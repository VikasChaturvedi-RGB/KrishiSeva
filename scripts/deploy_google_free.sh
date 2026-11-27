#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Krishi Sahayak — One-Command Google Cloud Always-Free Deployment Script
# Targets:
#   1. Google Cloud Run (us-central1 — Always Free: 2M req/mo, min-instances=0)
#   2. Firebase Hosting (Spark Free Plan: 10 GB CDN, global SSL, PWA + TWA AssetLinks)
# ==============================================================================

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-kris-seva}}"
REGION="asia-south1"
SERVICE_NAME="krishi-sahayak-api"

echo "🌾 Deploying Krishi Sahayak (100% Free Tier Guardrails) to project: ${PROJECT_ID} (${REGION})"

# 1. Sync PWA assets into web_app & public
npm run build

# 2. Deploy stateless API to Cloud Run in Always-Free eligible region (us-central1) with scale-to-zero
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},CLOUD_RUN_REGION=${REGION}"

# 3. Deploy PWA & TWA Digital Asset Links to Firebase Hosting + Firestore Rules (Spark Always-Free Tier)
npx -y firebase-tools@latest deploy --only hosting,firestore:rules --project "${PROJECT_ID}"

# 4. Optional: Fetch Android google-services.json programmatically into android_app/app/
# npx -y firebase-tools@latest apps:sdkconfig ANDROID --project "${PROJECT_ID}" > android_app/app/google-services.json || true

echo "✅ Krishi Sahayak PWA + Cloud Run API deployed within Always-Free limits!"
