#!/usr/bin/env node
// ============================================================================
// MONTHLY AREA-INTELLIGENCE REFRESH  (run by .github/workflows/monthly-crop-data-refresh.yml
// at 06:00 IST on the 1st of every month, or manually)
//
//   node scripts/refresh_crop_variety_almanac.mjs [--date=YYYY-MM-DD] [--dry-run]
//
// What it does each month:
//   1. Agronomist-curated updates (optional, env ALMANAC_OVERRIDES_URL → JSON):
//        varietyUpserts        newly notified / released public-sector varieties
//        varietyRetirements    de-notified or disease-broken varieties (e.g. red-rot-hit cane)
//        suitabilityUpserts    state × season crop-fit changes (new advisories, contingency plans)
//        soilDeficiencyUpserts new Soil Health Card / ICAR-IISS survey figures
//   2. Live mandi price signal per state × crop (optional, env DATA_GOV_IN_API_KEY):
//        data.gov.in "Current daily price of various commodities from various markets"
//   3. Re-stamps lastReviewedAt / version (YYYY.MM) on both datasets
//   4. Validates referential integrity — refuses to write a broken dataset
//   5. Appends a changelog entry (last 12 months kept) to the almanac meta
//
// Without either env var it still re-stamps + validates, so the app's freshness
// badge stays honest ("reviewed this month") and the CI test gate re-runs.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALMANAC = path.join(root, 'backend/src/data/crop-variety-almanac.json');
const ATLAS = path.join(root, 'backend/src/data/soil-zone-atlas.json');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const DRY_RUN = Boolean(args['dry-run']);

function istToday() {
  const now = new Date();
  const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
  return ist.toISOString().slice(0, 10);
}
const reviewDate = typeof args.date === 'string' ? args.date : istToday();
if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) throw new Error(`Invalid --date ${reviewDate}`);
const version = reviewDate.slice(0, 7).replace('-', '.');

const almanac = JSON.parse(fs.readFileSync(ALMANAC, 'utf8'));
const atlas = JSON.parse(fs.readFileSync(ATLAS, 'utf8'));
const summary = { varietiesAdded: 0, varietiesUpdated: 0, varietiesRetired: 0, suitabilityChanged: 0, soilDeficienciesChanged: 0, marketSignals: 0, notes: [] };

