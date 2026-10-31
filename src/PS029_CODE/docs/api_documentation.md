# API Documentation — DevElite QoO Network Evaluation Platform

**Base URL:** `http://localhost:8000`
**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)
**Alternative Docs:** `http://localhost:8000/redoc` (ReDoc)
**OpenAPI JSON:** `http://localhost:8000/api/openapi.json`

---

## Authentication

No authentication required for hackathon deployment. All endpoints are open.

---

## Health Endpoints

### `GET /`
Platform information and API map.

**Response:**
```json
{
  "status": "online",
  "project": "DevElite QoO Network Evaluation Platform",
  "team": "Team DevElite (A3-PS029-TC237)",
  "hackathon": "AIORI Hackathon 3 - Internet Measurement",
  "problem_statement": "PS-029",
  "specification": "draft-ietf-ippm-qoo"
}
```

### `GET /health`
Platform health and active gateway state.

---

## Profiles API — `/api/profiles`

### `GET /api/profiles`
Returns all configured application profiles.

### `GET /api/profiles/{profile_id}`
Returns full configuration for a specific profile by ID or name.

### `POST /api/profiles`
Create/register a new application profile. Body: profile JSON object.

### `PUT /api/profiles/{profile_id}`
Update permitted parameters of an existing profile.
Permitted update keys: `parameters`, `application_telemetry`, `description`, `status`.

**Request body example:**
```json
{
  "parameters": {
    "delay": { "acceptable_ms": 120.0, "weight": 0.35 }
  },
  "status": "MENTOR_APPROVED"
}
```

### `GET /api/profiles/{profile_id}/export`
Export profile as downloadable JSON.

### `POST /api/profiles/import`
Import a profile JSON object.

---

## Scenarios API — `/api/scenarios`

### `GET /api/scenarios`
List all 6 impairment scenarios from `config/scenarios.json`.

### `GET /api/scenarios/{scenario_id}`
Get configuration for specific scenario (e.g., `S3`).

### `PUT /api/scenarios/{scenario_id}`
Update scenario parameters.

**Request body:**
```json
{
  "delay_ms": 150.0,
  "jitter_ms": 10.0,
  "loss_pct": 0.5
}
```

### `POST /api/scenarios/reset`
Safe baseline reset — sends reset command to gateway, verifies impairments cleared.

---

## Experiments API — `/api/experiments`

### `POST /api/experiments/run`
Execute single experiment workflow.

**Request body:**
```json
{
  "profile_id": "profile-realtime-video",
  "scenario_id": "S3",
  "repeats": 3,
  "run_godash": true,
  "notes": "Jitter sensitivity test"
}
```

**Response:**
```json
{
  "run_id": "RUN-20261031-A1B2C3",
  "status": "COMPLETED",
  "records": [...],
  "duration_s": 2.45
}
```

### `POST /api/experiments/batch`
Execute full matrix comparison.

**Request body:**
```json
{
  "profile_ids": ["profile-realtime-video", "profile-bulk-transfer"],
  "scenario_ids": ["S1", "S2", "S3", "S4", "S5", "S6"],
  "repeats": 3
}
```

### `GET /api/experiments`
List all historical experiments. Query params: `profile`, `scenario`, `search`.

### `GET /api/experiments/{experiment_id}`
Get full experiment record with profile parameter snapshot.

### `GET /api/experiments/{run_id}/logs`
Retrieve harness execution log for a run.

### `POST /api/experiments/{run_id}/cancel`
Cancel active experiment and trigger emergency baseline reset.

---

## Results API — `/api/results`

### `GET /api/results`
All experiment records.

### `GET /api/results/statistics`
Statistical summaries (mean, std, min, max, band) per (scenario, profile) cell.

### `GET /api/results/compare`
Cross-profile comparison with divergence insights per scenario.

---

## Reports API — `/api/reports`

### `GET /api/reports/export/csv`
Download full 16-column `results.csv`.

### `GET /api/reports/export/json`
Download full `results.json` with profile parameter snapshots.

### `GET /api/reports/export/summary-csv`
Download aggregated `summary.csv` with statistical summaries.

### `GET /api/reports/summary`
Returns Markdown-formatted executive summary report.

---

## Gateway Passthrough (Direct Testbed Control)

The gateway container also exposes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/baseline` | POST | Reset all impairments (0/0/0) |
| `/custom` | POST | Inject `{"delay":X,"jitter":Y,"loss":Z}` |
| `/qoo-profiles` | GET/POST | View/register QoO profiles |
| `/evaluate` | POST | Live QoO calculation |
| `/api/results` | GET/POST | Direct dataset access |
