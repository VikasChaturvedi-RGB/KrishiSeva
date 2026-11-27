import * as fs from 'fs';
import * as path from 'path';
import { normaliseStateName, findKeyInsensitive, istMonth, computeFreshness, DataFreshness } from './areaResolver';
import { SoilAtlasService } from './soilAtlasService';

/**
 * Area-wise Crop & Variety Fit Advisor
 * ------------------------------------
 * Answers "which crop and which public-sector variety fits MY area this season?"
 * for a farmer's state/district, soil and water situation.
 *
 * Data: backend/src/data/crop-variety-almanac.json — refreshed on the 1st of every
 * month by scripts/refresh_crop_variety_almanac.mjs (GitHub Actions cron). The file
 * is re-read whenever its mtime changes, so a refreshed almanac is served without
 * restarting the API.
 */

export type IrrigationAccess = 'IRRIGATED' | 'LIMITED' | 'RAINFED';
export type SeasonCode = 'KHARIF' | 'RABI' | 'ZAID' | 'PERENNIAL';

export interface CropFitQuery {
  state?: string;
  district?: string;
  month?: number;           // 1–12; defaults to current IST month
  season?: SeasonCode;      // optional explicit season
  soilType?: string;        // e.g. BLACK_COTTON; defaults from soil atlas
  irrigation?: IrrigationAccess;
  limit?: number;
}

export interface RankedVariety {
  name: string;
  releasedBy: string;
  durationDays: string;
  yieldQtlPerAcre: string;
  traits: string[];
  noteHi: string;
  matchReasonsHi: string[];
  recommendedForState: boolean;
}

export interface RankedCrop {
  cropCode: string;
  cropNameHi: string;
  cropNameEn: string;
  season: SeasonCode;
  fitScore: number;
  fitBand: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'RISKY';
  timing: 'SOW_NOW' | 'PREPARE_NOW' | 'UPCOMING' | 'IN_FIELD';
  reasonHi: string;
  cautionHi?: string;
  adjustmentsHi: string[];
  sowingWindowHi: string;
  seedRatePerAcre: string;
  rotationAdviceHi: string;
  marketSignal: { modalInrPerQtl: number; marketsReporting: number; latestArrivalDate: string } | null;
  varieties: RankedVariety[];
}

export interface CropFitResult {
  area: { state: string; district: string | null; matchedStateProfile: boolean; agroClimaticZones: string[] };
  month: number;
  seasonFocus: SeasonCode[];
  soilTypeUsed: string;
  soilTypeSource: 'FARMER_INPUT' | 'DISTRICT_ATLAS' | 'STATE_ATLAS' | 'DEFAULT';
  irrigation: IrrigationAccess;
  recommendations: RankedCrop[];
  marketSignalsAsOf: string | null;
  freshness: DataFreshness;
  sources: Array<{ id: string; name: string; url: string }>;
  advisoryNoteHi: string;
}

const TRAIT_BOOSTS: Record<IrrigationAccess, string[]> = {
  RAINFED: ['DROUGHT_TOLERANT', 'RAINFED', 'RAINFED_UPLAND', 'EARLY', 'EXTRA_EARLY', 'DROUGHT_ESCAPE', 'SHORT_DURATION', 'LIMITED_IRRIGATION', 'HEAT_TOLERANT'],
  LIMITED: ['LIMITED_IRRIGATION', 'EARLY', 'HEAT_TOLERANT', 'SHORT_DURATION', 'WATER_SAVING', 'DROUGHT_TOLERANT'],
  IRRIGATED: ['HIGH_YIELD', 'IRRIGATED', 'TIMELY_SOWN', 'HYBRID']
};

const SOIL_TRAIT_BOOSTS: Record<string, string[]> = {
  SALINE_SODIC: ['SALINITY_TOLERANT', 'SALINITY_SODICITY_TOLERANT'],
  COASTAL_SALINE: ['SALINITY_TOLERANT', 'SALINITY_SODICITY_TOLERANT', 'FLOOD_SUBMERGENCE_TOLERANT', 'FLOOD_AND_DROUGHT_TOLERANT'],
  TERAI_ALLUVIAL: ['FLOOD_SUBMERGENCE_TOLERANT', 'WATERLOGGING_TOLERANT'],
  HILL_ACIDIC: ['HILL_ADAPTED'],
  SANDY_ARID: ['DROUGHT_TOLERANT', 'DROUGHT_ESCAPE', 'EXTRA_EARLY']
};

