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

## Security & Compliance
- **Data Protection**: Full compliance with the DPDP (Digital Personal Data Protection) Act, 2023. Explicit consent capture via OTP for agronomic processing.
- **Authentication**: Strict RBAC (Role-Based Access Control) separating Farmer, Clinic, and Admin/Agronomist user models.

## License
Confidential & Proprietary. All rights reserved.
