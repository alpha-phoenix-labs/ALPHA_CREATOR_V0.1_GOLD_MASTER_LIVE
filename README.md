# ALPHA CREATOR V0.1 — Integrated Gold Master

**AI Content Intelligence & Growth Engine**  
**Verified local integration baseline: 29 August 2026**

ALPHA CREATOR V0.1 is a locally functional modular monolith. It integrates the tested FastAPI core from the Core Checkpoint with the premium React frontend through an explicit service/adapter boundary.

The verified V0.1 product path is:

`REAL RSS → SCAN → NORMALIZE → DEDUPLICATE → SCORE/RANK → PREMIUM FRONTEND → GENERATE → REVIEW → APPROVE/REJECT → DATABASE → CONTENT LIBRARY → RELOAD`

## Release status

- Core Checkpoint: technical regression baseline.
- Premium Frontend Checkpoint: UI/UX baseline.
- Backend core files changed relative to the baseline: **no**.
- Frontend's default data source: **real Core API**.
- Mock data: available only through an explicitly selected UI/test mode.
- Full-stack end-to-end run using five real RSS sources: **PASS**.
- Clean installation, lint, production build, SSR, automated tests and production runtime: **PASS**.
- Reference commit recorded for the Gold Master: `d3c55fced10457fdb08766d99901be927a813c5f`.

The integration contract and known structural differences are documented in `INTEGRATION_CONTRACT_MATRIX.md`.

## Architecture

```text
Premium React UI
    ↓ Presentation Contracts
DashboardService
    ↓ DashboardAdapter
DashboardApiAdapter
    ↓ /api/v1 server-side frontend proxy
FastAPI Core
    ├── RSS collectors
    ├── normalization and deduplication
    ├── deterministic scoring
    ├── structured content generation
    ├── review and approval workflow
    └── SQLAlchemy / Alembic
            ↓
      SQLite locally / PostgreSQL intended for production
```

The UI does not import backend models or mock fixtures. It does not call Instagram or OpenAI directly. `DashboardApiAdapter` maps Core responses into frontend-only presentation contracts. Differences between Core and UI data structures are handled at the adapter boundary rather than by modifying the Core.

## Repository structure

```text
adapters/                         Adapter interface, API and mock adapters
app/                              Vinext/React routes and server-side API proxy
backend/app/                      FastAPI Core
backend/alembic/                  Database migrations
backend/tests/                    Core, collector, processing and API tests
components/alpha/                 ALPHA design-system components
components/dashboard/             Premium dashboard and UI states
data/                             Mock fixture for explicitly enabled test mode
scripts/                          Installation, startup, tests and live E2E
services/                         DashboardService
tests/                            Frontend, adapter, component and SSR tests
types/                            Frontend presentation contracts
worker/                           Vinext/Cloudflare entry
.openai/hosting.json              Hosting configuration required by vite.config.ts
build/sites-vite-plugin.ts        Build plugin required by vite.config.ts
```

## Requirements

- Python 3.12+
- Node.js 22.13.0+
- npm with `npm ci` support
- Internet access for dependency installation and live RSS scans
- PostgreSQL, optional; intended for shared/production environments
- OpenAI API key, optional; enables the external structured-generation provider

The documented final validation environment used Python 3.12.13, Node.js 24.19.0 and npm 11.9.0.

## Reproducible local installation

From a clean source checkout:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm ci
cp .env.example .env
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

Copying `.env.example` is optional. Without a local `.env`, the Core uses its local SQLite configuration and the `local-grounded` generation provider.

For the project-specific locked installation environment, the repository also provides:

```bash
npm run install:ci
```

This script prepares project-local tool caches, verifies the integrity-pinned Vinext tarball and performs one bounded `npm ci`. For a standard local setup, `npm ci` is the direct installation path.

## Environment variables

| Variable | Purpose | Safe/default behavior |
| --- | --- | --- |
| `APP_NAME` | API display name | `ALPHA CREATOR` |
| `APP_ENV` | Runtime environment | `development` |
| `APP_DEBUG` | Debug mode | `false` |
| `API_PREFIX` | Core API prefix | `/api/v1` |
| `DATABASE_URL` | SQLAlchemy connection | local SQLite |
| `OPENAI_API_KEY` | Enables the OpenAI provider | unset |
| `OPENAI_MODEL` | Model behind the provider boundary | `gpt-5-mini` |
| `ALPHA_BACKEND_URL` | Server-side frontend proxy target | `http://127.0.0.1:8000` |
| `CORS_ORIGINS` | Allowed origins for direct API access | local origins |
| `COLLECTOR_TIMEOUT_SECONDS` | Per-source timeout | `10` |
| `COLLECTOR_MAX_ITEMS_PER_SOURCE` | Feed item limit | `35` |
| `COLLECTOR_RETRIES` | Controlled retries | `1` |
| `DEDUPE_THRESHOLD` | RapidFuzz threshold | `88` |
| `NEXT_PUBLIC_ALPHA_DASHBOARD_SOURCE` | `api` or explicit `mock` mode | `api` |

