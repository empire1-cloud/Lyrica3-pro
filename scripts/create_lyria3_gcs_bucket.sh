#!/usr/bin/env bash
set -euo pipefail

# ────────────────────────────────────────────────────────────
# Create GCS bucket for Lyria 3 Pro audio output
# Run this from Cloud Shell or a machine with working gcloud auth
# ────────────────────────────────────────────────────────────

PROJECT="disco-amphora-490606-n8"
BUCKET="lyrica3-audio-output"
LOCATION="us-central1"

echo "→ Creating bucket gs://${BUCKET} in ${LOCATION}..."
gcloud storage buckets create "gs://${BUCKET}" \
  --project="${PROJECT}" \
  --location="${LOCATION}" \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access

echo "→ Setting lifecycle to auto-delete objects older than 30 days..."
cat > /tmp/lifecycle.json << 'LCEOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
LCEOF

gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file=/tmp/lifecycle.json

echo "→ Granting Cloud Run SA objectViewer access..."
# The Cloud Run runtime service account - replace with actual SA if different
RUN_SA="$(gcloud iam service-accounts list \
  --project="${PROJECT}" \
  --filter="displayName~'Compute Engine default'" \
  --format='value(email)' 2>/dev/null || echo '')"

if [ -n "${RUN_SA}" ]; then
  gsutil iam ch "serviceAccount:${RUN_SA}:roles/storage.objectViewer" "gs://${BUCKET}"
  echo "   Granted access to ${RUN_SA}"
fi

echo ""
echo "✅ Bucket gs://${BUCKET} ready!"
echo "   Run the pipeline with:"
echo "   export LYRIA3_AUDIO_BUCKET=${BUCKET}"
echo ""
echo "   Or set in Cloud Run env:"
echo "   LYRIA3_AUDIO_BUCKET=${BUCKET}"
