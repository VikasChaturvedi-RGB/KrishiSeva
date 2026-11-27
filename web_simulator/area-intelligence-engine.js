// ============================================================================
// KRISHI SAHAYAK — AREA INTELLIGENCE ENGINE (offline mirror of the API)
// ----------------------------------------------------------------------------
// Pure functions that rank crops + public-sector varieties for a farmer's area
// and build the area soil/nutrient profile, from the two monthly-refreshed
// datasets bundled with the PWA (data/crop-variety-almanac.json and
// data/soil-zone-atlas.json).
//
// It mirrors backend/src/services/area-intelligence/*.ts — the backend test
// suite runs a parity check so the online and offline answers never drift.
// UMD: window.KrishiAreaEngine in the browser, require()-able from Node.
// ============================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KrishiAreaEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STATE_ALIASES = {
    'MP': 'Madhya Pradesh', 'M.P.': 'Madhya Pradesh', 'MADHYA PRADESH': 'Madhya Pradesh', 'मध्य प्रदेश': 'Madhya Pradesh', 'म.प्र.': 'Madhya Pradesh', 'मप्र': 'Madhya Pradesh',
    'MH': 'Maharashtra', 'MAHARASHTRA': 'Maharashtra', 'महाराष्ट्र': 'Maharashtra',
    'PB': 'Punjab', 'PUNJAB': 'Punjab', 'पंजाब': 'Punjab', 'ਪੰਜਾਬ': 'Punjab',
    'HR': 'Haryana', 'HARYANA': 'Haryana', 'हरियाणा': 'Haryana',
    'UP': 'Uttar Pradesh', 'U.P.': 'Uttar Pradesh', 'UTTAR PRADESH': 'Uttar Pradesh', 'उत्तर प्रदेश': 'Uttar Pradesh', 'उ.प्र.': 'Uttar Pradesh',
    'RJ': 'Rajasthan', 'RAJASTHAN': 'Rajasthan', 'राजस्थान': 'Rajasthan',
    'GJ': 'Gujarat', 'GUJARAT': 'Gujarat', 'गुजरात': 'Gujarat', 'ગુજરાત': 'Gujarat',
    'BR': 'Bihar', 'BIHAR': 'Bihar', 'बिहार': 'Bihar',
    'WB': 'West Bengal', 'WEST BENGAL': 'West Bengal', 'पश्चिम बंगाल': 'West Bengal', 'পশ্চিমবঙ্গ': 'West Bengal',
    'OD': 'Odisha', 'OR': 'Odisha', 'ODISHA': 'Odisha', 'ORISSA': 'Odisha', 'ओडिशा': 'Odisha', 'ଓଡ଼ିଶା': 'Odisha',
    'CG': 'Chhattisgarh', 'CT': 'Chhattisgarh', 'CHHATTISGARH': 'Chhattisgarh', 'छत्तीसगढ़': 'Chhattisgarh',
    'JH': 'Jharkhand', 'JHARKHAND': 'Jharkhand', 'झारखंड': 'Jharkhand',
    'KA': 'Karnataka', 'KARNATAKA': 'Karnataka', 'कर्नाटक': 'Karnataka', 'ಕರ್ನಾಟಕ': 'Karnataka',
    'TS': 'Telangana', 'TG': 'Telangana', 'TELANGANA': 'Telangana', 'तेलंगाना': 'Telangana', 'తెలంగాణ': 'Telangana',
    'AP': 'Andhra Pradesh', 'ANDHRA PRADESH': 'Andhra Pradesh', 'आंध्र प्रदेश': 'Andhra Pradesh', 'ఆంధ్ర ప్రదేశ్': 'Andhra Pradesh',
    'TN': 'Tamil Nadu', 'TAMIL NADU': 'Tamil Nadu', 'TAMILNADU': 'Tamil Nadu', 'तमिलनाडु': 'Tamil Nadu', 'தமிழ்நாடு': 'Tamil Nadu',
    'AS': 'Assam', 'ASSAM': 'Assam', 'असम': 'Assam', 'অসম': 'Assam'
  };

  function normaliseStateName(raw) {
    if (!raw) return null;
    var trimmed = String(raw).trim();
    if (!trimmed) return null;
    var upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
    if (STATE_ALIASES[upper]) return STATE_ALIASES[upper];
    if (STATE_ALIASES[trimmed]) return STATE_ALIASES[trimmed];
    return trimmed.toLowerCase().split(/\s+/).map(function (w) { return w ? w[0].toUpperCase() + w.slice(1) : w; }).join(' ');
  }

  function findKeyInsensitive(obj, wanted) {
    if (!wanted || !obj) return null;
    var w = String(wanted).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!w) return null;
    var keys = Object.keys(obj), i;
    for (i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === w) return keys[i];
    var loose = w.replace(/[^a-zऀ-෿]/g, '');
    for (i = 0; i < keys.length; i++) {
      var kl = keys[i].toLowerCase().replace(/[^a-zऀ-෿]/g, '');
      if (kl && (loose.indexOf(kl) === 0 || kl.indexOf(loose) === 0)) return keys[i];
    }
    return null;
  }

  function istMonth(now) {
    now = now || new Date();
    var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 5.5 * 3600000).getMonth() + 1;
  }

  function computeFreshness(version, lastReviewedAt, now) {
    now = now || new Date();
    var reviewed = new Date(lastReviewedAt + 'T00:00:00+05:30');
    var ageDays = Math.max(0, Math.floor((now.getTime() - reviewed.getTime()) / 86400000));
    var nextDue = new Date(Date.UTC(reviewed.getUTCFullYear(), reviewed.getUTCMonth() + 1, 1));
    return {
      dataVersion: version,
      lastReviewedAt: lastReviewedAt,
      ageDays: ageDays,
      nextRefreshDueOn: nextDue.toISOString().slice(0, 10),
      isStale: now.getTime() > nextDue.getTime() + 5 * 86400000,
      refreshCadence: 'MONTHLY'
    };
  }

  // ---------------------------------------------------------------- Soil atlas
  var SEVERITY_RANK = { VERY_HIGH: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  var CROP_NUTRIENT_EMPHASIS = {
    MUSTARD: { nutrients: ['S', 'B'], reasonHi: 'तिलहन में गंधक से तेल व दाना दोनों बढ़ते हैं; बोरोन से फलियाँ भरती हैं।' },
    GROUNDNUT: { nutrients: ['S', 'B', 'FE'], reasonHi: 'मूँगफली को जिप्सम (कैल्शियम+गंधक) व बोरोन चाहिए; चूनेदार मिट्टी में आयरन पीलापन आम।' },
    SOYBEAN: { nutrients: ['S', 'ZN', 'MO'], reasonHi: 'सोयाबीन में गंधक व जिंक से उपज बढ़ती है; अम्लीय मिट्टी में मॉलिब्डेनम गांठें बढ़ाता है।' },
    CHICKPEA: { nutrients: ['ZN', 'B', 'MO'], reasonHi: 'चने में जिंक व बोरोन से फूल-फली झड़ना घटता है।' },
    PIGEONPEA: { nutrients: ['ZN', 'B', 'MO', 'S'], reasonHi: 'दलहन में मॉलिब्डेनम व बोरोन से गांठें व फली भराव बढ़ता है।' },
    GREENGRAM: { nutrients: ['ZN', 'S', 'MO'], reasonHi: 'मूँग में गंधक व जिंक से दाना चमकदार व भारी होता है।' },
    PADDY: { nutrients: ['ZN', 'FE'], reasonHi: 'धान में जिंक की कमी से "खैरा" रोग; हल्की मिट्टी व सूखी नर्सरी में आयरन कमी।' },
    WHEAT: { nutrients: ['ZN', 'MN', 'S'], reasonHi: 'धान के बाद हल्की मिट्टी पर गेहूँ में मैंगनीज कमी आम; जिंक से कल्ले बढ़ते हैं।' },
    MAIZE: { nutrients: ['ZN', 'B'], reasonHi: 'मक्का जिंक के प्रति सबसे संवेदनशील अनाज है; बोरोन से भुट्टे में दाने पूरे भरते हैं।' },
    COTTON: { nutrients: ['B', 'ZN', 'S'], reasonHi: 'कपास में बोरोन से टिंडे (बॉल) गिरना घटता है।' },
    SUGARCANE: { nutrients: ['ZN', 'FE', 'S'], reasonHi: 'गन्ने में आयरन व जिंक की कमी से पत्ते सफेद-पीले होते हैं (विशेषकर चूनेदार मिट्टी)।' },
    POTATO: { nutrients: ['K', 'S', 'ZN', 'B'], reasonHi: 'आलू पोटाश-प्रेमी है; बोरोन से कंद फटना घटता है।' },
    ONION: { nutrients: ['S', 'B', 'K'], reasonHi: 'प्याज में गंधक से तीखापन व भंडारण क्षमता बढ़ती है।' },
    TOMATO: { nutrients: ['B', 'K', 'ZN'], reasonHi: 'टमाटर में बोरोन व कैल्शियम से फल फटना व ब्लॉसम एंड रॉट घटता है।' },
    CHILLI: { nutrients: ['B', 'K', 'ZN'], reasonHi: 'मिर्च में बोरोन से फूल झड़ना घटता है।' },
    BANANA: { nutrients: ['K', 'ZN', 'B', 'FE'], reasonHi: 'केला पोटाश का सबसे भूखा पौधा है; जिंक व बोरोन से घौद (bunch) भरता है।' },
    PEARL_MILLET: { nutrients: ['ZN', 'FE', 'N'], reasonHi: 'बाजरा की रेतीली भूमि में नाइट्रोजन व जिंक सबसे बड़ी कमी।' },
    FINGER_MILLET: { nutrients: ['ZN', 'B', 'ACIDITY'], reasonHi: 'अम्लीय लाल मिट्टी में चूना व जिंक से रागी की उपज बढ़ती है।' }
  };

  function resolvePrimarySoil(atlas, state, district) {
    var stateKey = findKeyInsensitive(atlas.states, normaliseStateName(state));
    var profile = stateKey ? atlas.states[stateKey] : null;
    if (profile && district) {
      var dKey = findKeyInsensitive(profile.districts, district);
      if (dKey) return { soilType: profile.districts[dKey].soil, source: 'DISTRICT_ATLAS' };
    }
    if (profile && profile.dominantSoils && profile.dominantSoils.length) {
      var top = profile.dominantSoils.slice().sort(function (a, b) { return b.sharePct - a.sharePct; })[0];
      return { soilType: top.type, source: 'STATE_ATLAS' };
    }
    return { soilType: 'ALLUVIAL', source: 'DEFAULT' };
  }

  function describeSoil(atlas, type) {
    var s = atlas.soilTypes[type] || {};
    return {
      nameHi: s.nameHi, nameEn: s.nameEn, localNamesHi: s.localNamesHi, textureHi: s.textureHi, phTypical: s.phTypical,
      organicCarbonTypical: s.organicCarbonTypical, waterHoldingHi: s.waterHoldingHi, strengthsHi: s.strengthsHi,
      weaknessesHi: s.weaknessesHi, managementHi: s.managementHi, diyIdentifyHi: s.diyIdentifyHi
    };
  }

  function soilProfile(atlas, query, now) {
    query = query || {};
    var stateName = normaliseStateName(query.state) || 'Madhya Pradesh';
    var stateKey = findKeyInsensitive(atlas.states, stateName);
    var profile = stateKey ? atlas.states[stateKey] : atlas.nationalFallback;
    var acres = query.acres && query.acres > 0 ? Math.min(query.acres, 500) : 1;

    var districtMatch = null;
    if (query.district && profile.districts) {
      var dKey = findKeyInsensitive(profile.districts, query.district);
      if (dKey) districtMatch = { name: dKey, soil: profile.districts[dKey].soil, noteHi: profile.districts[dKey].noteHi };
    }
    var dominantSoils = (profile.dominantSoils || []).slice().sort(function (a, b) { return b.sharePct - a.sharePct; })
      .map(function (d) { return Object.assign({}, d, describeSoil(atlas, d.type)); });
    var primaryType = (districtMatch && districtMatch.soil) || (dominantSoils[0] && dominantSoils[0].type) || 'ALLUVIAL';

    var cropCode = query.cropCode ? String(query.cropCode).toUpperCase() : '';
    var emphasis = CROP_NUTRIENT_EMPHASIS[cropCode];

    var deficiencies = (profile.deficiencies || []).map(function (d) {
      var n = atlas.nutrients[d.nutrient] || {};
      return {
        nutrient: d.nutrient, nameHi: n.nameHi, nameEn: n.nameEn, severity: d.severity,
        approxPctSamplesDeficient: d.approxPctSamplesDeficient, hotspotsHi: d.hotspotsHi,
        symptomHi: n.symptomHi, photoCueHi: n.photoCueHi, soilCorrectionHi: n.soilCorrectionHi,
        foliarCorrectionHi: n.foliarCorrectionHi, organicHi: n.organicHi,
        cropCritical: Boolean(emphasis && emphasis.nutrients.indexOf(d.nutrient) >= 0)
      };
    }).sort(function (a, b) {
      return (Number(b.cropCritical) - Number(a.cropCritical)) ||
        ((SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)) ||
        (b.approxPctSamplesDeficient - a.approxPctSamplesDeficient);
    });

    return {
      area: {
        state: stateKey || stateName,
        district: districtMatch ? districtMatch.name : (query.district ? String(query.district).trim() : null),
        matchedStateProfile: Boolean(stateKey),
        matchedDistrict: Boolean(districtMatch)
      },
      primarySoil: Object.assign({ type: primaryType }, describeSoil(atlas, primaryType)),
      districtNoteHi: districtMatch ? districtMatch.noteHi : null,
      dominantSoils: dominantSoils,
      phBand: profile.phBand,
      organicCarbonStatus: profile.organicCarbonStatus,
      deficiencies: deficiencies,
      cropEmphasis: emphasis ? { cropCode: cropCode, nutrients: emphasis.nutrients, reasonHi: emphasis.reasonHi } : null,
      correctionPlan: buildCorrectionPlan(deficiencies, primaryType, acres),
      diySoilTests: atlas.diySoilTests || [],
      soilHealthCardGuidanceHi: atlas.soilHealthCardGuidanceHi || [],
      disclaimerHi: atlas.meta.disclaimerHi,
      freshness: computeFreshness(atlas.meta.atlasVersion, atlas.meta.lastReviewedAt, now),
      sources: atlas.meta.sources
    };
  }

  function buildCorrectionPlan(deficiencies, soilType, acres) {
    var plan = [];
    var pick = deficiencies.filter(function (d) { return d.cropCritical || SEVERITY_RANK[d.severity] >= 3; }).slice(0, 5);
    function fmt(perAcre, unit) { return (Math.round(perAcre * acres * 10) / 10) + ' ' + unit + ' (' + acres + ' एकड़ हेतु; ' + perAcre + ' ' + unit + '/एकड़)'; }
    var pumps = Math.ceil(13 * acres);
    pick.forEach(function (d) {
      switch (d.nutrient) {
        case 'ZN': plan.push({ nutrient: 'ZN', actionHi: 'जिंक सल्फेट (21%) मिट्टी में', quantityHi: fmt(10, 'kg'), timingHi: 'बुवाई/रोपाई के समय; हर 2–3 सीजन में एक बार' }); break;
        case 'S': plan.push({ nutrient: 'S', actionHi: soilType === 'SALINE_SODIC' ? 'जिप्सम (गंधक + सोडियम सुधार)' : 'जिप्सम या बेंटोनाइट सल्फर', quantityHi: soilType === 'SALINE_SODIC' ? 'मृदा जांच के जिप्सम आवश्यकता (GR) अनुसार' : fmt(100, 'kg') + ' जिप्सम या ' + fmt(8, 'kg') + ' बेंटोनाइट सल्फर', timingHi: 'अंतिम जुताई/बुवाई पर' }); break;
        case 'B': plan.push({ nutrient: 'B', actionHi: 'बोरेक्स मिट्टी में (अधिक न दें)', quantityHi: fmt(4, 'kg'), timingHi: 'बुवाई पर, 2 वर्ष में एक बार; या फूल से पहले 0.2% पर्णीय' }); break;
        case 'FE': plan.push({ nutrient: 'FE', actionHi: '0.5% फेरस सल्फेट + 0.1% नींबू रस/साइट्रिक एसिड पर्णीय छिड़काव', quantityHi: '75 g + 15 g / 15 L पंप (~13 पंप/एकड़ → ' + pumps + ' पंप)', timingHi: 'पीलापन दिखते ही, 7 दिन के अंतर पर 2–3 बार' }); break;
        case 'MN': plan.push({ nutrient: 'MN', actionHi: '0.5% मैंगनीज सल्फेट पर्णीय छिड़काव', quantityHi: '75 g / 15 L पंप (~' + pumps + ' पंप)', timingHi: 'गेहूँ में पहली सिंचाई से 2–4 दिन पहले, फिर साप्ताहिक 2 बार' }); break;
        case 'MO': plan.push({ nutrient: 'MO', actionHi: 'सोडियम मॉलिब्डेट बीजोपचार (दलहन)', quantityHi: '1 g प्रति kg बीज, राइजोबियम के साथ', timingHi: 'बुवाई से ठीक पहले' }); break;
        case 'ACIDITY': plan.push({ nutrient: 'ACIDITY', actionHi: 'कृषि चूना / डोलोमाइट कूंड़ में', quantityHi: fmt(150, 'kg'), timingHi: 'बुवाई से 2–3 सप्ताह पहले; हर साल (pH 6 तक)' }); break;
        case 'SODICITY': plan.push({ nutrient: 'SODICITY', actionHi: 'जिप्सम + ढैंचा हरी खाद + लवण-सहिष्णु किस्म', quantityHi: 'मृदा जांच के GR अनुसार (सामान्यतः 2–5 टन/एकड़)', timingHi: 'मानसून से पहले; पहले वर्ष धान से शुरुआत' }); break;
        case 'P': plan.push({ nutrient: 'P', actionHi: (soilType === 'RED_LATERITIC' || soilType === 'HILL_ACIDIC') ? 'रॉक फॉस्फेट + PSB कल्चर' : 'SSP (फॉस्फोरस + 12% गंधक) + PSB बीजोपचार', quantityHi: 'मृदा कार्ड अनुसार; सामान्य: 100–150 kg SSP/एकड़', timingHi: 'बुवाई पर कूंड़ में' }); break;
        case 'N': plan.push({ nutrient: 'N', actionHi: 'नीम-लेपित यूरिया किश्तों में + दलहन/हरी खाद चक्र', quantityHi: 'फसल अनुसार; 2–3 किश्तों में बाँटें', timingHi: 'बुवाई, कल्ले/शाखा व फूल से पहले' }); break;
        case 'K': plan.push({ nutrient: 'K', actionHi: 'म्यूरेट ऑफ पोटाश (MOP)', quantityHi: fmt(25, 'kg'), timingHi: 'बुवाई पर' }); break;
        default: break;
      }
    });
    plan.push({ nutrient: 'OC', actionHi: 'गोबर खाद/कम्पोस्ट + जीवामृत (जैविक कार्बन बढ़ाएं)', quantityHi: fmt(2, 'टन') + ' सड़ी गोबर खाद', timingHi: 'हर सीजन अंतिम जुताई से पहले' });
    return plan;
  }

  // ---------------------------------------------------------------- Crop fit
  var TRAIT_BOOSTS = {
    RAINFED: ['DROUGHT_TOLERANT', 'RAINFED', 'RAINFED_UPLAND', 'EARLY', 'EXTRA_EARLY', 'DROUGHT_ESCAPE', 'SHORT_DURATION', 'LIMITED_IRRIGATION', 'HEAT_TOLERANT'],
    LIMITED: ['LIMITED_IRRIGATION', 'EARLY', 'HEAT_TOLERANT', 'SHORT_DURATION', 'WATER_SAVING', 'DROUGHT_TOLERANT'],
    IRRIGATED: ['HIGH_YIELD', 'IRRIGATED', 'TIMELY_SOWN', 'HYBRID']
  };
  var SOIL_TRAIT_BOOSTS = {
    SALINE_SODIC: ['SALINITY_TOLERANT', 'SALINITY_SODICITY_TOLERANT'],
    COASTAL_SALINE: ['SALINITY_TOLERANT', 'SALINITY_SODICITY_TOLERANT', 'FLOOD_SUBMERGENCE_TOLERANT', 'FLOOD_AND_DROUGHT_TOLERANT'],
    TERAI_ALLUVIAL: ['FLOOD_SUBMERGENCE_TOLERANT', 'WATERLOGGING_TOLERANT'],
    HILL_ACIDIC: ['HILL_ADAPTED'],
    SANDY_ARID: ['DROUGHT_TOLERANT', 'DROUGHT_ESCAPE', 'EXTRA_EARLY']
  };
  var TRAIT_LABEL_HI = {
    DROUGHT_TOLERANT: 'सूखा सहनशील', RAINFED: 'असिंचित हेतु', RAINFED_UPLAND: 'ऊपरी असिंचित भूमि', EARLY: 'जल्दी पकने वाली',
    EXTRA_EARLY: 'बहुत जल्दी पकने वाली', DROUGHT_ESCAPE: 'सूखे से पहले पक जाती है', SHORT_DURATION: 'कम अवधि',
    LIMITED_IRRIGATION: '2–3 सिंचाई में सफल', HEAT_TOLERANT: 'गर्मी सहनशील', WATER_SAVING: 'पानी बचत', HIGH_YIELD: 'अधिक उपज',
    IRRIGATED: 'सिंचित हेतु', TIMELY_SOWN: 'समय से बुवाई हेतु', HYBRID: 'संकर', SALINITY_TOLERANT: 'लवण सहनशील',
    SALINITY_SODICITY_TOLERANT: 'खारी/ऊसर भूमि सहनशील', FLOOD_SUBMERGENCE_TOLERANT: 'बाढ़ में डूबने पर भी जीवित',
    FLOOD_AND_DROUGHT_TOLERANT: 'बाढ़ व सूखा दोनों सहनशील', WATERLOGGING_TOLERANT: 'जल भराव सहनशील', HILL_ADAPTED: 'पहाड़ी क्षेत्र हेतु',
    LATE_SOWN_OK: 'देर से बुवाई में भी ठीक', SUITS_LATE_RAIN: 'देर से वर्षा में ठीक'
  };

  function seasonsForMonth(month, seasonWindows) {
    var sowNow = [], prepare = [], inField = [];
    ['KHARIF', 'RABI', 'ZAID'].forEach(function (code) {
      var w = seasonWindows[code];
      if (!w) return;
      if (w.sowingMonths.indexOf(month) >= 0) sowNow.push(code);
      else if (w.planningMonths.indexOf(month) >= 0) prepare.push(code);
      else if (w.growingMonths.indexOf(month) >= 0) inField.push(code);
    });
    return { sowNow: sowNow, prepare: prepare, inField: inField };
  }

  function rankVarieties(crop, ctx) {
    var wanted = {};
    (TRAIT_BOOSTS[ctx.irrigation] || []).concat(SOIL_TRAIT_BOOSTS[ctx.soilType] || []).forEach(function (t) { wanted[t] = true; });
    if (ctx.month === 12 || ctx.month === 1) { wanted.LATE_SOWN_OK = true; wanted.EARLY = true; }
    var scored = (crop.varieties || []).map(function (v) {
      var inState = ctx.stateKey ? (v.states || []).indexOf(ctx.stateKey) >= 0 : false;
      var statePriority = ctx.stateKey ? (v.priorityStates || []).indexOf(ctx.stateKey) >= 0 : false;
      var matched = (v.traits || []).filter(function (t) { return wanted[t]; });
      var reasons = matched.map(function (t) { return TRAIT_LABEL_HI[t] || t; }).slice(0, 3);
      if (statePriority) reasons.unshift('राज्य कृषि विभाग की प्राथमिकता किस्म');
      if (inState) reasons.unshift('आपके राज्य हेतु संस्तुत');
      return {
        sortScore: (inState ? 100 : 0) + (statePriority ? 25 : 0) + matched.length * 10,
        variety: {
          name: v.name, releasedBy: v.releasedBy, durationDays: v.durationDays, yieldQtlPerAcre: v.yieldQtlPerAcre,
          traits: v.traits || [], noteHi: v.noteHi, matchReasonsHi: reasons, recommendedForState: inState
        }
      };
    });
    // Stable sort (same as Array.prototype.sort in modern engines / Node)
    scored.sort(function (a, b) { return b.sortScore - a.sortScore; });
    var stateFit = scored.filter(function (x) { return x.variety.recommendedForState; });
    return (stateFit.length ? stateFit : scored).slice(0, 4).map(function (x) { return x.variety; });
  }

  function scoreCrop(entry, crop, season, ctx) {
    var score = Number(entry.fitScore) || 60;
    var adj = [];
    if (crop.soilFit && crop.soilFit.indexOf(ctx.soilType) >= 0) { score += 4; adj.push('आपकी मिट्टी के अनुकूल'); }
    else if (ctx.soilType) { score -= 10; adj.push('आपकी मिट्टी हेतु आदर्श नहीं — मिट्टी सुधार/किस्म चयन पर ध्यान दें'); }

    if (ctx.irrigation === 'RAINFED') {
      if (crop.waterNeed === 'IRRIGATED') { score -= 22; adj.push('सिंचाई बिना जोखिम भरा'); }
      else if (crop.waterNeed === 'LIMITED_IRRIGATION') { score -= 6; adj.push('1–2 जीवन रक्षक सिंचाई चाहिए'); }
      if (crop.droughtBand === 'VERY_HIGH' || crop.droughtBand === 'HIGH') { score += 6; adj.push('कम पानी में भी सुरक्षित'); }
    } else if (ctx.irrigation === 'LIMITED') {
      if (crop.waterNeed === 'IRRIGATED') { score -= 8; adj.push('पूरी सिंचाई न हो तो उपज घटेगी'); }
      if (crop.droughtBand === 'HIGH' || crop.droughtBand === 'VERY_HIGH') score += 3;
    } else if (crop.waterNeed === 'IRRIGATED') {
      score += 3;
    }

    var timing = 'UPCOMING';
    if (season === 'PERENNIAL') {
      timing = ctx.perennialSowingMonths.indexOf(ctx.month) >= 0 ? 'SOW_NOW' : 'PREPARE_NOW';
      score -= 2;
    } else if (ctx.sowNow.indexOf(season) >= 0) timing = 'SOW_NOW';
    else if (ctx.prepare.indexOf(season) >= 0) timing = 'PREPARE_NOW';
    else if (ctx.inField.indexOf(season) >= 0) timing = 'IN_FIELD';

    score = Math.max(5, Math.min(99, Math.round(score)));
    return {
      cropCode: entry.crop, cropNameHi: crop.cropNameHi, cropNameEn: crop.cropNameEn, season: season,
      fitScore: score,
      fitBand: score >= 85 ? 'EXCELLENT' : score >= 72 ? 'GOOD' : score >= 58 ? 'FAIR' : 'RISKY',
      timing: timing, reasonHi: entry.reasonHi, cautionHi: entry.cautionHi, adjustmentsHi: adj,
      sowingWindowHi: crop.sowingWindowHi, seedRatePerAcre: crop.seedRatePerAcre, rotationAdviceHi: crop.rotationAdviceHi,
      marketSignal: ctx.market[entry.crop] || null,
      varieties: rankVarieties(crop, ctx)
    };
  }

  function recommendCrops(almanac, atlas, query, now) {
    query = query || {};
    now = now || new Date();
    var month = query.month >= 1 && query.month <= 12 ? Math.floor(query.month) : istMonth(now);
    var irrigation = ['IRRIGATED', 'LIMITED', 'RAINFED'].indexOf(query.irrigation) >= 0 ? query.irrigation : 'LIMITED';
    var stateName = normaliseStateName(query.state) || 'Madhya Pradesh';
    var stateKey = findKeyInsensitive(almanac.stateSuitability, stateName);
    var stateProfile = stateKey ? almanac.stateSuitability[stateKey] : null;
    var suitability = stateProfile ? stateProfile.seasons : almanac.nationalFallback.seasons;

    var soilTypeUsed = query.soilType ? String(query.soilType).toUpperCase() : '';
    var soilTypeSource = soilTypeUsed ? 'FARMER_INPUT' : 'DEFAULT';
    if (!soilTypeUsed && atlas) {
      var soil = resolvePrimarySoil(atlas, stateKey || stateName, query.district);
      soilTypeUsed = soil.soilType; soilTypeSource = soil.source;
    } else if (!soilTypeUsed) {
      soilTypeUsed = 'ALLUVIAL';
    }

    var sfm = seasonsForMonth(month, almanac.seasonWindows);
    var seasonFocus;
    if (query.season) seasonFocus = [query.season];
    else {
      seasonFocus = sfm.sowNow.concat(sfm.prepare);
      if (!seasonFocus.length) seasonFocus = sfm.inField.length ? sfm.inField.slice() : ['RABI'];
    }
    if (suitability.PERENNIAL && seasonFocus.indexOf('PERENNIAL') < 0) seasonFocus.push('PERENNIAL');

    var ctx = {
      month: month, irrigation: irrigation, soilType: soilTypeUsed, stateKey: stateKey,
      sowNow: sfm.sowNow, prepare: sfm.prepare, inField: sfm.inField,
      perennialSowingMonths: (almanac.seasonWindows.PERENNIAL && almanac.seasonWindows.PERENNIAL.sowingMonths) || [],
      market: (stateKey && almanac.marketSignals && almanac.marketSignals.byState && almanac.marketSignals.byState[stateKey]) || {}
    };
    var ranked = [];
    seasonFocus.forEach(function (season) {
      (suitability[season] || []).forEach(function (entry) {
        var crop = almanac.crops[entry.crop];
        if (crop) ranked.push(scoreCrop(entry, crop, season, ctx));
      });
    });
    var best = {}, order = [];
    ranked.forEach(function (r) {
      if (!best[r.cropCode]) order.push(r.cropCode);
      if (!best[r.cropCode] || best[r.cropCode].fitScore < r.fitScore) best[r.cropCode] = r;
    });
    var timingOrder = { SOW_NOW: 0, PREPARE_NOW: 1, UPCOMING: 2, IN_FIELD: 3 };
    var recommendations = order.map(function (k) { return best[k]; })
      .sort(function (a, b) { return (timingOrder[a.timing] - timingOrder[b.timing]) || (b.fitScore - a.fitScore); })
      .slice(0, Math.max(1, Math.min(query.limit || 8, 20)));

    return {
      area: { state: stateKey || stateName, district: query.district ? String(query.district).trim() : null, matchedStateProfile: Boolean(stateProfile), agroClimaticZones: stateProfile ? stateProfile.agroClimaticZones : [] },
      month: month,
      seasonFocus: seasonFocus,
      soilTypeUsed: soilTypeUsed,
      soilTypeSource: soilTypeSource,
      irrigation: irrigation,
      recommendations: recommendations,
      marketSignalsAsOf: (almanac.marketSignals && almanac.marketSignals.asOf) || null,
      freshness: computeFreshness(almanac.meta.almanacVersion, almanac.meta.lastReviewedAt, now),
      sources: almanac.meta.sources,
      advisoryNoteHi: stateProfile
        ? 'केवल सरकारी/ICAR/कृषि विश्वविद्यालय द्वारा विकसित किस्में दिखाई गई हैं — किसी कंपनी ब्रांड का प्रचार नहीं। बीज केवल प्रमाणित (नीला/सफेद टैग) व पक्के बिल के साथ लें।'
        : almanac.nationalFallback.noteHi
    };
  }

  return {
    normaliseStateName: normaliseStateName,
    findKeyInsensitive: findKeyInsensitive,
    istMonth: istMonth,
    computeFreshness: computeFreshness,
    seasonsForMonth: seasonsForMonth,
    resolvePrimarySoil: resolvePrimarySoil,
    soilProfile: soilProfile,
    recommendCrops: recommendCrops
  };
});