Real secrets must only be stored in a local `.env` file or the runtime's secret manager. Never commit credentials. The local `.env` file is excluded from the source checkpoint.

## Run locally

Start the complete development environment:

```bash
npm run dev:full
```

Default local endpoints:

- Premium frontend: `http://127.0.0.1:3000/dashboard`
- Backend health: `http://127.0.0.1:8000/health`
- FastAPI documentation: `http://127.0.0.1:8000/docs`

Alternatively, run the backend and frontend in separate terminals:

```bash
.venv/bin/uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
ALPHA_BACKEND_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 3000
```

## Production build and local production runtime

```bash
npm run build
ALPHA_BACKEND_URL=http://127.0.0.1:8000 npm start -- --host 127.0.0.1 --port 4173
```

The production build includes client, server, React Server Component and SSR phases. The backend process must be started separately.

## Database

Initialize the local database:

```bash
mkdir -p backend/data
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

Example PostgreSQL configuration for a shared/production environment:

```bash
export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:5432/alpha_creator'
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

V0.1 domain entities include Sources, Stories, Story Scores, Generations, Content Items and Approval Decisions.

Initial migration: `backend/alembic/versions/73a80eba9096_initial_schema.py`.

**Validation boundary:** the documented Gold Master run verified the local SQLite path. PostgreSQL production behavior is not claimed as verified by that run.

## Core API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service, database and generation status |
| `POST` | `/api/v1/radar/scan` | Scan, normalize, deduplicate and rank sources |
| `GET` | `/api/v1/stories` | Ranked stories |
| `GET` | `/api/v1/stories/{story_id}` | Story details and scores |
| `POST` | `/api/v1/stories/{story_id}/generate` | Generate a structured content package |
| `GET` | `/api/v1/content` | Persistent content library |
| `GET` | `/api/v1/content/{content_id}` | Individual content package |
| `POST` | `/api/v1/content/{content_id}/decision` | Approve or reject content |
| `GET` | `/api/v1/dashboard/stats` | Core dashboard counters |

The frontend proxy at `app/api/v1/[...path]/route.ts` allows only `GET` and `POST`, validates the backend target and does not expose backend credentials to the browser.

## Premium frontend

Integrated areas connected to real Core data include:

- App shell, sidebar, mobile navigation and top bar
- Content pipeline and KPI cards
- Top opportunities based on ranked Core stories
- Recent content from the persistent Content Library
- Structured live preview
- Clearly labeled heuristic viral prediction
- ALPHA insights derived from stored Core packages
- Review/approve/reject next actions
- Presentation time range with visible Core time basis
- System status and creation flow from a ranked story
- Loading, empty, partial-data and error states
- Responsive layout gates, reduced motion and visible focus states

`DashboardApiAdapter.getDashboard()` aggregates `stats`, `stories` and `content` with `Promise.allSettled`. A failure in an individual request produces an explicit partial-data state; only failure of all three Core requests is treated as a complete dashboard failure.

## Data integrity and honest UI states

The V0.1 Core does not provide Instagram analytics, publishing, scheduling or video rendering. The UI therefore does not fabricate these capabilities:

- Reach, views, saves, shares and follows: unavailable
- Scheduled/published pipeline: unavailable
- Retention and prediction confidence: unavailable
- Preview: explicitly a structured preview, not a rendered video
- Pre-publish score: heuristic content score, not a probability of virality
- Time range: a presentation-level selection; Core counters retain their stated 24-hour/all-time basis

Experiments, Analytics, Settings and other views without a Core contract show a pending/unavailable state rather than implying live functionality.

## RSS sources

The documented live run used:

- OpenAI News
- Google AI
- Hugging Face Blog
- TechCrunch AI
- Ars Technica AI

Collector failures are isolated per source. A single feed failure does not abort the entire scan.

## Scoring and content generation

The Core calculates eleven deterministic sub-scores and a weighted overall score from 0 to 100. The UI labels this value as a heuristic content score.

When `OPENAI_API_KEY` is configured, `GenerationService` uses the structured OpenAI provider. Without a key, or during a temporary provider failure, the workflow remains available through the explicitly identified `local-grounded` provider. The frontend never calls OpenAI directly.

Both paths produce a validated content package containing a hook, first frame, reel script, scene plan, on-screen text, demo/proof, template, caption, CTA, five hashtags, thumbnail text, content scores, pre-publish score, test hypothesis, success signal and claim check.

