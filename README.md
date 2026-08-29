# ALPHA CREATOR V0.1 — Integrated Checkpoint

**KI Content Intelligence & Growth Engine**  
**Finaler lokaler Integrationsstand: 29.08.2026**

ALPHA CREATOR V0.1 ist ein lokal vollständig funktionsfähiger modularer Monolith. Dieser Stand verbindet den unveränderten, getesteten FastAPI-Core des Core-Checkpoints mit der Premium-UI des Frontend-Checkpoints über eine explizite Service-/Adapter-Grenze.

Der reale V0.1-Produktpfad ist:

`REAL RSS → SCAN → NORMALIZE → DEDUPLICATE → SCORE/RANK → PREMIUM FRONTEND → GENERATE → REVIEW → APPROVE/REJECT → DATABASE → CONTENT LIBRARY → RELOAD`

## Integrationsstatus

- Core-Checkpoint: technische Regression-Baseline
- Premium-Frontend-Checkpoint: UI/UX-Zielbasis
- Backend-Core-Dateien gegenüber der Baseline geändert: **nein**
- Standard-Datenquelle des Frontends: **reale Core-API**
- Mock-Daten: nur explizit aktivierbarer UI-/Testmodus
- Lokaler Full-Stack-E2E mit fünf realen RSS-Quellen: **bestanden**
- Clean Installation, Lint, Production Build, SSR, Tests und Production Runtime: **bestanden**

Die vollständige Contract-Matrix und alle bekannten Strukturunterschiede stehen in `INTEGRATION_CONTRACT_MATRIX.md`.

## Architektur

```text
Premium React UI
    ↓ Presentation Contracts
DashboardService
    ↓ DashboardAdapter
DashboardApiAdapter
    ↓ /api/v1 serverseitiger Frontend-Proxy
FastAPI Core
    ├── RSS Collectors
    ├── Normalisierung und Deduplizierung
    ├── deterministisches Scoring
    ├── strukturierte Generation
    ├── Review-/Approval-Workflow
    └── SQLAlchemy / Alembic
            ↓
      SQLite lokal / PostgreSQL produktiv
```

Die UI importiert keine Backend-Modelle und keine Mock-Fixtures. Sie ruft weder Instagram noch OpenAI direkt auf. `DashboardApiAdapter` übersetzt vorhandene Core-Antworten in reine Frontend-Presentation-Contracts. Unterschiede zwischen Core- und UI-Strukturen werden nicht durch einen Umbau des Core kaschiert.

## Repository-Struktur

```text
adapters/                         Adapter-Interface, API- und Mock-Adapter
app/                              Vinext/React-Routen und serverseitiger API-Proxy
backend/app/                      unveränderter FastAPI-Core
backend/alembic/                  Datenbankmigrationen
backend/tests/                    Core-, Collector-, Processing- und API-Tests
components/alpha/                 ALPHA Design-System-Komponenten
components/dashboard/             Premium-Dashboard und UI-Zustände
data/                             ausschließlich Mock-Fixture für expliziten Testmodus
scripts/                          Installation, Start, Tests und reales Live-E2E
services/                         DashboardService
tests/                            Frontend-, Adapter-, Komponenten- und SSR-Tests
types/                            Frontend-Presentation-Contracts
worker/                           Vinext/Cloudflare-Entry
.openai/hosting.json              von vite.config.ts benötigte Hosting-Konfiguration
build/sites-vite-plugin.ts        von vite.config.ts benötigtes Build-Plugin
```

## Voraussetzungen

- Python 3.12+
- Node.js mindestens 22.13.0
- npm mit Unterstützung für `npm ci`
- Internetzugriff für Dependency-Installation und reale RSS-Scans
- optional PostgreSQL für Shared/Production
- optional ein OpenAI API-Key für den strukturierten OpenAI-Provider

Final geprüft mit Python 3.12.13, Node.js 24.19.0 und npm 11.9.0.

## Reproduzierbare lokale Installation

Aus einem frischen Source-Checkpoint ohne `node_modules`, `.venv`, Cache oder Build-Ausgabe:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm ci
cp .env.example .env
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

`cp .env.example .env` ist optional. Ohne `.env` verwendet der Core die sichere lokale SQLite-Konfiguration und den faktengebundenen `local-grounded`-Generator.

Für die Sites-spezifische, gelockte Installationsumgebung existiert zusätzlich:

```bash
npm run install:ci
```

Dieses Script richtet projektlokale Tool-Caches ein, prüft den integritätsgebundenen Vinext-Tarball und führt genau ein begrenztes `npm ci` aus. Für eine normale lokale Installation ist `npm ci` der direkte Pfad.

## Environment Variables

