# Demo Operator Script

Use this script for every live demo. Do not improvise the product story.

## Demo objective

Show one working creator-owned loop:

1. user account access
2. track generation
3. DNA / track proof
4. ledger / payment / fraud infrastructure positioning
5. stable product behavior

## What to show

- app loads
- backend health is live
- user can authenticate or enter a test account
- user can generate a track through the working lane
- generated output has a visible DNA tag / proof field
- billing status is clearly explained as enabled or disabled
- Archisynapse is described as the money/risk layer

## What not to show

- Vibe Bar if it is still simulated
- any path that depends on placeholder SoundHelix audio
- any unfinished checkout path
- any “coming soon” flow unless you explicitly say it is disabled
- any architecture explanation longer than 30 seconds

## Opening line

"This is Lyrica 3 Pro. The point is not just generating music. The point is that a creator can generate work, attach proof and metadata to it, and connect that output to a trust and monetization layer."

## Step-by-step flow

### 1. Show service health

Show:

- `GET /health`

Expected:

- status `ok`
- service `empire1-ledger`

Say:

"The backend is up and the database is reachable."

### 2. Show app load

Show:

- landing page or direct app entry

Say:

"This is the creator-facing surface. We are keeping this demo narrow."

### 3. Show auth

Show:

- login or test account entry

Say:

"A creator can enter the product and use the generation workflow."

### 4. Show generation

Show:

- run one track through the working generation lane

Say:

"For this demo, we are using the validated working path. The purpose is to prove the creator loop, not to show every engine."

### 5. Show proof

Show:

- generated track
- `dna_tag`
- any `track_hash` or proof metadata exposed in the UI/API response

Say:

"Each output gets an identity layer. That gives us a way to track lineage, attribution, and later monetization logic."

### 6. Show ledger / money layer

Show:

- billing status endpoint if billing is disabled
- ledger data if available
- Archisynapse explanation as the payment/fraud/risk layer

Say:

"Archisynapse is the infrastructure layer that handles payment, fraud, ledger events, and payout logic around the creator asset."

### 7. Close

Say:

"The proof is one stable loop: creator in, asset generated, proof attached, monetization infrastructure connected."

## Backup lines if something is disabled

- "Billing is intentionally disabled in this demo because we do not show half-ready money flows."
- "This feature is gated because it is not part of the proof loop."
- "We are proving one path works before broadening the surface."