async function fetchJson(url, ms = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'krishi-sahayak-data-refresh' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------- 1. curated overrides
function applyOverrides(o) {
  for (const u of o.varietyUpserts || []) {
    const crop = almanac.crops[u.crop];
    if (!crop || !u.variety || !u.variety.name) { summary.notes.push(`skip variety upsert: ${JSON.stringify(u).slice(0, 80)}`); continue; }
    const required = ['releasedBy', 'durationDays', 'yieldQtlPerAcre', 'traits', 'states', 'noteHi'];
    const missing = required.filter((k) => u.variety[k] === undefined);
    const idx = crop.varieties.findIndex((v) => v.name === u.variety.name);
    if (idx >= 0) {
      crop.varieties[idx] = { ...crop.varieties[idx], ...u.variety };
      summary.varietiesUpdated++;
    } else if (missing.length) {
      summary.notes.push(`skip new variety ${u.variety.name}: missing ${missing.join(',')}`);
    } else {
      crop.varieties.push(u.variety);
      summary.varietiesAdded++;
    }
  }
  for (const r of o.varietyRetirements || []) {
    const crop = almanac.crops[r.crop];
    if (!crop) continue;
    const before = crop.varieties.length;
    crop.varieties = crop.varieties.filter((v) => v.name !== r.name);
    if (crop.varieties.length < before) {
      summary.varietiesRetired++;
      almanac.meta.retiredVarieties = [
        { crop: r.crop, name: r.name, reasonHi: r.reasonHi || '', retiredOn: reviewDate },
        ...(almanac.meta.retiredVarieties || [])
      ].slice(0, 50);
    }
  }
  for (const s of o.suitabilityUpserts || []) {
    const prof = almanac.stateSuitability[s.state];
    if (!prof || !s.season || !s.entry || !almanac.crops[s.entry.crop]) { summary.notes.push(`skip suitability: ${JSON.stringify(s).slice(0, 80)}`); continue; }
    prof.seasons[s.season] = prof.seasons[s.season] || [];
    const list = prof.seasons[s.season];
    const idx = list.findIndex((e) => e.crop === s.entry.crop);
    if (s.remove) { if (idx >= 0) { list.splice(idx, 1); summary.suitabilityChanged++; } continue; }
    if (idx >= 0) list[idx] = { ...list[idx], ...s.entry }; else list.push(s.entry);
    summary.suitabilityChanged++;
  }
  for (const d of o.soilDeficiencyUpserts || []) {
    const prof = atlas.states[d.state];
    if (!prof || !d.deficiency || !atlas.nutrients[d.deficiency.nutrient]) { summary.notes.push(`skip soil: ${JSON.stringify(d).slice(0, 80)}`); continue; }
    const idx = prof.deficiencies.findIndex((x) => x.nutrient === d.deficiency.nutrient);
    if (idx >= 0) prof.deficiencies[idx] = { ...prof.deficiencies[idx], ...d.deficiency }; else prof.deficiencies.push(d.deficiency);
    summary.soilDeficienciesChanged++;
  }
  if (o.notesHi) summary.notes.push(String(o.notesHi).slice(0, 300));
}

// ---------------------------------------------------------------------------- 2. mandi price signal
// Agmarknet commodity names as published on data.gov.in (exact-match filter)
const AGMARK_COMMODITY = {
  SOYBEAN: 'Soyabean', WHEAT: 'Wheat', PADDY: 'Paddy(Dhan)(Common)', COTTON: 'Cotton', CHICKPEA: 'Bengal Gram(Gram)(Whole)',
  MUSTARD: 'Mustard', MAIZE: 'Maize', PIGEONPEA: 'Arhar (Tur/Red Gram)(Whole)', GROUNDNUT: 'Groundnut', POTATO: 'Potato',
  ONION: 'Onion', PEARL_MILLET: 'Bajra(Pearl Millet/Cumbu)', FINGER_MILLET: 'Ragi (Finger Millet)', GREENGRAM: 'Green Gram (Moong)(Whole)',
  TOMATO: 'Tomato', CHILLI: 'Dry Chillies', BANANA: 'Banana'
};
const MANDI_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';

function median(xs) {
  const a = xs.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function refreshMarketSignals(apiKey) {
  const byState = {};
  const states = Object.keys(almanac.stateSuitability);
  for (const [cropCode, commodity] of Object.entries(AGMARK_COMMODITY)) {
    const url = `https://api.data.gov.in/resource/${MANDI_RESOURCE}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=3000&filters[commodity]=${encodeURIComponent(commodity)}`;
    let records = [];
    try {
      const data = await fetchJson(url);
      records = Array.isArray(data.records) ? data.records : [];
    } catch (e) {
      summary.notes.push(`mandi ${cropCode}: ${e.message}`);
      continue;
    }
    const grouped = {};
    for (const r of records) {
      const state = states.find((s) => s.toLowerCase() === String(r.state || '').trim().toLowerCase());
      const modal = Number(r.modal_price);
      if (!state || !Number.isFinite(modal) || modal <= 0) continue;
      (grouped[state] = grouped[state] || { prices: [], markets: new Set(), latest: '' }).prices.push(modal);
      grouped[state].markets.add(r.market);
      if (String(r.arrival_date || '') > grouped[state].latest) grouped[state].latest = String(r.arrival_date || '');
    }
    for (const [state, g] of Object.entries(grouped)) {
      byState[state] = byState[state] || {};
      byState[state][cropCode] = { modalInrPerQtl: median(g.prices), marketsReporting: g.markets.size, latestArrivalDate: g.latest };
      summary.marketSignals++;
    }
  }
  if (summary.marketSignals > 0) {
    almanac.marketSignals = { asOf: reviewDate, source: 'data.gov.in / Agmarknet daily mandi prices (median modal price across reporting markets)', byState };
  }
}

// ---------------------------------------------------------------------------- 4. integrity
function validate() {
  const errors = [];
  const cropCodes = Object.keys(almanac.crops);
  const soilTypes = Object.keys(atlas.soilTypes);
  const nutrients = Object.keys(atlas.nutrients);
  for (const [code, crop] of Object.entries(almanac.crops)) {
    if (!crop.varieties || crop.varieties.length < 2) errors.push(`${code}: fewer than 2 varieties`);
    for (const s of crop.soilFit || []) if (!soilTypes.includes(s)) errors.push(`${code}: unknown soil ${s}`);
    for (const v of crop.varieties || []) if (!v.name || !Array.isArray(v.states)) errors.push(`${code}: malformed variety`);
  }
  for (const [state, prof] of Object.entries(almanac.stateSuitability)) {
    for (const [season, list] of Object.entries(prof.seasons)) {
      if (!almanac.seasonWindows[season]) errors.push(`${state}: unknown season ${season}`);
      for (const e of list) {
        if (!cropCodes.includes(e.crop)) errors.push(`${state}/${season}: unknown crop ${e.crop}`);
        if (!(e.fitScore >= 0 && e.fitScore <= 100)) errors.push(`${state}/${season}/${e.crop}: fitScore out of range`);
      }
    }
  }
  for (const [state, prof] of Object.entries(atlas.states)) {
    for (const d of prof.deficiencies) if (!nutrients.includes(d.nutrient)) errors.push(`atlas ${state}: unknown nutrient ${d.nutrient}`);
    for (const d of prof.dominantSoils) if (!soilTypes.includes(d.type)) errors.push(`atlas ${state}: unknown soil ${d.type}`);
    for (const [dist, d] of Object.entries(prof.districts)) if (!soilTypes.includes(d.soil)) errors.push(`atlas ${state}/${dist}: unknown soil ${d.soil}`);
  }
  return errors;
}

// ---------------------------------------------------------------------------- main
(async () => {
  if (process.env.ALMANAC_OVERRIDES_URL) {
    try {
      applyOverrides(await fetchJson(process.env.ALMANAC_OVERRIDES_URL));
    } catch (e) {
      summary.notes.push(`overrides feed unavailable: ${e.message}`);
    }
  } else {
    summary.notes.push('no ALMANAC_OVERRIDES_URL configured — curated updates skipped');
  }

  if (process.env.DATA_GOV_IN_API_KEY) {
    await refreshMarketSignals(process.env.DATA_GOV_IN_API_KEY);
  } else {
    summary.notes.push('no DATA_GOV_IN_API_KEY configured — mandi price signals skipped');
  }

  almanac.meta.lastReviewedAt = reviewDate;
  almanac.meta.almanacVersion = version;
  atlas.meta.lastReviewedAt = reviewDate;
  atlas.meta.atlasVersion = version;
  almanac.meta.changelog = [{ version, reviewedAt: reviewDate, ...summary }, ...(almanac.meta.changelog || []).filter((c) => c.version !== version)].slice(0, 12);

  const errors = validate();
  if (errors.length) {
    console.error('❌ Refusing to write invalid datasets:\n  ' + errors.join('\n  '));
    process.exit(1);
  }

  console.log(`Monthly refresh ${version} (${reviewDate})`, JSON.stringify(summary, null, 2));
  if (DRY_RUN) {
    console.log('Dry run — nothing written.');
    return;
  }
  fs.writeFileSync(ALMANAC, JSON.stringify(almanac, null, 2) + '\n');
  fs.writeFileSync(ATLAS, JSON.stringify(atlas, null, 2) + '\n');
  console.log('✓ Wrote backend/src/data/crop-variety-almanac.json & soil-zone-atlas.json — run `npm run build` to publish to the PWA.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