## Test results

Run the complete local suite:

```bash
npm run test:all
```

Run individual checks:

```bash
.venv/bin/pytest
npm run lint
npm test
```

Run the live full-stack test:

```bash
npm run test:e2e:live
```

### 1. Passed tests — documented Gold Master run

The recorded final validation dated 29 August 2026 reports:

| Gate | Result | Evidence recorded |
| --- | --- | --- |
| Clean `npm ci` | **PASS** | 677 packages installed |
| Clean Python installation | **PASS** | Requirements installed |
| Backend pytest | **PASS** | 6/6 tests |
| ESLint | **PASS** | 0 lint errors |
| Frontend, components, adapters and SSR | **PASS** | 15/15 tests |
| Production build | **PASS** | All five documented Vinext build phases |
| Production runtime | **PASS** | Dashboard, `/health` and proxy stats responded |
| Real full-stack E2E | **PASS** | `LIVE_PREMIUM_E2E_OK` |

The final clean E2E run used five live RSS sources, processed 129 raw feed items into 128 story clusters, generated a content package from a ranked story, persisted an approval decision and verified the `approved` state after reloading through a new service/adapter instance.

**Recorded automated test total: 21 passed, 0 failed** (6 backend + 15 frontend/adapter/component/SSR tests).

### 2. Failed tests — explicit failure record

**No failing automated tests were recorded in the documented Gold Master validation.**

| Failure category | Recorded result |
| --- | --- |
| Backend pytest failures | **0** |
| Frontend/adapter/component/SSR failures | **0** |
| ESLint errors | **0** |
| Production build failures | **0** |
| Live full-stack E2E failures | **0** |

This is a statement about the cited historical validation run, not a guarantee that every environment or future commit will pass. The repository's current CI status must be checked independently; the historical test report does not establish a current green GitHub Actions run.

### 3. Not run / not verified — do not interpret as a pass

| Area | Status | Boundary |
| --- | --- | --- |
| External OpenAI provider | **NOT RUN** | No API key was supplied for the recorded validation; the local-grounded path was tested |
| PostgreSQL production database | **NOT VERIFIED** | The documented end-to-end run used local SQLite |
| Hosted deployment | **NOT VERIFIED** | No hosted production deployment was established by the recorded test |
| Authentication and multi-user isolation | **NOT IMPLEMENTED / NOT VERIFIED** | V0.1 is a local/internal application baseline |
| GitHub Actions CI | **NOT VERIFIED** | No workflow run was available in the recorded repository review |
| Instagram publishing, scheduling and analytics | **OUT OF SCOPE** | Not implemented in V0.1 |

### 4. Non-blocking observations and follow-up work

- The OpenAI quality provider was not called without an API key; the tested `local-grounded` path remained functional.
- Vinext emitted an informational notice that the dynamic API proxy route could not be statically classified. Build, SSR, routing and runtime checks passed.
- Miniflare could not load the optional Cloudflare `Request.cf` object in the test environment and used its local fallback. The E2E run still passed.
- Live RSS results depend on external source availability; per-source error isolation is part of the Core.
- Historical iPad UX feedback identified opportunities to clarify approved-content inspection and navigation destinations. These are product follow-ups, not failed automated tests.

## Out of scope for V0.1

- Instagram API integration and automated publishing
- Scheduling
- Reel rendering, TTS, subtitles or FFmpeg
- ML-based virality prediction
- Authentication, billing and multi-tenancy
- DM/comment automation
- Agent orchestration
- ALPHA-ENGINE-V3 features

## Source checkpoint and integrity

The documented final source archive is:

`ALPHA_CREATOR_V0.1_INTEGRATED_SOURCE_CHECKPOINT.zip`

Recorded SHA-256:

`4573494c1c6196eeda789b60274e0a22c13b2cc3f777b59c2dce1d1be65dcc08`

Verify the separately supplied checksum file before using the archive:

```bash
sha256sum -c ALPHA_CREATOR_V0.1_INTEGRATED_SOURCE_CHECKPOINT_SHA256.txt
```

The archive is documented as containing source, frontend, backend, tests, migrations, scripts, configuration and completion documentation. It excludes `.env`, secrets, `node_modules`, `.venv`, databases, caches, logs, temporary artifacts, old input ZIPs and build output.

For additional technical detail, see `DEVELOPMENT_HANDOFF.md` and `CURRENT_STATE.md`.

---

**Verification principle:** PASS means a test was recorded as passing in the referenced Gold Master validation. NOT RUN, NOT VERIFIED and OUT OF SCOPE are intentionally distinct from PASS.
