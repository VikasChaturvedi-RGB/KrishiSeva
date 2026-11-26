// ============================================================================
// KRISHI SAHAYAK — GOOGLE CLOUD ALWAYS-FREE CLIENT INTEGRATION
// Services Used (Strictly $0 / Always-Free Quotas):
//   1. Firebase Hosting (Spark Plan: 10 GB storage, 10 GB/mo transfer)
//   2. Firebase Authentication (Anonymous + Google Sign-In: 50,000 MAU Free, 0 SMS cost)
//   3. Cloud Firestore REST/Offline Sync (1 GiB, 50k reads/day, 20k writes/day Free)
//   4. Google Cloud Run + Gemini Flash Free Tier Proxy (/v1/gemini/guidance)
// ============================================================================

window.KrishiGoogleCloud = {
  mode: 'OFFLINE_FIRST_WITH_GOOGLE_FREE_SYNC',
  projectId: null,
  anonymousFarmerId: null,

  init() {
    let fid = localStorage.getItem('krishi_anon_farmer_uid');
    if (!fid) {
      fid = 'farmer-anon-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('krishi_anon_farmer_uid', fid);
    }
    this.anonymousFarmerId = fid;

    // Fetch public non-secret Google Cloud Free Tier status from Cloud Run backend if reachable
    const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
    fetch(`${apiBase}/google-free/status`)
      .then(r => r.ok ? r.json() : null)
      .then(info => {
        if (info && info.projectId) {
          this.projectId = info.projectId;
          this.mode = info.firestoreEnabled ? 'CLOUD_RUN_FIRESTORE_ACTIVE' : 'CLOUD_RUN_FREE_ACTIVE';
        }
        this.updateStatusBadge();
      })
      .catch(() => {
        this.updateStatusBadge();
      });
  },

  updateStatusBadge() {
    const el = document.getElementById('googleCloudStatusPill');
    if (!el) return;
    const isOnline = navigator.onLine;
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

    const profile = {
      uid: this.anonymousFarmerId,
      name,
      state,
      crop,
      areaAcres: area,
      landUnit: unit,
      language: window.currentLanguage || 'hi',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('krishi_farmer_profile_v2', JSON.stringify(profile));

    // Apply immediately to Home UI
    const farmerNameEl = document.getElementById('homeFarmerName');
    if (farmerNameEl) farmerNameEl.innerText = profile.name;
    const locMetaEl = document.getElementById('homeLocationMeta');
    if (locMetaEl) locMetaEl.innerHTML = `${profile.state} • <strong>${window.formatLandArea(profile.areaAcres)}</strong>`;
    const unitBadge = document.getElementById('landUnitBtnLabel');
    if (unitBadge) unitBadge.innerText = gp(window.KRISHI_UNIT_FACTORS[unit].key, unit);

    // Non-blocking sync to Cloud Run / Firestore Free Tier
    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      await fetch(`${apiBase}/google-free/sync-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) {}

    if (typeof switchView === 'function') switchView('viewHome');
  },

  hydrateSavedFarmProfile() {
    try {
      const raw = localStorage.getItem('krishi_farmer_profile_v2');
      if (!raw) return;
      const p = JSON.parse(raw);
      const farmerNameEl = document.getElementById('homeFarmerName');
      if (farmerNameEl && p.name) farmerNameEl.innerText = p.name;
      const locMetaEl = document.getElementById('homeLocationMeta');
      if (locMetaEl && p.state) {
        locMetaEl.innerHTML = `${p.state} • <strong>${window.formatLandArea(p.areaAcres || 3.5)}</strong>`;
      }
      if (document.getElementById('nameInput') && p.name) document.getElementById('nameInput').value = p.name;
      if (document.getElementById('profileStateSelect') && p.state) document.getElementById('profileStateSelect').value = p.state;
      if (document.getElementById('profileCropSelect') && p.crop) document.getElementById('profileCropSelect').value = p.crop;
      if (document.getElementById('profileAreaInput') && p.areaAcres) document.getElementById('profileAreaInput').value = p.areaAcres;
      if (document.getElementById('profileUnitSelect') && p.landUnit) document.getElementById('profileUnitSelect').value = p.landUnit;
    } catch (e) {}
  },

  async syncDiaryToFirestoreFree(entries) {
    try {
      const apiBase = typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
      await fetch(`${apiBase}/google-free/sync-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: this.anonymousFarmerId, entries: entries.slice(0, 50) })
      });
    } catch (e) {}
  }
};
