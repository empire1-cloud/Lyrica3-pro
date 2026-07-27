# Lyrica 3 Artist Growth + Royalty Operating System

## Product definition

This engine connects the artist's full commercial loop:

```text
Create and DNA-tag a track
  -> lock ownership and collaborator splits
  -> schedule and distribute a release
  -> generate smart links and campaigns
  -> capture consented fan relationships
  -> attribute streams, tickets, merch, subscriptions, tips, remixes, and deals
  -> ingest DSP/distributor/PRO statements
  -> audit expected versus reported royalties
  -> open recovery claims for missing money
  -> route verified earnings to Archisynapse for approved payouts
```

It is not a generic marketing chatbot. It is an artist-owned operating system in which every campaign, fan action, right, royalty expectation, and payout can share the same track DNA identity.

## Canonical product boundary

- **Lyrica 3** owns artist experience, releases, songs, fan relationships, campaigns, splits, royalty visibility, and growth analytics.
- **DNA Tag + Soulprint + VICS** own provenance, lineage, signing, and proof.
- **Archisynapse** owns approved payment, ledger, fraud, compliance, and receipt execution.
- **SLA113** owns cross-universe routing, policy, capability boundaries, and operator control.
- **Cultura Vibe Forge** remains a protected cultural-authenticity dependency and is not modified by this engine.

The engine must remain provider-independent. Google or Gemini APIs are not part of the approved product architecture. DSP, advertising, messaging, commerce, and collection providers connect through replaceable adapters behind Empire-1 orchestration.

## First implemented vertical slice

The branch `codex/artist-growth-royalty-engine-v1` adds:

1. Release registry with DNA-tagged track membership, ISRC mapping, territories, release dates, and distribution state.
2. Smart links with channel destinations and private pixel configuration.
3. Campaign planning across TikTok, YouTube, Instagram, Facebook, email, SMS, Discord, and organic channels.
4. Fan CRM event capture using hashed identifiers instead of storing raw email or phone values in fan profiles.
5. Transparent fan scoring and segments: anonymous listener, known fan, engaged, buyer, and superfan.
6. Attributed conversions for tickets, merch, downloads, subscriptions, tips, brand deals, royalties, and remixes.
7. Collaborator split agreements that must total exactly 10,000 basis points.
8. DSP/distributor statement auditing for duplicates, invalid values, excessive fees, missing expectations, and possible underpayment.
9. Royalty-recovery claim records generated from selected audit findings.
10. Brand-deal pipeline management.
11. Campaign performance and artist growth scorecards.
12. Non-binding faster-royalty-access previews with real money movement explicitly disabled.

## API surface

Run the integrated application with:

```bash
cd backend
uvicorn artist_growth_api:app --reload
```

