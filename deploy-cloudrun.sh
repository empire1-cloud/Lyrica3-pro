#!/bin/bash
set -e

# GCP Configuration
PROJECT_ID="disco-amphora-490606-n8"
REGION="us-west1"
SERVICE_NAME="lyrica3-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=========================================="
echo "DEPLOYING LYRICA3 TO GCP CLOUD RUN"
echo "=========================================="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo ""

# Enable required APIs
echo "[1/5] Enabling required GCP APIs..."
gcloud services enable cloudbuild.googleapis.com --project=${PROJECT_ID}
gcloud services enable run.googleapis.com --project=${PROJECT_ID}
gcloud services enable artifactregistry.googleapis.com --project=${PROJECT_ID}

# Build container image
echo ""
echo "[2/5] Building container image..."
cd /home/shiestybizz/Lyrica3-pro/backend
gcloud builds submit --tag ${IMAGE_NAME} --project=${PROJECT_ID}

# Deploy to Cloud Run
echo ""
echo "[3/5] Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "MONGO_URL=mongodb+srv://Lyrica3-pro:Xochitlboom113@cluster0.wqf3a4d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
  --set-env-vars "DB_NAME=lyrica3_prod" \
  --set-env-vars "JWT_SECRET=lyrica3_jwt_secret_change_in_prod" \
  --set-env-vars "VERTEX_PROJECT_ID=disco-amphora-490606-n8" \
  --set-env-vars "VERTEX_LOCATION=us-west1" \
  --set-env-vars "VERTEX_AGENTS_ENABLED=true" \
  --set-env-vars "SL_AUDIO_MASTER_ID=agent_1778921386550" \
  --set-env-vars "BEAST_AGENT_ID=agent_1776939216148" \
  --set-env-vars "GEMINI3_AGENT_ID=agent_1775606766952" \
  --set-env-vars "CORS_ORIGINS=*"

# Get the service URL
echo ""
echo "[4/5] Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --format 'value(status.url)')

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Service URL: ${SERVICE_URL}"
echo ""
echo "[5/5] Testing health endpoint..."
curl -s "${SERVICE_URL}/api/health" || echo "Health check endpoint not available"

echo ""
echo ""
echo "Next steps:"
echo "1. Update frontend REACT_APP_BACKEND_URL to: ${SERVICE_URL}"
echo "2. Set up MongoDB Atlas connection (currently using placeholder)"
echo "3. Add Google service account for Vertex AI"
echo "4. Configure custom domain (optional)"
echo ""
