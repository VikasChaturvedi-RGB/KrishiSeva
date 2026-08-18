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
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const token = getToken();
      if (!token) throw new Error("NOT_AUTHENTICATED");
      headers["Authorization"] = `Bearer ${token}`;
    }
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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

  return {
    requestOtp: (mobileNumber, purpose) => request("/auth/otp/request", { method: "POST", body: { mobileNumber, purpose } }),
    verifyOtp: (payload) => request("/auth/otp/verify", { method: "POST", body: payload }),
    getSession: () => request("/auth/session", { auth: true }),
    updateLocation: (stateCode, district) => request("/auth/location", { method: "POST", body: { stateCode, district }, auth: true }),
    logout: () => request("/auth/logout", { method: "POST", auth: true }),
    getLanguages: () => request("/reference/languages"),
    getStates: () => request("/reference/states"),
    getCrops: () => request("/reference/crops"),
    getSigns: () => request("/diagnosis/signs"),
    getCropDetail: (cropId) => request(`/diagnosis/crops/${cropId}`),
    getVisionStatus: () => request("/diagnosis/vision-status"),
    diagnose: (payload) => request("/diagnosis", { method: "POST", body: payload, auth: true }),
    getHistory: () => request("/diagnosis/history", { auth: true }),
    getToken,
    setSession,
    getUser,
    clearSession,
    isOnline,
  };
})();
