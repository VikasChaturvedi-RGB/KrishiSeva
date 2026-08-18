# Data sources — what's real, what's seed data, and what needs verification

This is the single most important document in the repo. Please read it before this
knowledge base reaches a real farmer's screen.

## What the knowledge base actually is

`backend/src/data/knowledge-base.json` was written from general, well-established
agronomic knowledge about 15 major Indian crops — the kind of information found across
standard entomology, plant pathology, and soil science references. **It was not compiled
by ingesting ICAR Package-of-Practices documents, CIB&RC's live registered-product
database, or any State Agriculture Department's current advisory.** No model has read
those source documents in this project. Anyone who tells you otherwise about an AI-built
knowledge base should be treated with suspicion — this note exists so nobody has to take
that on faith here.

Concretely, that means:

- Pest, disease, and deficiency identifications (which symptoms map to which cause) are
  drawn from generally reliable, textbook-level agronomy and should be broadly directionally
  correct, but have **not** been checked against a current ICAR source line by line.
- **Every chemical-control field is deliberately vague** — it names an active-ingredient
  *class* ("a selective hopper-specific insecticide class... registered for BPH in rice"),
  never a brand name, formulation, or dose. This is not an oversight to fix later; it's a
  permanent policy (see below) unless a proper verified-data pipeline replaces it.
- Regional/soil associations (e.g. which states, which soil types) are reasonable but
  approximate, not sourced from a district-level soil survey.
- Disease entries currently have no `name_hi` (Hindi common name) field — pest and
  nutrient-deficiency entries do. The UI falls back to the English name gracefully, but
  this is a real content gap, not an intentional design choice.

## Why chemical entries are class-only, permanently, until this changes

Pesticide legality in India is **not static and not uniform**. A product can be:
- Registered under the Insecticides Act, 1968 nationally but restricted or banned in
  specific states
- Withdrawn or have its registration modified by CIB&RC after this was written
- Legal for one crop and not another
- Subject to a different dose depending on formulation, spray volume, and local advisory

Publishing a specific product name or dose in an app used by real farmers, without a live
feed to CIB&RC's actual master list, risks real crop loss, health harm, or farmers using
something that's since been withdrawn. The app is built so this is structurally hard to
get wrong: `diagnosisEngine.ts` only ever surfaces `chemical_class_generic` strings that
already read as "verify before use," and the frontend renders a `chemical_caution` banner
next to every result (see `web_app/locales/*.json`). **Do not add specific product names or
doses to this dataset without first wiring a live, authoritative feed** — see below.

## Making this production-grade: the actual steps

1. **ICAR Package of Practices (POP)** — Each state agricultural university (SAU) publishes
   crop-wise POP documents (often via ICAR / state agriculture department portals). These
   are the right source for verified cultural practices, resistant varieties, and
   nutrient-correction rates. A subject-matter agronomist should cross-check every entry in
   `knowledge-base.json` against the relevant state's current POP.
2. **CIB&RC master list** — The Central Insecticides Board & Registration Committee
   publishes the authoritative list of registered pesticides, by crop and pest, updated
   periodically. This is the *only* acceptable source before any brand/dose ever appears
   in the app, and even then it should be fetched live (or refreshed on a defined cadence)
   rather than hardcoded, since registrations change.
3. **State Agriculture Department advisories** — Many states publish their own seasonal
   pest/disease advisories (often more current and locally specific than national sources).
   Worth wiring in per-state once the core pipeline exists.
4. **KVK (Krishi Vigyan Kendra) network** — District-level KVKs are the practical ground
   truth for "what's actually being recommended right now, here." A future version could
   surface the farmer's nearest KVK contact directly (the Kisan Call Centre number
   1800-180-1551 is already surfaced in the UI as a fallback).
5. **mKisan / Kisan Call Centre** — Existing government channels this app should
   complement, not duplicate or contradict.

## Translations

All 11 locale files (`web_app/locales/*.json`) were machine-drafted for this project, not
reviewed by native speakers. Given that they include the DPDP consent text and the
chemical-safety caution banner — both high-stakes for accuracy — **a native-speaker
agronomist or extension worker in each language should review every string before this
goes anywhere near production**, not just for fluency but for correct agricultural
terminology (a mistranslated symptom name is worse than no translation).

## Before this touches a real farmer's field

Do not deploy this as farmer-facing advice without:
- An agronomist sign-off on every crop entry in `knowledge-base.json`
- A live or regularly-refreshed CIB&RC-backed chemical-recommendation layer before any
  product/dose specificity is added
- Native-speaker review of all 11 locale files
- Legal/DPDP review of the consent flow text specifically (`consent_text` key)
