# Roadmap / known gaps

This is a from-scratch v1 build. It's structurally complete and internally consistent —
the backend compiles, the frontend's JS/CSS/HTML/locale files all cross-check against each
other, and the smoke tests pass — but several things are stubbed, mocked, or simplified on
purpose to keep the build honest about what it is: a working skeleton, not a
field-verified product. This file tracks what's next, roughly in priority order.

## Data (see docs/DATA_SOURCES.md for the full picture)
- [ ] Agronomist review of every crop entry against current ICAR POP documents
- [ ] Wire a live/refreshed CIB&RC feed before any chemical brand/dose is ever shown
- [ ] Add `name_hi` (and ideally names in the other 9 languages) to disease entries —
      currently only pests and nutrient deficiencies have localized names
- [ ] Native-speaker review of all 11 `web_app/locales/*.json` files
- [ ] Expand `locations-india.json` from state-level to district-level (LGD codes), so
      recommendations can get more locally specific than "dominant soils per state"

## Backend
- [ ] Real SMS gateway integration. `backend/src/services/smsProvider.ts` defines a clean
      `SmsProvider` interface with a `MockSmsProvider` (logs the OTP to the server console)
      as the only implementation. Swapping in MSG91, Twilio, AWS SNS, Gupshup, or Karix
      means implementing that interface and pointing `SMS_PROVIDER` at it — no other code
      should need to change.
- [ ] `npm install` has never actually been run in this build environment (no network
      egress here) — the TypeScript was only checked file-by-file with a bare `tsc`
      invocation, which is why a raw type-check throws Node/Express "cannot find module"
      noise. `package.json` already lists the right dependencies and `@types/*` packages;
      a real `npm install` followed by `npm run build` should be the actual first
      verification step in any real environment.
- [ ] Rate limiting is in-memory (`express-rate-limit` defaults) — fine for a single
      instance, not for a multi-instance deployment behind a load balancer without a
      shared store (Redis, etc).
- [ ] No automated retry/backoff or delivery-status tracking on the SMS provider interface
      yet — worth adding once a real provider is wired in.
- [ ] Diagnosis photo path (`claudeVision.ts`) is fully optional and gracefully absent
      without `ANTHROPIC_API_KEY` — the checklist path works standalone. If enabling
      photo diagnosis in production, decide on image retention/deletion policy (DPDP-relevant).

## Frontend / PWA
- [ ] True app-store distribution: the PWA installs via "Add to Home Screen" on both
      Android and iOS today, but wrapping it with Capacitor or a TWA (Trusted Web
      Activity) is the next step if Play Store / App Store listing is wanted.
- [ ] Offline support currently caches the app *shell* (HTML/CSS/JS/locales/icons via
      `service-worker.js`) and the *last-fetched* reference data + diagnosis history
      (via `localStorage`, see `app.js`'s `loadReferenceDataWithFallback` and the
      `ksh_ref_cache` / `ksh_history_cache` / `ksh_last_result` keys). A farmer who has
      never been online can't run a first diagnosis — the knowledge base isn't bundled
      into the service worker precache. Worth a deliberate decision: bundle a compressed
      copy of `knowledge-base.json` into the app shell for true first-run offline use,
      once the data itself is verified (see DATA_SOURCES.md) and worth shipping baked-in.
- [ ] No image compression/resizing before the photo-diagnosis upload — large phone
      camera photos will be sent as-is (base64), which is slow on poor rural connectivity.
      Client-side downscaling before upload is a clear win.
- [ ] `web_app/js/app.js`'s screen-navigation is a hand-rolled show/hide state machine.
      Fine at this size; if the screen count grows meaningfully, consider a proper router.
- [ ] Accessibility pass: focus management between screens, ARIA live regions for the
      OTP/error states, and screen-reader testing in at least Hindi and one RTL (Urdu)
      context haven't been done.

## Testing
- [ ] `backend/src/testRunner.ts` covers the auth/session/diagnosis-engine core with
      dependency-free smoke tests (`npm test` after `npm run build`). There's no
      integration test hitting the actual Express routes end-to-end, and no frontend
      test suite at all yet.

## Nice-to-haves, not blockers
- [ ] Clinic/Admin role screens (the DB schema and `requireRole` middleware already
      support `farmer` / `clinic` / `admin`, but only the farmer-facing flow has UI)
- [ ] Push notifications for seasonal pest alerts by state/crop
- [ ] A `PATCH`-style profile screen to edit district (not just state) after onboarding
