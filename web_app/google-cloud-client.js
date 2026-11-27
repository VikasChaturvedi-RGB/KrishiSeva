// ============================================================================
// MRIDAK (मृदक) — CUSTOMER MOBILE + DOB AUTHENTICATION & GOOGLE CLOUD FREE SYNC
// Supports 1,000 to 50,000+ Self-Registering Customers at ₹0 Cost:
//   1. Firebase Authentication (Email/Password mapping <mobile>@auth.mridak.com: 50,000 MAU Free, 0 SMS fees)
//   2. Cloud Firestore Per-Customer Profile Sync (/farmers/{uid} with strict owner isolation)
//   3. Cloud Run / Backend PBKDF2-SHA512 + 365-Day Persistent JWT (/v1/auth/mobile-dob)
//   4. Offline Salted SHA-256 Verifier & Persistent Device Session (stays logged in automatically)
// ============================================================================

const MRIDAK_SESSION_KEY = 'mridak_customer_session_v1';
const MRIDAK_DEVICE_VAULT_KEY = 'mridak_device_accounts_v1';

async function sha256Hex(input) {
  if (window.crypto && window.crypto.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic pure-JS fallback if WebCrypto unavailable in non-HTTPS LAN preview
  let h1 = 0xdeadbeef ^ input.length, h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const base = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  return (base + base + base + base).slice(0, 64);
}

window.KrishiGoogleCloud = {
  mode: 'OFFLINE_FIRST_WITH_GOOGLE_FREE_SYNC',
  projectId: 'kris-seva',
  firebaseConfig: null,
  firebaseIdToken: null,
  anonymousFarmerId: null,
  customerSession: null,

  init() {
    this.populateDobDropdowns();
    this.restoreCustomerSession();

    let fid = localStorage.getItem('krishi_anon_farmer_uid');
    if (!fid) {
      fid = 'farmer-anon-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('krishi_anon_farmer_uid', fid);
    }
    this.anonymousFarmerId = (this.customerSession && this.customerSession.user && this.customerSession.user.uid) || fid;

    // Auto-discover Firebase Hosting Web Config (served automatically at /__/firebase/init.json on mridak.com)
    fetch('/__/firebase/init.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg && cfg.apiKey && cfg.projectId) {
          this.firebaseConfig = cfg;
          this.projectId = cfg.projectId;
          this.mode = 'FIREBASE_AUTH_AND_FIRESTORE_ACTIVE';
          if (this.customerSession && this.customerSession.firebaseRefreshToken) {
            this.refreshFirebaseIdToken(this.customerSession.firebaseRefreshToken);
          }
        }
      })
      .catch(() => {});

    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
    fetch(`${apiBase}/google-free/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((info) => {
        if (info && info.projectId) {
          this.projectId = info.projectId;
          if (!this.firebaseConfig) {
            this.mode = info.firestoreEnabled ? 'CLOUD_RUN_FIRESTORE_ACTIVE' : 'CLOUD_RUN_FREE_ACTIVE';
          }
        }
        this.updateStatusBadge();
      })
      .catch(() => {
        this.updateStatusBadge();
      });
  },

  populateDobDropdowns() {
    const daySel = document.getElementById('loginDobDay');
    const yearSel = document.getElementById('loginDobYear');
    if (daySel && daySel.options.length <= 1) {
      for (let d = 1; d <= 31; d++) {
        const dd = String(d).padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = dd;
        opt.textContent = dd;
        daySel.appendChild(opt);
      }
    }
    if (yearSel && yearSel.options.length <= 1) {
      const maxYear = new Date().getFullYear() - 12;
      for (let y = maxYear; y >= 1930; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        yearSel.appendChild(opt);
      }
    }
  },

  isCustomerLoggedIn() {
    return Boolean(this.customerSession && this.customerSession.authenticated && this.customerSession.user);
  },

  restoreCustomerSession() {
    try {
      const raw = localStorage.getItem(MRIDAK_SESSION_KEY);
      if (!raw) {
        this.customerSession = null;
        window.authToken = null;
        window.currentUser = null;
        this.syncAuthGateUi();
        return false;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.authenticated || !parsed.user || !parsed.user.mobileNumber) {
        this.customerSession = null;
        window.authToken = null;
        window.currentUser = null;
        this.syncAuthGateUi();
        return false;
      }
      this.customerSession = parsed;
      this.firebaseIdToken = parsed.firebaseIdToken || null;
      this.anonymousFarmerId = parsed.user.uid;
      window.authToken = parsed.token || 'mridak-local-session';
      window.currentUser = parsed.user;
      if (typeof authToken !== 'undefined') authToken = window.authToken;
      if (typeof currentUser !== 'undefined') currentUser = window.currentUser;

      // Keep krishi_farmer_profile_v2 in sync with logged-in customer
      localStorage.setItem('krishi_farmer_profile_v2', JSON.stringify({
        uid: parsed.user.uid,
        name: parsed.user.name || parsed.user.fullName,
        mobileMasked: parsed.user.mobileMasked,
        state: parsed.user.state || 'Madhya Pradesh',
        crop: parsed.user.crop || 'SOYBEAN',
        crops: parsed.user.crops || [parsed.user.crop || 'SOYBEAN'],
        areaAcres: parsed.user.areaAcres || 3.5,
        landUnit: parsed.user.landUnit || 'ACRE',
        language: parsed.user.preferredLanguage || window.currentLanguage || 'hi',
        updatedAt: parsed.user.updatedAt || new Date().toISOString()
      }));
      localStorage.setItem('krishi_b2c_onboarded_v1', 'true');
      this.syncAuthGateUi();
      return true;
    } catch {
      this.customerSession = null;
      this.syncAuthGateUi();
      return false;
    }
  },

  syncAuthGateUi() {
    const loggedIn = this.isCustomerLoggedIn();
    const loginBox = document.getElementById('authLoginGateBox');
    const profileBox = document.getElementById('authProfileManageBox');
    const bottomNav = document.querySelector('.phone-bottom-nav');
    const voiceFab = document.getElementById('floatingVoiceCompanionBtn');

    if (loginBox) loginBox.classList.toggle('hidden', loggedIn);
    if (profileBox) profileBox.classList.toggle('hidden', !loggedIn);
    if (bottomNav) bottomNav.style.display = loggedIn ? 'flex' : 'none';
    if (voiceFab) voiceFab.style.display = loggedIn ? 'inline-flex' : 'none';

    if (loggedIn && this.customerSession?.user) {
      const u = this.customerSession.user;
      const badge = document.getElementById('loggedInMobileDisplay');
      if (badge) badge.textContent = u.mobileMasked || (`+91-XXXXXX${String(u.mobileNumber).slice(-4)}`);
      this.updateStatusBadge();
    }
  },

  showLoginMessage(msg, isError) {
    const box = document.getElementById('mobileDobErrorBox');
    if (!box) return;
    if (!msg) {
      box.classList.add('hidden');
      box.textContent = '';
      return;
    }
    box.classList.remove('hidden');
    box.style.background = isError ? '#fef2f2' : '#f0fdf4';
    box.style.borderColor = isError ? '#fca5a5' : '#86efac';
    box.style.color = isError ? '#b91c1c' : '#166534';
    box.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> <span>${msg}</span>`;
  },

  async authenticateWithFirebaseRest(cleanMobile, normalizedDob, extraProfile) {
    if (!this.firebaseConfig || !this.firebaseConfig.apiKey) return null;
    const apiKey = this.firebaseConfig.apiKey;
    const projectId = this.firebaseConfig.projectId || 'kris-seva';
    const syntheticEmail = `${cleanMobile}@auth.mridak.com`;
    const derivedHex = await sha256Hex(`mridak-fb-auth-v1:${cleanMobile}:${normalizedDob}`);
    const derivedPassword = `Mridak#${derivedHex.slice(0, 40)}`;
    const dobSha256 = 'sha256:' + (await sha256Hex(`mridak-dob:${cleanMobile}:${normalizedDob}`));
    const mobileMasked = `+91-XXXXXX${cleanMobile.slice(-4)}`;

    // 1. Try signing in existing customer
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: syntheticEmail, password: derivedPassword, returnSecureToken: true })
    });

    if (signInRes.ok) {
      const authData = await signInRes.json();
      const uid = authData.localId;
      let profile = {
        uid,
        userId: uid,
        mobileNumber: cleanMobile,
        mobileMasked,
        dobHash: dobSha256,
        name: extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`,
        fullName: extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`,
        state: extraProfile.state || 'Madhya Pradesh',
        crop: extraProfile.crop || 'SOYBEAN',
        crops: [extraProfile.crop || 'SOYBEAN'],
        areaAcres: 3.5,
        landUnit: 'ACRE',
        preferredLanguage: extraProfile.preferredLanguage || 'hi',
        updatedAt: new Date().toISOString()
      };

      // Fetch stored profile from Firestore /farmers/{uid}
      try {
        const fsRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/farmers/${encodeURIComponent(uid)}`, {
          headers: { Authorization: `Bearer ${authData.idToken}` }
        });
        if (fsRes.ok) {
          const doc = await fsRes.json();
          const f = doc.fields || {};
          if (f.name?.stringValue) { profile.name = f.name.stringValue; profile.fullName = f.name.stringValue; }
          if (f.state?.stringValue) profile.state = f.state.stringValue;
          if (f.crop?.stringValue) profile.crop = f.crop.stringValue;
          if (f.areaAcres?.doubleValue || f.areaAcres?.integerValue) {
            profile.areaAcres = Number(f.areaAcres.doubleValue ?? f.areaAcres.integerValue);
          }
          if (f.landUnit?.stringValue) profile.landUnit = f.landUnit.stringValue;
          if (f.language?.stringValue) profile.preferredLanguage = f.language.stringValue;
        }
      } catch {}

      return {
        isNewUser: false,
        token: authData.idToken,
        firebaseIdToken: authData.idToken,
        firebaseRefreshToken: authData.refreshToken,
        user: profile
      };
    }

    const signInErr = await signInRes.json().catch(() => ({}));
    const errMsg = signInErr?.error?.message || '';
    if (errMsg.includes('TOO_MANY_ATTEMPTS')) {
      throw new Error('गलत जन्मतिथि के कई प्रयास हुए हैं। कृपया कुछ मिनट बाद पुनः प्रयास करें। (Too many attempts, please retry shortly.)');
    }

    // If Firebase Email/Password provider is not enabled yet in Console, fall back cleanly to Cloud Run / Backend API
    if (errMsg.includes('OPERATION_NOT_ALLOWED') || errMsg.includes('CONFIGURATION_NOT_FOUND')) {
      return null;
    }

    // 2. Attempt Open Self-Registration via accounts:signUp
    const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: syntheticEmail, password: derivedPassword, returnSecureToken: true })
    });

    if (signUpRes.ok) {
      const upData = await signUpRes.json();
      const uid = upData.localId;
      const nowIso = new Date().toISOString();
      const chosenName = extraProfile.fullName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`;
      const chosenState = extraProfile.state || 'Madhya Pradesh';
      const chosenCrop = extraProfile.crop || 'SOYBEAN';
      const chosenLang = extraProfile.preferredLanguage || 'hi';

      // Create owner-isolated /farmers/{uid} document matching hardened firestore.rules
      try {
        await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/farmers?documentId=${encodeURIComponent(uid)}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${upData.idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              uid: { stringValue: uid },
              name: { stringValue: chosenName },
              mobileMasked: { stringValue: mobileMasked },
              dobHash: { stringValue: dobSha256 },
              authMethod: { stringValue: 'MOBILE_DOB' },
              state: { stringValue: chosenState },
              crop: { stringValue: chosenCrop },
              areaAcres: { doubleValue: 3.5 },
              landUnit: { stringValue: 'ACRE' },
              language: { stringValue: chosenLang },
              updatedAt: { stringValue: nowIso }
            }
          })
        });
      } catch {}

      return {
        isNewUser: true,
        token: upData.idToken,
        firebaseIdToken: upData.idToken,
        firebaseRefreshToken: upData.refreshToken,
        user: {
          uid,
          userId: uid,
          mobileNumber: cleanMobile,
          mobileMasked,
          dobHash: dobSha256,
          name: chosenName,
          fullName: chosenName,
          state: chosenState,
          crop: chosenCrop,
          crops: [chosenCrop],
          areaAcres: 3.5,
          landUnit: 'ACRE',
          preferredLanguage: chosenLang,
          updatedAt: nowIso
        }
      };
    }

    const signUpErr = await signUpRes.json().catch(() => ({}));
    const upErrMsg = signUpErr?.error?.message || '';
    if (upErrMsg.includes('EMAIL_EXISTS')) {
      throw new Error('यह मोबाइल नंबर पहले से पंजीकृत है, लेकिन जन्मतिथि (DOB) मेल नहीं खाती! कृपया अपनी सही जन्मतिथि चुनें। (Incorrect Date of Birth for this mobile number.)');
    }
    if (upErrMsg.includes('OPERATION_NOT_ALLOWED') || upErrMsg.includes('CONFIGURATION_NOT_FOUND')) {
      return null;
    }
    throw new Error('लॉगिन सत्यापन में त्रुटि हुई, कृपया पुनः प्रयास करें।');
  },

  async refreshFirebaseIdToken(refreshToken) {
    if (!this.firebaseConfig?.apiKey || !refreshToken) return;
    try {
      const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(this.firebaseConfig.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id_token && this.customerSession) {
          this.firebaseIdToken = data.id_token;
          this.customerSession.firebaseIdToken = data.id_token;
          this.customerSession.token = data.id_token;
          localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(this.customerSession));
        }
      }
    } catch {}
  },

  async submitMobileDobLogin(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    this.showLoginMessage('', false);

    const rawMobile = document.getElementById('loginMobileInput')?.value || '';
    const digits = rawMobile.replace(/\D/g, '');
    const cleanMobile = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

    if (!/^[6-9][0-9]{9}$/.test(cleanMobile)) {
      this.showLoginMessage('कृपया 10-अंकों का सही मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)।', true);
      document.getElementById('loginMobileInput')?.focus();
      return;
    }

    const dd = document.getElementById('loginDobDay')?.value || '';
    const mm = document.getElementById('loginDobMonth')?.value || '';
    const yyyy = document.getElementById('loginDobYear')?.value || '';
    if (!dd || !mm || !yyyy) {
      this.showLoginMessage('कृपया अपनी पूरी जन्मतिथि (दिन, महीना और वर्ष) चुनें।', true);
      return;
    }

    const yNum = parseInt(yyyy, 10), mNum = parseInt(mm, 10), dNum = parseInt(dd, 10);
    const checkDate = new Date(Date.UTC(yNum, mNum - 1, dNum));
    if (checkDate.getUTCFullYear() !== yNum || checkDate.getUTCMonth() !== mNum - 1 || checkDate.getUTCDate() !== dNum) {
      this.showLoginMessage('चुनी गई तारीख कैलेंडर में मान्य नहीं है (जैसे 30/31 फरवरी)। कृपया सही तारीख चुनें।', true);
      return;
    }
    const normalizedDob = `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;

    const optName = document.getElementById('loginNameInput')?.value?.trim() || '';
    const optState = document.getElementById('loginStateSelect')?.value || 'Madhya Pradesh';
    const optCrop = document.getElementById('loginCropSelect')?.value || 'SOYBEAN';
    const lang = window.currentLanguage || 'hi';

    const btn = document.getElementById('mobileDobSubmitBtn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>सत्यापित किया जा रहा है...</span>';
    }

    try {
      let authOutcome = null;

      // Path 1: Firebase Authentication (50,000 MAU Always-Free) if active on domain
      if (this.firebaseConfig && this.firebaseConfig.apiKey) {
        authOutcome = await this.authenticateWithFirebaseRest(cleanMobile, normalizedDob, {
          fullName: optName,
          state: optState,
          crop: optCrop,
          preferredLanguage: lang
        });
      }

      // Path 2: Cloud Run / Express Backend API (/v1/auth/mobile-dob)
      if (!authOutcome) {
        const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
        try {
          const res = await fetch(`${apiBase}/auth/mobile-dob`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mobileNumber: cleanMobile,
              dob: normalizedDob,
              fullName: optName || undefined,
              state: optState,
              crop: optCrop,
              preferredLanguage: lang
            })
          });

          const payload = await res.json().catch(() => null);
          if (res.ok && payload && payload.success && payload.user) {
            authOutcome = {
              isNewUser: Boolean(payload.isNewUser),
              token: payload.accessToken,
              firebaseIdToken: null,
              firebaseRefreshToken: null,
              user: payload.user
            };
          } else if (res.status === 400 || res.status === 401 || res.status === 429) {
            throw new Error(payload?.message || 'जन्मतिथि (DOB) मेल नहीं खाती! कृपया सही जन्मतिथि चुनें।');
          }
        } catch (netOrAuthErr) {
          // Re-throw explicit auth/validation failures; only fall back to offline vault if offline/network unreachable
          if (netOrAuthErr && netOrAuthErr.message && !/Failed to fetch|NetworkError|Load failed/i.test(netOrAuthErr.message)) {
            throw netOrAuthErr;
          }
        }
      }

      // Path 3: Offline Rural Field Fallback (when 0% mobile network or static preview without backend)
      const offlineDobHash = await sha256Hex(`mridak-offline-v1:${cleanMobile}:${normalizedDob}`);
      const deviceVault = JSON.parse(localStorage.getItem(MRIDAK_DEVICE_VAULT_KEY) || '{}');

      if (!authOutcome) {
        const cachedAcct = deviceVault[cleanMobile];
        if (cachedAcct) {
          if (cachedAcct.saltedDobHash !== offlineDobHash) {
            throw new Error('यह मोबाइल नंबर इस फोन में पंजीकृत है, लेकिन जन्मतिथि (DOB) मेल नहीं खाती! कृपया सही जन्मतिथि चुनें।');
          }
          authOutcome = {
            isNewUser: false,
            token: 'mridak-offline-verified',
            firebaseIdToken: null,
            firebaseRefreshToken: null,
            user: cachedAcct.user
          };
        } else {
          const uid = 'cust-local-' + (await sha256Hex(cleanMobile)).slice(0, 20);
          const chosenName = optName || `किसान मित्र (+91-${cleanMobile.slice(-4)})`;
          authOutcome = {
            isNewUser: true,
            token: 'mridak-offline-verified',
            firebaseIdToken: null,
            firebaseRefreshToken: null,
            user: {
              uid,
              userId: uid,
              mobileNumber: cleanMobile,
              mobileMasked: `+91-XXXXXX${cleanMobile.slice(-4)}`,
              dobHash: 'sha256:' + offlineDobHash,
              name: chosenName,
              fullName: chosenName,
              state: optState,
              crop: optCrop,
              crops: [optCrop],
              areaAcres: 3.5,
              landUnit: 'ACRE',
              preferredLanguage: lang,
              updatedAt: new Date().toISOString()
            }
          };
        }
      }

      // Mirror salted verifier into local device vault for offline resilience (never stores raw DOB)
      deviceVault[cleanMobile] = {
        saltedDobHash: offlineDobHash,
        user: authOutcome.user
      };
      localStorage.setItem(MRIDAK_DEVICE_VAULT_KEY, JSON.stringify(deviceVault));

      // Save persistent customer session (keeps customer logged in automatically on this phone)
      const sessionObj = {
        authenticated: true,
        isNewUser: authOutcome.isNewUser,
        token: authOutcome.token,
        firebaseIdToken: authOutcome.firebaseIdToken || null,
        firebaseRefreshToken: authOutcome.firebaseRefreshToken || null,
        user: authOutcome.user,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(sessionObj));
      localStorage.setItem('krishi_b2c_crops', JSON.stringify(authOutcome.user.crops || [authOutcome.user.crop || 'SOYBEAN']));
      if (window.KrishiB2C) {
        window.KrishiB2C.selectedCrops = authOutcome.user.crops || [authOutcome.user.crop || 'SOYBEAN'];
        window.KrishiB2C.updatePersonalizedDailyBrief();
      }

      this.restoreCustomerSession();
      this.hydrateSavedFarmProfile();

      const targetView = (typeof pendingProtectedView !== 'undefined' && pendingProtectedView && pendingProtectedView !== 'viewAuth')
        ? pendingProtectedView
        : 'viewHome';
      if (typeof pendingProtectedView !== 'undefined') pendingProtectedView = null;
      if (typeof switchView === 'function') switchView(targetView);
    } catch (err) {
      this.showLoginMessage(err?.message || 'लॉगिन विफल रहा, कृपया पुनः प्रयास करें।', true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  },

  logoutCustomer() {
    localStorage.removeItem(MRIDAK_SESSION_KEY);
    this.customerSession = null;
    this.firebaseIdToken = null;
    window.authToken = null;
    window.currentUser = null;
    if (typeof authToken !== 'undefined') authToken = null;
    if (typeof currentUser !== 'undefined') currentUser = null;
    this.syncAuthGateUi();
    this.showLoginMessage('आप सफलतापूर्वक लॉगआउट हो गए हैं। कृपया मोबाइल नंबर व जन्मतिथि से लॉगिन करें।', false);
    const mobEl = document.getElementById('loginMobileInput');
    if (mobEl) mobEl.value = '';
    if (typeof switchView === 'function') switchView('viewAuth', false);
  },

  updateStatusBadge() {
    const el = document.getElementById('googleCloudStatusPill');
    if (!el) return;
    const isOnline = navigator.onLine;
    const masked = this.customerSession?.user?.mobileMasked;
    if (masked) {
      el.innerHTML = isOnline
        ? `<i class="fa-solid fa-mobile-screen-button"></i> ${masked} • Cloud Sync`
        : `<i class="fa-solid fa-bolt"></i> ${masked} • Offline`;
      return;
    }
    el.innerHTML = isOnline
      ? '<i class="fa-brands fa-google"></i> Cloud Free Sync'
      : '<i class="fa-solid fa-bolt"></i> Offline Ready';
  },

  async saveFarmProfilePreference() {
    const name = document.getElementById('nameInput')?.value?.trim() || 'किसान मित्र';
    const state = document.getElementById('profileStateSelect')?.value || 'Madhya Pradesh';
    const crop = document.getElementById('profileCropSelect')?.value || 'SOYBEAN';
    const area = parseFloat(document.getElementById('profileAreaInput')?.value || '3.5');
    const unit = document.getElementById('profileUnitSelect')?.value || window.KRISHI_LAND_UNIT || 'ACRE';

    window.KRISHI_LAND_UNIT = unit;
    localStorage.setItem('krishi_land_unit', unit);

    const uid = this.customerSession?.user?.uid || this.anonymousFarmerId;
    const profile = {
      uid,
      name,
      fullName: name,
      mobileNumber: this.customerSession?.user?.mobileNumber || '',
      mobileMasked: this.customerSession?.user?.mobileMasked || '',
      dobHash: this.customerSession?.user?.dobHash || '',
      state,
      crop,
      crops: window.KrishiB2C?.selectedCrops || [crop],
      areaAcres: area,
      landUnit: unit,
      preferredLanguage: window.currentLanguage || 'hi',
      language: window.currentLanguage || 'hi',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('krishi_farmer_profile_v2', JSON.stringify(profile));

    if (this.customerSession && this.customerSession.user) {
      this.customerSession.user = Object.assign({}, this.customerSession.user, profile);
      localStorage.setItem(MRIDAK_SESSION_KEY, JSON.stringify(this.customerSession));
      const deviceVault = JSON.parse(localStorage.getItem(MRIDAK_DEVICE_VAULT_KEY) || '{}');
      if (profile.mobileNumber && deviceVault[profile.mobileNumber]) {
        deviceVault[profile.mobileNumber].user = this.customerSession.user;
        localStorage.setItem(MRIDAK_DEVICE_VAULT_KEY, JSON.stringify(deviceVault));
      }
    }

    this.hydrateSavedFarmProfile();

    // Sync to Backend JWT Profile & Firestore
    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      if (this.customerSession?.token && !this.customerSession.firebaseIdToken) {
        await fetch(`${apiBase}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.customerSession.token}`
          },
          body: JSON.stringify(profile)
        });
      } else if (this.firebaseIdToken && this.firebaseConfig?.projectId) {
        const pid = this.firebaseConfig.projectId;
        await fetch(
          `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/farmers/${encodeURIComponent(uid)}?updateMask.fieldPaths=name&updateMask.fieldPaths=state&updateMask.fieldPaths=crop&updateMask.fieldPaths=areaAcres&updateMask.fieldPaths=landUnit&updateMask.fieldPaths=language&updateMask.fieldPaths=updatedAt`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.firebaseIdToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                name: { stringValue: name },
                state: { stringValue: state },
                crop: { stringValue: crop },
                areaAcres: { doubleValue: Number(area || 3.5) },
                landUnit: { stringValue: unit },
                language: { stringValue: profile.language },
                updatedAt: { stringValue: profile.updatedAt }
              }
            })
          }
        );
      } else {
        await fetch(`${apiBase}/google-free/sync-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
      }
    } catch {}

    if (typeof switchView === 'function') switchView('viewHome');
  },

  hydrateSavedFarmProfile() {
    try {
      const sessionUser = this.customerSession?.user;
      const raw = localStorage.getItem('krishi_farmer_profile_v2');
      const p = sessionUser || (raw ? JSON.parse(raw) : null);
      if (!p) return;

      const displayName = p.name || p.fullName;
      const farmerNameEl = document.getElementById('homeFarmerName');
      if (farmerNameEl && displayName) farmerNameEl.innerText = displayName;
      const locMetaEl = document.getElementById('homeLocationMeta');
      if (locMetaEl && p.state && typeof window.formatLandArea === 'function') {
        locMetaEl.innerHTML = `${p.state} • <strong>${window.formatLandArea(p.areaAcres || 3.5)}</strong>`;
      }
      if (document.getElementById('nameInput') && displayName) document.getElementById('nameInput').value = displayName;
      if (document.getElementById('profileStateSelect') && p.state) document.getElementById('profileStateSelect').value = p.state;
      if (document.getElementById('profileCropSelect') && p.crop) document.getElementById('profileCropSelect').value = p.crop;
      if (document.getElementById('profileAreaInput') && p.areaAcres) document.getElementById('profileAreaInput').value = p.areaAcres;
      if (document.getElementById('profileUnitSelect') && p.landUnit) document.getElementById('profileUnitSelect').value = p.landUnit;
      this.updateStatusBadge();
    } catch {}
  },

  async syncDiaryToFirestoreFree(entries) {
    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      await fetch(`${apiBase}/google-free/sync-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: this.customerSession?.user?.uid || this.anonymousFarmerId, entries: entries.slice(0, 50) })
      });
    } catch {}
  }
};
