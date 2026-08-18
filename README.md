# Krishi Swasthya Sahayak (AgriScan AI)

A bilingual-to-11-language plant health diagnosis and advisory PWA for Indian farmers —
mobile+OTP login, crop/symptom or photo-based diagnosis, a Nutrition-First (mineral →
biological → chemical-class-only) recommendation hierarchy, and a Plant Health Index shown
as a Leaf Colour Chart strip, the real paper tool Indian agronomists use to read rice
nitrogen status.

**Read `docs/DATA_SOURCES.md` before treating any output as verified agricultural
advice.** Short version: this is a structurally complete v1 build with a seed knowledge
base written from general agronomic knowledge, not from ingested ICAR textbooks or a live
CIB&RC feed. It's built so that gap is safe by construction — chemical guidance never goes
past active-ingredient-class level — but it still needs an agronomist's sign-off before
reaching a real farmer.

## Architecture

One installable Progressive Web App serves as both the web experience and the "mobile
app" (via Add to Home Screen on Android and iOS) — there's no separate Flutter codebase to
keep in sync with the web build.

```
backend/            Node + Express + TypeScript API, SQLite (WAL mode)
  src/data/            knowledge-base.json (15 crops), languages.json, locations-india.json
  src/auth/            OTP issuance/verification, 45-day JWT sessions, RBAC middleware
  src/services/        SMS provider interface (mocked), diagnosis engine, optional Claude vision
  src/routes/          /auth, /reference, /diagnosis
  src/testRunner.ts    dependency-free smoke tests

web_app/             The PWA (vanilla HTML/CSS/JS — no build step required)
  index.html           all screens in one shell
  css/style.css        design tokens + full component library
  js/                  i18n.js, api.js, app.js
  locales/             en, hi, bn, mr, te, ta, gu, ur (RTL), kn, or, ml
  manifest.json, service-worker.js, icons/

docs/                DATA_SOURCES.md, ROADMAP.md
scripts/             gen_icons.py — regenerates web_app/icons/ from scratch
```

## Running it

### Backend
```bash
cd backend
npm install
cp .env.example .env      # defaults work out of the box (mock SMS provider, SQLite file)
npm run build
npm test                  # smoke tests — auth, sessions, diagnosis engine
npm run dev                # ts-node-dev, or `npm start` after `npm run build`
```
The mock SMS provider logs OTPs to the server console instead of sending a real SMS —
see `docs/ROADMAP.md` for wiring in a real gateway (MSG91, Twilio, AWS SNS, Gupshup, Karix).

### Frontend
The PWA is static files — serve `web_app/` with any static file server, e.g.:
```bash
cd web_app
python3 -m http.server 8080
```
Then open `http://localhost:8080`. By default it talks to the backend at
`http://localhost:4000`; override by setting `window.KSH_API_BASE` before `js/app.js`
loads (e.g. in a small inline `<script>` in `index.html`) if you're pointing at a deployed
API origin instead of local dev.

To actually install it as an app: open the served URL on a phone, then "Add to Home
Screen" (Android Chrome) or Share → "Add to Home Screen" (iOS Safari).

## What's genuinely solid here
- Backend type-checks cleanly (module-resolution noise aside — see `docs/ROADMAP.md`) and
  passes its smoke test suite, including a real 45-day session-expiry check.
- All 15 crop entries and all 11 locale files are structurally validated — every locale
  has the identical 59-key set, every JSON file parses.
- Chemical-safety design isn't a bolt-on disclaimer: the diagnosis engine's type system
  only ever returns `chemical_class_generic` strings, and the frontend always renders the
  caution banner next to them.

## What still needs real-world hardening
See `docs/ROADMAP.md` for the full list — SMS gateway integration, agronomist data
verification, native-speaker translation review, offline-first knowledge-base bundling,
and app-store packaging (Capacitor/TWA) are the main open items.
