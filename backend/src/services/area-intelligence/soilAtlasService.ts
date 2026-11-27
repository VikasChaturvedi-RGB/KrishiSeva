import * as fs from 'fs';
import * as path from 'path';
import { normaliseStateName, findKeyInsensitive, computeFreshness, DataFreshness } from './areaResolver';

/**
 * Area Soil-Type & Nutrient-Deficiency Atlas
 * ------------------------------------------
 * Tells a farmer what soil type dominates their state/district and which
 * nutrients are commonly deficient there (ICAR-IISS / Soil Health Card survey
 * patterns), with a per-acre correction plan and DIY field tests.
 *
 * Data: backend/src/data/soil-zone-atlas.json (refreshed monthly alongside the
 * crop-variety almanac; re-read automatically when the file changes).
 */

export interface SoilAtlasQuery {
  state?: string;
  district?: string;
  cropCode?: string;
  acres?: number;
}

const SEVERITY_RANK: Record<string, number> = { VERY_HIGH: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

// Crop groups that need extra emphasis on particular nutrients
const CROP_NUTRIENT_EMPHASIS: Record<string, { nutrients: string[]; reasonHi: string }> = {
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



let atlasCache: { mtimeMs: number; data: any } | null = null;

function resolveAtlasFile(): string {
  const candidates = [
    process.env.SOIL_ATLAS_PATH || '',
    path.join(__dirname, '../../data/soil-zone-atlas.json'),
    path.join(process.cwd(), 'src/data/soil-zone-atlas.json'),
    path.join(process.cwd(), 'backend/src/data/soil-zone-atlas.json'),
    path.join(process.cwd(), 'dist/data/soil-zone-atlas.json')
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Soil atlas dataset not found: soil-zone-atlas.json');
}

export class SoilAtlasService {
  static loadAtlas(): any {
    const file = resolveAtlasFile();
    const mtimeMs = fs.statSync(file).mtimeMs;
    if (!atlasCache || atlasCache.mtimeMs !== mtimeMs) {
      atlasCache = { mtimeMs, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
    return atlasCache.data;
  }

  static getFreshness(now: Date = new Date()): DataFreshness {
    const a = this.loadAtlas();
    return computeFreshness(a.meta.atlasVersion, a.meta.lastReviewedAt, now);
  }

  /** Used by the crop advisor to default the soil type for an area. */
  static resolvePrimarySoil(state?: string | null, district?: string | null): { soilType: string; source: 'DISTRICT_ATLAS' | 'STATE_ATLAS' | 'DEFAULT' } {
    const atlas = this.loadAtlas();
    const stateKey = findKeyInsensitive(atlas.states, normaliseStateName(state));
    const profile = stateKey ? atlas.states[stateKey] : null;
    if (profile && district) {
      const dKey = findKeyInsensitive(profile.districts, district);
      if (dKey) return { soilType: profile.districts[dKey].soil, source: 'DISTRICT_ATLAS' };
    }
    if (profile && profile.dominantSoils?.length) {
      const top = [...profile.dominantSoils].sort((a: any, b: any) => b.sharePct - a.sharePct)[0];
      return { soilType: top.type, source: 'STATE_ATLAS' };
    }
    return { soilType: 'ALLUVIAL', source: 'DEFAULT' };
  }

  static getAreaSoilProfile(query: SoilAtlasQuery, now: Date = new Date()) {
    const atlas = this.loadAtlas();
    const stateName = normaliseStateName(query.state) || 'Madhya Pradesh';
    const stateKey = findKeyInsensitive(atlas.states, stateName);
    const profile = stateKey ? atlas.states[stateKey] : atlas.nationalFallback;
    const acres = query.acres && query.acres > 0 ? Math.min(query.acres, 500) : 1;

    // District-level primary soil (if we know it)
    let districtMatch: { name: string; soil: string; noteHi: string } | null = null;
    if (query.district && profile.districts) {
      const dKey = findKeyInsensitive(profile.districts, query.district);
      if (dKey) districtMatch = { name: dKey, soil: profile.districts[dKey].soil, noteHi: profile.districts[dKey].noteHi };
    }

    const dominantSoils = [...(profile.dominantSoils || [])]
      .sort((a: any, b: any) => b.sharePct - a.sharePct)
      .map((d: any) => ({ ...d, ...this.describeSoil(atlas, d.type) }));

    const primarySoilType = districtMatch?.soil || dominantSoils[0]?.type || 'ALLUVIAL';
    const primarySoil = { type: primarySoilType, ...this.describeSoil(atlas, primarySoilType) };

    // Crop emphasis lifts crop-critical nutrients to the top
    const cropCode = query.cropCode ? String(query.cropCode).toUpperCase() : '';
    const emphasis = CROP_NUTRIENT_EMPHASIS[cropCode];

    const deficiencies = [...(profile.deficiencies || [])]
      .map((d: any) => {
        const n = atlas.nutrients[d.nutrient] || {};
        const cropCritical = Boolean(emphasis?.nutrients.includes(d.nutrient));
        return {
          nutrient: d.nutrient,
          nameHi: n.nameHi,
          nameEn: n.nameEn,
          severity: d.severity,
          approxPctSamplesDeficient: d.approxPctSamplesDeficient,
          hotspotsHi: d.hotspotsHi,
          symptomHi: n.symptomHi,
          photoCueHi: n.photoCueHi,
          soilCorrectionHi: n.soilCorrectionHi,
          foliarCorrectionHi: n.foliarCorrectionHi,
          organicHi: n.organicHi,
          cropCritical
        };
      })
      .sort((a: any, b: any) =>
        (Number(b.cropCritical) - Number(a.cropCritical)) ||
        ((SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)) ||
        (b.approxPctSamplesDeficient - a.approxPctSamplesDeficient)
      );

    return {
      area: {
        state: stateKey || stateName,
        district: districtMatch?.name || (query.district ? String(query.district).trim() : null),
        matchedStateProfile: Boolean(stateKey),
        matchedDistrict: Boolean(districtMatch)
      },
      primarySoil,
      districtNoteHi: districtMatch?.noteHi || null,
      dominantSoils,
      phBand: profile.phBand,
      organicCarbonStatus: profile.organicCarbonStatus,
      deficiencies,
      cropEmphasis: emphasis ? { cropCode, nutrients: emphasis.nutrients, reasonHi: emphasis.reasonHi } : null,
      correctionPlan: this.buildCorrectionPlan(deficiencies, primarySoilType, acres),
      diySoilTests: atlas.diySoilTests || [],
      soilHealthCardGuidanceHi: atlas.soilHealthCardGuidanceHi || [],
      disclaimerHi: atlas.meta.disclaimerHi,
      freshness: computeFreshness(atlas.meta.atlasVersion, atlas.meta.lastReviewedAt, now),
      sources: atlas.meta.sources
    };
  }

  private static describeSoil(atlas: any, type: string) {
    const s = atlas.soilTypes[type] || {};
    return {
      nameHi: s.nameHi,
      nameEn: s.nameEn,
      localNamesHi: s.localNamesHi,
      textureHi: s.textureHi,
      phTypical: s.phTypical,
      organicCarbonTypical: s.organicCarbonTypical,
      waterHoldingHi: s.waterHoldingHi,
      strengthsHi: s.strengthsHi,
      weaknessesHi: s.weaknessesHi,
      managementHi: s.managementHi,
      diyIdentifyHi: s.diyIdentifyHi
    };
  }

  /** Per-acre plan scaled to the farmer's land; only for HIGH/VERY_HIGH/crop-critical gaps. */
  private static buildCorrectionPlan(deficiencies: any[], soilType: string, acres: number) {
    const plan: Array<{ nutrient: string; actionHi: string; quantityHi: string; timingHi: string }> = [];
    const pick = deficiencies.filter(d => d.cropCritical || SEVERITY_RANK[d.severity] >= 3).slice(0, 5);
    const fmt = (perAcre: number, unit: string) => `${Math.round(perAcre * acres * 10) / 10} ${unit} (${acres} एकड़ हेतु; ${perAcre} ${unit}/एकड़)`;

    for (const d of pick) {
      switch (d.nutrient) {
        case 'ZN':
          plan.push({ nutrient: 'ZN', actionHi: 'जिंक सल्फेट (21%) मिट्टी में', quantityHi: fmt(10, 'kg'), timingHi: 'बुवाई/रोपाई के समय; हर 2–3 सीजन में एक बार' });
          break;
        case 'S':
          plan.push({ nutrient: 'S', actionHi: soilType === 'SALINE_SODIC' ? 'जिप्सम (गंधक + सोडियम सुधार)' : 'जिप्सम या बेंटोनाइट सल्फर', quantityHi: soilType === 'SALINE_SODIC' ? 'मृदा जांच के जिप्सम आवश्यकता (GR) अनुसार' : `${fmt(100, 'kg')} जिप्सम या ${fmt(8, 'kg')} बेंटोनाइट सल्फर`, timingHi: 'अंतिम जुताई/बुवाई पर' });
          break;
        case 'B':
          plan.push({ nutrient: 'B', actionHi: 'बोरेक्स मिट्टी में (अधिक न दें)', quantityHi: fmt(4, 'kg'), timingHi: 'बुवाई पर, 2 वर्ष में एक बार; या फूल से पहले 0.2% पर्णीय' });
          break;
        case 'FE':
          plan.push({ nutrient: 'FE', actionHi: '0.5% फेरस सल्फेट + 0.1% नींबू रस/साइट्रिक एसिड पर्णीय छिड़काव', quantityHi: `75 g + 15 g / 15 L पंप (~13 पंप/एकड़ → ${Math.ceil(13 * acres)} पंप)`, timingHi: 'पीलापन दिखते ही, 7 दिन के अंतर पर 2–3 बार' });
          break;
        case 'MN':
          plan.push({ nutrient: 'MN', actionHi: '0.5% मैंगनीज सल्फेट पर्णीय छिड़काव', quantityHi: `75 g / 15 L पंप (~${Math.ceil(13 * acres)} पंप)`, timingHi: 'गेहूँ में पहली सिंचाई से 2–4 दिन पहले, फिर साप्ताहिक 2 बार' });
          break;
        case 'MO':
          plan.push({ nutrient: 'MO', actionHi: 'सोडियम मॉलिब्डेट बीजोपचार (दलहन)', quantityHi: '1 g प्रति kg बीज, राइजोबियम के साथ', timingHi: 'बुवाई से ठीक पहले' });
          break;
        case 'ACIDITY':
          plan.push({ nutrient: 'ACIDITY', actionHi: 'कृषि चूना / डोलोमाइट कूंड़ में', quantityHi: fmt(150, 'kg'), timingHi: 'बुवाई से 2–3 सप्ताह पहले; हर साल (pH 6 तक)' });
          break;
        case 'SODICITY':
          plan.push({ nutrient: 'SODICITY', actionHi: 'जिप्सम + ढैंचा हरी खाद + लवण-सहिष्णु किस्म', quantityHi: 'मृदा जांच के GR अनुसार (सामान्यतः 2–5 टन/एकड़)', timingHi: 'मानसून से पहले; पहले वर्ष धान से शुरुआत' });
          break;
        case 'P':
          plan.push({ nutrient: 'P', actionHi: soilType === 'RED_LATERITIC' || soilType === 'HILL_ACIDIC' ? 'रॉक फॉस्फेट + PSB कल्चर' : 'SSP (फॉस्फोरस + 12% गंधक) + PSB बीजोपचार', quantityHi: 'मृदा कार्ड अनुसार; सामान्य: 100–150 kg SSP/एकड़', timingHi: 'बुवाई पर कूंड़ में' });
          break;
        case 'N':
          plan.push({ nutrient: 'N', actionHi: 'नीम-लेपित यूरिया किश्तों में + दलहन/हरी खाद चक्र', quantityHi: 'फसल अनुसार; 2–3 किश्तों में बाँटें', timingHi: 'बुवाई, कल्ले/शाखा व फूल से पहले' });
          break;
        case 'K':
          plan.push({ nutrient: 'K', actionHi: 'म्यूरेट ऑफ पोटाश (MOP)', quantityHi: fmt(25, 'kg'), timingHi: 'बुवाई पर' });
          break;
        default:
          break;
      }
    }
    // Every plan includes organic carbon building — the root fix for most micronutrient gaps
    plan.push({ nutrient: 'OC', actionHi: 'गोबर खाद/कम्पोस्ट + जीवामृत (जैविक कार्बन बढ़ाएं)', quantityHi: `${fmt(2, 'टन')} सड़ी गोबर खाद`, timingHi: 'हर सीजन अंतिम जुताई से पहले' });
    return plan;
  }
}
