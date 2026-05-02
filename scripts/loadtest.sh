#!/usr/bin/env bash
# ============================================================
# Lyrica 3 Pro · Public Scale Readiness — rate-limit soak test
# Fires parallel bursts at /api/auth/register and /api/generate
# to verify (a) 429 is deterministic and (b) no bypass via header spoof.
# Run against:
#   - single replica preview URL    (baseline)
#   - multi-replica prod URL        (post-deploy gate)
# Usage:
#   API=https://api.lyrica3.com ./scripts/loadtest.sh
# ============================================================
set -u
API="${API:-https://can-cant-builder.preview.emergentagent.com}"
CONCURRENCY="${CONCURRENCY:-20}"
TOTAL="${TOTAL:-200}"

TS=$(date +%s)
echo "[$(date -Iseconds)] target=$API  concurrency=$CONCURRENCY  total=$TOTAL"

# --- 1 · auth register burst (policy: 5/min/IP) ---------------
echo "-- AUTH REGISTER BURST (expect lots of 429 after first 5 per window)"
seq 1 "$TOTAL" | xargs -P "$CONCURRENCY" -I{} curl -s -o /dev/null \
  -w "%{http_code}\n" \
  -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"handle\":\"lt_${TS}_{}_$RANDOM\",\"password\":\"loadtest1234\"}" \
  | sort | uniq -c

# --- 2 · header spoof attempt (must NOT reset the bucket) -----
echo "-- SPOOF PROBE — sending fake CF-Connecting-IP per request"
seq 1 30 | xargs -P 5 -I{} curl -s -o /dev/null \
  -w "%{http_code}\n" \
  -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "CF-Connecting-IP: 198.51.100.{}" \
  -H "X-Forwarded-For: 198.51.100.{}" \
  -d "{\"handle\":\"sp_${TS}_{}\",\"password\":\"pass123456\"}" \
  | sort | uniq -c

# --- 3 · latency p50/p95/p99 on /api/tracks -------------------
echo "-- LATENCY /api/tracks"
for i in $(seq 1 60); do
  curl -s -o /dev/null -w "%{time_total}\n" "$API/api/tracks"
done | sort -n | awk '
  { a[NR]=$1 }
  END {
    n=NR;
    printf "p50 = %.3fs\np95 = %.3fs\np99 = %.3fs\n",
      a[int(n*0.50)], a[int(n*0.95)], a[int(n*0.99)];
  }'

echo "[$(date -Iseconds)] done"
