# कृषि सहायक (Krishi Sahayak) — 100% Free B2C Farmer Guidance App

**Pure Guidance • Zero Selling • 22 Indian Languages & Dialects • Google Cloud Always-Free First**

Krishi Sahayak is a direct-to-farmer (**B2C**) Progressive Web App (**PWA**) and **Android App** built to guide Indian smallholder farmers with unbiased scientific and traditional agricultural knowledge—without selling seeds, fertilizers, pesticides, or credit.

---

## Core B2C Farmer Pillars

1. **Zero-Selling Unbiased Crop & Nutrient Doctor**:
   - Multimodal leaf photo/video diagnosis prioritizing **(1) DIY On-Farm Bio-Remedies** (*Neemastra, Jeevamrut, Beejamrut, Trichoderma*), **(2) Balanced Generic Nutrients** measured per **15-Litre Knapsack Sprayer Pump** (`प्रति 15L पंप`) and **Acre / Bigha / Hectare**, and **(3) CIB&RC Safety & State-Ban Warnings**.
2. **Self-Reliant Farming & Input Purity Protection**:
   - **2-Minute Home Adulteration Tests** (FAI/ICAR methods) to spot fake DAP, Zinc Sulphate, Urea, MOP, and low-germination seeds + **Statutory Govt MRP Shield** (Urea ₹266.50/45kg, DAP ₹1,350/50kg).
   - **Climate Shock 24-Hour Rescue Plans** (Waterlogging, Heatwave, Frost/*Pala*, Mid-Monsoon Dry Spell).
   - **Private Season Expense & Savings Self-Diary** + **100% Free Govt Helplines** (`1800-180-1551` Kisan Call Centre in 22 languages, `14447` PMFBY, ICAR-KVKs).
3. **Language Is Never a Constraint (22 Indian Languages + Voice-First UX)**:
   - Supports **Hindi, English, Marathi, Punjabi, Gujarati, Bengali, Telugu, Tamil, Kannada, Malayalam, Odia, Assamese, Urdu (RTL), Bhojpuri, Maithili, Chhattisgarhi, Rajasthani/Marwari, Haryanvi, Konkani, Nepali, Dogri, and Santali**.
   - **4-Tier Zero-Cost Translation**: Curated native packs -> **Google ML Kit On-Device Translation** (Android) / **Chrome W3C On-Device `Translator` API** -> **Cloud Run Gemini Flash / Cloud Translation Free Tier** with local caching.
   - **"Bolo aur Suno" Accessibility**: Audio preview in the language picker, **🔊 Listen** buttons on every card, **🎙️ Floating Voice Companion**, and `अ+` sunlight font scaling.
4. **B2C Consumer Polish**:
   - 15-second zero-OTP first-launch crop/state personalization, **1-tap WhatsApp / Native Share**, **Firebase Cloud Messaging (FCM)** free weather/mandi/outbreak alerts, and **DPDP Act 2023** 1-tap data export & delete.

---

## Google Cloud Always-Free Architecture (`$0/month`)

| Layer | Google Service | Always-Free Tier Used |
| :--- | :--- | :--- |
| **PWA CDN & SSL** | **Firebase Hosting** (`firebase.json`) | Spark Plan: 10 GB storage, 10 GB/mo transfer |
| **Serverless API** | **Google Cloud Run** (`Dockerfile`, `cloudbuild.yaml`) | `us-central1`, `min-instances=0`: 2M req/mo free |
| **NoSQL Sync DB** | **Cloud Firestore** (`firestore.rules`) | 1 GiB storage, 50k reads/day, 20k writes/day (guarded at 45k/18k) |
| **AI Vision & Q&A** | **Google AI Studio — Gemini 2.5 Flash** | Free Tier + deterministic ICAR/CIB&RC offline fallback |
| **Push, Auth & Stability** | **FCM, Firebase Anonymous/Google Auth, Analytics & Crashlytics** | 100% Always Free (Unlimited FCM, 50k MAU Auth) |
| **Android App (`android_app/`)** | **Kotlin + Jetpack Compose + ML Kit Translate & Vision + TWA** | 100% On-Device & Free |

---

## Quick Start Commands

### 1. Build PWA & Bundle Offline Assets into Android
```bash
npm run build
```

### 2. Run Locally
```bash
python3 -m http.server 3000 --directory web_app
# Or start full Cloud Run API + PWA locally:
cd backend && npm install && npm run dev
```

### 3. Deploy to Google Cloud Run + Firebase Hosting (Always Free)
```bash
chmod +x scripts/deploy_google_free.sh
GEMINI_API_KEY="your_free_ai_studio_key" ./scripts/deploy_google_free.sh your-gcp-project-id
```

### 4. Build Android App (`android_app/`)
- **Android Studio**: Open `android_app/` and click **Run** (bundles offline PWA + ML Kit On-Device Translation + Native TTS + FCM).
- **Pure Play Store TWA**: `cd android_app && npx @bubblewrap/cli build` using `twa-manifest.json`.
