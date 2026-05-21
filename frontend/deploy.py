"""
Deploy Lyrica 3 Pro frontend to Cloud Run.
Uses ADC for auth — no gcloud needed.
"""
import os, json, time, subprocess, sys

PROJECT = "disco-amphora-490606-n8"
LOCATION = "us-west1"
SERVICE = "lyrica3-frontend"
IMAGE = f"gcr.io/{PROJECT}/{SERVICE}"

def step(msg):
    print(f"\n=== {msg} ===")

# 1. Build Docker image using Cloud Build
step("Building Docker image via Cloud Build")
os.chdir(os.path.dirname(__file__) or ".")
r = subprocess.run([
    "gcloud", "builds", "submit",
    "--config", "cloudbuild.yaml",
    f"--project={PROJECT}",
], capture_output=True, text=True, timeout=600)
print(r.stdout[-2000:] if r.stdout else "")
print(r.stderr[-1000:] if r.stderr else "")
if r.returncode != 0:
    print(f"Build failed (rc={r.returncode})")
    sys.exit(1)

# 2. Deploy to Cloud Run
step("Deploying to Cloud Run")
r = subprocess.run([
    "gcloud", "run", "deploy", SERVICE,
    f"--image={IMAGE}",
    f"--project={PROJECT}",
    f"--region={LOCATION}",
    "--platform=managed",
    "--allow-unauthenticated",
    "--memory=256Mi",
    "--cpu=1",
    "--min-instances=0",
    "--max-instances=10",
    "--concurrency=80",
    "--timeout=300",
    f"--set-env-vars=REACT_APP_BACKEND_URL=https://lyrica3-backend-339698334666.us-west1.run.app",
], capture_output=True, text=True, timeout=300)
print(r.stdout[-2000:] if r.stdout else "")
print(r.stderr[-1000:] if r.stderr else "")
if r.returncode != 0:
    print(f"Deploy failed (rc={r.returncode})")
    sys.exit(1)

print("\n✅ Frontend deployed!")