| Variable | Zweck | Sicherer Default |
| --- | --- | --- |
| `APP_NAME` | API-Anzeigename | `ALPHA CREATOR` |
| `APP_ENV` | Laufzeitumgebung | `development` |
| `APP_DEBUG` | Debugmodus | `false` |
| `API_PREFIX` | Core-API-Präfix | `/api/v1` |
| `DATABASE_URL` | SQLAlchemy-Verbindung | `sqlite:///./backend/data/alpha_creator.db` |
| `OPENAI_API_KEY` | aktiviert den OpenAI-Provider | leer |
| `OPENAI_MODEL` | Modellwahl hinter der Provider-Grenze | `gpt-5-mini` |
| `ALPHA_BACKEND_URL` | serverseitiges Ziel des Frontend-Proxys | `http://127.0.0.1:8000` |
| `CORS_ORIGINS` | erlaubte Origins bei direktem API-Zugriff | lokale Origins |
| `COLLECTOR_TIMEOUT_SECONDS` | Timeout pro Quelle | `10` |
| `COLLECTOR_MAX_ITEMS_PER_SOURCE` | Feed-Limit | `35` |
| `COLLECTOR_RETRIES` | kontrollierte Retries | `1` |
| `DEDUPE_THRESHOLD` | RapidFuzz-Schwellwert | `88` |
| `NEXT_PUBLIC_ALPHA_DASHBOARD_SOURCE` | `api` oder expliziter `mock`-Modus | `api` |

Echte Secrets gehören ausschließlich in eine lokale `.env` oder in die Secret-Verwaltung der Laufzeit. `.env` wird ignoriert und ist nicht Bestandteil des finalen Source-Checkpoints.

## Lokaler Start

Komplettes Entwicklungssystem mit einem Befehl:

```bash
npm run dev:full
```

Danach:

- Premium-Frontend: `http://127.0.0.1:3000/dashboard`
- Backend-Health: `http://127.0.0.1:8000/health`
- FastAPI-Dokumentation: `http://127.0.0.1:8000/docs`

Alternativ in zwei Terminals:

```bash
.venv/bin/uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
ALPHA_BACKEND_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 3000
```

## Production Build und lokaler Production-Start

```bash
npm run build
ALPHA_BACKEND_URL=http://127.0.0.1:8000 npm start -- --host 127.0.0.1 --port 4173
```

Der Production Build umfasst Client-, Server-, React-Server-Component- und SSR-Phasen. Der Backend-Prozess muss separat laufen.

## Datenbank

Lokale Initialisierung:

