// ============================================================================
// KRISHI SAHAYAK — ALWAYS-ON PHOTO / VIDEO DIAGNOSIS PIPELINE
// ----------------------------------------------------------------------------
// Guarantees a farmer ALWAYS gets an answer from a leaf photo or video:
//   1. Reads the real pixels (camera snapshot, gallery photo, recorded video,
//      uploaded video, or frames grabbed live while recording).
//   2. Runs the on-device KrishiLeafVision engine — no network needed.
//   3. In parallel asks the server (/v1/diagnosis/diagnose/submit) to verify,
//      persist and attach the CIB&RC/state-ban checked prescription — with a
//      timeout and one retry. Server failure never blocks the farmer.
//   4. A watchdog guarantees completion within WATCHDOG_MS; any crash returns
//      a safe "retake + area-common deficiencies" result instead of a spinner.
//   5. A self-test on synthetic leaves runs at start-up and daily, exposing a
//      health status pill and GA4/GTM events so breakage is noticed quickly.
// ============================================================================
(function () {
  'use strict';

  var WATCHDOG_MS = 15000;
  var SERVER_TIMEOUT_MS = 7000;
  var MAX_ANALYSIS_SIDE = 800;
  var VIDEO_FRAMES = 6;
  var SELFTEST_KEY = 'krishi_ai_selftest_v1';

  function apiBase() {
    return typeof API_BASE !== 'undefined' ? API_BASE : '/v1';
  }

  function track(name, params) {
    try { if (window.KrishiAnalytics) window.KrishiAnalytics.trackEvent(name, params || {}); } catch (e) {}
  }

  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error((label || 'operation') + ' timed out after ' + ms + 'ms')); }, ms);
      Promise.resolve(promise).then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function waitEvent(el, evt, ms) {
    return withTimeout(new Promise(function (resolve, reject) {
      function ok() { cleanup(); resolve(); }
      function bad() { cleanup(); reject(new Error(evt + ' failed')); }
      function cleanup() { el.removeEventListener(evt, ok); el.removeEventListener('error', bad); }
      el.addEventListener(evt, ok, { once: true });
      el.addEventListener('error', bad, { once: true });
    }), ms || 4000, evt);
  }

  // --------------------------------------------------------------------------
  // Pixel acquisition
  // --------------------------------------------------------------------------
  function drawToImageData(source, srcW, srcH, maxSide) {
    var scale = Math.min(1, (maxSide || MAX_ANALYSIS_SIDE) / Math.max(srcW, srcH));
    var w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, w, h);
    return { imageData: ctx.getImageData(0, 0, w, h), canvas: canvas };
  }

  async function bitmapFromBlob(blob) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch (e) { /* fall through */ }
      try { return await createImageBitmap(blob); } catch (e2) { /* fall through */ }
    }
    var url = URL.createObjectURL(blob);
    try {
      var img = new Image();
      img.decoding = 'async';
      img.src = url;
      await waitEvent(img, 'load', 6000);
      return img;
    } finally {
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }
  }

  async function imageDataFromImgElement(img) {
    if (!img || !img.src) throw new Error('No preview image');
    if (!img.complete || !img.naturalWidth) await waitEvent(img, 'load', 6000);
    try {
      return drawToImageData(img, img.naturalWidth, img.naturalHeight);
    } catch (taintErr) {
      // Cross-origin sample image: re-fetch as blob (CORS) so pixels are readable
      var res = await withTimeout(fetch(img.src, { mode: 'cors' }), 6000, 'image fetch');
      var bmp = await bitmapFromBlob(await res.blob());
      return drawToImageData(bmp, bmp.width || bmp.naturalWidth, bmp.height || bmp.naturalHeight);
    }
  }

  async function photoImageData() {
    var file = typeof currentUploadedFile !== 'undefined' ? currentUploadedFile : null;
    if (file && file.type && file.type.indexOf('image/') === 0) {
      var bmp = await bitmapFromBlob(file);
      return drawToImageData(bmp, bmp.width || bmp.naturalWidth, bmp.height || bmp.naturalHeight);
    }
    return imageDataFromImgElement(document.getElementById('leafPreviewImg'));
  }

  // Frames grabbed straight from the live camera while recording — works even
  // when MediaRecorder or the recorded codec is unsupported on the phone.
  var liveFrames = [];
  var liveFrameTimer = null;

  function startLiveFrameGrab(videoEl) {
    stopLiveFrameGrab();
    liveFrames = [];
    if (!videoEl) return;
    liveFrameTimer = setInterval(function () {
      try {
        if (!videoEl.videoWidth || liveFrames.length >= 10) return;
        liveFrames.push(drawToImageData(videoEl, videoEl.videoWidth, videoEl.videoHeight, 480).imageData);
      } catch (e) { /* camera not ready yet */ }
    }, 900);
  }

  function stopLiveFrameGrab() {
    if (liveFrameTimer) clearInterval(liveFrameTimer);
    liveFrameTimer = null;
  }

  async function framesFromVideoSource(src, count) {
    var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.src = src;
    await waitEvent(v, 'loadeddata', 8000);
    var dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
    // MediaRecorder WebM blobs often report Infinity duration until seeked to the end
    if (!dur) {
      try { v.currentTime = 1e7; await waitEvent(v, 'seeked', 3000); dur = v.duration; } catch (e) {}
    }
    var frames = [];
    var n = Math.max(1, count || VIDEO_FRAMES);
    for (var k = 0; k < n; k++) {
      var t = dur ? Math.min(dur - 0.05, (dur * (k + 0.5)) / n) : 0;
      try {
        v.currentTime = Math.max(0, t);
        await waitEvent(v, 'seeked', 3000);
        frames.push(drawToImageData(v, v.videoWidth, v.videoHeight, 480).imageData);
      } catch (e) { /* skip unreadable frame */ }
      if (!dur) break;
    }
    v.removeAttribute('src'); v.load();
    return frames;
  }

  async function videoFrames() {
    if (liveFrames.length >= 2) return liveFrames.slice();
    var file = typeof currentUploadedFile !== 'undefined' ? currentUploadedFile : null;
    if (file && file.type && file.type.indexOf('video/') === 0) {
      var url = URL.createObjectURL(file);
      try { return await framesFromVideoSource(url, VIDEO_FRAMES); } finally { URL.revokeObjectURL(url); }
    }
    if (window.__krishiLastVideoBlob) {
      var url2 = URL.createObjectURL(window.__krishiLastVideoBlob);
      try { return await framesFromVideoSource(url2, VIDEO_FRAMES); } finally { URL.revokeObjectURL(url2); }
    }
    var pv = document.getElementById('leafPreviewVideo');
    if (pv && pv.src) return framesFromVideoSource(pv.src, VIDEO_FRAMES);
    return liveFrames.slice();
  }

  function thumbnailDataUrl(canvas) {
    try {
      var scale = Math.min(1, 320 / Math.max(canvas.width, canvas.height));
      var c = document.createElement('canvas');
      c.width = Math.round(canvas.width * scale); c.height = Math.round(canvas.height * scale);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.7);
    } catch (e) { return null; }
  }

  function imageDataToCanvas(imageData) {
    var c = document.createElement('canvas');
    c.width = imageData.width; c.height = imageData.height;
    c.getContext('2d').putImageData(imageData, 0, 0);
    return c;
  }

  // --------------------------------------------------------------------------
  // Area prior (links to the Soil Atlas: endemic deficiencies in farmer's area)
  // --------------------------------------------------------------------------
  function areaPrior() {
    try {
      if (window.KrishiAreaIntel && typeof window.KrishiAreaIntel.getSoilDeficiencyPrior === 'function') {
        return window.KrishiAreaIntel.getSoilDeficiencyPrior() || {};
      }
    } catch (e) {}
    return {};
  }

  // --------------------------------------------------------------------------
  // Server verification (non-blocking, timeout + one retry)
  // --------------------------------------------------------------------------
  async function verifyWithServer(payload) {
    if (!navigator.onLine) return { ok: false, reason: 'OFFLINE' };
    for (var attempt = 0; attempt < 2; attempt++) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, SERVER_TIMEOUT_MS);
      try {
        var res = await fetch(apiBase() + '/diagnosis/diagnose/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept-Language': window.currentLanguage || 'hi' },
          body: JSON.stringify(payload),
          signal: ctrl ? ctrl.signal : undefined
        });
        clearTimeout(timer);
        if (res.ok) {
          var data = await res.json();
          // Only a real, persisted server diagnosis counts as verification
          if (data && data.diagnosisId && !data.offline && data.status !== 'OFFLINE_CACHED_INFERENCE') return { ok: true, data: data };
          return { ok: false, reason: data && data.status === 'REJECTED_POOR_QUALITY' ? 'SERVER_REJECTED_QUALITY' : 'NOT_PERSISTED' };
        }
        if (res.status >= 400 && res.status < 500) return { ok: false, reason: 'HTTP_' + res.status };
      } catch (e) {
        clearTimeout(timer);
        if (attempt === 1) return { ok: false, reason: e && e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK' };
      }
    }
    return { ok: false, reason: 'SERVER_ERROR' };
  }

  // --------------------------------------------------------------------------
  // Main entry
  // --------------------------------------------------------------------------
  async function runPipeline(opts, onStage) {
    var engine = window.KrishiLeafVision;
    if (!engine) throw new Error('Leaf vision engine not loaded');
    var mode = opts.mode === 'video' ? 'video' : 'photo';
    var startedAt = performance.now();

    onStage(1, mode === 'video' ? 'वीडियो से फ्रेम निकाले जा रहे हैं...' : 'फोटो के पिक्सेल पढ़े जा रहे हैं...');
    var features, thumbCanvas = null, framesInfo = null;

    if (mode === 'video') {
      var frames = await withTimeout(videoFrames(), 12000, 'video decode');
      if (!frames.length) throw new Error('NO_VIDEO_FRAMES');
      var perFrame = frames.map(function (fr) { return engine.analyzePixels(fr.data, fr.width, fr.height); });
      features = engine.aggregateFrames(perFrame);
      thumbCanvas = imageDataToCanvas(frames[Math.floor(frames.length / 2)]);
      framesInfo = { analysed: frames.length, used: features.framesUsed || frames.length };
    } else {
      var px = await withTimeout(photoImageData(), 9000, 'image decode');
      features = engine.analyzePixels(px.imageData.data, px.imageData.width, px.imageData.height);
      thumbCanvas = px.canvas;
    }

    onStage(2, 'रंग, धब्बे व पीलेपन का पैटर्न मापा गया', features);

    var ctx = {
      crop: opts.crop,
      leafAge: opts.leafAge || null,
      humidity: opts.humidity || null,
      areaPrior: areaPrior()
    };
    var local = engine.diagnose(features, ctx);
    onStage(3, 'संभावित कारण क्रमबद्ध: ' + local.nameHi, local);

    var payload = {
      fileName: opts.fileName || ((opts.crop || 'crop').toLowerCase() + '_' + mode + '.jpg'),
      isLeafOnlyScan: true,
      mediaType: mode,
      imageUrl: thumbCanvas ? thumbnailDataUrl(thumbCanvas) : undefined,
      qualityMetrics: {
        blurScore: features.quality.blurScore,
        brightnessScore: features.quality.brightnessScore,
        isAcceptableQuality: features.quality.isAcceptableQuality,
        issues: features.quality.issues
      },
      clientVision: {
        engineVersion: local.engineVersion,
        code: local.code,
        backendCode: local.backendCode,
        category: local.category,
        nameHi: local.nameHi,
        nameEn: local.nameEn,
        confidence: local.confidence,
        differentials: local.differentials,
        tissue: features.tissue,
        lesions: features.lesions,
        pattern: features.pattern,
        frames: framesInfo
      },
      context: {
        cropSpecies: opts.crop,
        affectedPlantPart: 'LEAF',
        state: opts.state || undefined,
        weatherContext: opts.humidity ? { relativeHumidityPercent: opts.humidity } : undefined
      }
    };

    var server = opts.offline ? { ok: false, reason: 'OFFLINE' } : await verifyWithServer(payload);
    onStage(4, server.ok ? 'सर्वर सत्यापन व पर्चा सुरक्षित' : 'ऑफ़लाइन — फोन पर ही निदान पूर्ण', server);

    return {
      __pipeline: true,
      mode: mode,
      crop: opts.crop,
      local: local,
      features: features,
      frames: framesInfo,
      server: server.ok ? server.data : null,
      serverStatus: server.ok ? 'VERIFIED' : server.reason,
      diagnosisId: server.ok && server.data ? server.data.diagnosisId : null,
      serverPayload: server.ok ? null : payload,
      source: server.ok ? 'DEVICE_AI_PLUS_SERVER' : 'DEVICE_AI_OFFLINE',
      elapsedMs: Math.round(performance.now() - startedAt),
      createdAt: new Date().toISOString()
    };
  }

  function safeFallbackResult(opts, error) {
    var engine = window.KrishiLeafVision;
    var kb = engine ? engine.KNOWLEDGE.UNCERTAIN : null;
    return {
      __pipeline: true,
      mode: opts.mode,
      crop: opts.crop,
      local: {
        engineVersion: engine ? engine.ENGINE_VERSION : 'unavailable',
        code: 'UNCERTAIN',
        category: 'UNCERTAIN',
        nameHi: kb ? kb.nameHi : 'स्पष्ट निष्कर्ष नहीं — दोबारा फोटो लें',
        seenHi: 'फोटो/वीडियो पढ़ा नहीं जा सका (' + String(error && error.message || error).slice(0, 80) + ')',
        confidence: 0,
        confidenceBand: 'LOW',
        differentials: [],
        solution: kb ? { step1: kb.step1, step2: kb.step2, step3: kb.step3, escalateHi: kb.escalateHi } : null,
        needsAdaptiveQuestions: true,
        adaptiveQuestions: [],
        evidence: [],
        quality: { issues: ['READ_FAILED'], isAcceptableQuality: false }
      },
      features: null,
      server: null,
      serverStatus: 'SKIPPED',
      source: 'SAFE_FALLBACK',
      pipelineError: String(error && error.message || error),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Run with watchdog. Always resolves (never rejects, never hangs).
   * @param {object} opts { mode, crop, acres, state, leafAge, humidity, fileName }
   * @param {function} onStage (stageNo 1-4, labelHi, detail)
   */
  async function run(opts, onStage) {
    opts = opts || {};
    onStage = typeof onStage === 'function' ? onStage : function () {};
    var t0 = performance.now();
    try {
      var result = await withTimeout(runPipeline(opts, onStage), WATCHDOG_MS, 'diagnosis pipeline');
      track('ai_diagnosis_completed', {
        media_mode: result.mode,
        crop: opts.crop,
        result_code: result.local.code,
        confidence_band: result.local.confidenceBand,
        source: result.source,
        duration_ms: Math.round(performance.now() - t0)
      });
      state.lastRun = { ok: true, at: Date.now(), code: result.local.code, source: result.source };
      return result;
    } catch (err) {
      console.warn('[KrishiDiagnosisPipeline] falling back:', err);
      track('ai_diagnosis_fallback', { media_mode: opts.mode, crop: opts.crop, error: String(err && err.message || err).slice(0, 90) });
      state.lastRun = { ok: false, at: Date.now(), error: String(err && err.message || err) };
      return safeFallbackResult(opts, err);
    }
  }

  // Fast pre-check right after capture so the farmer can retake a bad photo
  async function previewQualityCheck(mode) {
    try {
      if (!window.KrishiLeafVision || mode === 'video') return null;
      var px = await withTimeout(photoImageData(), 5000, 'preview decode');
      var f = window.KrishiLeafVision.analyzePixels(px.imageData.data, px.imageData.width, px.imageData.height, { maxSide: 120 });
      return f.quality;
    } catch (e) { return null; }
  }

  // --------------------------------------------------------------------------
  // Self-test & health
  // --------------------------------------------------------------------------
  var state = { selfTest: null, lastRun: null };

  function renderHealthPill() {
    var el = document.getElementById('aiEngineHealthPill');
    if (!el) return;
    var st = state.selfTest;
    if (!st) { el.className = 'ai-health-pill pending'; el.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> AI इंजन जांच...'; return; }
    if (st.healthy) {
      el.className = 'ai-health-pill ok';
      el.innerHTML = '<i class="fa-solid fa-shield-heart"></i> AI जांच इंजन तैयार • ऑफ़लाइन भी (' + st.passed + '/' + st.total + ')';
    } else {
      el.className = 'ai-health-pill warn';
      el.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> AI इंजन सीमित मोड (' + st.passed + '/' + st.total + ') — सर्वर सहायता से जांच जारी';
    }
  }

  function runSelfTest(force) {
    try {
      var cached = JSON.parse(localStorage.getItem(SELFTEST_KEY) || 'null');
      var engine = window.KrishiLeafVision;
      if (!force && cached && engine && cached.engineVersion === engine.ENGINE_VERSION && Date.now() - cached.at < 86400000) {
        state.selfTest = cached;
        renderHealthPill();
        return cached;
      }
      if (!engine) {
        state.selfTest = { healthy: false, passed: 0, total: 1, engineVersion: 'missing', at: Date.now() };
      } else {
        var r = engine.runSelfTest();
        state.selfTest = { healthy: r.healthy, passed: r.passed, total: r.total, engineVersion: r.engineVersion, ms: r.ms, failures: r.results.filter(function (x) { return !x.pass; }), at: Date.now() };
      }
      try { localStorage.setItem(SELFTEST_KEY, JSON.stringify(state.selfTest)); } catch (e) {}
      track('ai_diagnosis_selftest', { healthy: state.selfTest.healthy ? 'yes' : 'no', passed: state.selfTest.passed, total: state.selfTest.total, duration_ms: state.selfTest.ms || 0 });
      renderHealthPill();
      return state.selfTest;
    } catch (e) {
      state.selfTest = { healthy: false, passed: 0, total: 1, error: String(e), at: Date.now() };
      renderHealthPill();
      return state.selfTest;
    }
  }

  function scheduleSelfTest() {
    var go = function () { runSelfTest(false); };
    if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 });
    else setTimeout(go, 1500);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') runSelfTest(false); // daily re-check (cached within 24h)
    });
  }

  window.KrishiDiagnosisPipeline = {
    run: run,
    previewQualityCheck: previewQualityCheck,
    startLiveFrameGrab: startLiveFrameGrab,
    stopLiveFrameGrab: stopLiveFrameGrab,
    clearCapturedFrames: function () { liveFrames = []; window.__krishiLastVideoBlob = null; },
    runSelfTest: runSelfTest,
    renderHealthPill: renderHealthPill,
    getHealth: function () { return { selfTest: state.selfTest, lastRun: state.lastRun }; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleSelfTest);
  else scheduleSelfTest();
})();
