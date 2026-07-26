# Lyrica → Archisynapse v2 Cutover Runbook

## Purpose

Move the public Lyrica Flip flow from local-only lineage records to the signed Archisynapse v2 royalty receipt loop without breaking current creator behavior or allowing two financial sources of truth.

The original Archisynapse adapter remains preserved. New Flip royalty obligations use only Archisynapse v2 after the explicit cutover flag is enabled.

## Safe default

```bash
LYRICA_ARCHISYNAPSE_V2_ENABLED=false
```

When false or unset:

- `production_app:app` boots successfully;
- the original `POST /api/tracks/{dna_tag}/flip` route remains registered;
- the internal proof and outbox operator routes are available but fail closed without credentials;
- no new Archisynapse v2 financial event is emitted.

Never enable the flag until every preflight item below is complete.

## Required Lyrica variables

```bash
LYRICA_ARCHISYNAPSE_V2_ENABLED=false

LYRICA_VICS_SERVICE_TOKEN=<shared service-auth token>
LYRICA_VICS_PROOF_SIGNING_KEY=<Lyrica-only secret, minimum 32 characters>

ARCHISYNAPSE_V2_EVENTS_URL=https://<archisynapse-gateway>/api/v1/events
ARCHISYNAPSE_V2_TENANT_API_KEY=<SLA113-issued tenant bearer key>
LYRICA_ARCHISYNAPSE_ED25519_PRIVATE_KEY_B64=<raw 32-byte private key, base64>
LYRICA_ARCHISYNAPSE_KEY_ID=lyrica-event-k1
ARCHISYNAPSE_RECEIPT_PUBLIC_KEY_B64=<gateway receipt public key, base64>
ARCHISYNAPSE_RECEIPT_KEY_ID=arch-rcpt-k1
ARCHISYNAPSE_V2_TIMEOUT_SECONDS=10

LYRICA_ROYALTY_INTERNAL_TOKEN=<internal operator token>
LYRICA_ROYALTY_ALLOWED_SERVICES=empire1-cofounder,lyrica3-backend
```

The VICS proof-signing key and Ed25519 event-signing key are different secrets with different responsibilities. Do not reuse `JWT_SECRET` for either.

## Required Archisynapse v2 variables

```bash
ROYALTY_LOOP_ENABLED=true
LYRICA_VICS_VERIFIER_ENABLED=true
LYRICA_VICS_VERIFY_URL=https://<lyrica-backend>/duo-soul/internal/v1/vics/verify
LYRICA_VICS_SERVICE_TOKEN=<same shared service-auth token>
LYRICA_VICS_VERIFY_TIMEOUT_SECONDS=5
```

Also configure the normal v2 gateway, transaction, ledger, fraud, PostgreSQL, admin-auth, and receipt-signing secrets.

## Tenant registration

Before enabling Lyrica's public cutover:

1. Register the Lyrica tenant bearer API key in Archisynapse v2.
2. Register `lyrica-event-k1` with the matching Lyrica Ed25519 public key.
3. Retrieve the Archisynapse receipt public key for `arch-rcpt-k1`.
4. Install that public key in Lyrica as `ARCHISYNAPSE_RECEIPT_PUBLIC_KEY_B64`.
5. Confirm no private key crosses the service boundary.

## Preflight sequence

1. Deploy Archisynapse v2 PR #3 with the verifier flag still false.
2. Deploy Lyrica PR #37 and PR #38 with `LYRICA_ARCHISYNAPSE_V2_ENABLED=false`.
3. Confirm both health checks and the original public Flip behavior.
4. Configure service tokens and signing keys.
5. Enable the Archisynapse VICS verifier.
6. Issue a proof for one controlled Lyrica track.
7. Verify the same proof through Archisynapse with no financial event.
8. Send one controlled `$1.2500` obligation through the guarded internal dispatch route.
9. Confirm:
   - one outbox row;
   - one Archisynapse obligation;
   - one balanced ledger effect when allowed;
   - one signed receipt;
   - `gross = net = 1.2500`;
   - `platform_fee = 0.0000`;
   - creator payout rows sum to the full pool;
   - retrying the exact event returns the same receipt and creates no second posting.
10. Reverse the controlled obligation and verify the post-reversal trial-balance delta is zero.
11. Only then set:

```bash
LYRICA_ARCHISYNAPSE_V2_ENABLED=true
```

## Public Flip behavior after cutover

The public route performs:

```text
Parent proof preflight
  → existing Flip creation
  → durable outbox insert
  → exact-byte Ed25519 event signature
  → Archisynapse v2 gateway
  → transaction-service-owned posting
  → signed receipt verification
  → receipt-driven creator response
```

A deployment configuration problem leaves the obligation `pending` with `configuration_error`; it never reports paid and never remains stuck as `sending`.

A network or v2 `503 retry_later` response leaves the same event pending with the same event ID, correlation ID, idempotency key, and body.

A tampered event, invalid receipt, nonzero creator-pool fee, invalid signature, tenant mismatch, or idempotency conflict fails closed.

## Rollback

To stop new v2 dispatches without deleting data:

```bash
LYRICA_ARCHISYNAPSE_V2_ENABLED=false
```

Redeploy Lyrica. The original Flip route becomes active again. Preserve all outbox rows and receipts for reconciliation; do not delete or rewrite them.

Do not point new events back to the legacy Archisynapse ledger. Rollback affects new public Flip dispatch only; existing v2 obligations remain under v2 financial truth.

## Merge versus enablement

Merging the code is safe while the cutover flag remains false. Enabling the flag is a separate production operation and requires the controlled receipt proof above.
