# Krishi Swasthya Sahayak (AgriScan AI)

Krishi Seva is an intelligent, bilingual (English & Hindi) agricultural diagnostic platform that utilizes multimodal AI to deliver plant health reports, botanical crop classification, and location-aware nutrient deficiency solutions for farmers.

## Core Capabilities

- **Botanical Organ & Crop Morphology Classifier**: 
  - Classifies plant anatomical parts (`LEAF`, `STEM`, `FRUIT`, `ROOT`, `FLOWER`).
  - Identifies crop species through advanced leaf venation and morphology pattern matching (e.g., *Musa acuminata* penni-parallel paddle-blades, *Glycine max* trifoliate reticulate structures).
- **Multi-Frame Video Stream Analysis**: 
  - Extracts keyframes from video streams.
  - Applies Laplacian variance for motion blur filtering and temporal stability index scoring.
- **AI Plant Health Report & Deficiency Engine**: 
  - Computes a visual Plant Health Index (0–100).
  - Quantifies chlorosis and necrosis surface areas.
  - Formulates location- and soil-specific remedies (e.g., dynamically recommending chelated Zn-EDTA in alkaline Black Cotton soils).
  - Includes real-time acreage-scaled dosage generation for precision agriculture.
- **CIB&RC Compliant Prescriptions**:
  - Implements a strict Nutrition-First Hierarchy: (1) Mineral Foliar Correction, (2) Bio-Remediation, and (3) Chemical Intervention.
  - Verifies chemicals against real-time State-level bans and CIB&RC regulations.

## Repository Structure

- `/backend`: The core Node.js backend integrating with the ML inference layer, DPDP compliant auth, SQLite WAL embedded database, and the Location-Aware Deficiency Engine.
- `/mobile_app`: A cross-platform Flutter mobile client featuring a Guided Camera interface, localized TTS (Text-to-Speech) readouts for prescriptions, and offline-first PWA caching capabilities.
- `/web_simulator`: An interactive web simulator simulating the diagnostic pipelines and multi-stage physiological rendering.
- `/contracts`: Core protocol configurations and smart integration schemas.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite (WAL mode)
- **Frontend / Mobile**: Flutter, Dart, AppLocalizations
- **Web App**: Vanilla HTML/JS with Progressive Web App (PWA) support via Service Workers
- **AI / ML**: Multi-stage morphological matching & spectral signal classification, OCR

## Quick Start

### Backend Server
```bash
cd backend
npm install
npm run build
npm start
```
*Run tests:* `npm run test` or `node dist/testRunner.js`

### Web Simulator (PWA)
Launch a local server at the root directory:
```bash
npx serve .
```
Navigate to `/web_simulator/index.html` to access the interactive web interface.

### Mobile App (Flutter)
```bash
cd mobile_app
flutter pub get
flutter run
```

## Indian Farmer Super-App Ecosystem Modules (v2026)

See the complete market study and state-wise analysis in [`docs/INDIAN_AGRITECH_MARKET_STUDY_AND_STATE_MATRIX.md`](docs/INDIAN_AGRITECH_MARKET_STUDY_AND_STATE_MATRIX.md).

1. **Live e-NAM / APMC Mandi Bhav & Net Realization Calculator (`GET /v1/market/mandi-prices`)**:
   - Real-time spot modal, min, and max prices across major Indian APMCs benchmarked against **MSP 2026–27** (Soybean ₹4,892/qtl, Paddy ₹2,320/qtl, Wheat ₹2,425/qtl, Cotton ₹7,521/qtl, Maize ₹2,225/qtl).
   - **AI Sell/Hold Signal** + net realization calculator after deducting tractor-trolley transport (`₹18/km`) and mandi *hamali*/weighing charges.
2. **Hyperlocal IMD Weather & Hourly Spray Suitability Window (`GET /v1/weather/spray-advisory`)**:
   - Computes an hourly **Spray Suitability Score (0–100)** from wind drift (`<12 km/h`), 6-hour rain washout risk, stomatal opening temperature, and relative humidity.
3. **5-Stage Scientific Crop Calendar & Soil-Linked NPK Bag Calculator (`GET /v1/advisory/crop-calendar`)**:
   - Converts Soil Health Card readings (`N, P, K, Zn, pH`) and acreage into exact commercial bags (**DAP 50kg**, **Neem-Coated Urea 45kg**, **MOP 50kg**, and **Zinc Sulphate 21% + ZSB Bio-Fertilizer**).
4. **Sarkari Yojana, KCC 4% Credit & PMFBY 72-Hour Claim Intimation (`GET /v1/schemes/eligibility`, `POST /v1/schemes/claim`)**:
   - Instant eligibility & one-click filing for **PM-KISAN** (`₹6,000/yr`), **KCC 4% Interest Subvention Loan Limit**, **PM-KUSUM 60% Solar Pump Subsidy**, and **PMFBY 72-Hour Crop Damage Claim** linked directly to the farmer's AI Diagnosis ID.
5. **Voice "Kisan e-Mitra" AI & 15km Community Outbreak Radar (`POST /v1/assistant/ask`, `GET /v1/community/outbreaks`)**:
   - Bilingual (Hindi/English) voice and text assistant + KVK-verified 15km regional pest and disease outbreak alerts.
6. **State-Wise Agro-Climatic Challenge & CHC/Drone Tech Intervention Hub (`GET /v1/states/challenges`, `POST /v1/states/tech-intervention-book`)**:
   - Addresses state-specific bottlenecks across **8 major Indian state clusters** (Madhya Pradesh, Punjab & Haryana, Maharashtra, UP & Bihar, AP/Telangana/Karnataka, Gujarat & Rajasthan, West Bengal/Odisha/Assam, Kerala & Himachal Pradesh) with 1-click booking for **Kisan Drone sprays, Happy Seeders, Pusa Bio-Decomposer, BBF Planters, and Bio-IPM kits** backed by 18 SQLite tables in WAL mode.

## Security & Compliance
- **Data Protection**: Full compliance with the DPDP (Digital Personal Data Protection) Act, 2023. Explicit consent capture via OTP for agronomic processing.
- **Authentication**: Strict RBAC (Role-Based Access Control) separating Farmer, Clinic, and Admin/Agronomist user models.

## License
Confidential & Proprietary. All rights reserved.