The entrypoint preserves all existing `server.py` routes and adds:

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/growth/releases` | Register a DNA-backed release |
| GET | `/api/growth/releases` | List release operations |
| POST | `/api/growth/smart-links` | Create a campaign smart link |
| GET | `/api/growth/smart-links/{slug}` | Resolve a public smart link |
| POST | `/api/growth/campaigns` | Create a release campaign |
| GET | `/api/growth/campaigns` | List campaigns |
| GET | `/api/growth/campaigns/{id}/performance` | Calculate fan, revenue, spend, and ROAS performance |
| POST | `/api/growth/fans/events` | Capture a fan touchpoint or purchase |
| GET | `/api/growth/fans/segments` | Return CRM segments and fan profiles |
| POST | `/api/growth/conversions` | Record ticket, merch, tip, subscription, royalty, or remix value |
| POST | `/api/growth/splits` | Save a validated collaborator split |
| POST | `/api/growth/royalties/statements/audit` | Audit normalized royalty rows |
| POST | `/api/growth/royalties/claims` | Create a recovery case from audit findings |
| POST | `/api/growth/royalties/advance-preview` | Preview faster access without moving money |
| POST | `/api/growth/brand-deals` | Add a brand partnership opportunity |
| GET | `/api/growth/brand-deals` | List the brand-deal pipeline |
| GET | `/api/growth/dashboard` | Return the combined artist growth scorecard |

All artist-private routes reuse the existing Lyrica JWT identity dependency.

## Statement audit truth model

Royalty auditing must not invent one universal per-stream rate. Rates differ by contract, territory, DSP, subscription type, usage type, currency, and reporting period.

The first slice therefore requires the caller to supply contract-backed expected rates by ISRC. Rows without an expectation are marked `no_expectation`; they are not falsely labeled underpaid. The audit can identify:

- possible duplicate rows;
- missing ISRC identifiers;
- negative units or monetary values;
- fees greater than gross revenue;
- reported net revenue materially below a supplied expectation;
- estimated recoverable value.

Future adapter layers can populate expectations from signed distribution, publishing, licensing, and collection agreements.

## Faster royalty access boundary

The current endpoint is a non-binding preview only. It can calculate a proposed advance, fee, and retained receivable, but it cannot transfer funds or represent approved financing.

Before activation, Empire-1 must add:

- verified receivable ownership;
- KYC/KYB and sanctions screening;
- fraud and duplicate-advance controls;
- jurisdiction and lending/receivables-compliance review;
- signed artist disclosures and agreements;
- Archisynapse ledger entries and immutable receipts;
- an approved banking, factoring, or payment partner.

## Provider adapter backlog

### Distribution and DSP analytics

- Spotify for Artists and Apple Music for Artists analytics imports where permitted.
- Distributor delivery/status adapters.
- ISRC/UPC reconciliation.
- Daily stream and territory snapshots.
- Playlist, skip, save, repeat-listen, and source analytics.

### Advertising and promotion

- Meta, TikTok, YouTube/Google Ads alternatives only where approved by the Empire-1 provider policy.
- Campaign creation, creative variants, spend sync, conversion events, and pause rules.
- Human approval before budget changes or campaign launch.

### Fan CRM and messaging

- Consent-led email and SMS adapters.
- Suppression, unsubscribe, quiet-hour, and jurisdiction rules.
- Automated fan journeys based on release and purchase behavior.

### Commerce and brand deals

- Ticketing, merchandise, storefront, and checkout adapters.
- Brand opportunity matching, deliverable tracking, contracts, invoices, and receipts.

### Royalty administration and collection

- Distributor, publisher, PRO, MLC, SoundExchange, neighboring-rights, sync, and UGC statement adapters.
- Contract expectation registry.
- Claim packet generation and provider submission.
- Recovery status and recovered-payment reconciliation.

## Delivery phases

### Phase 1 — Operating spine

The current branch: data contracts, deterministic rules, authenticated CRUD, audit findings, claims, scorecard, and tests.

### Phase 2 — Artist cockpit

Add frontend pages for Launch Plan, Campaigns, Fans, Smart Links, Royalties, Splits, Deals, Commerce, and Growth Dashboard.

### Phase 3 — Read-only connectors

Ingest real analytics and statements without allowing external writes. Every import receives a source, timestamp, checksum, and evidence status.

### Phase 4 — Approval-controlled execution

Allow approved campaign launches, release submissions, messages, claim submissions, and payouts. Every action passes preflight policy and produces a receipt.

### Phase 5 — Intelligence loop

Use campaign outcomes, fan cohorts, royalty yield, remix lineage, and commerce conversion to recommend the next highest-value action. Recommendations stay explainable and approval-controlled.

## Core KPIs

- Release readiness completion rate.
- Time from finished master to release submission.
- Cost per known fan.
- Fan capture rate by campaign and source.
- Presave-to-stream conversion.
- Repeat-listener and superfan growth.
- Ticket, merch, subscription, remix, and tip conversion.
- Campaign ROAS and contribution margin.
- Statement coverage by revenue source.
- Expected-versus-reported royalty variance.
- Recoverable and recovered royalty value.
- Split agreement completion before release.
- Days from verified earning to artist payout.

## Non-negotiable safeguards

- Never store raw fan contact details in analytics views.
- Never launch ads or change budgets without approval controls.
- Never submit a royalty claim based solely on an estimated rate.
- Never move money from an advance preview.
- Never overwrite DNA lineage or signed split history.
- Never flatten Lyrica, Archisynapse, SLA113, or Cultura into one unsafe monolith.
- Every external action must preserve evidence, idempotency, and a receipt.
