#!/bin/bash
# Deploy Lyrica3 frontend to Cloud Run at www.lyrica3.com

set -e

PROJECT_ID="disco-amphora-490606-n8"
REGION="us-west1"
SERVICE_NAME="lyrica3-frontend"
BACKEND_URL="https://lyrica3-backend-e2q5oemapa-uw.a.run.app"

echo "🚀 Deploying Lyrica3 Frontend to Cloud Run..."

cd /home/shiestybizz/Lyrica3-pro/frontend

# Create production env file
echo "REACT_APP_BACKEND_URL=${BACKEND_URL}" > .env.production

# Build and deploy using Cloud Build
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --set-env-vars="REACT_APP_BACKEND_URL=${BACKEND_URL}"

echo "✅ Frontend deployed!"
echo ""
echo "Next steps:"
echo "1. Get the service URL from Cloud Run console"
echo "2. Configure www.lyrica3.com DNS to point to that URL"
echo "3. Add custom domain in Cloud Run console"
