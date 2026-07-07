# Lyrica Architecture Audit

Date: 2026-07-03
Mode: Audit only
Repo: `/home/shiestybizz113/projects/Lyrica3-pro`

## Audit Notes

- Requested file `agents/lyrica/AGENT.md` was not present in this workspace.
- Repo-local [AGENTS.md](/home/shiestybizz113/projects/Lyrica3-pro/AGENTS.md) was used as the nearest instruction source.
- No product code was modified.

## Primary Architecture Reading

Core sources used for this audit:

- [README.md](/home/shiestybizz113/projects/Lyrica3-pro/README.md)
- [AGENTS.md](/home/shiestybizz113/projects/Lyrica3-pro/AGENTS.md)
- [memory/PRD.md](/home/shiestybizz113/projects/Lyrica3-pro/memory/PRD.md)
- [frontend/src/routes.tsx](/home/shiestybizz113/projects/Lyrica3-pro/frontend/src/routes.tsx)
- [backend/server.py](/home/shiestybizz113/projects/Lyrica3-pro/backend/server.py)
- [backend/fastapi_app.py](/home/shiestybizz113/projects/Lyrica3-pro/backend/fastapi_app.py)
- [api/main.py](/home/shiestybizz113/projects/Lyrica3-pro/api/main.py)
- [gateway/main.py](/home/shiestybizz113/projects/Lyrica3-pro/gateway/main.py)

## System Shape

Lyrica is not a single app. This repo contains one music business with several surfaces:

- Sonance Pro studio
- SL Universal / radio surface
- Soulfire generation engine
- proof and royalty lane
- Discord distribution surface
- gateway/auth layer
- Cultura sidecar
- embedded governance/foundry materials

The live React shell is routed from [frontend/src/routes.tsx](/home/shiestybizz113/projects/Lyrica3-pro/frontend/src/routes.tsx), and the main backend surface is [backend/server.py](/home/shiestybizz113/projects/Lyrica3-pro/backend/server.py).

## Subsystem Definitions

### 1. Canon, Narrative, and Product Positioning
Business framing, launch narrative, investor positioning, and protected architecture intent.

### 2. Frontend Shell
React/Vite app shell, layout, route composition, shared UI primitives, and browser-facing API client.

### 3. Sonance Pro Studio
Studio-facing authoring, engine controls, dashboard, timeline, library, settings, and creator workflow.

### 4. SL Universal / Radio
Listener-facing and radio-style experience, live session UI, remix feed, aura visualization, and vibe interaction.

### 5. Soulfire Core Engine
Core generative logic, orchestration, lyric master, sequencing, intent parsing, voice/emotion modeling, and audio composition pipeline.

### 6. Voice DNA / DuoSoul
Voice analysis, soul-card flow, synth/watermark inspection, and alternate API surface for Soulfire card generation.

### 7. Access, Identity, and Gateway
Auth, token handling, identity firewall, reverse proxying, and protected service routing.

### 8. Proof, Royalties, and Ledger
Track proof, remix economics, royalty logic, payout/ledger hooks, and Archisynapse-adjacent integration.

### 9. Distribution Surfaces
Discord bot and any user-facing channel integrations beyond the main web frontend.

### 10. Cultura Sidecar
Embedded Cultura backend/frontend inside the repo.

### 11. Governance and Foundry
SLA113 governance, universe manifests, policy/compiler assets, and foundry structure docs.

### 12. Deployment, Tests, and Evidence
Infra configs, deploy scripts, test suites, demo docs, proof docs, and captured evidence artifacts.

### 13. Local and Generated Artifacts
Build outputs, vendor dependencies, cached state, local DBs, audio outputs, pycache, and local runtime folders.

## File-to-Subsystem Map

This section maps every file in the repo by explicit path or path rule.

### Canon, Narrative, and Product Positioning

Files:

- `AGENTS.md`
- `AGENTS_LOCAL_INFO.md`
- `ANTI_GENERIC_MANIFESTO.md`
- `ASSISTIVE_AI_POSITIONING.md`
- `COMPETITIVE_ANALYSIS.md`
- `LAUNCH_CONTENT.md`
- `LAUNCH_MESSAGING.md`
- `LAUNCH_RUNBOOK.md`
- `PRODUCT_HUNT_LAUNCH.md`
- `PUBLIC_LAUNCH_STRATEGY.md`
- `README.md`
- `SOULFIRE_DEPLOYMENT.md`
- `VOCAL_CHAIN_INTEGRATION.md`
- `memory/PRD.md`
- `docs/investor/*`

Role:
- Defines what Lyrica is, how it is positioned, and how the repo should be understood commercially.

### Frontend Shell

Files:

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/index.html`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vercel.json`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`
- `frontend/src/index.css`
- `frontend/src/routes.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/components/figma/ImageWithFallback.tsx`
- `frontend/src/components/ui/*`
- `frontend/src/vite-env.d.ts`

Role:
- Shared browser shell and reusable UI primitives used by multiple surfaces.

### Sonance Pro Studio

Files:

- `frontend/src/pages/Auth.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Engine.tsx`
- `frontend/src/pages/Layout.tsx`
- `frontend/src/pages/Library.tsx`
- `frontend/src/pages/MakeMusic.tsx`
- `frontend/src/pages/MyTracks.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/Studio.tsx`
- `frontend/src/pages/System.tsx`
- `frontend/src/pages/Timeline.tsx`

Backend files primarily serving this subsystem:

- `backend/server.py`
- `backend/fastapi_app.py`
- `backend/empire_server.py`
- `backend/main_agent.py`

Role:
- Main creator-facing studio and operational workspace.

### SL Universal / Radio

Files:

- `frontend/src/pages/Radio.tsx`
- `frontend/src/pages/RadioPage.tsx`
- `frontend/src/features/radio/*`
- `frontend/src/radio/components/*`
- `frontend/src/radio/lib/*`
- `frontend/src/radio/radio.css`
- `backend/fastapi_app.py`

Role:
- Consumer/listener and live radio-facing mode inside the same business.

### Soulfire Core Engine

Files:

- `backend/advanced_lyria_pipeline.py`
- `backend/audio_engine.py`
- `backend/demucs_worker.py`
- `backend/local_musicgen.py`
- `backend/lyria3_adk_pipeline.py`
- `backend/lyrica_emotional_os.py`
- `backend/lyrica_vision.py`
- `backend/master_lyria_pipeline.py`
- `backend/mma_worker.py`
- `backend/nemotron_adlib_bridge.py`
- `backend/pfa_worker.py`
- `backend/procedural_instrumental.py`
- `backend/production_pipeline.py`
- `backend/s2_synthesizer.py`
- `backend/vertex_agent_class.py`
- `backend/vertex_agents_config.py`
- `backend/vertex_ai.py`
- `backend/vertex_beast_agent.py`
- `backend/vertex_lyria3.py`
- `backend/vocal_melody_generator.py`
- `backend/music_engine/*`
- `backend/agents/*`
- `backend/prompts/*`
- `backend/lyrica_agent/*`
- `soulfire_kernel/__init__.py`
- `soulfire_kernel/kernel.py`
- `soulfire_kernel/empire_lyric_master.py`
- `soulfire_kernel/render_from_blueprint.py`
- `soulfire_kernel/requirements.txt`
- `soulfire_kernel/chrono_sequencer/*`
- `soulfire_kernel/intent_parser/*`
- `soulfire_kernel/docs/*`

Role:
- Actual music-generation and emotional/aesthetic engine stack.

### Voice DNA / DuoSoul

Files:

- `api/__init__.py`
- `api/main.py`
- `api/models.py`
- `api/soulfire_bridge.py`
- `api/soulfire_engine.py`
- `api/vocal_engine.py`
- `api/voice_analyzer.py`
- `api/requirements.txt`
- `api/Dockerfile`
- `lyrica3_soulfire/__init__.py`
- `lyrica3_soulfire/gradio_soulcard_ui.py`
- `lyrica3_soulfire/requirements.txt`
- `lyrica3_soulfire/two_pass_pipeline.py`
- `lyrica3_soulfire/soul_card/*`

Role:
- Alternate API and soul-card pathway for voice-derived generation and proof inspection.

### Access, Identity, and Gateway

Files:

- `gateway/__init__.py`
- `gateway/auth.py`
- `gateway/config.py`
- `gateway/main.py`
- `gateway/models.py`
- `gateway/proxy.py`
- `gateway/requirements.txt`
- `gateway/identity_firewall/*`
- `backend/identity_firewall/*`

Role:
- Authentication boundary and protected request routing between user-facing clients and backend services.

### Proof, Royalties, and Ledger

Files:

- `frontend/src/pages/TrackProof.tsx`
- `backend/archisynapse_integration.py`
- `backend/empire1_flip_engine.py`
- `backend/micro_royalty_distributor.py`
- `backend/vics_ledger.py`
- `empire1_ledger_service/*`
- `soulfire_kernel/empire1_ledger/*`
- `empire_one_ledger.db`
- `test_vics.py`
- `VICS_TEST_OUTPUT.json`

Role:
- Ownership proof, royalty economics, flips, and ledger-adjacent behavior.

### Distribution Surfaces

Files:

- `discord_bot/*`
- `marketing_agent.py`

Role:
- Channel-specific distribution and engagement surfaces outside the main app shell.

### Cultura Sidecar

Files:

- `cultura/backend/*`
- `cultura/frontend/*`

Role:
- Embedded Cultura product/module kept alongside the main Lyrica repo.

### Governance and Foundry

Files:

- `foundry/README.md`
- `foundry/empire1/**`
- `foundry/sla113/**`
- `foundry/southern/**`
- `sla113_governance/__init__.py`
- `sla113_governance/engine_interfaces/*`
- `sla113_governance/opa_policies/*`
- `sla113_governance/pipeline_compiler/*`
- `sla113_governance/universe_manifests/*`

Role:
- Cross-universe governance, policy, and production-foundry framing embedded inside the Lyrica repo.

### Deployment, Tests, and Evidence

Files:

- `DEPLOY.md`
- `DEPLOYMENT.md`
- `DEPLOYMENT_STATUS.md`
- `Dockerfile`
- `Dockerfile.gradio`
- `cloudbuild.yaml`
- `deploy-cloudrun.sh`
- `deploy-frontend.sh`
- `docker-compose.yml`
- `railway.toml`
- `render.yaml`
- `scripts/*`
- `tests/*`
- `backend/tests/*`
- `backend/test_barrio_phonetics_integration.py`
- `backend/test_global_archetypes.py`
- `backend/test_vics_upgrade.py`
- `test_dashboard_api.py`
- `test_lyrica_live.py`
- `LYRICA3_TEST_OUTPUT.json`
- `test_result.md`
- `test_reports/*`
- `docs/demo/*`

Role:
- Deployment paths, test harnesses, demo artifacts, and captured execution evidence.

### Local and Generated Artifacts

Files and rules:

- `.git/*`
- `.emergent/*`
- `.local/*`
- `.vercel*`
- `.gitignore`
- `.gitconfig`
- `frontend/.vercel/*`
- `frontend/build/**`
- `frontend/dist/**`
- `frontend/node_modules/**`
- `backend/__pycache__/**`
- `backend/lyrica_agent/__pycache__/**`
- `backend/music_engine/__pycache__/**`
- `backend/music_output/**`
- `backend/*.wav`
- `backend/chicano_soul_player.html`

Role:
- Local runtime state, generated output, vendored dependencies, caches, and non-source artifacts.

## Directory-by-Directory Summary

### `frontend/`
- Canonical web client.
- Split internally between studio pages and radio/universal pages.

### `backend/`
- Largest operational surface.
- Mixes production API, generation pipeline, auth/firewall, royalty logic, prompts, and experimental audio assets.

### `api/`
- Secondary FastAPI surface for DuoSoul and soul-card workflows.
- Overlaps with core backend capabilities instead of sitting cleanly behind one boundary.

### `gateway/`
- Explicit auth and proxy boundary.
- Cleaner separation than the main backend in terms of routing responsibility.

### `soulfire_kernel/`
- Reusable engine-core package.
- Most coherent engine boundary in the repo.

### `lyrica3_soulfire/`
- Soul-card and Gradio-oriented subproduct.
- Closely related to proof/voice workflows.

### `empire1_ledger_service/`
- Embedded ledger service, but not clearly isolated from backend royalty logic.

### `discord_bot/`
- Distinct distribution surface.

### `cultura/`
- Embedded sibling product, not just a helper library.

### `foundry/` and `sla113_governance/`
- Cross-universe materials that likely belong above the Lyrica product layer, but currently live inside this repo.

## Architecture Findings

### Clear strengths

- The repo has a real product split between studio, radio, proof, and distribution.
- `frontend/src/routes.tsx` gives a clear user-facing surface map.
- `gateway/` is a recognizable boundary for auth and proxying.
- `soulfire_kernel/` is the strongest reusable engine-core boundary in the repo.

### Major boundary overlaps

- `backend/`, `api/`, and `soulfire_kernel/` all participate in generation responsibilities.
- Ledger and royalty logic exists in multiple places:
  - `backend/archisynapse_integration.py`
  - `backend/micro_royalty_distributor.py`
  - `backend/vics_ledger.py`
  - `empire1_ledger_service/*`
  - `soulfire_kernel/empire1_ledger/*`
- Governance/foundry assets are embedded inside the product repo rather than clearly externalized.

### Embedded non-Lyrica domains

- `cultura/`
- `foundry/southern/**`
- `foundry/sla113/**`
- `sla113_governance/**`
- `empire1_ledger_service/**`

This repo is therefore both a product repo and a partial ecosystem repo.

## Missing or Weak Documentation

- `agents/lyrica/AGENT.md` is missing.
- No dedicated `ARCHITECTURE.md` existed in this repo before this audit.
- `api/` has no standalone README explaining why it exists alongside `backend/`.
- `gateway/` has no standalone README.
- `empire1_ledger_service/` has no local README.
- `cultura/` has no repo-local architecture note inside this repo.

## Recommended Reading Order

1. [AGENTS.md](/home/shiestybizz113/projects/Lyrica3-pro/AGENTS.md)
2. [README.md](/home/shiestybizz113/projects/Lyrica3-pro/README.md)
3. [memory/PRD.md](/home/shiestybizz113/projects/Lyrica3-pro/memory/PRD.md)
4. [frontend/src/routes.tsx](/home/shiestybizz113/projects/Lyrica3-pro/frontend/src/routes.tsx)
5. [backend/server.py](/home/shiestybizz113/projects/Lyrica3-pro/backend/server.py)
6. [gateway/main.py](/home/shiestybizz113/projects/Lyrica3-pro/gateway/main.py)
7. [soulfire_kernel/kernel.py](/home/shiestybizz113/projects/Lyrica3-pro/soulfire_kernel/kernel.py)
8. [api/main.py](/home/shiestybizz113/projects/Lyrica3-pro/api/main.py)
9. `backend/lyrica_agent/*`
10. `backend/music_engine/*`

## Bottom Line

Lyrica is a multi-surface music product with one dominant repo that currently bundles:

- the main web product
- the core music engine
- an alternate Soulfire API
- gateway/auth
- proof and ledger hooks
- Discord distribution
- embedded Cultura and governance materials

The cleanest internal boundaries today are:

- `frontend/` for user-facing shell
- `gateway/` for auth/proxy
- `soulfire_kernel/` for engine-core

The least clean boundaries today are:

- `backend/` versus `api/`
- royalty/ledger logic spread across multiple locations
- governance/foundry assets living inside the product repo

Audit complete. No implementation changes were made beyond this report file.