```bash
mkdir -p backend/data
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

PostgreSQL-Beispiel für Shared/Production:

```bash
export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:5432/alpha_creator'
.venv/bin/alembic -c backend/alembic.ini upgrade head
```

V0.1-Entitäten:

- Sources
- Stories
- Story Scores
- Generations
- Content Items
- Approval Decisions

Die initiale Migration liegt in `backend/alembic/versions/73a80eba9096_initial_schema.py`.

## Core API

| Methode | Endpoint | Funktion |
| --- | --- | --- |
| `GET` | `/health` | Service-, Datenbank- und Generierungsstatus |
| `POST` | `/api/v1/radar/scan` | Quellen scannen, normalisieren, deduplizieren und ranken |
| `GET` | `/api/v1/stories` | gerankte Storys |
| `GET` | `/api/v1/stories/{story_id}` | Story-Details und Scores |
| `POST` | `/api/v1/stories/{story_id}/generate` | strukturiertes Content-Paket erzeugen |
| `GET` | `/api/v1/content` | persistente Content Library |
| `GET` | `/api/v1/content/{content_id}` | einzelnes Content-Paket |
| `POST` | `/api/v1/content/{content_id}/decision` | freigeben oder ablehnen |
| `GET` | `/api/v1/dashboard/stats` | Core-Dashboard-Zähler |

Der Frontend-Proxy unter `app/api/v1/[...path]/route.ts` erlaubt nur `GET` und `POST`, validiert das Backend-Ziel und gibt keine Backend-Credentials an den Browser weiter.

## Premium-Frontend

Integriert und mit realen Core-Daten verbunden sind:

- App Shell, Sidebar, mobile Navigation und Top Bar
- Content Pipeline
- KPI Cards
- Top Opportunities aus gerankten Core-Storys
- Recent Content aus der persistenten Content Library
- strukturierte Live Preview
- heuristisch gekennzeichnete Viral Prediction
- ALPHA Insights aus dem gespeicherten Core-Paket
- reale Next Best Action für Review/Approve/Reject
- Presentation Time Range mit sichtbarer Core-Zeitbasis
- Systemstatus
- Create Flow aus einer realen gerankten Story
- Loading-, Empty-, Partial-Data- und Error-States
- responsive Layout-Gates
- Reduced Motion und sichtbare Focus-States

`DashboardApiAdapter.getDashboard()` aggregiert `stats`, `stories` und `content` mit `Promise.allSettled`. Einzelne Ausfälle erzeugen einen ehrlichen Partial-Data-State; erst der Ausfall aller drei Core-Anfragen wird als vollständiger Fehler behandelt.

## Ehrliche Datenkennzeichnung

Der Core liefert in V0.1 keine Instagram-Analytics, kein Publishing, kein Scheduling und kein Reel-Rendering. Deshalb werden folgende Bereiche nicht erfunden:

- Reach, Views, Saves, Shares und Follows: `unavailable`
- Scheduled/Published Pipeline: `unavailable`
- Retention und Prediction Confidence: `unavailable`
- Preview: ausdrücklich `structured-preview`, kein gerendertes Video
- Pre-Publish Score: heuristischer Content-Score, keine Viralitätswahrscheinlichkeit
- Time Range: Presentation-Auswahl; Core-Zähler behalten ihre sichtbar angegebene 24h-/All-Time-Basis

Experiments, Analytics, Settings und dedizierte Unterseiten ohne Core-Vertrag zeigen einen klaren Pending-/Unavailable-Zustand und täuschen keine Live-Funktion vor.

## Reale RSS-Quellen

- OpenAI News
- Google AI
- Hugging Face Blog
- TechCrunch AI
- Ars Technica AI

Collector-Fehler werden pro Quelle isoliert. Ein einzelner Feedfehler bricht den Gesamtscan nicht ab.

## Scoring und Generation

Der Core berechnet elf deterministische Teilscores und einen gewichteten Gesamtscore von 0 bis 100. Die UI kennzeichnet diesen Wert als heuristischen Content-Score.

Mit `OPENAI_API_KEY` verwendet `GenerationService` den strukturierten OpenAI-Provider. Ohne Schlüssel oder bei einem vorübergehenden Providerfehler bleibt der Workflow über den gekennzeichneten `local-grounded`-Provider funktionsfähig. Die UI ruft OpenAI nie direkt auf.

Beide Wege erzeugen ein validiertes Content-Paket mit Hook, First Frame, Reel-Skript, Szenenplan, On-Screen-Texten, Demo/Proof, Template, Caption, CTA, fünf Hashtags, Thumbnail-Text, Content-Scores, Pre-Publish Score, Testhypothese, Erfolgssignal und Claim Check.

## Tests

Vollständige lokale Suite:

```bash
npm run test:all
```

Einzeln:

```bash
.venv/bin/pytest
npm run lint
npm test
```

Realer Full-Stack-Test:

```bash
npm run test:e2e:live
```

Finale Ergebnisse vom 29.08.2026:

| Gate | Ergebnis |
| --- | --- |
| Clean `npm ci` | PASS — 677 Pakete installiert |
| Clean Python-Installation | PASS — `requirements.txt` vollständig installiert |
| Backend/pytest | PASS — 6/6 |
| ESLint | PASS — 0 Fehler |
| Frontend, Komponenten, Adapter und SSR | PASS — 15/15 |
| Production Build | PASS — alle fünf Vinext-Buildphasen |
| Production Runtime | PASS — Dashboard, `/health` und Proxy-Stats erreichbar |
| Real Full-Stack-E2E | PASS — `LIVE_PREMIUM_E2E_OK` |

Der finale Clean-E2E nutzte fünf reale RSS-Quellen, verarbeitete 129 Rohmeldungen zu 128 Story-Clustern, generierte aus einer gerankten Story ein Content-Paket, speicherte die Freigabe und las nach einer neuen Service-/Adapter-Instanz den Status `approved` aus der Content Library zurück.

## Bekannte nicht blockierende Hinweise

- Der OpenAI-Qualitätsmodus wurde ohne bereitgestellten API-Key nicht extern aufgerufen; der vollständige `local-grounded`-Pfad ist getestet.
- Vinext weist informativ darauf hin, dass die dynamische API-Proxyroute statisch noch nicht klassifiziert werden kann. Build, SSR, Routing und Runtime sind erfolgreich.
- Miniflare konnte in der Testumgebung das optionale Cloudflare-`Request.cf`-Objekt nicht laden und verwendete seinen vorgesehenen lokalen Fallback. Der E2E blieb erfolgreich.
- Die Live-RSS-Ergebnisse hängen naturgemäß von externen Quellen ab; Fehlerisolation ist Teil des Core.

## Bewusst außerhalb V0.1

- Instagram API und automatische Veröffentlichung
- Scheduling
- Reel-Rendering, TTS, Untertitel oder FFmpeg
- ML-basierte Viralitätsvorhersage
- Authentifizierung, Billing und Multi-Tenancy
- DM-/Kommentar-Automation
- Agent-Orchestrierung
- neue ALPHA-ENGINE-V3-Funktionen

## Export- und Wiederherstellungsregeln

Der finale Source-Checkpoint heißt:

`ALPHA_CREATOR_V0.1_INTEGRATED_SOURCE_CHECKPOINT.zip`

Er enthält Source, Frontend, Backend, Tests, Migrationen, Scripts, Konfiguration und die Abschlussdokumentation. Ausgeschlossen sind `.env`, Secrets, `node_modules`, `.venv`, Datenbanken, Cache, Logs, temporäre Artefakte, alte Input-ZIPs und Build-Ausgaben.

Die separate SHA-256-Datei muss vor Verwendung geprüft werden:

```bash
sha256sum -c ALPHA_CREATOR_V0.1_INTEGRATED_SOURCE_CHECKPOINT_SHA256.txt
```

Weitere technische Details stehen in `DEVELOPMENT_HANDOFF.md`; der kompakte Abschlusszustand steht in `CURRENT_STATE.md`.
