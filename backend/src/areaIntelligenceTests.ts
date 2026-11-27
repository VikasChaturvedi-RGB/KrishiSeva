/**
 * Area-intelligence & leaf-vision tests (no database needed — runs on any Node ≥ 18).
 *   npm run test:area
 *
 * Covers:
 *   1. Crop & variety almanac integrity + monthly freshness logic
 *   2. Crop-fit ranking behaviour (season by month, rainfed penalties, district soil)
 *   3. Soil atlas profiles, crop emphasis, acre-scaled correction plans
 *   4. Backend (TS) ⇄ PWA offline engine (JS) parity — online & offline answers match
 *   5. On-device leaf-vision engine self-test, robustness & video aggregation
 */
import * as fs from 'fs';
import * as path from 'path';
import { CropVarietyAdvisorService, seasonsForMonth } from './services/area-intelligence/cropVarietyAdvisorService';
import { SoilAtlasService } from './services/area-intelligence/soilAtlasService';
import { computeFreshness, normaliseStateName, findKeyInsensitive } from './services/area-intelligence/areaResolver';

let failures = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error(`❌ FAILED: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

const repoRoot = path.join(__dirname, '../..');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AreaEngine = require(path.join(repoRoot, 'web_simulator/area-intelligence-engine.js'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LeafVision = require(path.join(repoRoot, 'web_simulator/leaf-vision-engine.js'));

const almanac = CropVarietyAdvisorService.loadAlmanac();
const atlas = SoilAtlasService.loadAtlas();

console.log('\n--- 1. Almanac & atlas integrity ---');
{
  const cropCodes = Object.keys(almanac.crops);
  const soilTypes = Object.keys(atlas.soilTypes);
  const badCropRefs: string[] = [];
  const badSoilRefs: string[] = [];
  for (const [state, prof] of Object.entries<any>(almanac.stateSuitability)) {
    for (const [season, list] of Object.entries<any>(prof.seasons)) {
      for (const e of list) if (!cropCodes.includes(e.crop)) badCropRefs.push(`${state}/${season}/${e.crop}`);
    }
  }
  for (const [code, crop] of Object.entries<any>(almanac.crops)) {
    for (const s of crop.soilFit || []) if (!soilTypes.includes(s)) badSoilRefs.push(`${code}:${s}`);
    assert(Array.isArray(crop.varieties) && crop.varieties.length >= 3, `Almanac: ${code} lists ≥3 public-sector varieties`);
  }
  assert(badCropRefs.length === 0, `Almanac: every state suitability entry points to a known crop ${badCropRefs.join(',')}`);
  assert(badSoilRefs.length === 0, `Almanac: every crop soilFit uses an atlas soil type ${badSoilRefs.join(',')}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(almanac.meta.lastReviewedAt), 'Almanac: lastReviewedAt is an ISO date');
  assert(almanac.meta.refreshCadence === 'MONTHLY', 'Almanac: declares MONTHLY refresh cadence');

  const nutrients = Object.keys(atlas.nutrients);
  let badAtlas = 0;
  for (const prof of Object.values<any>(atlas.states)) {
    for (const d of prof.deficiencies) if (!nutrients.includes(d.nutrient)) badAtlas++;
    for (const d of prof.dominantSoils) if (!soilTypes.includes(d.type)) badAtlas++;
    for (const d of Object.values<any>(prof.districts)) if (!soilTypes.includes(d.soil)) badAtlas++;
  }
  assert(badAtlas === 0, 'Soil atlas: all nutrient / soil references resolve');
  // Both bundled copies in the PWA must match the backend source of truth after build
  for (const f of ['crop-variety-almanac.json', 'soil-zone-atlas.json']) {
    const pwaCopy = path.join(repoRoot, 'web_simulator/data', f);
    if (fs.existsSync(pwaCopy)) {
      const same = fs.readFileSync(pwaCopy, 'utf8') === fs.readFileSync(path.join(__dirname, 'data', f), 'utf8');
      assert(same, `PWA bundled data/${f} is in sync with backend/src/data (run: npm run build at repo root)`);
    }
  }
}