const TRAIT_LABEL_HI: Record<string, string> = {
  DROUGHT_TOLERANT: 'सूखा सहनशील', RAINFED: 'असिंचित हेतु', RAINFED_UPLAND: 'ऊपरी असिंचित भूमि', EARLY: 'जल्दी पकने वाली',
  EXTRA_EARLY: 'बहुत जल्दी पकने वाली', DROUGHT_ESCAPE: 'सूखे से पहले पक जाती है', SHORT_DURATION: 'कम अवधि',
  LIMITED_IRRIGATION: '2–3 सिंचाई में सफल', HEAT_TOLERANT: 'गर्मी सहनशील', WATER_SAVING: 'पानी बचत', HIGH_YIELD: 'अधिक उपज',
  IRRIGATED: 'सिंचित हेतु', TIMELY_SOWN: 'समय से बुवाई हेतु', HYBRID: 'संकर', SALINITY_TOLERANT: 'लवण सहनशील',
  SALINITY_SODICITY_TOLERANT: 'खारी/ऊसर भूमि सहनशील', FLOOD_SUBMERGENCE_TOLERANT: 'बाढ़ में डूबने पर भी जीवित',
  FLOOD_AND_DROUGHT_TOLERANT: 'बाढ़ व सूखा दोनों सहनशील', WATERLOGGING_TOLERANT: 'जल भराव सहनशील', HILL_ADAPTED: 'पहाड़ी क्षेत्र हेतु',
  LATE_SOWN_OK: 'देर से बुवाई में भी ठीक', SUITS_LATE_RAIN: 'देर से वर्षा में ठीक'
};

interface CachedFile<T> { mtimeMs: number; data: T }
let almanacCache: CachedFile<any> | null = null;

function resolveDataFile(fileName: string): string {
  const candidates = [
    process.env.CROP_ALMANAC_PATH && fileName === 'crop-variety-almanac.json' ? process.env.CROP_ALMANAC_PATH : '',
    path.join(__dirname, '../../data', fileName),
    path.join(process.cwd(), 'src/data', fileName),
    path.join(process.cwd(), 'backend/src/data', fileName),
    path.join(process.cwd(), 'dist/data', fileName)
  ].filter(Boolean) as string[];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`Area-intelligence dataset not found: ${fileName}`);
}

export function seasonsForMonth(month: number, seasonWindows: Record<string, any>): { sowNow: SeasonCode[]; prepare: SeasonCode[]; inField: SeasonCode[] } {
  const sowNow: SeasonCode[] = [];
  const prepare: SeasonCode[] = [];
  const inField: SeasonCode[] = [];
  for (const code of ['KHARIF', 'RABI', 'ZAID'] as SeasonCode[]) {
    const w = seasonWindows[code];
    if (!w) continue;
    if (w.sowingMonths.includes(month)) sowNow.push(code);
    else if (w.planningMonths.includes(month)) prepare.push(code);
    else if (w.growingMonths.includes(month)) inField.push(code);
  }
  return { sowNow, prepare, inField };
}

