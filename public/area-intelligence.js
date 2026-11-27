// ============================================================================
// KRISHI SAHAYAK — AREA INTELLIGENCE UI
//   • "मेरे क्षेत्र की फसल व किस्म" — crop & public-variety fit for the farmer's
//     state/district, soil, water and this month (dataset refreshed monthly)
//   • "मेरी मिट्टी व पोषक कमी" — area soil type, endemic nutrient deficiencies,
//     acre-scaled correction plan, DIY soil tests, Soil Health Card guidance
// Online: /v1 API (server-authoritative). Offline: bundled data/*.json + the
// KrishiAreaEngine mirror. Also feeds the leaf-diagnosis engine an "area prior".
// ============================================================================
(function () {
  'use strict';

  var CTX_KEY = 'krishi_area_ctx_v1';
  var PRIOR_KEY = 'krishi_soil_prior_v1';
  var SEEN_VERSION_KEY = 'krishi_almanac_seen_version';
  var API_TIMEOUT_MS = 5000;

  var STATES = [
    ['Madhya Pradesh', 'मध्य प्रदेश'], ['Maharashtra', 'महाराष्ट्र'], ['Uttar Pradesh', 'उत्तर प्रदेश'], ['Punjab', 'पंजाब'],
    ['Haryana', 'हरियाणा'], ['Rajasthan', 'राजस्थान'], ['Gujarat', 'गुजरात'], ['Bihar', 'बिहार'], ['West Bengal', 'पश्चिम बंगाल'],
    ['Odisha', 'ओडिशा'], ['Chhattisgarh', 'छत्तीसगढ़'], ['Jharkhand', 'झारखंड'], ['Karnataka', 'कर्नाटक'], ['Telangana', 'तेलंगाना'],
    ['Andhra Pradesh', 'आंध्र प्रदेश'], ['Tamil Nadu', 'तमिलनाडु'], ['Assam', 'असम'], ['Other', 'अन्य राज्य']
  ];
  var MONTHS_HI = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  var SEASON_HI = { KHARIF: 'खरीफ', RABI: 'रबी', ZAID: 'जायद', PERENNIAL: 'बारहमासी' };
  var TIMING_HI = { SOW_NOW: '🌱 अभी बुवाई का समय', PREPARE_NOW: '🗓️ अभी तैयारी करें', UPCOMING: '⏳ आगामी', IN_FIELD: '🌾 खेत में फसल' };
  var BAND_HI = { EXCELLENT: 'सर्वोत्तम', GOOD: 'अच्छा', FAIR: 'ठीक', RISKY: 'जोखिम' };
  var SEVERITY_HI = { VERY_HIGH: 'अत्यधिक', HIGH: 'अधिक', MEDIUM: 'मध्यम', LOW: 'कम' };
  var IRRIGATION_HI = { IRRIGATED: 'पूरी सिंचाई', LIMITED: '1–3 सिंचाई', RAINFED: 'असिंचित (वर्षा)' };
  var LEVEL_HI = { VERY_LOW: 'बहुत कम', LOW: 'कम', LOW_MEDIUM: 'कम–मध्यम', MEDIUM: 'मध्यम', MEDIUM_HIGH: 'मध्यम–अधिक', HIGH: 'अधिक' };
  function levelHi(str) {
    return String(str || '').replace(/^([A-Z_]+)/, function (m) { return LEVEL_HI[m] || m; });
  }
  var CROP_OPTIONS = ['SOYBEAN', 'WHEAT', 'PADDY', 'COTTON', 'CHICKPEA', 'MUSTARD', 'MAIZE', 'PIGEONPEA', 'GROUNDNUT', 'SUGARCANE', 'POTATO', 'ONION', 'PEARL_MILLET', 'FINGER_MILLET', 'GREENGRAM', 'TOMATO', 'CHILLI', 'BANANA'];

  var datasets = { almanac: null, atlas: null, loading: null };
  var lastCropFit = null, lastSoil = null;

  function apiBase() { return typeof API_BASE !== 'undefined' ? API_BASE : '/v1'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function track(n, p) { try { if (window.KrishiAnalytics) window.KrishiAnalytics.trackEvent(n, p || {}); } catch (e) {} }
  function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function fetchJson(url, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || API_TIMEOUT_MS);
    return fetch(url, { signal: ctrl ? ctrl.signal : undefined, cache: 'no-cache' })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }

  // ------------------------------------------------------------------ context
  // The app-wide farmer context uses multi-state region labels such as
  // "Uttar Pradesh & Bihar" — map that to the first single state we cover.
  function stateFromRegionLabel(label) {
    if (!label) return null;
    var first = String(label).split(/[&,]/)[0].trim();
    var norm = window.KrishiAreaEngine ? window.KrishiAreaEngine.normaliseStateName(first) : first;
    var lower = String(norm || '').toLowerCase();
    for (var i = 0; i < STATES.length; i++) {
      var k = STATES[i][0].toLowerCase();
      if (k === lower || (lower && k.indexOf(lower) === 0)) return STATES[i][0];
    }
    return 'Other'; // known farmer region we don't cover yet → safe national guidance, not another state's
  }

  function getContext() {
    var profile = readJson('krishi_farmer_profile_v2') || {};
    var ctx = readJson(CTX_KEY) || {};
    var fc = null;
    try { fc = typeof window.getFarmerContext === 'function' ? window.getFarmerContext() : null; } catch (e) { fc = null; }
    return {
      // Explicit choice on the area screens wins, then the farmer's profile/context
      state: ctx.state || stateFromRegionLabel(fc && fc.state) || stateFromRegionLabel(profile.state) || 'Madhya Pradesh',
      district: ctx.district || '',
      pincode: ctx.pincode || '',
      irrigation: ctx.irrigation || 'LIMITED',
      crop: ctx.crop || (fc && fc.crop) || profile.crop || (typeof currentCrop !== 'undefined' ? currentCrop : 'SOYBEAN'),
      acres: Number(ctx.acres || (fc && fc.areaAcres) || profile.areaAcres || 1) || 1,
      month: ctx.month || null
    };
  }
  function saveContext(patch) {
    var next = Object.assign(readJson(CTX_KEY) || {}, patch);
    writeJson(CTX_KEY, next);
    return next;
  }

  // ------------------------------------------------------------------ datasets
  // The Android app loads the PWA from file:// where WebView fetch() cannot read
  // local files, so each dataset also ships as a tiny script that sets a global.
  function loadScriptGlobal(src, globalName) {
    return new Promise(function (resolve, reject) {
      if (window[globalName]) return resolve(window[globalName]);
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = function () { window[globalName] ? resolve(window[globalName]) : reject(new Error(globalName + ' missing')); };
      el.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(el);
    });
  }

  function loadDataset(name, globalName, validKey) {
    return fetchJson('data/' + name + '.json', 8000)
      .then(function (d) { if (!d || !d[validKey]) throw new Error('bad dataset'); return d; })
      .catch(function () { return loadScriptGlobal('data/' + name + '.js', globalName); });
  }

  function loadDatasets() {
    if (datasets.almanac && datasets.atlas) return Promise.resolve(datasets);
    if (datasets.loading) return datasets.loading;
    datasets.loading = Promise.all([
      loadDataset('crop-variety-almanac', 'KRISHI_DATA_CROP_ALMANAC', 'stateSuitability'),
      loadDataset('soil-zone-atlas', 'KRISHI_DATA_SOIL_ATLAS', 'soilTypes')
    ]).then(function (r) {
      datasets.almanac = r[0]; datasets.atlas = r[1]; datasets.loading = null;
      return datasets;
    }).catch(function (e) { datasets.loading = null; throw e; });
    return datasets.loading;
  }

  // Server first (fresh monthly data), bundled offline engine as fallback
  function getCropFit(q) {
    var qs = 'state=' + encodeURIComponent(q.state) + '&district=' + encodeURIComponent(q.district || '') +
      '&irrigation=' + q.irrigation + (q.month ? '&month=' + q.month : '');
    return fetchJson(apiBase() + '/advisory/crop-variety-fit?' + qs)
      .then(function (r) {
        // Service-worker offline stubs or old servers lack the shape → use bundle
        if (!r || !Array.isArray(r.recommendations) || !r.freshness) throw new Error('unexpected response');
        r._source = 'SERVER'; return r;
      })
      .catch(function () {
        return loadDatasets().then(function (d) {
          var r = window.KrishiAreaEngine.recommendCrops(d.almanac, d.atlas, q, new Date());
          r._source = 'OFFLINE_BUNDLE';
          return r;
        });
      });
  }

  function getSoilProfile(q) {
    var qs = 'state=' + encodeURIComponent(q.state) + '&district=' + encodeURIComponent(q.district || '') +
      '&cropCode=' + encodeURIComponent(q.crop || '') + '&acres=' + encodeURIComponent(q.acres || 1);
    return fetchJson(apiBase() + '/soil/area-profile?' + qs)
      .then(function (r) {
        if (!r || !r.primarySoil || !Array.isArray(r.deficiencies)) throw new Error('unexpected response');
        r._source = 'SERVER'; return r;
      })
      .catch(function () {
        return loadDatasets().then(function (d) {
          var r = window.KrishiAreaEngine.soilProfile(d.atlas, { state: q.state, district: q.district, cropCode: q.crop, acres: q.acres }, new Date());
          r._source = 'OFFLINE_BUNDLE';
          return r;
        });
      });
  }

  // Leaf-diagnosis area prior: { ZN: 'HIGH', B: 'VERY_HIGH', ... }
  function storePrior(profile) {
    if (!profile || !profile.deficiencies) return;
    var prior = {};
    profile.deficiencies.forEach(function (d) { prior[d.nutrient] = d.severity; });
    writeJson(PRIOR_KEY, { state: profile.area.state, district: profile.area.district, prior: prior, at: Date.now() });
  }
  function getSoilDeficiencyPrior() {
    var p = readJson(PRIOR_KEY);
    var ctx = getContext();
    if (p && p.prior && p.state === ctx.state) return p.prior;
    // Compute synchronously from bundled atlas if already loaded
    if (datasets.atlas && window.KrishiAreaEngine) {
      var prof = window.KrishiAreaEngine.soilProfile(datasets.atlas, { state: ctx.state, district: ctx.district }, new Date());
      storePrior(prof);
      var out = {};
      prof.deficiencies.forEach(function (d) { out[d.nutrient] = d.severity; });
      return out;
    }
    return {};
  }

  // ------------------------------------------------------------------ shared area form
  function areaFormHtml(prefix, ctx, opts) {
    opts = opts || {};
    var stateOptions = STATES.map(function (s) {
      return '<option value="' + esc(s[0]) + '"' + (s[0] === ctx.state ? ' selected' : '') + '>' + esc(s[1]) + ' (' + esc(s[0]) + ')</option>';
    }).join('');
    var districts = [];
    if (datasets.atlas && datasets.atlas.states[ctx.state]) districts = Object.keys(datasets.atlas.states[ctx.state].districts);
    var html = '' +
      '<div class="ai-area-form">' +
      '  <div class="ai-row">' +
      '    <label>राज्य<select id="' + prefix + 'State" onchange="KrishiAreaIntel.onAreaChange(\'' + prefix + '\')">' + stateOptions + '</select></label>' +
      '    <label>जिला<input id="' + prefix + 'District" list="' + prefix + 'DistrictList" value="' + esc(ctx.district) + '" placeholder="उदा. धार" onchange="KrishiAreaIntel.onAreaChange(\'' + prefix + '\')"></label>' +
      '    <datalist id="' + prefix + 'DistrictList">' + districts.map(function (d) { return '<option value="' + esc(d) + '">'; }).join('') + '</datalist>' +
      '  </div>' +
      '  <div class="ai-row">' +
      '    <label>पिन कोड<input id="' + prefix + 'Pin" inputmode="numeric" maxlength="6" value="' + esc(ctx.pincode) + '" placeholder="6 अंक"></label>' +
      '    <button type="button" class="acc-pill-btn ai-pin-btn" onclick="KrishiAreaIntel.lookupPincode(\'' + prefix + '\')"><i class="fa-solid fa-location-crosshairs"></i> पिन से क्षेत्र भरें</button>' +
      '  </div>';
    if (opts.irrigation) {
      html += '<div class="ai-seg" role="group" aria-label="सिंचाई">' + ['IRRIGATED', 'LIMITED', 'RAINFED'].map(function (k) {
        return '<button type="button" class="ai-seg-btn' + (ctx.irrigation === k ? ' active' : '') + '" onclick="KrishiAreaIntel.setIrrigation(\'' + k + '\')">' + IRRIGATION_HI[k] + '</button>';
      }).join('') + '</div>';
    }
    if (opts.crop) {
      html += '<div class="ai-row"><label>मेरी फसल<select id="' + prefix + 'Crop" onchange="KrishiAreaIntel.onAreaChange(\'' + prefix + '\')">' +
        CROP_OPTIONS.map(function (c) {
          var name = datasets.almanac && datasets.almanac.crops[c] ? datasets.almanac.crops[c].cropNameHi : c;
          return '<option value="' + c + '"' + (c === ctx.crop ? ' selected' : '') + '>' + esc(name) + '</option>';
        }).join('') + '</select></label>' +
        '<label>जमीन (एकड़)<input id="' + prefix + 'Acres" type="number" min="0.1" max="500" step="0.5" value="' + esc(ctx.acres) + '" onchange="KrishiAreaIntel.onAreaChange(\'' + prefix + '\')"></label></div>';
    }
    if (opts.month) {
      var m = ctx.month || (window.KrishiAreaEngine ? window.KrishiAreaEngine.istMonth() : new Date().getMonth() + 1);
      html += '<div class="ai-row"><label>महीना<select id="' + prefix + 'Month" onchange="KrishiAreaIntel.onAreaChange(\'' + prefix + '\')">' +
        MONTHS_HI.map(function (n, i) { return '<option value="' + (i + 1) + '"' + (i + 1 === m ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label></div>';
    }
    return html + '</div>';
  }

  function freshnessHtml(f, source) {
    if (!f) return '';
    var d = new Date(f.lastReviewedAt + 'T00:00:00');
    var next = new Date(f.nextRefreshDueOn + 'T00:00:00');
    var label = MONTHS_HI[d.getMonth()] + ' ' + d.getFullYear();
    var src = source === 'SERVER' ? '<i class="fa-solid fa-cloud"></i> सर्वर' : '<i class="fa-solid fa-mobile-screen"></i> ऑफ़लाइन डेटा';
    return '<div class="ai-freshness' + (f.isStale ? ' stale' : '') + '">' +
      '<span><i class="fa-solid fa-rotate"></i> मासिक अद्यतन: <strong>' + label + '</strong> (v' + esc(f.dataVersion) + ')</span>' +
      '<span>अगला: ' + next.getDate() + ' ' + MONTHS_HI[next.getMonth()] + ' • ' + src + '</span>' +
      (f.isStale ? '<span class="ai-stale-note">⚠️ डेटा पुराना हो सकता है — इंटरनेट चालू कर ऐप खोलें</span>' : '') +
      '</div>';
  }

  function readForm(prefix) {
    var g = function (id) { var el = document.getElementById(prefix + id); return el ? el.value : undefined; };
    var patch = {};
    if (g('State') !== undefined) patch.state = g('State');
    if (g('District') !== undefined) patch.district = String(g('District') || '').trim();
    if (g('Pin') !== undefined) patch.pincode = String(g('Pin') || '').trim();
    if (g('Crop') !== undefined) patch.crop = g('Crop');
    if (g('Acres') !== undefined) patch.acres = Number(g('Acres')) || 1;
    if (g('Month') !== undefined) patch.month = Number(g('Month')) || null;
    return patch;
  }

  // ------------------------------------------------------------------ Crop fit screen
  function renderCropFit() {
    var root = document.getElementById('cropFitRoot');
    if (!root) return;
    var t0 = performance.now();
    var ctx = getContext();
    root.innerHTML = areaFormHtml('cf', ctx, { irrigation: true, month: true }) +
      '<div id="cropFitResults" class="ai-results"><div class="loading-state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> आपके क्षेत्र की फसल-किस्म सलाह तैयार हो रही है...</div></div>';
    // Ensure datalist/crop names populate once datasets arrive
    loadDatasets().then(function () {
      var dl = document.getElementById('cfDistrictList');
      if (dl && datasets.atlas.states[ctx.state]) dl.innerHTML = Object.keys(datasets.atlas.states[ctx.state].districts).map(function (d) { return '<option value="' + esc(d) + '">'; }).join('');
    }).catch(function () {});

    // 'Other' is not in the almanac → engines fall back to the safe national list
    var q = { state: ctx.state, district: ctx.district, irrigation: ctx.irrigation, month: ctx.month || undefined };
    getCropFit(q).then(function (r) {
      lastCropFit = r;
      paintCropFit(r);
      track('crop_fit_viewed', { state: r.area.state, month: r.month, irrigation: r.irrigation, source: r._source, data_version: r.freshness.dataVersion, top_crop: r.recommendations[0] && r.recommendations[0].cropCode });
      if (window.KrishiAnalytics && window.KrishiAnalytics.trackTiming) window.KrishiAnalytics.trackTiming('crop_fit_load', t0, { source: r._source });
    }).catch(function (e) {
      var box = document.getElementById('cropFitResults');
      if (box) box.innerHTML = '<div class="ai-error">⚠️ सलाह लोड नहीं हुई (' + esc(e.message) + '). इंटरनेट चालू कर दोबारा खोलें या KVK 1800-180-1551 पर कॉल करें।</div>';
      track('crop_fit_error', { error: String(e.message).slice(0, 80) });
    });
  }

  function paintCropFit(r) {
    var box = document.getElementById('cropFitResults');
    if (!box) return;
    var soilName = datasets.atlas && datasets.atlas.soilTypes[r.soilTypeUsed] ? datasets.atlas.soilTypes[r.soilTypeUsed].nameHi : r.soilTypeUsed;
    var head = freshnessHtml(r.freshness, r._source) +
      '<div class="ai-summary">' +
      '<strong>' + esc(r.area.state) + (r.area.district ? ' • ' + esc(r.area.district) : '') + '</strong> • ' + MONTHS_HI[r.month - 1] +
      ' • ' + r.seasonFocus.map(function (s) { return SEASON_HI[s] || s; }).join(' + ') +
      '<br><small>मिट्टी: ' + esc(soilName) + (r.soilTypeSource === 'DISTRICT_ATLAS' ? ' (जिला आधारित)' : r.soilTypeSource === 'STATE_ATLAS' ? ' (राज्य आधारित — जिला चुनें)' : '') +
      ' • पानी: ' + IRRIGATION_HI[r.irrigation] + '</small>' +
      (r.area.agroClimaticZones && r.area.agroClimaticZones.length ? '<br><small>कृषि-जलवायु क्षेत्र: ' + esc(r.area.agroClimaticZones.join(', ')) + '</small>' : '') +
      '</div>' +
      '<p class="ai-note"><i class="fa-solid fa-hand-holding-heart"></i> ' + esc(r.advisoryNoteHi) + '</p>';

    var cards = r.recommendations.map(function (c, idx) {
      var varieties = c.varieties.map(function (v) {
        return '<li class="ai-variety">' +
          '<div class="ai-v-head"><strong>' + esc(v.name) + '</strong><small>' + esc(v.releasedBy) + '</small></div>' +
          '<div class="ai-v-meta"><span>⏱ ' + esc(v.durationDays) + ' दिन</span><span>⚖️ ' + esc(v.yieldQtlPerAcre) + ' क्विं/एकड़</span></div>' +
          (v.matchReasonsHi.length ? '<div class="ai-v-tags">' + v.matchReasonsHi.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
          '<p>' + esc(v.noteHi) + '</p></li>';
      }).join('');
      return '<details class="ai-crop-card band-' + c.fitBand.toLowerCase() + '"' + (idx < 2 ? ' open' : '') + '>' +
        '<summary>' +
        '  <div class="ai-crop-title"><span class="ai-crop-name">' + esc(c.cropNameHi) + '</span><small>' + esc(c.cropNameEn) + ' • ' + (SEASON_HI[c.season] || c.season) + '</small></div>' +
        '  <div class="ai-crop-score"><strong>' + c.fitScore + '</strong><small>' + BAND_HI[c.fitBand] + '</small></div>' +
        '</summary>' +
        '<div class="ai-crop-body">' +
        '  <span class="ai-timing ' + c.timing.toLowerCase() + '">' + TIMING_HI[c.timing] + '</span>' +
        '  <p>' + esc(c.reasonHi) + '</p>' +
        (c.cautionHi ? '  <p class="ai-caution"><i class="fa-solid fa-triangle-exclamation"></i> ' + esc(c.cautionHi) + '</p>' : '') +
        (c.adjustmentsHi.length ? '  <div class="ai-adjust">' + c.adjustmentsHi.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '') +
        '  <div class="ai-kv"><span>📅 बुवाई</span><p>' + esc(c.sowingWindowHi) + '</p></div>' +
        '  <div class="ai-kv"><span>🌾 बीज दर</span><p>' + esc(c.seedRatePerAcre) + '</p></div>' +
        '  <div class="ai-kv"><span>🔄 फसल चक्र</span><p>' + esc(c.rotationAdviceHi) + '</p></div>' +
        (c.marketSignal ? '  <div class="ai-kv"><span>💹 मंडी भाव</span><p>₹' + Number(c.marketSignal.modalInrPerQtl).toLocaleString('en-IN') + '/क्विं (मध्य मॉडल भाव, ' + c.marketSignal.marketsReporting + ' मंडियाँ, ' + esc(r.marketSignalsAsOf || '') + ')</p></div>' : '') +
        '  <h6>उपयुक्त सरकारी/ICAR किस्में</h6><ul class="ai-variety-list">' + varieties + '</ul>' +
        '  <button type="button" class="acc-pill-btn" onclick="KrishiAreaIntel.openSoilForCrop(\'' + c.cropCode + '\')"><i class="fa-solid fa-earth-asia"></i> इस फसल हेतु मेरी मिट्टी की कमी देखें</button>' +
        '</div></details>';
    }).join('');

    var srcs = '<details class="ai-sources"><summary>डेटा स्रोत</summary><ul>' + (r.sources || []).map(function (s) {
      return '<li>' + esc(s.name) + ' — <small>' + esc(s.url) + '</small></li>';
    }).join('') + '</ul></details>';

    box.innerHTML = head + cards + srcs;
  }

  // ------------------------------------------------------------------ Soil atlas screen
  function renderSoilAtlas() {
    var root = document.getElementById('soilAtlasRoot');
    if (!root) return;
    var ctx = getContext();
    root.innerHTML = areaFormHtml('sa', ctx, { crop: true }) +
      '<div id="soilAtlasResults" class="ai-results"><div class="loading-state-box"><i class="fa-solid fa-circle-notch fa-spin"></i> आपके क्षेत्र की मिट्टी का विवरण लोड हो रहा है...</div></div>';
    loadDatasets().then(function () {
      var dl = document.getElementById('saDistrictList');
      if (dl && datasets.atlas.states[ctx.state]) dl.innerHTML = Object.keys(datasets.atlas.states[ctx.state].districts).map(function (d) { return '<option value="' + esc(d) + '">'; }).join('');
      var cs = document.getElementById('saCrop');
      if (cs) Array.prototype.forEach.call(cs.options, function (o) { var c = datasets.almanac.crops[o.value]; if (c) o.textContent = c.cropNameHi; });
    }).catch(function () {});

    getSoilProfile({ state: ctx.state, district: ctx.district, crop: ctx.crop, acres: ctx.acres }).then(function (r) {
      lastSoil = r;
      storePrior(r);
      paintSoil(r);
      track('soil_atlas_viewed', { state: r.area.state, district_matched: r.area.matchedDistrict ? 'yes' : 'no', crop: ctx.crop, primary_soil: r.primarySoil.type, top_deficiency: r.deficiencies[0] && r.deficiencies[0].nutrient, source: r._source });
    }).catch(function (e) {
      var box = document.getElementById('soilAtlasResults');
      if (box) box.innerHTML = '<div class="ai-error">⚠️ मिट्टी विवरण लोड नहीं हुआ (' + esc(e.message) + ').</div>';
      track('soil_atlas_error', { error: String(e.message).slice(0, 80) });
    });
  }

  function paintSoil(r) {
    var box = document.getElementById('soilAtlasResults');
    if (!box) return;
    var ps = r.primarySoil;
    var sevPct = { VERY_HIGH: 100, HIGH: 75, MEDIUM: 50, LOW: 25 };

    var soilCard = '<div class="ai-soil-hero">' +
      '<span class="ai-soil-badge">' + (r.area.matchedDistrict ? 'आपके जिले की मुख्य मिट्टी' : 'आपके राज्य की मुख्य मिट्टी') + '</span>' +
      '<h4>' + esc(ps.nameHi) + '</h4><small>' + esc(ps.nameEn) + ' • स्थानीय नाम: ' + esc(ps.localNamesHi) + '</small>' +
      (r.districtNoteHi ? '<p class="ai-district-note"><i class="fa-solid fa-location-dot"></i> ' + esc(r.districtNoteHi) + '</p>' : '') +
      '<div class="ai-soil-grid">' +
      '<div><span>बनावट</span><p>' + esc(ps.textureHi) + '</p></div>' +
      '<div><span>सामान्य pH</span><p>' + esc(ps.phTypical) + ' (क्षेत्र: ' + esc(r.phBand) + ')</p></div>' +
      '<div><span>जैविक कार्बन</span><p>' + esc(levelHi(ps.organicCarbonTypical)) + ' (क्षेत्र: ' + esc(levelHi(r.organicCarbonStatus)) + ')</p></div>' +
      '<div><span>जल धारण</span><p>' + esc(ps.waterHoldingHi) + '</p></div>' +
      '</div>' +
      '<p><strong>✅ ताकत:</strong> ' + esc(ps.strengthsHi) + '</p>' +
      '<p><strong>⚠️ कमजोरी:</strong> ' + esc(ps.weaknessesHi) + '</p>' +
      '<p><strong>🛠️ प्रबंधन:</strong> ' + esc(ps.managementHi) + '</p>' +
      '<p class="ai-diy-id"><i class="fa-solid fa-hand"></i> <strong>खुद पहचानें:</strong> ' + esc(ps.diyIdentifyHi) + '</p>' +
      '</div>';

    var shares = '<div class="ai-card"><h5>क्षेत्र में मिट्टी के प्रकार</h5>' + r.dominantSoils.map(function (d) {
      return '<div class="ai-share"><div class="ai-share-head"><span>' + esc(d.nameHi) + '</span><strong>' + d.sharePct + '%</strong></div>' +
        '<div class="ai-bar"><i style="width:' + Math.min(100, d.sharePct) + '%"></i></div><small>' + esc(d.regionsHi) + '</small></div>';
    }).join('') + '</div>';

    var emphasis = r.cropEmphasis ? '<p class="ai-note"><i class="fa-solid fa-seedling"></i> ' + esc(r.cropEmphasis.reasonHi) + '</p>' : '';

    var defs = '<div class="ai-card"><h5>आपके क्षेत्र में आम पोषक कमियाँ</h5>' + emphasis + r.deficiencies.map(function (d) {
      return '<details class="ai-def sev-' + d.severity.toLowerCase() + '"' + (d.cropCritical ? ' open' : '') + '>' +
        '<summary><div class="ai-def-head"><strong>' + esc(d.nameHi) + '</strong>' + (d.cropCritical ? '<span class="ai-crit">आपकी फसल हेतु अहम</span>' : '') + '</div>' +
        '<div class="ai-def-meta"><span>कमी: ' + SEVERITY_HI[d.severity] + '</span><span>~' + d.approxPctSamplesDeficient + '% नमूने</span></div>' +
        '<div class="ai-bar sev"><i style="width:' + (sevPct[d.severity] || 40) + '%"></i></div></summary>' +
        '<div class="ai-def-body">' +
        '<p><strong>📍 कहाँ अधिक:</strong> ' + esc(d.hotspotsHi) + '</p>' +
        '<p><strong>👁️ पत्ती पर लक्षण:</strong> ' + esc(d.symptomHi) + '</p>' +
        '<p><strong>🧪 मिट्टी में सुधार:</strong> ' + esc(d.soilCorrectionHi) + '</p>' +
        '<p><strong>💧 तुरंत (पर्णीय):</strong> ' + esc(d.foliarCorrectionHi) + '</p>' +
        '<p><strong>🌿 जैविक:</strong> ' + esc(d.organicHi) + '</p>' +
        '</div></details>';
    }).join('') + '</div>';

    var plan = '<div class="ai-card"><h5>आपके खेत हेतु सुधार योजना</h5><ol class="ai-plan">' + r.correctionPlan.map(function (p) {
      return '<li><strong>' + esc(p.actionHi) + '</strong><span>मात्रा: ' + esc(p.quantityHi) + '</span><small>समय: ' + esc(p.timingHi) + '</small></li>';
    }).join('') + '</ol>' +
      '<button type="button" class="acc-pill-btn" onclick="openCameraView(\'photo\')"><i class="fa-solid fa-camera"></i> पत्ती में लक्षण दिखें तो फोटो से जांचें</button></div>';

    var diy = (r.diySoilTests || []).length ? '<div class="ai-card"><h5>घर पर 4 निःशुल्क मिट्टी परीक्षण</h5>' + r.diySoilTests.map(function (t) {
      return '<details class="ai-diy"><summary>' + esc(t.titleHi) + '</summary><p>' + esc(t.stepsHi).replace(/\n/g, '<br>') + '</p></details>';
    }).join('') + '</div>' : '';

    var shc = (r.soilHealthCardGuidanceHi || []).length ? '<div class="ai-card"><h5>मृदा स्वास्थ्य कार्ड (निःशुल्क) कैसे बनवाएं</h5><ul class="ai-shc">' +
      r.soilHealthCardGuidanceHi.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div>' : '';

    box.innerHTML = freshnessHtml(r.freshness, r._source) + soilCard + shares + defs + plan + diy + shc +
      '<p class="ai-disclaimer"><i class="fa-solid fa-circle-info"></i> ' + esc(r.disclaimerHi) + '</p>';
  }

  // ------------------------------------------------------------------ interactions
  function onAreaChange(prefix) {
    var patch = readForm(prefix);
    // State changed → old district no longer valid
    var prev = getContext();
    if (patch.state && patch.state !== prev.state && patch.district === prev.district) patch.district = '';
    saveContext(patch);
    if (prefix === 'cf') renderCropFit(); else renderSoilAtlas();
  }

  function setIrrigation(k) {
    saveContext({ irrigation: k });
    renderCropFit();
  }

  function lookupPincode(prefix) {
    var pinEl = document.getElementById(prefix + 'Pin');
    var pin = pinEl ? String(pinEl.value || '').trim() : '';
    if (!/^\d{6}$/.test(pin)) { if (pinEl) pinEl.classList.add('ai-invalid'); return; }
    if (pinEl) pinEl.classList.remove('ai-invalid');
    fetchJson(apiBase() + '/auth/pincode/' + pin, 6000).then(function (r) {
      if (!r || !r.state) throw new Error('no state');
      var state = window.KrishiAreaEngine ? window.KrishiAreaEngine.normaliseStateName(r.state) : r.state;
      var known = STATES.some(function (s) { return s[0] === state; });
      saveContext({ pincode: pin, state: known ? state : 'Other', district: r.district || '' });
      track('area_pincode_resolved', { state_known: known ? 'yes' : 'no' });
      if (prefix === 'cf') renderCropFit(); else renderSoilAtlas();
    }).catch(function () {
      saveContext({ pincode: pin });
      alert('पिन कोड से क्षेत्र नहीं मिला (इंटरनेट/सर्वर). कृपया राज्य व जिला स्वयं चुनें।');
    });
  }

  function openSoilForCrop(cropCode) {
    saveContext({ crop: cropCode });
    if (typeof switchView === 'function') switchView('viewSoilAtlas');
  }

  // ------------------------------------------------------------------ monthly update notice (home)
  function checkMonthlyUpdate() {
    loadDatasets().then(function (d) {
      var f = window.KrishiAreaEngine.computeFreshness(d.almanac.meta.almanacVersion, d.almanac.meta.lastReviewedAt, new Date());
      var seen = localStorage.getItem(SEEN_VERSION_KEY);
      var el = document.getElementById('homeCropFitSub');
      var reviewed = new Date(d.almanac.meta.lastReviewedAt + 'T00:00:00');
      var label = MONTHS_HI[reviewed.getMonth()] + ' ' + reviewed.getFullYear();
      if (el) el.innerText = (seen !== d.almanac.meta.almanacVersion ? '🆕 ' : '') + label + ' की सलाह • ' + (f.isStale ? 'अपडेट लंबित' : 'मासिक अपडेट');
      if (seen !== d.almanac.meta.almanacVersion) {
        track('crop_fit_data_updated', { data_version: d.almanac.meta.almanacVersion, previous_version: seen || 'none' });
      }
      // Warm the diagnosis prior for the farmer's area
      getSoilDeficiencyPrior();
    }).catch(function () {});
  }

  function markSeen() {
    if (datasets.almanac) { try { localStorage.setItem(SEEN_VERSION_KEY, datasets.almanac.meta.almanacVersion); } catch (e) {} }
  }

  window.KrishiAreaIntel = {
    renderCropFit: function () { renderCropFit(); loadDatasets().then(markSeen).catch(function () {}); },
    renderSoilAtlas: renderSoilAtlas,
    onAreaChange: onAreaChange,
    setIrrigation: setIrrigation,
    lookupPincode: lookupPincode,
    openSoilForCrop: openSoilForCrop,
    getSoilDeficiencyPrior: getSoilDeficiencyPrior,
    getContext: getContext,
    loadDatasets: loadDatasets,
    _last: function () { return { cropFit: lastCropFit, soil: lastSoil }; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkMonthlyUpdate);
  else checkMonthlyUpdate();
})();