console.log('\n--- 2. Monthly freshness ---');
{
  const fresh = computeFreshness('2026.11', '2026-11-28', new Date('2026-12-03T10:00:00+05:30'));
  assert(fresh.nextRefreshDueOn === '2026-12-01', 'Freshness: next refresh due on the 1st of next month');
  assert(fresh.isStale === false, 'Freshness: within 5-day grace after due date is NOT stale');
  const stale = computeFreshness('2026.11', '2026-11-28', new Date('2026-12-09T10:00:00+05:30'));
  assert(stale.isStale === true, 'Freshness: more than 5 days past due IS stale');
  const jsFresh = AreaEngine.computeFreshness('2026.11', '2026-11-28', new Date('2026-12-09T10:00:00+05:30'));
  assert(JSON.stringify(jsFresh) === JSON.stringify(stale), 'Freshness: PWA engine computes the same staleness as the API');
}

console.log('\n--- 3. Crop-fit ranking ---');
{
  assert(normaliseStateName('mp') === 'Madhya Pradesh' && normaliseStateName('म.प्र.') === 'Madhya Pradesh', 'Area: "MP"/"म.प्र." resolve to Madhya Pradesh');
  assert(findKeyInsensitive({ 'Lakhimpur Kheri': 1 }, 'lakhimpur-kheri') === 'Lakhimpur Kheri', 'Area: fuzzy district match handles India Post spellings');

  const nov = seasonsForMonth(11, almanac.seasonWindows);
  assert(nov.sowNow.includes('RABI'), 'Season: November is Rabi sowing month');
  const jun = seasonsForMonth(6, almanac.seasonWindows);
  assert(jun.sowNow.includes('KHARIF'), 'Season: June is Kharif sowing month');

  const mpNov = CropVarietyAdvisorService.recommend({ state: 'Madhya Pradesh', district: 'Dhar', month: 11, irrigation: 'IRRIGATED' }, new Date('2026-11-28'));
  assert(mpNov.soilTypeUsed === 'BLACK_COTTON' && mpNov.soilTypeSource === 'DISTRICT_ATLAS', 'Crop fit: Dhar resolves to black cotton soil from district atlas');
  const top3 = mpNov.recommendations.slice(0, 3).map(r => r.cropCode);
  assert(top3.includes('WHEAT') && top3.includes('CHICKPEA'), `Crop fit: MP in November ranks wheat & chickpea on top (got ${top3.join(',')})`);
  assert(mpNov.recommendations[0].timing === 'SOW_NOW', 'Crop fit: top recommendation is sowable this month');
  const wheat = mpNov.recommendations.find(r => r.cropCode === 'WHEAT')!;
  assert(wheat.varieties.length > 0 && wheat.varieties.every(v => v.recommendedForState), 'Crop fit: wheat varieties are MP-recommended only');

  const mpNovRainfed = CropVarietyAdvisorService.recommend({ state: 'Madhya Pradesh', district: 'Dhar', month: 11, irrigation: 'RAINFED' }, new Date('2026-11-28'));
  const wheatRainfed = mpNovRainfed.recommendations.find(r => r.cropCode === 'WHEAT')!;
  const gramRainfed = mpNovRainfed.recommendations.find(r => r.cropCode === 'CHICKPEA')!;
  assert(gramRainfed.fitScore > wheatRainfed.fitScore, 'Crop fit: rainfed farmer is steered to chickpea over wheat');

  const punjabJun = CropVarietyAdvisorService.recommend({ state: 'PB', month: 6, irrigation: 'IRRIGATED' });
  const paddy = punjabJun.recommendations.find(r => r.cropCode === 'PADDY')!;
  assert(Boolean(paddy && paddy.cautionHi), 'Crop fit: Punjab paddy carries the groundwater/long-duration caution');
  assert(paddy.varieties[0].name === 'PR 126', `Crop fit: Punjab paddy leads with water-saving PR 126 (got ${paddy.varieties[0].name})`);
  const upCane = CropVarietyAdvisorService.recommend({ state: 'Uttar Pradesh', month: 10, irrigation: 'IRRIGATED' })
    .recommendations.find(r => r.cropCode === 'SUGARCANE')!;
  assert(['Co 15023 (Karan 13)', 'CoLk 14201 (Ikshu 5)'].includes(upCane.varieties[0].name), `Crop fit: UP sugarcane leads with a red-rot-tolerant replacement for Co 0238 (got ${upCane.varieties[0].name})`);

  const unknownState = CropVarietyAdvisorService.recommend({ state: 'Kerala', month: 11 });
  assert(unknownState.area.matchedStateProfile === false && unknownState.recommendations.length > 0, 'Crop fit: unknown state falls back to safe national list');

  const rajLate = CropVarietyAdvisorService.recommend({ state: 'Rajasthan', month: 7, irrigation: 'RAINFED' });
  const bajra = rajLate.recommendations.find(r => r.cropCode === 'PEARL_MILLET')!;
  assert(bajra.fitBand === 'EXCELLENT', 'Crop fit: rainfed Rajasthan July → bajra is EXCELLENT fit');
}