export class CropVarietyAdvisorService {
  static loadAlmanac(): any {
    const file = resolveDataFile('crop-variety-almanac.json');
    const mtimeMs = fs.statSync(file).mtimeMs;
    if (!almanacCache || almanacCache.mtimeMs !== mtimeMs) {
      almanacCache = { mtimeMs, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
    return almanacCache.data;
  }

  static getFreshness(now: Date = new Date()): DataFreshness {
    const a = this.loadAlmanac();
    return computeFreshness(a.meta.almanacVersion, a.meta.lastReviewedAt, now);
  }

  static recommend(query: CropFitQuery, now: Date = new Date()): CropFitResult {
    const almanac = this.loadAlmanac();
    const month = query.month && query.month >= 1 && query.month <= 12 ? Math.floor(query.month) : istMonth(now);
    const irrigation: IrrigationAccess = (['IRRIGATED', 'LIMITED', 'RAINFED'] as IrrigationAccess[]).includes(query.irrigation as IrrigationAccess)
      ? (query.irrigation as IrrigationAccess)
      : 'LIMITED';

    const stateName = normaliseStateName(query.state) || 'Madhya Pradesh';
    const stateKey = findKeyInsensitive(almanac.stateSuitability, stateName);
    const stateProfile = stateKey ? almanac.stateSuitability[stateKey] : null;
    const suitability = stateProfile ? stateProfile.seasons : almanac.nationalFallback.seasons;

    // Soil: farmer input > district atlas > state atlas
    let soilTypeUsed = query.soilType ? String(query.soilType).toUpperCase() : '';
    let soilTypeSource: CropFitResult['soilTypeSource'] = soilTypeUsed ? 'FARMER_INPUT' : 'DEFAULT';
    if (!soilTypeUsed) {
      const soil = SoilAtlasService.resolvePrimarySoil(stateKey || stateName, query.district);
      soilTypeUsed = soil.soilType;
      soilTypeSource = soil.source;
    }

    // Seasons in focus for this month
    const { sowNow, prepare, inField } = seasonsForMonth(month, almanac.seasonWindows);
    let seasonFocus: SeasonCode[];
    if (query.season) {
      seasonFocus = [query.season];
    } else {
      seasonFocus = [...sowNow, ...prepare];
      if (seasonFocus.length === 0) seasonFocus = inField.length ? [...inField] : ['RABI'];
    }
    if (suitability.PERENNIAL && !seasonFocus.includes('PERENNIAL')) seasonFocus.push('PERENNIAL');

    const ranked: RankedCrop[] = [];
    for (const season of seasonFocus) {
      for (const entry of suitability[season] || []) {
        const crop = almanac.crops[entry.crop];
        if (!crop) continue;
        ranked.push(this.scoreCrop(entry, crop, season, {
          month, irrigation, soilType: soilTypeUsed, stateKey,
          sowNow, prepare, inField,
          perennialSowingMonths: almanac.seasonWindows.PERENNIAL?.sowingMonths || [],
          market: (stateKey && almanac.marketSignals?.byState?.[stateKey]) || {}
        }));
      }
    }

    // De-duplicate crops that appear in two focus seasons (keep the better fit)
    const best = new Map<string, RankedCrop>();
    for (const r of ranked) {
      const k = r.cropCode;
      if (!best.has(k) || best.get(k)!.fitScore < r.fitScore) best.set(k, r);
    }
    const timingOrder = { SOW_NOW: 0, PREPARE_NOW: 1, UPCOMING: 2, IN_FIELD: 3 };
    const recommendations = Array.from(best.values())
      .sort((a, b) => (timingOrder[a.timing] - timingOrder[b.timing]) || (b.fitScore - a.fitScore))
      .slice(0, Math.max(1, Math.min(query.limit || 8, 20)));

    return {
      area: {
        state: stateKey || stateName,
        district: query.district ? String(query.district).trim() : null,
        matchedStateProfile: Boolean(stateProfile),
        agroClimaticZones: stateProfile?.agroClimaticZones || []
      },
      month,
      seasonFocus,
      soilTypeUsed,
      soilTypeSource,
      irrigation,
      recommendations,
      marketSignalsAsOf: almanac.marketSignals?.asOf || null,
      freshness: computeFreshness(almanac.meta.almanacVersion, almanac.meta.lastReviewedAt, now),
      sources: almanac.meta.sources,
      advisoryNoteHi: stateProfile
        ? 'केवल सरकारी/ICAR/कृषि विश्वविद्यालय द्वारा विकसित किस्में दिखाई गई हैं — किसी कंपनी ब्रांड का प्रचार नहीं। बीज केवल प्रमाणित (नीला/सफेद टैग) व पक्के बिल के साथ लें।'
        : almanac.nationalFallback.noteHi
    };
  }

  private static scoreCrop(
    entry: any,
    crop: any,
    season: SeasonCode,
    ctx: { month: number; irrigation: IrrigationAccess; soilType: string; stateKey: string | null; sowNow: SeasonCode[]; prepare: SeasonCode[]; inField: SeasonCode[]; perennialSowingMonths: number[]; market: Record<string, any> }
  ): RankedCrop {
    let score = Number(entry.fitScore) || 60;
    const adjustmentsHi: string[] = [];

    // Soil fit
    if (crop.soilFit?.includes(ctx.soilType)) {
      score += 4;
      adjustmentsHi.push('आपकी मिट्टी के अनुकूल');
    } else if (ctx.soilType) {
      score -= 10;
      adjustmentsHi.push('आपकी मिट्टी हेतु आदर्श नहीं — मिट्टी सुधार/किस्म चयन पर ध्यान दें');
    }

    // Water access fit
    if (ctx.irrigation === 'RAINFED') {
      if (crop.waterNeed === 'IRRIGATED') { score -= 22; adjustmentsHi.push('सिंचाई बिना जोखिम भरा'); }
      else if (crop.waterNeed === 'LIMITED_IRRIGATION') { score -= 6; adjustmentsHi.push('1–2 जीवन रक्षक सिंचाई चाहिए'); }
      if (crop.droughtBand === 'VERY_HIGH' || crop.droughtBand === 'HIGH') { score += 6; adjustmentsHi.push('कम पानी में भी सुरक्षित'); }
    } else if (ctx.irrigation === 'LIMITED') {
      if (crop.waterNeed === 'IRRIGATED') { score -= 8; adjustmentsHi.push('पूरी सिंचाई न हो तो उपज घटेगी'); }
      if (crop.droughtBand === 'HIGH' || crop.droughtBand === 'VERY_HIGH') score += 3;
    } else if (crop.waterNeed === 'IRRIGATED') {
      score += 3;
    }

    // Timing relative to this month
    let timing: RankedCrop['timing'] = 'UPCOMING';
    if (season === 'PERENNIAL') {
      timing = ctx.perennialSowingMonths.includes(ctx.month) ? 'SOW_NOW' : 'PREPARE_NOW';
      score -= 2; // multi-year commitment
    } else if (ctx.sowNow.includes(season)) {
      timing = 'SOW_NOW';
    } else if (ctx.prepare.includes(season)) {
      timing = 'PREPARE_NOW';
    } else if (ctx.inField.includes(season)) {
      timing = 'IN_FIELD';
    }

    score = Math.max(5, Math.min(99, Math.round(score)));
    const fitBand: RankedCrop['fitBand'] = score >= 85 ? 'EXCELLENT' : score >= 72 ? 'GOOD' : score >= 58 ? 'FAIR' : 'RISKY';

    return {
      cropCode: entry.crop,
      cropNameHi: crop.cropNameHi,
      cropNameEn: crop.cropNameEn,
      season,
      fitScore: score,
      fitBand,
      timing,
      reasonHi: entry.reasonHi,
      cautionHi: entry.cautionHi,
      adjustmentsHi,
      sowingWindowHi: crop.sowingWindowHi,
      seedRatePerAcre: crop.seedRatePerAcre,
      rotationAdviceHi: crop.rotationAdviceHi,
      marketSignal: ctx.market[entry.crop] || null,
      varieties: this.rankVarieties(crop, ctx)
    };
  }

  static rankVarieties(crop: any, ctx: { month: number; irrigation: IrrigationAccess; soilType: string; stateKey: string | null }): RankedVariety[] {
    const wantedTraits = new Set<string>([
      ...TRAIT_BOOSTS[ctx.irrigation],
      ...(SOIL_TRAIT_BOOSTS[ctx.soilType] || [])
    ]);
    // Late sowing month for rabi crops (December) → prefer late-sown/early types
    if (ctx.month === 12 || ctx.month === 1) {
      wantedTraits.add('LATE_SOWN_OK');
      wantedTraits.add('EARLY');
    }

    const scored = (crop.varieties || []).map((v: any) => {
      const inState = ctx.stateKey ? (v.states || []).includes(ctx.stateKey) : false;
      // Varieties the state agriculture department is actively promoting (e.g. PR 126 to save
      // groundwater in Punjab, Co 15023 replacing red-rot-hit Co 0238 in UP) rank first
      const statePriority = ctx.stateKey ? (v.priorityStates || []).includes(ctx.stateKey) : false;
      const matched = (v.traits || []).filter((t: string) => wantedTraits.has(t));
      const s = (inState ? 100 : 0) + (statePriority ? 25 : 0) + matched.length * 10;
      const matchReasonsHi = matched.map((t: string) => TRAIT_LABEL_HI[t] || t).slice(0, 3);
      if (statePriority) matchReasonsHi.unshift('राज्य कृषि विभाग की प्राथमिकता किस्म');
      if (inState) matchReasonsHi.unshift('आपके राज्य हेतु संस्तुत');
      return {
        sortScore: s,
        variety: {
          name: v.name,
          releasedBy: v.releasedBy,
          durationDays: v.durationDays,
          yieldQtlPerAcre: v.yieldQtlPerAcre,
          traits: v.traits || [],
          noteHi: v.noteHi,
          matchReasonsHi,
          recommendedForState: inState
        } as RankedVariety
      };
    });

    scored.sort((a: any, b: any) => b.sortScore - a.sortScore);
    const stateFit = scored.filter((x: any) => x.variety.recommendedForState);
    // Prefer state-recommended varieties; fall back to best national ones if none listed
    const chosen = (stateFit.length ? stateFit : scored).slice(0, 4);
    return chosen.map((x: any) => x.variety);
  }
}
