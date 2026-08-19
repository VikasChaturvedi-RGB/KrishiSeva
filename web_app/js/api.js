const API = (() => {
  // In production, serve the PWA behind the same reverse proxy as the API and set this to
  // "" (same-origin, "/auth/..." etc.) or your deployed API origin. Defaults to local dev.
  const BASE_URL = window.KSH_API_BASE || "http://localhost:4000";

  const TOKEN_KEY = "ksh_token";
  const TOKEN_EXPIRES_KEY = "ksh_token_expires";
  const USER_KEY = "ksh_user";

  function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    const expires = localStorage.getItem(TOKEN_EXPIRES_KEY);
    if (!token || !expires) return null;
    if (new Date(expires).getTime() < Date.now()) {
      clearSession();
      return null;
    }
    return token; // valid for up to 45 days without re-entering OTP, per issueSession() on the backend
  }

  function setSession(token, expiresAt, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, { method = "GET", body, auth = false } = {}) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error("NETWORK_ERROR");
    }
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (!token) throw new Error("NOT_AUTHENTICATED");
      headers["Authorization"] = `Bearer ${token}`;
    }
    let res;
    try {
      const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(2500) : undefined;
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (e) {
      throw new Error("NETWORK_ERROR");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(data.error || "REQUEST_FAILED"), { status: res.status, data });
    }
    return data;
  }

  function isOnline() {
    return navigator.onLine;
  }

  let offlineOtpStore = {};

  async function safeGetLanguages() {
    try {
      return await request("/reference/languages");
    } catch {
      return (window.KSH_DATA && window.KSH_DATA.languages) || [];
    }
  }

  async function safeGetStates() {
    try {
      return await request("/reference/states");
    } catch {
      return (window.KSH_DATA && window.KSH_DATA.states) || [];
    }
  }

  async function safeGetCrops() {
    try {
      return await request("/reference/crops");
    } catch {
      return (window.KSH_DATA && window.KSH_DATA.crops) || [];
    }
  }

  async function safeGetSigns() {
    try {
      return await request("/diagnosis/signs");
    } catch {
      return (window.KSH_DATA && window.KSH_DATA.signs) || [];
    }
  }

  async function safeGetCropDetail(cropId) {
    try {
      return await request(`/diagnosis/crops/${cropId}`);
    } catch {
      if (window.KSH_DATA && window.KSH_DATA.knowledgeBaseCrops) {
        return window.KSH_DATA.knowledgeBaseCrops.find((c) => c.id === cropId);
      }
      return null;
    }
  }

  async function safeRequestOtp(mobileNumber, purpose) {
    try {
      return await request("/auth/otp/request", { method: "POST", body: { mobileNumber, purpose } });
    } catch (e) {
      if (e.message === "OTP_COOLDOWN_ACTIVE") throw e;
      // Offline fallback: Generate a demo OTP
      const demoOtp = "123456";
      offlineOtpStore[mobileNumber] = demoOtp;
      return { ok: true, offline: true, demoOtp, message: "DEMO_OTP_ACTIVE" };
    }
  }

  async function safeVerifyOtp(payload) {
    try {
      return await request("/auth/otp/verify", { method: "POST", body: payload });
    } catch (e) {
      if (e.status && e.status !== 500 && e.message !== "NETWORK_ERROR") throw e;
      // Offline fallback: Accept demo OTP or any 6-digit code in offline mode
      const stored = offlineOtpStore[payload.mobileNumber] || "123456";
      if (payload.otp !== stored && payload.otp.length !== 6) {
        throw new Error("OTP_INCORRECT");
      }
      const expiresAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
      const user = {
        id: "offline_user",
        mobileNumber: payload.mobileNumber,
        role: "farmer",
        stateCode: null,
        languagePreference: payload.languagePreference || "hi",
      };
      return {
        ok: true,
        token: "demo-offline-session-token",
        expiresAt,
        user,
        offline: true,
      };
    }
  }

  async function safeDiagnose(payload) {
    try {
      return await request("/diagnosis", { method: "POST", body: payload, auth: true });
    } catch (e) {
      // Offline fallback: Run client-side rule matcher & visual heuristic
      if (window.KSH_DATA && window.KSH_DATA.diagnoseOffline) {
        const result = window.KSH_DATA.diagnoseOffline(
          payload.cropId,
          payload.signIds || [],
          payload.acreage,
          payload.organ,
          Boolean(payload.imageBase64)
        );
        // Persist to local history
        const history = JSON.parse(localStorage.getItem("ksh_history_cache") || "[]");
        history.unshift({
          id: "hist_" + Date.now(),
          cropId: payload.cropId,
          organ: payload.organ,
          plantHealthIndex: result.plantHealthIndex,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("ksh_history_cache", JSON.stringify(history.slice(0, 50)));
        return result;
      }
      throw e;
    }
  }

  async function safeGetHistory() {
    try {
      return await request("/diagnosis/history", { auth: true });
    } catch {
      return JSON.parse(localStorage.getItem("ksh_history_cache") || "[]");
    }
  }

  return {
    requestOtp: safeRequestOtp,
    verifyOtp: safeVerifyOtp,
    getSession: () => request("/auth/session", { auth: true }),
    updateLocation: (stateCode, district) => request("/auth/location", { method: "POST", body: { stateCode, district }, auth: true }),
    logout: () => request("/auth/logout", { method: "POST", auth: true }).catch(() => ({ ok: true })),
    getLanguages: safeGetLanguages,
    getStates: safeGetStates,
    getCrops: safeGetCrops,
    getSigns: safeGetSigns,
    getCropDetail: safeGetCropDetail,
    getVisionStatus: () => request("/diagnosis/vision-status").catch(() => ({ enabled: false })),
    diagnose: safeDiagnose,
    getHistory: safeGetHistory,
    getToken,
    setSession,
    getUser,
    clearSession,
    isOnline,
  };
})();

if (typeof window !== "undefined") {
  window.API = API;
}
if (typeof module !== "undefined") {
  module.exports = API;
}