console.log('\n--- 4. Soil atlas ---');
{
  const bihar = SoilAtlasService.getAreaSoilProfile({ state: 'Bihar', district: 'Samastipur', cropCode: 'MAIZE', acres: 2 });
  assert(bihar.primarySoil.type === 'CALCAREOUS_ALLUVIAL', 'Soil: Samastipur → calcareous alluvium');
  assert(['B', 'ZN'].includes(bihar.deficiencies[0].nutrient), 'Soil: Bihar maize puts boron/zinc first');
  assert(bihar.deficiencies.slice(0, 2).every(d => d.cropCritical), 'Soil: crop-critical nutrients ranked first');
  const zn = bihar.correctionPlan.find(p => p.nutrient === 'ZN')!;
  assert(zn.quantityHi.startsWith('20 kg'), `Soil: zinc dose scales to 2 acres (got "${zn.quantityHi}")`);
  assert(bihar.correctionPlan[bihar.correctionPlan.length - 1].nutrient === 'OC', 'Soil: every plan ends with organic-carbon building');

  const jh = SoilAtlasService.getAreaSoilProfile({ state: 'Jharkhand' });
  assert(jh.deficiencies[0].nutrient === 'ACIDITY' && jh.correctionPlan.some(p => p.nutrient === 'ACIDITY'), 'Soil: Jharkhand flags acidity and plans lime');

  const fallback = SoilAtlasService.getAreaSoilProfile({ state: 'Sikkim' });
  assert(fallback.area.matchedStateProfile === false && fallback.deficiencies.length > 0, 'Soil: unknown state falls back to national deficiency pattern');
}

console.log('\n--- 5. API ⇄ offline PWA engine parity ---');
{
  const now = new Date('2026-11-28T12:00:00+05:30');
  const cases = [
    { state: 'Madhya Pradesh', district: 'Dhar', month: 11, irrigation: 'IRRIGATED' },
    { state: 'Maharashtra', month: 6, irrigation: 'RAINFED' },
    { state: 'UP', district: 'Raebareli', month: 3, irrigation: 'LIMITED' },
    { state: 'Tamil Nadu', month: 9 },
    { state: 'Kerala', month: 1, irrigation: 'RAINFED' },
    { state: 'Punjab', month: 12, irrigation: 'IRRIGATED', soilType: 'SALINE_SODIC' }
  ];
  for (const q of cases) {
    const api = CropVarietyAdvisorService.recommend(q as any, now);
    const pwa = AreaEngine.recommendCrops(almanac, atlas, q, now);
    assert(JSON.stringify(api) === JSON.stringify(pwa), `Parity (crop fit): ${JSON.stringify(q)}`);
  }
  const soilCases = [
    { state: 'Bihar', district: 'Samastipur', cropCode: 'MAIZE', acres: 2 },
    { state: 'Punjab', district: 'Fazilka', cropCode: 'WHEAT', acres: 5 },
    { state: 'Odisha', cropCode: 'FINGER_MILLET' },
    { state: 'Goa' }
  ];
  for (const q of soilCases) {
    const api = SoilAtlasService.getAreaSoilProfile(q, now);
    const pwa = AreaEngine.soilProfile(atlas, q, now);
    assert(JSON.stringify(api) === JSON.stringify(pwa), `Parity (soil): ${JSON.stringify(q)}`);
  }
}

