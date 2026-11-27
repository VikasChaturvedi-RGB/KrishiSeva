// ============================================================================
// KRISHI SAHAYAK — ON-DEVICE LEAF VISION ENGINE (works 100% offline)
// ----------------------------------------------------------------------------
// Reads the actual pixels of the farmer's leaf photo / video frames and measures:
//   • leaf coverage, healthy-green vs chlorotic (yellow) vs pale (whitish) tissue
//   • necrosis inside the leaf (lesions) vs along the margin (scorch)
//   • lesion count / size / yellow halo / elongation (spots, rust, blast, blight)
//   • purple-red pigmentation, white powdery growth
//   • chlorosis geometry: uniform vs fine interveinal net vs blotchy mosaic
// and ranks deficiency / disease hypotheses with a calibrated confidence and a
// nutrition-first 3-step solution.
//
// Pure JS, no network, no dependencies. UMD: window.KrishiLeafVision in the PWA,
// require()-able from Node so the backend test-suite runs the same code.
// ============================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KrishiLeafVision = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ENGINE_VERSION = 'leaf-vision-2026.11.1';

  // Pixel classes
  var C = { BG: 0, GREEN: 1, YELLOW: 2, PALE: 3, BROWN: 4, DARK: 5, PURPLE: 6, ORANGE: 7, WHITE: 8, GLARE: 9 };

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function ramp(x, lo, hi) { return clamp((x - lo) / (hi - lo), 0, 1); }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, h = 0;
    if (d > 0) {
      if (max === r) h = 60 * (((g - b) / d) % 6);
      else if (max === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return [h, max === 0 ? 0 : d / max, max];
  }

  function classify(h, s, v) {
    if (v < 0.13) return C.DARK;
    // Below ~0.18 saturation, camera noise alone can fake a tint on grey/white backgrounds
    if (s < 0.18) {
      if (v > 0.94) return C.GLARE;
      return v > 0.74 ? C.WHITE : C.BG;
    }
    if (h >= 165 && h < 265) return C.BG;                       // sky / blue / plastic
    if (h >= 265 && h < 345) return s > 0.18 ? C.PURPLE : C.BG;
    if (h >= 75 && h < 165) return C.GREEN;
    if (h >= 50 && h < 75) {
      if (h >= 66 && s > 0.35 && v < 0.62) return C.GREEN;     // olive / dark yellow-green = still green
      if (v < 0.35) return C.BROWN;                             // dark olive-yellow is dead tissue, not chlorosis
      if (s < 0.4 && v > 0.7) return C.PALE;                    // whitish-yellow (iron-type)
      return C.YELLOW;
    }
    if (h >= 38 && h < 50) return (v > 0.6 && s > 0.35) ? C.YELLOW : C.BROWN;
    if (h >= 345 || h < 12) return (s > 0.45 && v > 0.35) ? C.PURPLE : C.BROWN;
    if (s > 0.6 && v > 0.55) return C.ORANGE;                  // bright orange (rust pustules)
    return C.BROWN;
  }

  // Leaf tissue for masking: green, yellow, pale AND purple (a severely P-deficient
  // leaf can be entirely purple and must still be recognised as a leaf)
  function isCore(c) { return c === C.GREEN || c === C.YELLOW || c === C.PALE || c === C.PURPLE; }

  // --------------------------------------------------------------------------
  // Image quality: Laplacian variance on a full-resolution centre crop (blur)
  // --------------------------------------------------------------------------
  function measureSharpness(rgba, width, height) {
    var crop = Math.min(180, width - 2, height - 2);
    if (crop < 16) return 0;
    var x0 = Math.floor((width - crop) / 2), y0 = Math.floor((height - crop) / 2);
    var gray = new Float32Array(crop * crop);
    for (var y = 0; y < crop; y++) {
      for (var x = 0; x < crop; x++) {
        var i = ((y0 + y) * width + (x0 + x)) * 4;
        gray[y * crop + x] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
      }
    }
    var sum = 0, sumSq = 0, n = 0;
    for (var yy = 1; yy < crop - 1; yy++) {
      for (var xx = 1; xx < crop - 1; xx++) {
        var k = yy * crop + xx;
        var lap = gray[k - 1] + gray[k + 1] + gray[k - crop] + gray[k + crop] - 4 * gray[k];
        sum += lap; sumSq += lap * lap; n++;
      }
    }
    var mean = sum / n;
    return sumSq / n - mean * mean;
  }

  // --------------------------------------------------------------------------
  // Feature extraction
  // --------------------------------------------------------------------------
  function analyzePixels(rgba, width, height, opts) {
    opts = opts || {};
    var t0 = Date.now();
    var maxSide = opts.maxSide || 400;
    var scale = Math.max(1, Math.max(width, height) / maxSide);
    var W = Math.max(8, Math.round(width / scale));
    var H = Math.max(8, Math.round(height / scale));
    var N = W * H;
    var cls = new Uint8Array(N);
    var sat = new Float32Array(N);
    var val = new Float32Array(N);
    var sumV = 0, glare = 0, dgciSum = 0, dgciN = 0;

    for (var y = 0; y < H; y++) {
      var sy = Math.min(height - 1, Math.floor((y + 0.5) * scale));
      for (var x = 0; x < W; x++) {
        var sx = Math.min(width - 1, Math.floor((x + 0.5) * scale));
        var i = (sy * width + sx) * 4;
        var hsv = rgbToHsv(rgba[i], rgba[i + 1], rgba[i + 2]);
        var p = y * W + x;
        var c = classify(hsv[0], hsv[1], hsv[2]);
        cls[p] = c; sat[p] = hsv[1]; val[p] = hsv[2];
        sumV += hsv[2];
        if (c === C.GLARE) glare++;
        if (c === C.GREEN || c === C.YELLOW || c === C.PALE) {
          // Dark Green Colour Index (Karcher & Richardson) — greenness / chlorophyll proxy
          dgciSum += ((hsv[0] - 60) / 60 + (1 - hsv[1]) + (1 - hsv[2])) / 3;
          dgciN++;
        }
      }
    }

    // Despeckle: an isolated "tissue" pixel with < 2 tissue neighbours is noise, not leaf
    for (var dy = 1; dy < H - 1; dy++) {
      for (var dx = 1; dx < W - 1; dx++) {
        var di = dy * W + dx;
        if (!isCore(cls[di])) continue;
        var nb = [cls[di - 1], cls[di + 1], cls[di - W], cls[di + W]];
        var nbCore = nb.filter(isCore).length;
        if (nbCore < 2) {
          // take the majority class of the non-tissue neighbours (e.g. brown inside a lesion)
          var tally = {}, best = -1, bestN = 0;
          nb.forEach(function (c) { if (!isCore(c)) { tally[c] = (tally[c] || 0) + 1; if (tally[c] > bestN) { bestN = tally[c]; best = c; } } });
          cls[di] = best >= 0 ? best : (val[di] > 0.74 ? C.WHITE : C.BG);
        }
      }
    }

    // Distance to nearest core-leaf pixel in 4 directions (two linear passes per axis)
    var BIG = 1 << 14;
    var dL = new Uint16Array(N), dR = new Uint16Array(N), dU = new Uint16Array(N), dD = new Uint16Array(N);
    for (var ry = 0; ry < H; ry++) {
      var last = -BIG;
      for (var rx = 0; rx < W; rx++) { var q = ry * W + rx; if (isCore(cls[q])) last = rx; dL[q] = Math.min(BIG, rx - last); }
      last = BIG;
      for (var rx2 = W - 1; rx2 >= 0; rx2--) { var q2 = ry * W + rx2; if (isCore(cls[q2])) last = rx2; dR[q2] = Math.min(BIG, last - rx2); }
    }
    for (var cx = 0; cx < W; cx++) {
      var lastU = -BIG;
      for (var cy = 0; cy < H; cy++) { var q3 = cy * W + cx; if (isCore(cls[q3])) lastU = cy; dU[q3] = Math.min(BIG, cy - lastU); }
      lastU = BIG;
      for (var cy2 = H - 1; cy2 >= 0; cy2--) { var q4 = cy2 * W + cx; if (isCore(cls[q4])) lastU = cy2; dD[q4] = Math.min(BIG, lastU - cy2); }
    }

    var maxDim = Math.max(W, H);
    var R = Math.max(3, Math.round(0.12 * maxDim));   // "inside the leaf" reach
    var BAND = Math.max(2, Math.round(0.035 * maxDim)); // margin band width

    // A scorched leaf margin is a THIN brown band with non-brown background beyond it.
    // Brown soil next to the leaf keeps going — so look one band-width further away
    // from the leaf; if it's still brown/dark it is background, not leaf tissue.
    function isThinMarginBand(p, nearest) {
      var px = p % W, py = (p - px) / W, ox = 0, oy = 0;
      if (dL[p] === nearest) ox = 1; else if (dR[p] === nearest) ox = -1;
      else if (dU[p] === nearest) oy = 1; else oy = -1;
      var step = BAND + 2;
      var qx = px + ox * step, qy = py + oy * step;
      if (qx < 0 || qy < 0 || qx >= W || qy >= H) return true; // leaf reaches photo edge
      var qc = cls[qy * W + qx];
      return !(qc === C.BROWN || qc === C.DARK);
    }

    // Region labels: 0 = outside, 1 = core leaf, 2 = enclosed lesion, 3 = marginal necrosis, 4 = attached purple
    var region = new Uint8Array(N);
    var counts = { green: 0, yellow: 0, pale: 0, purple: 0, lesion: 0, orangeLesion: 0, darkLesion: 0, greyLesion: 0, whiteEnclosed: 0, marginal: 0, bgBrown: 0, bgTotal: 0 };

    for (var p2 = 0; p2 < N; p2++) {
      var c2 = cls[p2];
      if (c2 === C.GREEN) { region[p2] = 1; counts.green++; continue; }
      if (c2 === C.YELLOW) { region[p2] = 1; counts.yellow++; continue; }
      if (c2 === C.PALE) { region[p2] = 1; counts.pale++; continue; }
      var encH = dL[p2] <= R && dR[p2] <= R;
      var encV = dU[p2] <= R && dD[p2] <= R;
      var enclosed = encH || encV;
      var nearest = Math.min(dL[p2], dR[p2], dU[p2], dD[p2]);
      if (c2 === C.PURPLE) { region[p2] = 4; counts.purple++; continue; }
      if (enclosed && (c2 === C.BROWN || c2 === C.DARK || c2 === C.ORANGE)) {
        region[p2] = 2; counts.lesion++;
        if (c2 === C.ORANGE) counts.orangeLesion++;
        if (c2 === C.DARK) counts.darkLesion++;
        continue;
      }
      if (enclosed && c2 === C.WHITE) { region[p2] = 2; counts.whiteEnclosed++; counts.lesion++; continue; }
      if (enclosed && c2 === C.BG && val[p2] > 0.3 && val[p2] < 0.78) { region[p2] = 2; counts.greyLesion++; counts.lesion++; continue; }
      if (!enclosed && nearest <= BAND && (c2 === C.BROWN || c2 === C.DARK) && isThinMarginBand(p2, nearest)) { region[p2] = 3; counts.marginal++; continue; }
      counts.bgTotal++;
      if (c2 === C.BROWN) counts.bgBrown++;
    }

    var core = counts.green + counts.yellow + counts.pale;
    var leaf = core + counts.lesion + counts.marginal + counts.purple;
    var leafCoverage = leaf / N;
    var soilLikeBackground = counts.bgTotal > 0 ? counts.bgBrown / counts.bgTotal : 0;

    // Chlorosis geometry: transitions & yellow run lengths along rows and columns
    var transRow = 0, transCol = 0, runSum = 0, runN = 0;
    function scanLine(getIdx, len, isRow) {
      var prev = -1, run = 0;
      for (var k = 0; k < len; k++) {
        var idx = getIdx(k), cc = cls[idx];
        var state = (cc === C.GREEN) ? 0 : (cc === C.YELLOW || cc === C.PALE) ? 1 : -1;
        if (state === 1) run++;
        else if (run > 0) { runSum += run; runN++; run = 0; }
        if (state >= 0) {
          if (prev >= 0 && prev !== state) { if (isRow) transRow++; else transCol++; }
          prev = state;
        } else if (region[idx] === 0) {
          prev = -1; // left the leaf: don't count transitions across background
        }
      }
      if (run > 0) { runSum += run; runN++; }
    }
    for (var sy2 = 0; sy2 < H; sy2++) { (function (yy) { scanLine(function (k) { return yy * W + k; }, W, true); })(sy2); }
    for (var sx2 = 0; sx2 < W; sx2++) { (function (xx) { scanLine(function (k) { return k * W + xx; }, H, false); })(sx2); }

    var yellowTotal = counts.yellow + counts.pale;
    var leafDiameter = Math.sqrt(Math.max(1, leaf));
    var meanYellowRun = runN ? runSum / runN : 0;

    // Lesion components (4-connected) for spots / rust / blast
    var seen = new Uint8Array(N);
    var comps = [];
    var stack = new Int32Array(N);
    for (var s0 = 0; s0 < N; s0++) {
      if (region[s0] !== 2 || seen[s0]) continue;
      var sp = 0; stack[sp++] = s0; seen[s0] = 1;
      var area = 0, minX = W, maxX = 0, minY = H, maxY = 0, orange = 0, grey = 0, haloY = 0, haloG = 0, white = 0, touchesEdge = false;
      while (sp > 0) {
        var cur = stack[--sp];
        var cxp = cur % W, cyp = (cur - cxp) / W;
        area++;
        if (cxp < minX) minX = cxp; if (cxp > maxX) maxX = cxp;
        if (cyp < minY) minY = cyp; if (cyp > maxY) maxY = cyp;
        if (cls[cur] === C.ORANGE) orange++;
        if (cls[cur] === C.BG) grey++;
        if (cls[cur] === C.WHITE) white++;
        var nbs = [cxp > 0 ? cur - 1 : -1, cxp < W - 1 ? cur + 1 : -1, cyp > 0 ? cur - W : -1, cyp < H - 1 ? cur + W : -1];
        for (var nb = 0; nb < 4; nb++) {
          var n2 = nbs[nb];
          if (n2 < 0) continue;
          if (region[n2] === 2) {
            if (!seen[n2]) { seen[n2] = 1; stack[sp++] = n2; }
          } else if (region[n2] === 0 || region[n2] === 3) {
            touchesEdge = true; // dead tissue running into the leaf border = marginal scorch, not a spot
          } else if (cls[n2] === C.YELLOW || cls[n2] === C.PALE) haloY++;
          else if (cls[n2] === C.GREEN) haloG++;
        }
      }
      var bw = maxX - minX + 1, bh = maxY - minY + 1;
      comps.push({
        area: area,
        elongation: Math.max(bw, bh) / Math.max(1, Math.min(bw, bh)),
        orangeShare: orange / area,
        greyShare: grey / area,
        whiteShare: white / area,
        haloYellow: haloY / Math.max(1, haloY + haloG),
        touchesEdge: touchesEdge
      });
    }

    // Ignore single-pixel speckle noise; white-dominated components are powdery growth, not lesions
    var minArea = Math.max(3, Math.round(leaf * 0.00008));
    var lesions = comps.filter(function (c) { return c.area >= minArea && c.whiteShare < 0.6; });
    var tinyThreshold = leaf * 0.004;
    var rustPustules = lesions.filter(function (c) { return c.orangeShare >= 0.35 && c.area <= Math.max(tinyThreshold, 12); });
    var spotLesions = lesions.filter(function (c) { return c.orangeShare < 0.35 && !c.touchesEdge; });
    var edgeLesionArea = lesions.filter(function (c) { return c.orangeShare < 0.35 && c.touchesEdge; })
      .reduce(function (a, c) { return a + c.area; }, 0);
    var lesionAreaSum = spotLesions.reduce(function (a, c) { return a + c.area; }, 0);
    var haloAvg = spotLesions.length ? spotLesions.reduce(function (a, c) { return a + c.haloYellow; }, 0) / spotLesions.length : 0;
    var elongated = spotLesions.filter(function (c) { return c.elongation >= 2.5; }).length;
    var largestLesion = spotLesions.reduce(function (m, c) { return Math.max(m, c.area); }, 0);

    var sharpnessVar = measureSharpness(rgba, width, height);
    var brightness = sumV / N;
    var blurScore = clamp(sharpnessVar / 150, 0, 1);
    var issues = [];
    if (leafCoverage < 0.08) issues.push('NO_LEAF_DETECTED');
    if (blurScore < 0.18) issues.push('BLURRY');
    if (brightness < 0.16) issues.push('TOO_DARK');
    if (brightness > 0.9) issues.push('OVEREXPOSED');
    if (glare / N > 0.12) issues.push('GLARE');

    var necroticTotal = counts.lesion - counts.whiteEnclosed + counts.marginal;
    var safeLeaf = Math.max(1, leaf);

    return {
      engineVersion: ENGINE_VERSION,
      analysedSize: { width: W, height: H },
      processingMs: Date.now() - t0,
      quality: {
        brightness: +brightness.toFixed(3),
        sharpnessVariance: +sharpnessVar.toFixed(1),
        blurScore: +blurScore.toFixed(3),
        brightnessScore: +(1 - Math.abs(brightness - 0.55) / 0.55).toFixed(3),
        glareRatio: +(glare / N).toFixed(3),
        leafCoverage: +leafCoverage.toFixed(3),
        soilLikeBackground: +soilLikeBackground.toFixed(3),
        issues: issues,
        isAcceptableQuality: issues.indexOf('NO_LEAF_DETECTED') === -1 && issues.indexOf('BLURRY') === -1 && issues.indexOf('TOO_DARK') === -1
      },
      tissue: {
        greenRatio: +(counts.green / safeLeaf).toFixed(4),
        chlorosisRatio: +(yellowTotal / safeLeaf).toFixed(4),
        paleRatio: +(counts.pale / safeLeaf).toFixed(4),
        necrosisRatio: +(necroticTotal / safeLeaf).toFixed(4),
        marginalNecrosisShare: +(Math.min(1, (counts.marginal + edgeLesionArea) / Math.max(1, necroticTotal))).toFixed(4),
        purpleRatio: +(counts.purple / safeLeaf).toFixed(4),
        powderyRatio: +(counts.whiteEnclosed / safeLeaf).toFixed(4),
        greyLesionRatio: +(counts.greyLesion / safeLeaf).toFixed(4),
        greennessIndexDGCI: dgciN ? +(dgciSum / dgciN).toFixed(3) : 0
      },
      pattern: {
        transitionDensity: +((transRow + transCol) / Math.max(1, yellowTotal)).toFixed(4),
        anisotropy: +(Math.abs(transRow - transCol) / Math.max(1, transRow + transCol)).toFixed(4),
        meanYellowRunNorm: +(meanYellowRun / leafDiameter).toFixed(4)
      },
      lesions: {
        count: spotLesions.length,
        meanSizeRatio: spotLesions.length ? +(lesionAreaSum / spotLesions.length / safeLeaf).toFixed(5) : 0,
        largestSizeRatio: +(largestLesion / safeLeaf).toFixed(4),
        haloRatio: +haloAvg.toFixed(3),
        elongatedShare: spotLesions.length ? +(elongated / spotLesions.length).toFixed(3) : 0,
        rustPustuleCount: rustPustules.length,
        rustAreaRatio: +(rustPustules.reduce(function (a, c) { return a + c.area; }, 0) / safeLeaf).toFixed(4)
      }
    };
  }

  // --------------------------------------------------------------------------
  // Knowledge base: nutrition-first, zero-brand, CIB&RC-registered molecules only
  // --------------------------------------------------------------------------
  var KB = {
    HEALTHY: {
      category: 'HEALTHY', nameHi: 'पत्ती स्वस्थ दिख रही है', nameEn: 'Leaf looks healthy',
      seenHi: 'पत्ती का अधिकांश भाग गहरा हरा है; पीलापन, धब्बे या सूखापन नगण्य।',
      step1: { titleHi: 'कोई दवा/छिड़काव आवश्यक नहीं', actionHi: 'फसल स्वस्थ है — अनावश्यक कीटनाशक/टॉनिक न खरीदें। हर 7 दिन पर खेत का चक्कर लगाकर नई पत्तियों की जांच करते रहें।', dose: null },
      step2: { titleHi: 'मिट्टी की ताकत बनाए रखें', actionHi: 'हर सिंचाई के साथ 200 लीटर/एकड़ जीवामृत दें; मृदा स्वास्थ्य कार्ड के अनुसार ही खाद डालें।', dose: { qtyPerAcre: 200, unit: 'L जीवामृत' } },
      step3: { titleHi: 'रसायन की आवश्यकता नहीं', actionHi: 'कोई रासायनिक छिड़काव न करें।', isRecommended: false },
      escalateHi: null
    },
    N_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'N', nameHi: 'नाइट्रोजन (N) की कमी', nameEn: 'Nitrogen Deficiency',
      seenHi: 'पत्ती लगभग समान रूप से हल्की पीली — शिराएं भी पीली; धब्बे नहीं। (नीचे की पुरानी पत्तियों से शुरू होती है)',
      step1: { titleHi: 'चरण 1: 2% यूरिया पर्णीय छिड़काव (तुरंत हरियाली)', actionHi: '300 ग्राम यूरिया प्रति 15 लीटर पंप में घोलकर सुबह 8–10 बजे या शाम को छिड़कें। 7–10 दिन बाद दोहराएं।', dose: { qtyPerAcre: 4, unit: 'kg यूरिया', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: मिट्टी में नाइट्रोजन व जैविक सुधार', actionHi: 'नीम-लेपित यूरिया की अगली किश्त समय पर दें (एक बार में ज्यादा नहीं); 200 L जीवामृत सिंचाई के साथ; अगली फसल से पहले दलहन/ढैंचा हरी खाद।', dose: { qtyPerAcre: 200, unit: 'L जीवामृत' } },
      step3: { titleHi: 'चरण 3: कीटनाशक/फफूंदनाशक की आवश्यकता नहीं', actionHi: 'यह पोषण की कमी है, रोग नहीं — कोई भी कीटनाशक या "टॉनिक" न खरीदें।', isRecommended: false },
      escalateHi: 'यूरिया छिड़काव के 10 दिन बाद भी हरियाली न लौटे तो जड़ सड़न/जल भराव जांचें और KVK से संपर्क करें।'
    },
    S_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'S', nameHi: 'गंधक (सल्फर) की कमी', nameEn: 'Sulphur Deficiency',
      seenHi: 'ऊपर की नई पत्तियाँ समान रूप से हल्की पीली; शिराएं भी पीली। तिलहन/दलहन में आम।',
      step1: { titleHi: 'चरण 1: जल्दी असर हेतु 0.2% घुलनशील सल्फर/अमोनियम सल्फेट', actionHi: 'अमोनियम सल्फेट 150 ग्राम या 80% घुलनशील सल्फर 40 ग्राम प्रति 15 L पंप छिड़कें।', dose: { qtyPerAcre: 0.5, unit: 'kg 80% WDG सल्फर', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: जिप्सम/बेंटोनाइट सल्फर मिट्टी में', actionHi: 'जिप्सम 100 kg/एकड़ या बेंटोनाइट सल्फर 8 kg/एकड़ अगली सिंचाई/निराई के साथ दें। भविष्य में DAP की जगह SSP अपनाएं।', dose: { qtyPerAcre: 100, unit: 'kg जिप्सम' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'पोषण विकार — कीटनाशक न डालें।', isRecommended: false },
      escalateHi: 'मृदा स्वास्थ्य कार्ड में सल्फर (S) का स्तर अवश्य देखें।'
    },
    ZN_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'ZN', backendCode: 'DIS_ZINC_DEFICIENCY', nameHi: 'जिंक (जस्ता) की कमी', nameEn: 'Zinc Deficiency (Interveinal Chlorosis)',
      seenHi: 'हरी शिराओं के बीच पीलापन (जाल जैसा पैटर्न), नई पत्तियाँ छोटी; धान में भूरे जंग जैसे "खैरा" धब्बे।',
      step1: { titleHi: 'चरण 1: 0.5% जिंक सल्फेट + 0.25% बुझा चूना पर्णीय छिड़काव', actionHi: '75 ग्राम जिंक सल्फेट (21%) + 38 ग्राम बुझा चूना प्रति 15 L पंप; 10 दिन के अंतर पर 2 बार, सुबह 8–11 बजे।', dose: { qtyPerAcre: 1, unit: 'kg जिंक सल्फेट 21%', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: ZSB जैव-उर्वरक + अगली फसल में बेसल जिंक', actionHi: '1 kg ZSB (जिंक घोलक जीवाणु) 50 kg सड़ी गोबर खाद में मिलाकर जड़ों के पास दें। अगली बुवाई पर जिंक सल्फेट 10 kg/एकड़ (2–3 सीजन में एक बार)।', dose: { qtyPerAcre: 1, unit: 'kg ZSB' } },
      step3: { titleHi: 'चरण 3: कीटनाशक की आवश्यकता नहीं', actionHi: 'यह वायरस नहीं, सूक्ष्म पोषक तत्व की कमी है — महंगे कीटनाशक/वायरस दवा न खरीदें।', isRecommended: false },
      escalateHi: 'यदि पत्तियाँ मुड़ रही हों व सफेद मक्खी दिखे, तो यह वायरस हो सकता है — KVK से पुष्टि करें।'
    },
    FE_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'FE', nameHi: 'आयरन (लोहा) की कमी', nameEn: 'Iron Deficiency',
      seenHi: 'सबसे नई पत्तियाँ सफेद-पीली, केवल बारीक शिराएं हरी — चूनेदार/क्षारीय मिट्टी व सूखी धान नर्सरी में आम।',
      step1: { titleHi: 'चरण 1: 0.5% फेरस सल्फेट + नींबू रस/साइट्रिक एसिड छिड़काव', actionHi: '75 ग्राम फेरस सल्फेट + 15 ग्राम साइट्रिक एसिड (या 2 नींबू का रस) प्रति 15 L पंप; 7 दिन अंतर पर 2–3 बार।', dose: { qtyPerAcre: 1, unit: 'kg फेरस सल्फेट', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: जैविक खाद व जल प्रबंधन', actionHi: 'सड़ी गोबर खाद/वर्मीकम्पोस्ट बढ़ाएं; धान नर्सरी में पानी न सूखने दें। क्षारीय मिट्टी में मिट्टी में आयरन डालना कम असरदार है।', dose: { qtyPerAcre: 1, unit: 'टन वर्मीकम्पोस्ट' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'पोषण विकार — कीटनाशक न डालें।', isRecommended: false },
      escalateHi: 'मिट्टी पर सिरका डालने से झाग उठे तो मिट्टी चूनेदार है — आयरन कमी बार-बार आएगी; KVK से दीर्घकालीन सलाह लें।'
    },
    MN_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'MN', nameHi: 'मैंगनीज की कमी', nameEn: 'Manganese Deficiency',
      seenHi: 'शिराओं के बीच धूसर-पीले धब्बे/धारियाँ; हल्की मिट्टी पर धान के बाद गेहूँ में आम।',
      step1: { titleHi: 'चरण 1: 0.5% मैंगनीज सल्फेट छिड़काव', actionHi: '75 ग्राम मैंगनीज सल्फेट प्रति 15 L पंप; धूप वाले दिन, साप्ताहिक 2–3 बार।', dose: { qtyPerAcre: 1, unit: 'kg मैंगनीज सल्फेट', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: जैविक कार्बन बढ़ाएं', actionHi: 'पराली न जलाएं, मिट्टी में मिलाएं; गोबर खाद 2 टन/एकड़।', dose: { qtyPerAcre: 2, unit: 'टन गोबर खाद' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'पोषण विकार — कीटनाशक न डालें।', isRecommended: false },
      escalateHi: null
    },
    MG_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'MG', nameHi: 'मैग्नीशियम की कमी (लाल पत्ती)', nameEn: 'Magnesium Deficiency',
      seenHi: 'पुरानी पत्तियों में शिराओं के बीच पीलापन, बाद में लाल-बैंगनी रंग (कपास में "लाल पत्ती")।',
      step1: { titleHi: 'चरण 1: 1% मैग्नीशियम सल्फेट छिड़काव', actionHi: '150 ग्राम मैग्नीशियम सल्फेट प्रति 15 L पंप; 10 दिन अंतर पर 2 बार।', dose: { qtyPerAcre: 2, unit: 'kg मैग्नीशियम सल्फेट', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: संतुलित पोटाश व जैविक खाद', actionHi: 'अत्यधिक पोटाश न दें (Mg को रोकता है); अम्लीय मिट्टी में डोलोमाइट चूना 1 क्विंटल/एकड़।', dose: { qtyPerAcre: 100, unit: 'kg डोलोमाइट (अम्लीय मिट्टी में)' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'पोषण विकार — कीटनाशक न डालें।', isRecommended: false },
      escalateHi: null
    },
    K_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'K', nameHi: 'पोटाश (K) की कमी', nameEn: 'Potassium Deficiency (Marginal Scorch)',
      seenHi: 'पत्ती के किनारे (margin) भूरे-झुलसे, अंदर की ओर बढ़ते हुए; पुरानी पत्तियों से शुरू।',
      step1: { titleHi: 'चरण 1: 1% पोटैशियम नाइट्रेट (13:0:45) छिड़काव', actionHi: '150 ग्राम 13:0:45 प्रति 15 L पंप; 10–12 दिन अंतर पर 2 बार।', dose: { qtyPerAcre: 2, unit: 'kg 13:0:45', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: मिट्टी में पोटाश + राख', actionHi: 'MOP (म्यूरेट ऑफ पोटाश) 25 kg/एकड़ अगली सिंचाई पर; छनी लकड़ी की राख 1 क्विंटल/एकड़; KMB जीवाणु।', dose: { qtyPerAcre: 25, unit: 'kg MOP' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'किनारा झुलसना पोटाश कमी है, रोग नहीं — फफूंदनाशक न डालें।', isRecommended: false },
      escalateHi: 'यदि भूरापन किनारे के बजाय बीच से फैले व पानी-भीगे धब्बे हों, तो झुलसा रोग हो सकता है — दोबारा फोटो लें।'
    },
    P_DEF: {
      category: 'NUTRITIONAL_DEFICIENCY', nutrient: 'P', nameHi: 'फॉस्फोरस (P) की कमी', nameEn: 'Phosphorus Deficiency',
      seenHi: 'पत्तियों पर बैंगनी/लाल-बैंगनी रंगत, गहरी हरी-नीली पत्तियाँ; जड़ें कमजोर।',
      step1: { titleHi: 'चरण 1: 1% DAP का साफ घोल छिड़काव', actionHi: '150 ग्राम DAP रातभर 15 L पानी में भिगोकर, ऊपर का साफ पानी छानकर छिड़कें।', dose: { qtyPerAcre: 2, unit: 'kg DAP', waterPerAcre: 200 } },
      step2: { titleHi: 'चरण 2: PSB कल्चर + फॉस्फो-कम्पोस्ट', actionHi: '1 kg PSB 50 kg गोबर खाद में मिलाकर दें; अगली बुवाई पर SSP कूंड़ में; अम्लीय मिट्टी में रॉक फॉस्फेट।', dose: { qtyPerAcre: 1, unit: 'kg PSB' } },
      step3: { titleHi: 'चरण 3: रसायन की आवश्यकता नहीं', actionHi: 'ठंड के मौसम में शुरुआती बैंगनी रंग अस्थायी भी हो सकता है — कीटनाशक न डालें।', isRecommended: false },
      escalateHi: null
    },
    RUST: {
      category: 'FUNGAL_DISEASE', nameHi: 'रतुआ / गेरुई (Rust) रोग', nameEn: 'Rust (Fungal)',
      seenHi: 'पत्ती पर बहुत सारे छोटे नारंगी-भूरे उभरे दाने (pustules) — उंगली पर रगड़ने से जंग जैसा पाउडर लगता है।',
      step1: { titleHi: 'चरण 1: संक्रमित पत्तियाँ हटाएं + नीम/गोमूत्र जैव छिड़काव', actionHi: 'सबसे संक्रमित पत्तियाँ तोड़कर खेत से बाहर नष्ट करें; शुरुआती अवस्था में नीमास्त्र 1.5 L / 15 L पंप।', dose: { qtyPerAcre: 20, unit: 'L नीमास्त्र' } },
      step2: { titleHi: 'चरण 2: ट्राइकोडर्मा/स्यूडोमोनास + संतुलित पोटाश', actionHi: 'स्यूडोमोनास फ्लोरेसेंस 1% @ 10 ml/L छिड़काव; अधिक यूरिया न दें (रोग बढ़ाता है), पोटाश संतुलित रखें।', dose: { qtyPerAcre: 2, unit: 'L स्यूडोमोनास' } },
      step3: { titleHi: 'चरण 3: CIB&RC पंजीकृत फफूंदनाशक (रोग फैलने पर ही)', actionHi: 'प्रोपिकोनाजोल 25% EC @ 1 ml/लीटर या हेक्साकोनाजोल 5% EC @ 2 ml/लीटर पानी; 15 दिन बाद आवश्यकता होने पर दोहराएं। लेबल व राज्य प्रतिबंध अवश्य जांचें।', isRecommended: true, dose: { qtyPerAcre: 200, unit: 'ml प्रोपिकोनाजोल 25% EC', waterPerAcre: 200 } },
      escalateHi: 'गेहूँ में पीला रतुआ दिखे तो 48 घंटे में KVK/कृषि विभाग को सूचित करें — यह तेजी से फैलता है।'
    },
    LEAF_SPOT: {
      category: 'FUNGAL_DISEASE', nameHi: 'पत्ती धब्बा रोग (Leaf Spot)', nameEn: 'Fungal / Bacterial Leaf Spot',
      seenHi: 'पत्ती के अंदर कई अलग-अलग भूरे/काले गोल धब्बे, अधिकांश के चारों ओर पीला घेरा (halo)।',
      step1: { titleHi: 'चरण 1: संक्रमित पत्तियाँ हटाएं + स्वच्छता', actionHi: 'धब्बेदार निचली पत्तियाँ तोड़कर जलाएं/गाड़ें; ऊपर से सिंचाई (स्प्रिंकलर) रोकें; खेत में हवा का बहाव बढ़ाएं।', dose: null },
      step2: { titleHi: 'चरण 2: जैव फफूंदनाशक', actionHi: 'ट्राइकोडर्मा विरिडी 1% WP @ 5 g/L या स्यूडोमोनास फ्लोरेसेंस @ 10 ml/L छिड़काव; 2.5 kg ट्राइकोडर्मा गोबर खाद में मिलाकर मिट्टी में।', dose: { qtyPerAcre: 2.5, unit: 'kg ट्राइकोडर्मा' } },
      step3: { titleHi: 'चरण 3: CIB&RC पंजीकृत फफूंदनाशक (धब्बे बढ़ने पर)', actionHi: 'मैंकोजेब 75% WP @ 2.5 g/लीटर पानी; जीवाणु धब्बा (पानी-भीगे किनारे) हो तो कॉपर ऑक्सीक्लोराइड 50% WP @ 3 g/लीटर।', isRecommended: true, dose: { qtyPerAcre: 500, unit: 'g मैंकोजेब 75% WP', waterPerAcre: 200 } },
      escalateHi: 'धब्बे 3 दिन में तेजी से बढ़ें या तने/फल पर दिखें तो KVK विशेषज्ञ को फोटो भेजें।'
    },
    BLIGHT: {
      category: 'FUNGAL_DISEASE', nameHi: 'झुलसा (Blight) रोग', nameEn: 'Leaf Blight',
      seenHi: 'पत्ती के बड़े हिस्से पर अनियमित भूरे-काले सूखे धब्बे जो बीच से फैल रहे हैं।',
      step1: { titleHi: 'चरण 1: संक्रमित भाग तुरंत हटाएं', actionHi: 'झुलसे पौधे/पत्तियाँ खेत से बाहर नष्ट करें; शाम को सिंचाई न करें; जल निकासी सुधारें।', dose: null },
      step2: { titleHi: 'चरण 2: जैव सुरक्षा', actionHi: 'ट्राइकोडर्मा/स्यूडोमोनास छिड़काव; बीज/कंद उपचार अगली बार अनिवार्य।', dose: { qtyPerAcre: 2.5, unit: 'kg ट्राइकोडर्मा' } },
      step3: { titleHi: 'चरण 3: CIB&RC पंजीकृत फफूंदनाशक', actionHi: 'मैंकोजेब 75% WP @ 2.5 g/लीटर; आलू/टमाटर में पछेती झुलसा हो तो साइमोक्सानिल 8% + मैंकोजेब 64% WP @ 3 g/लीटर।', isRecommended: true, dose: { qtyPerAcre: 600, unit: 'g फफूंदनाशक', waterPerAcre: 200 } },
      escalateHi: 'आलू/टमाटर में पछेती झुलसा 2–3 दिन में पूरा खेत खत्म कर सकता है — तुरंत KVK से संपर्क करें।'
    },
    BLAST: {
      category: 'FUNGAL_DISEASE', backendCode: 'DIS_PADDY_BLAST', nameHi: 'धान का झोंका (Blast) रोग', nameEn: 'Paddy Blast (Magnaporthe oryzae)',
      seenHi: 'पत्ती पर आँख/नाव के आकार के लम्बे धब्बे — बीच में धूसर, किनारे भूरे।',
      step1: { titleHi: 'चरण 1: नाइट्रोजन रोकें, खेत में पानी बनाए रखें', actionHi: 'यूरिया की अगली किश्त रोक दें; खेत में 5 cm पानी बनाए रखें।', dose: null },
      step2: { titleHi: 'चरण 2: स्यूडोमोनास जैव छिड़काव', actionHi: 'स्यूडोमोनास फ्लोरेसेंस @ 10 ml/L छिड़काव; अगली बार बीज उपचार 10 g/kg बीज।', dose: { qtyPerAcre: 2, unit: 'L स्यूडोमोनास' } },
      step3: { titleHi: 'चरण 3: CIB&RC ट्राइसाइक्लाजोल 75% WP', actionHi: 'ट्राइसाइक्लाजोल 75% WP @ 0.6 g/लीटर पानी (120 g/एकड़); बाली निकलते समय गर्दन झोंका से बचाव हेतु दोहराएं।', isRecommended: true, dose: { qtyPerAcre: 120, unit: 'g ट्राइसाइक्लाजोल 75% WP', waterPerAcre: 200 } },
      escalateHi: 'गर्दन (neck) काली पड़ने लगे तो तुरंत KVK — यह उपज 50% तक घटा सकता है।'
    },
    SIGATOKA: {
      category: 'FUNGAL_DISEASE', backendCode: 'DIS_BANANA_SIGATOKA', nameHi: 'केला: सिगाटोका पर्ण धब्बा', nameEn: 'Banana Sigatoka Leaf Spot',
      seenHi: 'पत्ती की शिराओं के समानांतर लम्बी भूरी-काली धारियाँ/धब्बे, पीले घेरे सहित।',
      step1: { titleHi: 'चरण 1: रोगी पत्तियाँ काटें (de-leafing)', actionHi: '50% से अधिक संक्रमित पत्तियाँ काटकर खेत से बाहर नष्ट करें; पौधों के बीच हवा का बहाव बनाएं।', dose: null },
      step2: { titleHi: 'चरण 2: खनिज तेल + जैव फफूंदनाशक', actionHi: 'स्यूडोमोनास/ट्राइकोडर्मा छिड़काव; पोटाश संतुलित रखें।', dose: { qtyPerAcre: 2.5, unit: 'kg ट्राइकोडर्मा' } },
      step3: { titleHi: 'चरण 3: CIB&RC प्रोपिकोनाजोल 25% EC', actionHi: 'प्रोपिकोनाजोल 25% EC @ 1 ml/लीटर + 1% खनिज तेल (stickers) छिड़काव; 25 दिन बाद आवश्यकता अनुसार।', isRecommended: true, dose: { qtyPerAcre: 200, unit: 'ml प्रोपिकोनाजोल 25% EC', waterPerAcre: 200 } },
      escalateHi: null
    },
    POWDERY_MILDEW: {
      category: 'FUNGAL_DISEASE', nameHi: 'चूर्णिल आसिता / भभूतिया (Powdery Mildew)', nameEn: 'Powdery Mildew',
      seenHi: 'पत्ती की सतह पर सफेद आटे/पाउडर जैसे धब्बे जो उंगली से पुँछ जाते हैं।',
      step1: { titleHi: 'चरण 1: छाछ/दही का घरेलू छिड़काव', actionHi: '5 दिन पुरानी खट्टी छाछ 1 L प्रति 15 L पंप — शुरुआती अवस्था में प्रभावी।', dose: { qtyPerAcre: 13, unit: 'L खट्टी छाछ' } },
      step2: { titleHi: 'चरण 2: पौधों में दूरी व हवा', actionHi: 'घनी पत्तियाँ छाँटें; अधिक नाइट्रोजन न दें।', dose: null },
      step3: { titleHi: 'चरण 3: घुलनशील गंधक 80% WP (CIB&RC पंजीकृत)', actionHi: 'घुलनशील गंधक 80% WP @ 2.5 g/लीटर पानी (दोपहर की तेज धूप में न छिड़कें)।', isRecommended: true, dose: { qtyPerAcre: 500, unit: 'g घुलनशील गंधक 80% WP', waterPerAcre: 200 } },
      escalateHi: null
    },
    MOSAIC_VIRUS: {
      category: 'VIRAL_DISEASE', nameHi: 'पीला मोजेक / विषाणु (Virus) रोग की आशंका', nameEn: 'Suspected Yellow Mosaic Virus',
      seenHi: 'पत्ती पर अनियमित पीले-हरे चकत्ते (मोजेक), धब्बे नहीं; सफेद मक्खी द्वारा फैलता है।',
      step1: { titleHi: 'चरण 1: रोगी पौधे उखाड़ें + पीले चिपचिपे ट्रैप', actionHi: 'शुरुआती रोगी पौधे उखाड़कर गड्ढे में दबाएं; 15 पीले चिपचिपे ट्रैप/एकड़ फसल से 6 इंच ऊपर लगाएं।', dose: { qtyPerAcre: 15, unit: 'पीले ट्रैप' } },
      step2: { titleHi: 'चरण 2: नीम तेल से सफेद मक्खी नियंत्रण', actionHi: 'नीम तेल 1500 ppm @ 5 ml/L या नीमास्त्र 1.5 L / 15 L पंप, 7 दिन अंतर पर।', dose: { qtyPerAcre: 1, unit: 'L नीम तेल 1500 ppm' } },
      step3: { titleHi: 'चरण 3: केवल सफेद मक्खी ETL पार होने पर रसायन', actionHi: 'वायरस की कोई दवा नहीं होती — "वायरस दवा" खरीदकर ठगे न जाएं। सफेद मक्खी अधिक हो तो KVK सलाह से CIB&RC पंजीकृत कीटनाशक लें।', isRecommended: false },
      escalateHi: 'अगले सीजन मोजेक-प्रतिरोधी किस्म बोएं (जैसे मूँग IPM 02-3, सोयाबीन JS 20-34)।'
    },
    UNCERTAIN: {
      category: 'UNCERTAIN', nameHi: 'स्पष्ट निष्कर्ष नहीं — कृपया 2 सवालों के जवाब दें या दोबारा फोटो लें', nameEn: 'Inconclusive — answer 2 questions or retake',
      seenHi: 'फोटो में लक्षण कमजोर या मिश्रित हैं।',
      step1: { titleHi: 'दोबारा फोटो लें', actionHi: 'एक ही प्रभावित पत्ती को सादे सफेद कागज या आसमान के सामने रखकर, 20–30 cm दूरी से, दिन की रोशनी में फोटो लें। ऊपर व नीचे की दोनों सतह की फोटो लें।', dose: null },
      step2: { titleHi: 'अपने क्षेत्र की आम कमियाँ देखें', actionHi: 'नीचे आपके क्षेत्र की मिट्टी में सबसे आम पोषक कमी दिखाई गई है — लक्षण मिलाकर देखें।', dose: null },
      step3: { titleHi: 'अनुमान पर कोई रसायन न डालें', actionHi: 'पक्के निदान के बिना कीटनाशक/फफूंदनाशक पर पैसा खर्च न करें। निःशुल्क KVK हेल्पलाइन 1800-180-1551।', isRecommended: false },
      escalateHi: 'किसान कॉल सेंटर 1800-180-1551 (निःशुल्क) पर फोटो के साथ विशेषज्ञ से बात करें।'
    }
  };

  var INTERVEINAL_FAMILY = ['ZN_DEF', 'FE_DEF', 'MN_DEF', 'MG_DEF'];
  var NUTRIENT_OF = { N_DEF: 'N', S_DEF: 'S', ZN_DEF: 'ZN', FE_DEF: 'FE', MN_DEF: 'MN', MG_DEF: 'MG', K_DEF: 'K', P_DEF: 'P' };
  var SEVERITY_BOOST = { VERY_HIGH: 0.16, HIGH: 0.12, MEDIUM: 0.06, LOW: 0.02 };

  // --------------------------------------------------------------------------
  // Hypothesis scoring
  // --------------------------------------------------------------------------
  function scoreHypotheses(f, ctx) {
    ctx = ctx || {};
    var crop = String(ctx.crop || '').toUpperCase();
    var age = ctx.leafAge || null; // 'OLD' | 'NEW' | 'ALL' | null
    var t = f.tissue, pt = f.pattern, ls = f.lesions, q = f.quality;

    var chl = t.chlorosisRatio, nec = t.necrosisRatio, pale = t.paleRatio;
    var paleShare = chl > 0 ? pale / chl : 0;
    var soilPenalty = ramp(q.soilLikeBackground, 0.4, 0.8) * 0.6;

    var uniform = ramp(chl, 0.25, 0.6) * (1 - ramp(pt.transitionDensity, 0.12, 0.3)) * Math.max(ramp(pt.meanYellowRunNorm, 0.12, 0.35), ramp(chl, 0.7, 0.9));
    var interveinal = ramp(chl, 0.05, 0.18) * (1 - ramp(chl, 0.72, 0.92)) * ramp(pt.transitionDensity, 0.08, 0.2) * (1 - ramp(pt.meanYellowRunNorm, 0.18, 0.35));
    var mosaic = ramp(chl, 0.12, 0.3) * (1 - ramp(chl, 0.75, 0.9)) * (1 - ramp(pt.anisotropy, 0.3, 0.55)) *
      ramp(pt.meanYellowRunNorm, 0.08, 0.16) * (1 - ramp(pt.meanYellowRunNorm, 0.35, 0.55)) * (1 - ramp(nec, 0.04, 0.12)) *
      (1 - ramp(pt.transitionDensity, 0.15, 0.3));

    var rust = ramp(ls.rustPustuleCount, 6, 20) * Math.max(ramp(ls.rustAreaRatio, 0.002, 0.015), ramp(ls.rustPustuleCount, 20, 45));
    var spots = ramp(ls.count, 3, 10) * (1 - ramp(ls.meanSizeRatio, 0.03, 0.08)) * (0.55 + 0.6 * ramp(ls.haloRatio, 0.12, 0.4)) * (1 - 0.7 * rust);
    var marginal = ramp(nec, 0.04, 0.12) * ramp(t.marginalNecrosisShare, 0.45, 0.75) * (1 - soilPenalty);
    var blight = ramp(nec, 0.15, 0.35) * (1 - ramp(t.marginalNecrosisShare, 0.4, 0.7)) * ramp(ls.largestSizeRatio, 0.04, 0.12);

    var s = {};
    s.HEALTHY = (1 - ramp(chl, 0.04, 0.14)) * (1 - ramp(nec, 0.015, 0.07)) * (1 - ramp(t.purpleRatio, 0.03, 0.1)) *
      (1 - ramp(t.powderyRatio, 0.005, 0.02)) * (1 - rust) * (1 - ramp(ls.rustPustuleCount, 4, 12)) * (1 - ramp(ls.count, 2, 6));
    s.N_DEF = uniform * (age === 'NEW' ? 0.45 : 1) * (1 - 0.5 * ramp(nec, 0.1, 0.25));
    s.S_DEF = uniform * (age === 'NEW' ? 1 : age === 'OLD' ? 0.25 : 0.55);
    s.ZN_DEF = interveinal * (1 - 0.5 * ramp(paleShare, 0.45, 0.75)) * (age === 'OLD' ? 0.6 : 1) *
      (['PADDY', 'MAIZE', 'WHEAT', 'SOYBEAN', 'CHICKPEA'].indexOf(crop) >= 0 ? 1.15 : 1);
    if (crop === 'PADDY' && ls.count >= 3 && chl > 0.08) s.ZN_DEF += 0.15 * ramp(ls.count, 3, 12); // khaira brown spots
    s.FE_DEF = Math.max(interveinal, ramp(chl, 0.12, 0.3) * 0.6) * ramp(paleShare, 0.35, 0.7) * (age === 'OLD' ? 0.4 : 1);
    s.MN_DEF = interveinal * ramp(t.greyLesionRatio, 0.005, 0.03) * (crop === 'WHEAT' ? 1.3 : 0.9);
    s.MG_DEF = interveinal * (age === 'OLD' ? 1 : age === 'NEW' ? 0.3 : 0.55) * (0.7 + 0.6 * ramp(t.purpleRatio, 0.02, 0.1)) * (crop === 'COTTON' ? 1.2 : 1);
    s.K_DEF = marginal * (['BANANA', 'POTATO', 'COTTON', 'TOMATO', 'SUGARCANE'].indexOf(crop) >= 0 ? 1.2 : 1) *
      (age === 'OLD' ? 1.2 : age === 'NEW' ? 0.6 : 1); // potash scorch starts on older leaves
    s.P_DEF = ramp(t.purpleRatio, 0.05, 0.18) * (1 - 0.5 * ramp(nec, 0.15, 0.3));
    s.RUST = rust;
    s.LEAF_SPOT = spots * (crop === 'BANANA' ? 0.7 : 1);
    s.BLIGHT = blight;
    s.BLAST = crop === 'PADDY' ? ramp(ls.elongatedShare, 0.25, 0.6) * ramp(ls.count, 2, 6) : 0;
    s.SIGATOKA = crop === 'BANANA' ? Math.max(spots, ramp(ls.elongatedShare, 0.2, 0.5) * ramp(ls.count, 2, 6)) : 0;
    s.POWDERY_MILDEW = ramp(t.powderyRatio, 0.008, 0.04);
    s.MOSAIC_VIRUS = mosaic * (['SOYBEAN', 'GREENGRAM', 'OKRA', 'TOMATO', 'CHILLI', 'COTTON', 'PAPAYA'].indexOf(crop) >= 0 ? 1.2 : 0.9);

    // Area prior from the Soil Atlas (endemic deficiencies in farmer's district/state)
    var prior = ctx.areaPrior || {};
    Object.keys(NUTRIENT_OF).forEach(function (code) {
      var sev = prior[NUTRIENT_OF[code]];
      if (sev && s[code] > 0.05) s[code] *= 1 + (SEVERITY_BOOST[sev] || 0);
    });

    // Humid weather favours fungal disease
    if (ctx.humidity && ctx.humidity >= 80) {
      ['RUST', 'LEAF_SPOT', 'BLIGHT', 'BLAST', 'SIGATOKA', 'POWDERY_MILDEW'].forEach(function (k) { s[k] *= 1.15; });
    }
    Object.keys(s).forEach(function (k) { s[k] = clamp(s[k], 0, 1); });
    return s;
  }

  function diagnose(features, ctx) {
    ctx = ctx || {};
    var q = features.quality;
    if (q.issues.indexOf('NO_LEAF_DETECTED') >= 0) {
      return buildResult('UNCERTAIN', 0.15, [], features, ctx, 'NO_LEAF_DETECTED');
    }
    var scores = scoreHypotheses(features, ctx);
    var ranked = Object.keys(scores).map(function (k) { return { code: k, score: scores[k] }; })
      .sort(function (a, b) { return b.score - a.score; });

    var top = ranked[0], second = ranked[1] || { score: 0 };
    var qualityFactor = q.isAcceptableQuality ? 1 : 0.75;
    if (q.issues.indexOf('GLARE') >= 0) qualityFactor *= 0.92;
    if (q.soilLikeBackground > 0.6 && ['K_DEF', 'BLIGHT', 'LEAF_SPOT'].indexOf(top.code) >= 0) qualityFactor *= 0.85;

    var separation = top.score / (top.score + second.score + 1e-6);
    var confidence = clamp(0.35 + 0.6 * top.score * separation, 0.2, 0.88) * qualityFactor;

    // Weak signal → honest "inconclusive" + adaptive questions instead of a guess
    if (top.score < 0.18) {
      return buildResult('UNCERTAIN', +confidence.toFixed(3), ranked.slice(0, 3), features, ctx, 'WEAK_SIGNAL');
    }
    return buildResult(top.code, +confidence.toFixed(3), ranked.slice(1, 4), features, ctx, null);
  }

  function buildResult(code, confidence, others, features, ctx, reason) {
    var kb = KB[code] || KB.UNCERTAIN;
    var needsQuestions = code === 'UNCERTAIN' || confidence < 0.55 ||
      (INTERVEINAL_FAMILY.indexOf(code) >= 0 && !ctx.leafAge) || ((code === 'N_DEF' || code === 'S_DEF') && !ctx.leafAge);
    return {
      engineVersion: ENGINE_VERSION,
      code: code,
      backendCode: kb.backendCode || null,
      category: kb.category,
      nutrient: kb.nutrient || null,
      nameHi: kb.nameHi,
      nameEn: kb.nameEn,
      seenHi: kb.seenHi,
      confidence: confidence,
      confidenceBand: confidence >= 0.75 ? 'HIGH' : confidence >= 0.55 ? 'MEDIUM' : 'LOW',
      reason: reason,
      differentials: (others || []).filter(function (o) { return o.score >= 0.08 && o.code !== code; }).map(function (o) {
        return { code: o.code, nameHi: (KB[o.code] || {}).nameHi, score: +o.score.toFixed(3) };
      }),
      solution: { step1: kb.step1, step2: kb.step2, step3: kb.step3, escalateHi: kb.escalateHi },
      needsAdaptiveQuestions: needsQuestions,
      adaptiveQuestions: needsQuestions ? ADAPTIVE_QUESTIONS : [],
      evidence: summariseEvidence(features),
      quality: features.quality
    };
  }

  var ADAPTIVE_QUESTIONS = [
    { id: 'leafAge', textHi: 'लक्षण किन पत्तियों पर अधिक हैं?', options: [{ value: 'OLD', labelHi: 'नीचे की पुरानी पत्तियाँ' }, { value: 'NEW', labelHi: 'ऊपर की नई पत्तियाँ' }, { value: 'ALL', labelHi: 'सभी पत्तियाँ' }] },
    { id: 'spread', textHi: 'खेत में फैलाव कैसा है?', options: [{ value: 'PATCHES', labelHi: 'कुछ जगह झुंड में' }, { value: 'UNIFORM', labelHi: 'पूरे खेत में एक जैसा' }, { value: 'FEW_PLANTS', labelHi: 'इक्का-दुक्का पौधे' }] }
  ];

  function pct(x) { return Math.round(x * 1000) / 10; }

  function summariseEvidence(f) {
    var t = f.tissue, ls = f.lesions, pt = f.pattern;
    var lines = [
      { key: 'green', labelHi: 'स्वस्थ हरा भाग', value: pct(t.greenRatio) + '%' },
      { key: 'chlorosis', labelHi: 'पीलापन (क्लोरोसिस)', value: pct(t.chlorosisRatio) + '%' },
      { key: 'necrosis', labelHi: 'सूखा/मृत ऊतक', value: pct(t.necrosisRatio) + '%' }
    ];
    if (t.marginalNecrosisShare > 0.3 && t.necrosisRatio > 0.03) lines.push({ key: 'margin', labelHi: 'किनारों पर झुलसन', value: pct(t.marginalNecrosisShare) + '% सूखे भाग का' });
    if (ls.count > 0) lines.push({ key: 'spots', labelHi: 'अलग-अलग धब्बे', value: String(ls.count) + (ls.haloRatio > 0.2 ? ' (पीले घेरे सहित)' : '') });
    if (ls.rustPustuleCount > 0) lines.push({ key: 'rust', labelHi: 'नारंगी दाने (रतुआ जैसे)', value: String(ls.rustPustuleCount) });
    if (t.purpleRatio > 0.02) lines.push({ key: 'purple', labelHi: 'बैंगनी/लाल रंगत', value: pct(t.purpleRatio) + '%' });
    if (t.powderyRatio > 0.015) lines.push({ key: 'powdery', labelHi: 'सफेद पाउडर जैसा भाग', value: pct(t.powderyRatio) + '%' });
    if (t.chlorosisRatio > 0.05) {
      var patternHi = pt.transitionDensity > 0.15 ? 'शिराओं के बीच बारीक जाल (interveinal)' : pt.meanYellowRunNorm > 0.3 ? 'एक समान पीलापन' : 'चकत्तेदार (patchy)';
      lines.push({ key: 'pattern', labelHi: 'पीलेपन का पैटर्न', value: patternHi });
    }
    lines.push({ key: 'dgci', labelHi: 'हरितता सूचकांक (DGCI)', value: String(t.greennessIndexDGCI) });
    return lines;
  }

  // --------------------------------------------------------------------------
  // Video / multi-photo aggregation: median features over good frames
  // --------------------------------------------------------------------------
  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  function aggregateFrames(featureList) {
    var usable = featureList.filter(function (f) { return f && f.quality && f.quality.leafCoverage >= 0.08; });
    if (!usable.length) return featureList[0] || null;
    // Prefer the sharpest half of frames (motion blur is common in phone video)
    usable.sort(function (a, b) { return b.quality.blurScore - a.quality.blurScore; });
    var keep = usable.slice(0, Math.max(1, Math.ceil(usable.length / 2)));
    var base = JSON.parse(JSON.stringify(keep[0]));
    ['tissue', 'pattern', 'lesions'].forEach(function (group) {
      Object.keys(base[group]).forEach(function (k) {
        base[group][k] = median(keep.map(function (f) { return f[group][k]; }));
      });
    });
    ['blurScore', 'brightness', 'brightnessScore', 'leafCoverage', 'glareRatio', 'soilLikeBackground', 'sharpnessVariance'].forEach(function (k) {
      base.quality[k] = median(keep.map(function (f) { return f.quality[k]; }));
    });
    base.quality.issues = keep[0].quality.issues;
    base.quality.isAcceptableQuality = keep.some(function (f) { return f.quality.isAcceptableQuality; });
    base.framesAnalysed = featureList.length;
    base.framesUsed = keep.length;
    return base;
  }

  // --------------------------------------------------------------------------
  // Synthetic test leaves — used by the in-app health self-test and Node tests
  // --------------------------------------------------------------------------
  function synthesizeTestLeaf(kind, size) {
    size = size || 160;
    var w = size, h = size, data = new Uint8ClampedArray(w * h * 4);
    var cx = w / 2, cy = h / 2, rx = w * 0.42, ry = h * 0.3;
    // Deterministic pseudo-random for reproducible tests
    var seed = 1234567;
    function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var spots = [];
    var spotN = kind === 'rust' ? 70 : kind === 'leafspot' ? 7 : kind === 'powdery' ? 6 : 0;
    for (var s = 0; s < spotN; s++) {
      var a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.7;
      var k0 = size / 160; // lesions scale with the photo, like a real leaf filling the frame
      spots.push({ x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r, rad: (kind === 'rust' ? 1.6 : kind === 'leafspot' ? 4.5 : 9) * k0 });
    }
    function put(i, r, g, b) { data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255; }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny;
        // light grey-white paper background with slight texture (keeps sharpness measurable)
        var tex = ((x * 7 + y * 13) % 11) - 5;
        if (d > 1) { put(i, 236 + tex, 236 + tex, 232 + tex); continue; }
        var cell = Math.max(8, Math.round(8 * size / 160)), vein = Math.max(2, Math.round(2 * size / 160));
        var veinNet = (x % cell < vein) || (y % cell < vein);
        var g = [34 + tex, 128 + tex, 40];                 // healthy green
        if (kind === 'uniform') g = [205 + tex, 200 + tex, 70];
        if (kind === 'interveinal') g = veinNet ? [34, 128, 40] : [215 + tex, 205, 60];
        if (kind === 'pale') g = veinNet ? [60, 140, 60] : [236, 236, 176];
        if (kind === 'purple') g = (x + y) % 3 === 0 ? [40, 110, 45] : [120 + tex, 50, 125];
        if (kind === 'marginal' && d > 0.62) g = d > 0.68 ? [110 + tex, 70, 35] : [200, 190, 60];
        if (kind === 'mosaic') {
          var sc = size / 160;
          var blob = Math.sin(x / (9 * sc)) * Math.cos(y / (11 * sc)) + Math.sin((x + y) / (17 * sc));
          g = blob > 0.35 ? [210 + tex, 205, 70] : [40, 130 + tex, 45];
        }
        for (var k = 0; k < spots.length; k++) {
          var sp = spots[k], dx = x - sp.x, dy = y - sp.y, dd = Math.sqrt(dx * dx + dy * dy);
          if (kind === 'rust' && dd <= sp.rad) g = [222, 118, 28];
          if (kind === 'leafspot') {
            if (dd <= sp.rad) g = [92, 58, 30];
            else if (dd <= sp.rad + 2.2 * (size / 160)) g = [214, 200, 60];
          }
          if (kind === 'powdery' && dd <= sp.rad) g = [222 + tex, 226 + tex, 220 + tex];
        }
        put(i, g[0], g[1], g[2]);
      }
    }
    return { data: data, width: w, height: h };
  }

  var SELF_TEST_CASES = [
    { kind: 'healthy', expect: ['HEALTHY'] },
    { kind: 'uniform', expect: ['N_DEF', 'S_DEF'], ctx: { leafAge: 'OLD' } },
    { kind: 'interveinal', expect: INTERVEINAL_FAMILY },
    { kind: 'pale', expect: ['FE_DEF'], ctx: { leafAge: 'NEW' } },
    { kind: 'rust', expect: ['RUST'] },
    { kind: 'leafspot', expect: ['LEAF_SPOT'] },
    { kind: 'marginal', expect: ['K_DEF'], ctx: { leafAge: 'OLD' } },
    { kind: 'purple', expect: ['P_DEF', 'MG_DEF'] },
    { kind: 'powdery', expect: ['POWDERY_MILDEW'] },
    // High-resolution cases: tiny lesions must survive down-sampling of real phone photos
    { kind: 'rust', size: 720, expect: ['RUST'] },
    { kind: 'leafspot', size: 720, expect: ['LEAF_SPOT'] },
    { kind: 'healthy', size: 720, expect: ['HEALTHY'] }
  ];

  function runSelfTest() {
    var started = Date.now();
    var results = SELF_TEST_CASES.map(function (tc) {
      try {
        var img = synthesizeTestLeaf(tc.kind, tc.size);
        var feats = analyzePixels(img.data, img.width, img.height);
        var dx = diagnose(feats, tc.ctx || {});
        return { kind: tc.kind + (tc.size ? '@' + tc.size : ''), got: dx.code, pass: tc.expect.indexOf(dx.code) >= 0, confidence: dx.confidence };
      } catch (e) {
        return { kind: tc.kind, got: 'ERROR', pass: false, error: String(e && e.message || e) };
      }
    });
    var passed = results.filter(function (r) { return r.pass; }).length;
    return { engineVersion: ENGINE_VERSION, passed: passed, total: results.length, healthy: passed === results.length, results: results, ms: Date.now() - started };
  }

  return {
    ENGINE_VERSION: ENGINE_VERSION,
    KNOWLEDGE: KB,
    analyzePixels: analyzePixels,
    scoreHypotheses: scoreHypotheses,
    diagnose: diagnose,
    aggregateFrames: aggregateFrames,
    synthesizeTestLeaf: synthesizeTestLeaf,
    runSelfTest: runSelfTest,
    _internals: { classify: classify, rgbToHsv: rgbToHsv, C: C }
  };
});
