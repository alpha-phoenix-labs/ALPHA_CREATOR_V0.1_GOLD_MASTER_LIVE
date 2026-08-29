# ALPHA CREATOR V0.1 - Integration Contract Matrix

Stand: 29.08.2026

## Integrationsregel

Der Core-Checkpoint bleibt die technische Wahrheit und Regression-Baseline. Backend-Schemas und Datenmodelle werden fuer die Premium-Oberflaeche nicht umgebaut. `DashboardApiAdapter` uebersetzt die vorhandenen Core-Antworten in reine Frontend-Presentation-Contracts; UI-Komponenten importieren weder Backend-Modelle noch Mock-Fixtures.

```text
Premium UI -> DashboardService -> DashboardApiAdapter -> /api/v1 -> FastAPI Core
```

## Mapping-Matrix

| Core Response | Adapter/Mapper | Frontend Presentation Contract | Datenstatus |
| --- | --- | --- | --- |
| `GET /api/v1/dashboard/stats` | `mapDashboardStats` | `MetricCardData[]`, Teile von `PipelineStage[]`, `SystemStatus` | real |
| `GET /api/v1/stories` | `mapStoryToOpportunity` | `Opportunity[]` | real; Core-Heuristik |
| `StoryRead.score.total_score` | Opportunity-Mapper | `Opportunity.score` | real; heuristischer Content-Score, keine Viralitaetswahrscheinlichkeit |
| `StoryRead.score.topic_momentum` | Opportunity-Mapper | Opportunity-Signal `topicMomentum` | real; heuristisch |
| `StoryRead.score.audience_fit` | Opportunity-Mapper | Opportunity-Signal `audienceFit` | real; heuristisch |
| `StoryRead.score.visual_demonstrability` | Opportunity-Mapper | Opportunity-Signal `visualDemonstrability` | real; heuristisch |
| `GET /api/v1/content` | `mapContentToPerformance` | `ContentPerformance[]`, Content-Pipeline | real |
| `ContentItemRead.payload` | `mapContentToIntelligence` | `ContentPreview`, `ViralPrediction`, `AlphaInsight[]` | real/derived aus gespeichertem Core-Paket |
| `payload.pre_publish_viral_score` | Intelligence-Mapper | Prediction-Gesamtscore | real; heuristischer Pre-Publish-Score, keine Wahrscheinlichkeit |
| `payload.scores.hook_strength` | Intelligence-Mapper | `hookStrength` | real; heuristisch |
| `payload.scores.share_potential` | Intelligence-Mapper | `sharePotential` | real; heuristisch |
| `payload.scores.save_potential` | Intelligence-Mapper | `savePotential` | real; heuristisch |
| `payload.scores.follow_conversion` | Intelligence-Mapper | `followConversion` | real; heuristisch |
| `payload.scores.novelty` | Intelligence-Mapper | `novelty` | real; heuristisch |
| `payload.why_it_could_work` | Intelligence-Mapper | ALPHA Insight | derived aus Core-Output |
| `payload.what_is_being_tested` | Intelligence-Mapper | ALPHA Insight | derived aus Core-Output |
| `payload.claim_check` | Intelligence-Mapper | Validation-/Claim-Insight | real/derived aus Core-Output |
| `POST /api/v1/radar/scan` | `DashboardApiAdapter.scanRadar` | Scan-Aktion + anschliessender Dashboard-Reload | real |
| `POST /api/v1/stories/{id}/generate` | `DashboardApiAdapter.generateFromOpportunity` | Create Flow + neues Review-Content | real |
| `POST /api/v1/content/{id}/decision` | `DashboardApiAdapter.decideContent` | Approve/Reject + persistierter Status | real |

## Dokumentierte Contract-Mismatches

| Frontend-Anforderung | Core V0.1 | Integrationsentscheidung |
| --- | --- | --- |
| Ein aggregiertes `DashboardState`-Payload | Core liefert Stats, Stories und Content getrennt | Frontend-Adapter aggregiert mit unabhaengiger Fehlerbehandlung |
| KPI-Deltas und Sparklines | nicht vorhanden | nicht erfinden; im Presentation Contract optional/unavailable |
| Instagram Reach, Views, Saves, Shares, Follows | keine Instagram API/Analytics in V0.1 | als unavailable kennzeichnen und `-` darstellen |
| Zeitraeume `today`, `7d`, `30d`, `90d`, `custom` | nur `stories_last_24h` und All-Time-Zaehler | Control bleibt sichtbar; jede Kennzahl nennt ihre reale Zeitbasis, keine Scheinfilterung |
| Viral Prediction Confidence | nicht vorhanden | optional/unavailable; kein Ersatzwert |
| Retention-Score | nicht vorhanden | optional/unavailable; kein Ersatzwert |
| Competition/Whitespace | nicht vorhanden | Signal entfernen/als unavailable markieren; keine Low-Saturation-Behauptung |
| Scheduled/Published Pipeline | keine Scheduling-/Publishing-Funktionen | Pipeline-Stufen sichtbar, aber unavailable statt `0` |
| Freie Create-Brief-Eingaben | Core generiert ausschliesslich aus gespeicherten Storys | V0.1 Create Flow waehlt eine reale Opportunity/Story und ruft Generate auf |
| Duplicate/Optimize/Template/Archive | keine Core-Kommandos | keine lokale Scheinpersistenz; Aktionen als pending/unavailable ausweisen |
| Next Best Action fuer Publishing-Zeit | keine Instagram-Aktivitaetsdaten | nicht erzeugen; bei Review nur echte Approve/Reject-Entscheidung anbieten |
| Systemstatus aus einem Dashboard-Aggregat | Core liefert Stats und `/health` getrennt | Adapter nutzt reale Endpoint-Erreichbarkeit und Source-Zaehler; keine direkte UI-Health-Kopplung |
| `PipelineStageId` ohne `rejected` | Core kennt `rejected` | Frontend-Contract um `rejected` ergaenzen |
| Frontend `DashboardApiAdapter` erwartete `/api/alpha-creator/dashboard` | Core nutzt `/api/v1/*` | Adapter auf vorhandene Core-Endpunkte umstellen; kein neuer Core-Aggregationsendpoint |
| Default-Service verwendete MockAdapter | integrierter Stand muss reale Daten verwenden | Default auf `DashboardApiAdapter`; MockAdapter bleibt nur fuer isolierte UI-Tests |

## Core-Aenderungsentscheidung

Fuer dieses Mapping ist keine Backend-/Core-Dateiaenderung erforderlich. Die bestehende API deckt Scan, Ranking, Generation, Review, Entscheidung, Persistenz und Reload ab. Alle strukturellen Unterschiede werden im Frontend-Adapter geloest.
