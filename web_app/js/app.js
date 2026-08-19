const App = (() => {
  const state = {
    languages: (window.KSH_DATA && window.KSH_DATA.languages) || [],
    states: (window.KSH_DATA && window.KSH_DATA.states) || [],
    crops: (window.KSH_DATA && window.KSH_DATA.crops) || [],
    signs: (window.KSH_DATA && window.KSH_DATA.signs) || [],
    selectedLangCode: localStorage.getItem("ksh_lang") || "hi",
    pendingMobile: null,
    selectedStateCode: null,
    selectedCropId: null,
    selectedOrgan: null,
    selectedSignIds: new Set(),
    acreage: null,
    photoBase64: null,
    photoMediaType: null,
    lastResult: null,
    languageScreenMode: "onboarding", // "onboarding" | "change" — controls where lang-continue-btn goes next
  };

  function show(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(screenId);
    if (el) el.classList.add("active");
    document.querySelectorAll(".bottom-nav button").forEach((b) => b.classList.remove("active"));
    const navBtn = document.querySelector(`.bottom-nav button[data-nav="${screenId}"]`);
    if (navBtn) navBtn.classList.add("active");
    window.scrollTo(0, 0);
  }

  function setFieldError(inputEl, errorEl, message) {
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.add("visible");
      inputEl.style.borderColor = "var(--laterite)";
    } else {
      errorEl.classList.remove("visible");
      inputEl.style.borderColor = "";
    }
  }

  // ---------------- Language screen ----------------
  function renderLanguageGrid() {
    const grid = document.getElementById("lang-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if ((!state.languages || state.languages.length === 0) && window.KSH_DATA) {
      state.languages = window.KSH_DATA.languages;
    }

    const activeLang = state.selectedLangCode || "hi";

    state.languages.forEach((lang) => {
      const pill = document.createElement("button");
      pill.className = "lang-pill";
      if (lang.code === activeLang) {
        pill.classList.add("selected");
      }
      pill.type = "button";
      pill.innerHTML = `<span class="native">${lang.name_native}</span><span class="en">${lang.name_en}</span>`;
      pill.addEventListener("click", async () => {
        document.querySelectorAll(".lang-pill").forEach((p) => p.classList.remove("selected"));
        pill.classList.add("selected");
        state.selectedLangCode = lang.code;
        await I18N.load(lang.code);
        updateLangTags();
        const continueBtn = document.getElementById("lang-continue-btn");
        if (continueBtn) continueBtn.disabled = false;
      });
      grid.appendChild(pill);
    });

    const continueBtn = document.getElementById("lang-continue-btn");
    if (continueBtn) {
      continueBtn.disabled = false;
    }
  }

  function updateLangTags() {
    const tag = I18N.getCurrentLang().toUpperCase();
    const homeTag = document.getElementById("home-lang-tag");
    if (homeTag) homeTag.textContent = tag;
  }

  function bindLanguageScreen() {
    const continueBtn = document.getElementById("lang-continue-btn");
    if (!continueBtn) return;
    continueBtn.addEventListener("click", async () => {
      if (state.languageScreenMode === "change") {
        renderProfile();
        show("screen-profile");
      } else {
        show("screen-auth-mobile");
      }
    });
  }

  // ---------------- Auth: mobile + OTP ----------------
  function bindAuthScreens() {
    const mobileInput = document.getElementById("mobile-input");
    const mobileError = document.getElementById("mobile-error");
    document.getElementById("send-otp-btn").addEventListener("click", async () => {
      const raw = mobileInput.value.trim();
      if (!/^[6-9]\d{9}$/.test(raw)) {
        setFieldError(mobileInput, mobileError, I18N.t("invalid_mobile"));
        return;
      }
      setFieldError(mobileInput, mobileError, null);
      const btn = document.getElementById("send-otp-btn");
      btn.disabled = true;
      try {
        const res = await API.requestOtp(raw, "registration");
        state.pendingMobile = raw;
        const otpSentEl = document.getElementById("otp-sent-number");
        if (res && res.offline && res.demoOtp) {
          otpSentEl.textContent = `${raw} (डेमो OTP: ${res.demoOtp})`;
        } else {
          otpSentEl.textContent = raw;
        }
        document.querySelectorAll(".otp-row input").forEach((i) => (i.value = ""));
        show("screen-auth-otp");
      } catch (e) {
        setFieldError(mobileInput, mobileError, e.message === "OTP_COOLDOWN_ACTIVE" ? I18N.t("resend_otp") : I18N.t("invalid_mobile"));
      } finally {
        btn.disabled = false;
      }
    });

    const otpInputs = Array.from(document.querySelectorAll(".otp-row input"));
    otpInputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "").slice(0, 1);
        if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && idx > 0) otpInputs[idx - 1].focus();
      });
    });

    document.getElementById("verify-otp-btn").addEventListener("click", async () => {
      const otp = otpInputs.map((i) => i.value).join("");
      const otpError = document.getElementById("otp-error");
      if (otp.length !== 6) {
        setFieldError(otpInputs[0], otpError, I18N.t("invalid_otp"));
        return;
      }
      setFieldError(otpInputs[0], otpError, null);
      const btn = document.getElementById("verify-otp-btn");
      btn.disabled = true;
      try {
        const result = await API.verifyOtp({
          mobileNumber: state.pendingMobile,
          otp,
          languagePreference: state.selectedLangCode,
          deviceLabel: navigator.userAgent.slice(0, 60),
        });
        API.setSession(result.token, result.expiresAt, result.user);
        if (result.user.stateCode) {
          state.selectedStateCode = result.user.stateCode;
          await enterApp();
        } else {
          renderStateGrid();
          show("screen-location");
        }
      } catch (e) {
        setFieldError(otpInputs[0], otpError, I18N.t("invalid_otp"));
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("resend-otp-link").addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await API.requestOtp(state.pendingMobile, "registration");
        if (res && res.offline && res.demoOtp) {
          document.getElementById("otp-sent-number").textContent = `${state.pendingMobile} (डेमो OTP: ${res.demoOtp})`;
        }
      } catch {
        /* cooldown or transient error; silent no-op is fine here, farmer can just retry */
      }
    });

    document.getElementById("change-number-link").addEventListener("click", (e) => {
      e.preventDefault();
      show("screen-auth-mobile");
    });
  }

  // ---------------- Location + consent ----------------
  function renderStateGrid() {
    const select = document.getElementById("state-select");
    if (!select) return;
    if ((!state.states || state.states.length === 0) && window.KSH_DATA) {
      state.states = window.KSH_DATA.states;
    }
    select.innerHTML = `<option value="" disabled selected></option>`;
    state.states.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.code;
      opt.textContent = s.name;
      if (state.selectedStateCode === s.code) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  function bindLocationScreen() {
    document.getElementById("location-continue-btn").addEventListener("click", async () => {
      const select = document.getElementById("state-select");
      const consent = document.getElementById("consent-checkbox");
      const err = document.getElementById("location-error");
      if (!select.value || !consent.checked) {
        err.textContent = I18N.t("required_field");
        err.classList.add("visible");
        return;
      }
      err.classList.remove("visible");
      state.selectedStateCode = select.value;
      const user = API.getUser();
      if (user) {
        user.stateCode = state.selectedStateCode;
        localStorage.setItem("ksh_user", JSON.stringify(user));
      }
      try {
        // Persist to the account server-side too, so it survives a fresh login on another
        // device. If offline, local state above still lets the farmer proceed immediately —
        // this just quietly retries to sync in the background next time there's a connection.
        await API.updateLocation(state.selectedStateCode);
      } catch {
        /* offline or transient failure — non-fatal, local copy already saved */
      }
      await enterApp();
    });
  }

  // ---------------- Home ----------------
  async function renderHome() {
    const user = API.getUser();
    document.getElementById("home-greeting-name").textContent = user ? user.mobileNumber : "";
    try {
      const history = await API.getHistory();
      localStorage.setItem("ksh_history_cache", JSON.stringify(history));
      renderHistoryRows(history.slice(0, 3), "home-history-list");
      renderHistoryRows(history, "history-full-list");
    } catch {
      const cached = JSON.parse(localStorage.getItem("ksh_history_cache") || "[]");
      renderHistoryRows(cached.slice(0, 3), "home-history-list");
      renderHistoryRows(cached, "history-full-list");
      toggleOfflineBadge(true);
    }
  }

  function lccPanelsHtml(score) {
    const bands = 6;
    const idx = Math.min(bands - 1, Math.floor((score / 100) * bands));
    let panels = "";
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c1 = [220, 232, 178]; // leaf-pale-ish
      const c2 = [63, 107, 50]; // leaf-deep
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
      panels += `<div class="lcc-panel" style="background: rgb(${r},${g},${b})"></div>`;
    }
    const markerLeft = `${(score / 100) * 100}%`;
    return { panels, markerLeft, idx };
  }

  function renderHistoryRows(rows, targetId) {
    const target = document.getElementById(targetId);
    target.innerHTML = "";
    if (!rows || rows.length === 0) {
      target.innerHTML = `<p class="center-note">${I18N.t("no_diagnoses_yet")}</p>`;
      return;
    }
    rows.forEach((r) => {
      const crop = state.crops.find((c) => c.id === r.cropId);
      const row = document.createElement("div");
      row.className = "history-row";
      const { panels } = lccPanelsHtml(r.plantHealthIndex);
      row.innerHTML = `
        <div class="mini-lcc">${panels}</div>
        <div class="meta">
          <div class="crop">${crop ? crop.name_en : r.cropId}</div>
          <div class="date">${new Date(r.createdAt).toLocaleDateString()} · ${r.plantHealthIndex}/100</div>
        </div>`;
      target.appendChild(row);
    });
  }

  function toggleOfflineBadge(visible) {
    document.querySelectorAll(".offline-badge").forEach((b) => b.classList.toggle("visible", visible));
  }

  // ---------------- Diagnosis flow: crop ----------------
  function renderCropGrid() {
    const grid = document.getElementById("crop-grid");
    if (!grid) return;
    if ((!state.crops || state.crops.length === 0) && window.KSH_DATA) {
      state.crops = window.KSH_DATA.crops;
    }
    grid.innerHTML = "";
    state.crops.forEach((crop) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "crop-tile";
      if (state.selectedCropId === crop.id) {
        tile.classList.add("selected");
      }
      tile.innerHTML = `<div class="name">${crop.name_hi || crop.name_en}</div><div class="botanical">${crop.name_en}</div>`;
      tile.addEventListener("click", () => {
        document.querySelectorAll(".crop-tile").forEach((t) => t.classList.remove("selected"));
        tile.classList.add("selected");
        state.selectedCropId = crop.id;
        const contBtn = document.getElementById("crop-continue-btn");
        if (contBtn) contBtn.disabled = false;
      });
      grid.appendChild(tile);
    });
  }

  // ---------------- Diagnosis flow: organ + input mode ----------------
  function bindInputScreen() {
    document.querySelectorAll(".organ-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".organ-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.selectedOrgan = btn.dataset.organ;
      });
    });

    document.getElementById("mode-checklist-btn").addEventListener("click", () => {
      document.getElementById("sign-checklist-block").style.display = "block";
      document.getElementById("photo-block").style.display = "none";
      state.photoBase64 = null;
      renderSignChips();
    });
    document.getElementById("mode-photo-btn").addEventListener("click", () => {
      document.getElementById("photo-block").style.display = "block";
      document.getElementById("sign-checklist-block").style.display = "none";
      state.selectedSignIds.clear();
    });

    document.getElementById("photo-file-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        state.photoMediaType = file.type;
        state.photoBase64 = result.split(",")[1];
        const preview = document.getElementById("photo-preview");
        preview.src = result;
        preview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("acreage-input").addEventListener("input", (e) => {
      state.acreage = e.target.value ? Number(e.target.value) : null;
    });

    document.getElementById("get-diagnosis-btn").addEventListener("click", runDiagnosis);
  }

  function renderSignChips() {
    const list = document.getElementById("sign-list");
    if (!list) return;
    if ((!state.signs || state.signs.length === 0) && window.KSH_DATA) {
      state.signs = window.KSH_DATA.signs;
    }
    list.innerHTML = "";
    state.signs.forEach((sign) => {
      const chip = document.createElement("div");
      chip.className = "sign-chip";
      if (state.selectedSignIds.has(sign.id)) {
        chip.classList.add("selected");
      }
      chip.innerHTML = `<div class="box"></div><span class="label">${sign.label_hi || sign.label_en}</span>`;
      chip.addEventListener("click", () => {
        if (state.selectedSignIds.has(sign.id)) {
          state.selectedSignIds.delete(sign.id);
          chip.classList.remove("selected");
        } else {
          state.selectedSignIds.add(sign.id);
          chip.classList.add("selected");
        }
      });
      list.appendChild(chip);
    });
  }

  async function runDiagnosis() {
    const err = document.getElementById("input-error");
    const usingPhoto = document.getElementById("photo-block").style.display === "block";
    if (usingPhoto && !state.photoBase64) {
      err.textContent = I18N.t("no_signs_selected");
      err.classList.add("visible");
      return;
    }
    if (!usingPhoto && state.selectedSignIds.size === 0) {
      err.textContent = I18N.t("no_signs_selected");
      err.classList.add("visible");
      return;
    }
    err.classList.remove("visible");

    const btn = document.getElementById("get-diagnosis-btn");
    btn.disabled = true;
    btn.textContent = "…";

    try {
      const payload = {
        cropId: state.selectedCropId,
        organ: state.selectedOrgan,
        stateCode: state.selectedStateCode,
        acreage: state.acreage,
      };
      if (usingPhoto) {
        payload.imageBase64 = state.photoBase64;
        payload.imageMediaType = state.photoMediaType;
      } else {
        payload.signIds = Array.from(state.selectedSignIds);
      }
      const result = await API.diagnose(payload);
      state.lastResult = result;
      localStorage.setItem("ksh_last_result", JSON.stringify(result));
      renderResult(result);
      show("screen-result");
    } catch (e) {
      err.textContent = e.message || I18N.t("no_signs_selected");
      err.classList.add("visible");
    } finally {
      btn.disabled = false;
      btn.textContent = I18N.t("get_diagnosis");
    }
  }

  // ---------------- Result screen ----------------
  function renderResult(result) {
    const { panels, markerLeft } = lccPanelsHtml(result.plantHealthIndex);
    document.getElementById("result-lcc").innerHTML = panels;
    document.getElementById("result-lcc-marker").style.left = markerLeft;
    document.getElementById("result-score").textContent = result.plantHealthIndex;

    const list = document.getElementById("result-issues");
    list.innerHTML = "";
    if (!result.matches || result.matches.length === 0) {
      list.innerHTML = `<p class="center-note">${I18N.t("no_diagnoses_yet")}</p>`;
    }
    (result.matches || []).forEach((m) => {
      const card = document.createElement("div");
      card.className = "issue-card";
      const details = m.details || {};
      const tier1 = details.correction_foliar || details.ipm_cultural || details.cultural_control || "";
      const tier2 = details.correction_soil || details.biological || "";
      const tier3 = details.chemical_class_generic || "";
      const symptoms = details.symptoms || "";
      card.innerHTML = `
        <span class="type-tag ${m.type}">${m.type.replace("_", " ")}</span>
        <span class="confidence">${m.confidence}% ${I18N.t("confidence_label")}</span>
        <h3>${m.name_hi || m.name_en}</h3>
        ${symptoms ? `<p class="symptoms">${symptoms}</p>` : ""}
        <p class="eyebrow" style="margin-top:10px;">${I18N.t("nutrition_first_hierarchy")}</p>
        <div class="hierarchy">
          ${tier1 ? `<div class="level tier-1"><div class="tier-label">${I18N.t("tier1_label")}</div><p>${tier1}</p></div>` : ""}
          ${tier2 ? `<div class="level tier-2"><div class="tier-label">${I18N.t("tier2_label")}</div><p>${tier2}</p></div>` : ""}
          ${tier3 ? `<div class="level tier-3"><div class="tier-label">${I18N.t("tier3_label")}</div><p>${tier3}</p></div>` : ""}
        </div>
      `;
      list.appendChild(card);
    });

    document.getElementById("chemical-caution-text").textContent = I18N.t("chemical_caution");
    const scalingNote = document.getElementById("acreage-scaling-note");
    if (result.dosageScalingNote) {
      scalingNote.textContent = `${I18N.t("acreage_scaling_prefix")} ${result.dosageScalingNote}`;
      scalingNote.style.display = "block";
    } else {
      scalingNote.style.display = "none";
    }
  }

  // ---------------- Profile ----------------
  function bindProfileScreen() {
    const changeLangBtn = document.getElementById("profile-change-language-btn");
    if (changeLangBtn) {
      changeLangBtn.addEventListener("click", () => {
        state.languageScreenMode = "change";
        const continueBtn = document.getElementById("lang-continue-btn");
        if (continueBtn) continueBtn.disabled = false;
        show("screen-language");
      });
    }
    const logoutBtn = document.getElementById("profile-log-out-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await API.logout();
        } catch {
          /* if this fails (e.g. offline), still clear locally so the device logs out */
        }
        API.clearSession();
        location.reload();
      });
    }
  }

  function renderProfile() {
    const user = API.getUser();
    const profileMobile = document.getElementById("profile-mobile");
    if (profileMobile) profileMobile.textContent = user ? user.mobileNumber : "";
    const st = state.states.find((s) => s.code === state.selectedStateCode);
    const profileState = document.getElementById("profile-state");
    if (profileState) profileState.textContent = st ? st.name : "—";
    const profileLang = document.getElementById("profile-lang-name");
    if (profileLang) profileLang.textContent = I18N.getCurrentLang().toUpperCase();
  }

  // ---------------- Bottom nav + back buttons ----------------
  function bindNav() {
    document.querySelectorAll(".bottom-nav button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.nav;
        show(target);
        if (target === "screen-history") renderHome();
        if (target === "screen-profile") renderProfile();
      });
    });
    document.querySelectorAll("[data-back-to]").forEach((btn) => {
      btn.addEventListener("click", () => show(btn.dataset.backTo));
    });
    const homeNewBtn = document.getElementById("home-new-diagnosis-btn");
    if (homeNewBtn) {
      homeNewBtn.addEventListener("click", () => {
        state.selectedCropId = null;
        state.selectedOrgan = null;
        state.selectedSignIds.clear();
        state.photoBase64 = null;
        state.acreage = null;
        document.querySelectorAll(".crop-tile").forEach((t) => t.classList.remove("selected"));
        const cropContBtn = document.getElementById("crop-continue-btn");
        if (cropContBtn) cropContBtn.disabled = true;
        show("screen-crop");
      });
    }
    const cropContBtn = document.getElementById("crop-continue-btn");
    if (cropContBtn) {
      cropContBtn.addEventListener("click", () => {
        const preview = document.getElementById("photo-preview");
        if (preview) preview.style.display = "none";
        const photoBlock = document.getElementById("photo-block");
        if (photoBlock) photoBlock.style.display = "none";
        const signBlock = document.getElementById("sign-checklist-block");
        if (signBlock) signBlock.style.display = "none";
        show("screen-input");
      });
    }
    const resultDoneBtn = document.getElementById("result-done-btn");
    if (resultDoneBtn) {
      resultDoneBtn.addEventListener("click", () => {
        show("screen-home");
        renderHome();
      });
    }
  }

  // ---------------- Boot ----------------
  async function enterApp() {
    document.getElementById("onboarding-flow").style.display = "none";
    document.getElementById("main-flow").style.display = "flex";
    show("screen-home");
    await renderHome();
    renderCropGrid();
  }

  async function loadReferenceData() {
    const [languages, states, crops, signs] = await Promise.all([
      API.getLanguages(),
      API.getStates(),
      API.getCrops(),
      API.getSigns(),
    ]);
    state.languages = languages;
    state.states = states;
    state.crops = crops;
    state.signs = signs;
    localStorage.setItem("ksh_ref_cache", JSON.stringify({ languages, states, crops, signs }));
  }

  async function loadReferenceDataWithFallback() {
    try {
      await loadReferenceData();
    } catch {
      const cached = JSON.parse(localStorage.getItem("ksh_ref_cache") || "null");
      if (cached) {
        if (cached.languages && cached.languages.length > 0) state.languages = cached.languages;
        if (cached.states && cached.states.length > 0) state.states = cached.states;
        if (cached.crops && cached.crops.length > 0) state.crops = cached.crops;
        if (cached.signs && cached.signs.length > 0) state.signs = cached.signs;
      } else if (window.KSH_DATA) {
        state.languages = window.KSH_DATA.languages;
        state.states = window.KSH_DATA.states;
        state.crops = window.KSH_DATA.crops;
        state.signs = window.KSH_DATA.signs;
      }
      toggleOfflineBadge(!API.isOnline());
    }
  }

  async function init() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
    window.addEventListener("online", () => toggleOfflineBadge(false));
    window.addEventListener("offline", () => toggleOfflineBadge(true));
    toggleOfflineBadge(!navigator.onLine);

    const savedLang = localStorage.getItem("ksh_lang") || "hi";
    state.selectedLangCode = savedLang;
    await I18N.load(savedLang);
    updateLangTags();

    await loadReferenceDataWithFallback();
    renderLanguageGrid();
    renderStateGrid();
    bindLanguageScreen();
    bindAuthScreens();
    bindLocationScreen();
    bindInputScreen();
    bindProfileScreen();
    bindNav();

    const token = API.getToken();
    const user = API.getUser();
    if (token && user) {
      state.selectedStateCode = user.stateCode;
      await enterApp();
    } else {
      show("screen-language");
    }
  }

  return { init, state, show };
})();

if (typeof window !== "undefined") {
  window.App = App;
}
if (typeof module !== "undefined") {
  module.exports = App;
}

document.addEventListener("DOMContentLoaded", App.init);
