# Free Domains, Google Analytics (GA4) & One-Time Google Cloud India Link Guide

Everything in this repository is pre-configured for **₹0/month Always-Free** operation in **`asia-south1` (Mumbai, India)** using project ID **`krishi-sahayak-india-free`**.

---

## 1. Your Free Forever Domains (Zero Annual Fees)

Because old free TLD providers like Freenom (`.tk` / `.ml`) shut down permanently and often got blocked on WhatsApp, **Krishi Sahayak** is set up with **trusted, SSL-secured free-forever domains** that never get flagged when farmers share cards on WhatsApp:

1. **Google's Official Free `.web.app` & `.firebaseapp.com` Domains (Recommended Primary B2C Domain)**:
   - **`https://krishi-sahayak-india-free.web.app`** (and `https://krishi-sahayak-india-free.firebaseapp.com`)
   - **Cost**: ₹0 forever on Firebase Spark Plan, automatic Google SSL certificate, global CDN, and pre-trusted for **Android Trusted Web Activity (TWA)** App Links.
   - *Tip*: Inside Firebase Hosting, you can also add extra short free `.web.app` site names (e.g. `krishi-sahayak-in.web.app`) under **Hosting -> Add another site**.
2. **Instant GitHub Pages Free Domain**:
   - **`https://vikaschaturvedi-rgb.github.io/KisanSwasthyaSahayak/`** (auto-deployed via `.github/workflows/deploy-free-github-pages.yml` once `Settings -> Pages -> Source: GitHub Actions` is enabled on GitHub).
3. **Optional Free Custom Domain (`krishisahayak.eu.org` / `krishisahayak.js.org`)**:
   - If you want a non-platform root domain at ₹0 forever, request **`krishisahayak.eu.org`** at [nic.eu.org](https://nic.eu.org), then in **Firebase Console -> Hosting -> Add custom domain**, paste `krishisahayak.eu.org` and copy the 2 `A` / `TXT` records into `nic.eu.org`—Firebase provisions free SSL automatically.

---

## 2. One-Time 3-Minute Link Between GitHub & Your Google Account

*(Google requires every project owner to accept Google Cloud's Terms of Service once in their own browser; nobody else can legally create an account under your Google identity.)*

1. Open **[console.firebase.google.com](https://console.firebase.google.com)** with your Gmail/Google account $\rightarrow$ Click **Create a Firebase project** $\rightarrow$ Enter **`krishi-sahayak-india-free`** $\rightarrow$ Enable **Google Analytics** when prompted (100% Free — copy the `G-XXXXXXXXXX` Measurement ID if shown).
2. Open **Project Settings (⚙️) $\rightarrow$ Service accounts $\rightarrow$ Manage service account permissions** (opens Google Cloud Console) $\rightarrow$ Create a Service Account (with roles: `Cloud Run Admin`, `Firebase Hosting Admin`, `Cloud Datastore Owner`, `Service Account User`, `Cloud Build Editor`) $\rightarrow$ **Keys $\rightarrow$ Add Key $\rightarrow$ JSON**.
3. In your GitHub repo (`github.com/VikasChaturvedi-RGB/KisanSwasthyaSahayak` $\rightarrow$ **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions $\rightarrow$ New repository secret**), add:
   - **`GCP_SA_KEY`**: Paste the downloaded JSON file contents.
   - **`GA4_MEASUREMENT_ID`** *(optional)*: Paste your `G-XXXXXXXXXX` Google Analytics 4 ID (auto-injected into Cloud Run and loaded dynamically by `ga4-analytics.js`!).
   - **`GEMINI_API_KEY`** *(optional)*: Free key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

Every `git push` to `main` will then automatically:
- Build & publish the signed **ML Kit Hybrid Android `.apk` & Play Store `.aab`** under **GitHub $\rightarrow$ Actions $\rightarrow$ Artifacts**
- Deploy your API container to **Google Cloud Run (`asia-south1` Mumbai — Tier 1 Always Free)**
- Deploy your 22-language B2C PWA + hardened Firestore Rules + GA4 analytics to **`https://krishi-sahayak-india-free.web.app`**!