console.log('\n--- 6. On-device leaf vision engine ---');
{
  const st = LeafVision.runSelfTest();
  assert(st.healthy, `Leaf vision: self-test ${st.passed}/${st.total} synthetic leaves classified correctly`);
  st.results.filter((r: any) => !r.pass).forEach((r: any) => console.error('   ↳', r));

  // Soil background must not be mistaken for leaf-margin scorch
  const img = LeafVision.synthesizeTestLeaf('healthy');
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 220 && d[i + 1] > 220 && d[i + 2] > 215) { d[i] = 120; d[i + 1] = 88; d[i + 2] = 55; }
  const soilDx = LeafVision.diagnose(LeafVision.analyzePixels(d, img.width, img.height), {});
  assert(soilDx.code === 'HEALTHY', `Leaf vision: healthy leaf on brown soil stays HEALTHY (got ${soilDx.code})`);

  // Empty frame → honest inconclusive, never a fabricated disease
  const blank = new Uint8ClampedArray(120 * 120 * 4).fill(235);
  const blankDx = LeafVision.diagnose(LeafVision.analyzePixels(blank, 120, 120), {});
  assert(blankDx.code === 'UNCERTAIN' && blankDx.quality.issues.includes('NO_LEAF_DETECTED'), 'Leaf vision: photo without a leaf → UNCERTAIN + retake guidance');

  // Confidence is never overstated for image-only analysis
  assert(st.results.every((r: any) => r.confidence <= 0.88), 'Leaf vision: image-only confidence capped at 88%');

  // Video: median over frames tolerates one bad (blank) frame
  const rust = LeafVision.synthesizeTestLeaf('rust');
  const f1 = LeafVision.analyzePixels(rust.data, rust.width, rust.height);
  const fBlank = LeafVision.analyzePixels(blank, 120, 120);
  const agg = LeafVision.aggregateFrames([f1, f1, fBlank, f1]);
  assert(LeafVision.diagnose(agg, {}).code === 'RUST', 'Leaf vision: video aggregation ignores a leafless frame');

  // Area prior nudges endemic deficiency without overriding clear evidence
  const iv = LeafVision.synthesizeTestLeaf('interveinal');
  const ivF = LeafVision.analyzePixels(iv.data, iv.width, iv.height);
  const withPrior = LeafVision.scoreHypotheses(ivF, { areaPrior: { ZN: 'VERY_HIGH' } });
  const noPrior = LeafVision.scoreHypotheses(ivF, {});
  assert(withPrior.ZN_DEF >= noPrior.ZN_DEF, 'Leaf vision: soil-atlas prior raises endemic zinc deficiency');

  // Scale robustness: same condition must be found whether the photo is 160px or 1600px
  const kinds: Record<string, string[]> = {
    healthy: ['HEALTHY'], uniform: ['N_DEF', 'S_DEF'], interveinal: ['ZN_DEF', 'FE_DEF', 'MN_DEF', 'MG_DEF'], pale: ['FE_DEF'],
    rust: ['RUST'], leafspot: ['LEAF_SPOT'], marginal: ['K_DEF'], purple: ['P_DEF', 'MG_DEF'], powdery: ['POWDERY_MILDEW'], mosaic: ['MOSAIC_VIRUS']
  };
  const kctx: Record<string, any> = { uniform: { leafAge: 'OLD' }, pale: { leafAge: 'NEW' }, marginal: { leafAge: 'OLD' } };
  const misses: string[] = [];
  for (const size of [160, 480, 800, 1200, 1600]) {
    for (const [kind, expect] of Object.entries(kinds)) {
      const im = LeafVision.synthesizeTestLeaf(kind, size);
      const got = LeafVision.diagnose(LeafVision.analyzePixels(im.data, im.width, im.height), kctx[kind] || {}).code;
      if (!expect.includes(got)) misses.push(`${kind}@${size}→${got}`);
    }
  }
  assert(misses.length === 0, `Leaf vision: 10 conditions × 5 photo sizes all classified correctly ${misses.join(', ')}`);

  // Sensor noise / compression-like perturbation (±18 per channel) must not flip the result
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const noisyMisses: string[] = [];
  for (const [kind, expect] of Object.entries(kinds)) {
    const im = LeafVision.synthesizeTestLeaf(kind, 640);
    for (let i = 0; i < im.data.length; i += 4) for (let c = 0; c < 3; c++) im.data[i + c] = Math.max(0, Math.min(255, im.data[i + c] + Math.round((rnd() - 0.5) * 36)));
    const got = LeafVision.diagnose(LeafVision.analyzePixels(im.data, im.width, im.height), kctx[kind] || {}).code;
    if (!expect.includes(got)) noisyMisses.push(`${kind}→${got}`);
  }
  assert(noisyMisses.length === 0, `Leaf vision: robust to ±18 sensor noise ${noisyMisses.join(', ')}`);

  // Performance budget for low-end phones (pure JS, single thread)
  const big = LeafVision.synthesizeTestLeaf('leafspot', 800);
  const t0 = Date.now();
  LeafVision.diagnose(LeafVision.analyzePixels(big.data, big.width, big.height), { crop: 'TOMATO' });
  const ms = Date.now() - t0;
  assert(ms < 1500, `Leaf vision: 800px photo analysed in ${ms}ms (< 1.5s budget)`);
}

console.log(failures === 0 ? '\n🎉 ALL AREA-INTELLIGENCE & LEAF-VISION TESTS PASSED\n' : `\n💥 ${failures} TEST(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
