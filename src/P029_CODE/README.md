# DevElite – QoO Network Evaluation Platform
### Problem Statement PS-029 | AIORI Hackathon 3 – Internet Measurement
**Team:** Team DevElite (Code: `A3-PS029-TC237`)
**Specification:** [`draft-ietf-ippm-qoo`](https://datatracker.ietf.org/doc/draft-ietf-ippm-qoo/)
**Testbed Framework:** [`cj-ike-kunze/ietf-126-hackathon-qoo`](https://github.com/cj-ike-kunze/ietf-126-hackathon-qoo)

---

## Overview

This repository contains the **complete, functional experiment platform** for PS-029: *Application-Oriented Network Quality Evaluation Using QoO (Quality of Outcome)*.

Traditional QoS metrics (latency, jitter, packet loss) do not express whether a specific application can tolerate those conditions. This project evaluates **two application profiles** under **six controlled network impairment scenarios** using the IETF QoO framework to demonstrate that identical network conditions produce **asymmetrically different user outcome assessments** depending on the application's declared parameter bounds.

---

## Features

- 🔬 **12-Step Automated Experiment Harness** — profile selection → impairment injection → active probing → QoO evaluation → record storage → baseline reset
- 📊 **7-Page React Dashboard** — Main Dashboard, Profiles, Scenarios, Run Experiment, Results, History, Reports
- 🌐 **FastAPI REST Backend** with full OpenAPI documentation (`/docs`)
- 🔧 **Two Application Profiles** (Profile A: Real-Time Video Communication, Profile B: Bulk File Transfer)
- 🌩️ **Six Impairment Scenarios** (S1 Baseline → S6 Combined Delay+Jitter+Loss)
- 🐳 **Full Docker Compose Testbed** — Gateway, Server, Client, QoO Engine, InfluxDB, Grafana, Backend, Frontend
- 📁 **CSV + JSON dataset export** conforming to `docs/schema.md`
- 🛡️ **Safety guarantees** — baseline reset before, between, and after every run; impairments never touch host network
- 📈 **Grafana + InfluxDB** time-series telemetry integration
- 🧪 **Test suite** for QoO engine, harness, storage, and API endpoints

---

## Project Structure

```
DevElite-QoO/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── api/                # REST endpoint routers
│   │   ├── core/               # Config and logging
│   │   ├── models/             # Pydantic data models
│   │   └── services/           # Harness, QoO engine, storage, gateway, collector
│   ├── tests/                  # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React + TypeScript + Vite dashboard
│   ├── src/
│   │   ├── pages/              # 7 dashboard pages
│   │   ├── components/         # Shared UI components
│   │   ├── services/api.ts     # API client service
│   │   └── types/              # TypeScript interfaces
│   ├── package.json
│   └── Dockerfile
├── testbed/                    # Container-based testbed components
│   ├── gateway/                # tc-netem REST API gateway
│   ├── server/                 # Application traffic & DASH media server
│   ├── client/                 # Active probe & goDASH client
│   ├── qoo-engine/             # IETF QoO calculation microservice
│   ├── influxdb/               # InfluxDB configuration
│   └── grafana/                # Grafana provisioning
├── config/                     # Scenarios and profiles
│   ├── scenarios.json          # 6-scenario impairment matrix
│   └── profiles/               # Profile A and B JSON files
├── data/                       # Experiment dataset (CSV + JSON)
├── docs/                       # Documentation
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for full testbed)
- [Node.js](https://nodejs.org/) v18+ (for frontend dev server)
- [Python](https://www.python.org/) 3.11+ (for backend dev server)
- [Git](https://git-scm.com/)

---

## Quick Start — Full Docker Testbed

```bash
# 1. Clone the repository
git clone <your-repo-url> DevElite-QoO
cd DevElite-QoO

# 2. Copy environment configuration
cp .env.example .env

# 3. Build and launch all containers
docker compose up --build

# 4. Open the dashboard
#    React Dashboard:  http://localhost:3000
#    FastAPI Docs:     http://localhost:8001/docs
#    Grafana:          http://localhost:3001  (admin/admin)
#    InfluxDB:         http://localhost:8086
```

---

## Development Setup (Without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
# Set gateway URL if testbed is running
export GATEWAY_URL=http://localhost:8000
uvicorn backend.app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive OpenAPI UI.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` for the React dashboard.

The Vite dev server proxies `/api/*` to the backend at `http://localhost:8000`.

---

## Running Experiments

### Via Dashboard (Recommended)

1. Open `http://localhost:3000`
2. Navigate to **Run Experiment**
3. Select **Profile A** or **Profile B**
4. Select one of the **6 Scenarios** (S1–S6)
5. Set number of **Repetitions**
6. Click **Start Experiment**
7. Watch live execution logs
8. View results in **Results & Analysis** and **Experiment History**

### Via REST API

```bash
# Run single experiment
curl -X POST http://localhost:8000/api/experiments/run \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "profile-realtime-video", "scenario_id": "S3", "repeats": 3}'

# Run full comparison matrix (both profiles × all 6 scenarios)
curl -X POST http://localhost:8000/api/experiments/batch \
  -H "Content-Type: application/json" \
  -d '{"profile_ids": ["profile-realtime-video","profile-bulk-transfer"], "scenario_ids": ["S1","S2","S3","S4","S5","S6"], "repeats": 3}'
```

### Via Python Harness (CLI)

```bash
cd backend
python -m backend.app.services.harness
```

---

## Exporting Results

| Format | URL |
|--------|-----|
| CSV Dataset | `GET /api/reports/export/csv` |
| JSON Dataset | `GET /api/reports/export/json` |
| Summary CSV | `GET /api/reports/export/summary-csv` |
| Markdown Report | `GET /api/reports/summary` |

From the dashboard: **Reports & Downloads → Download CSV / JSON**.

---

## Application Profiles

| Profile | ID | App Metric | Status |
|---------|-----|-----------|--------|
| Real-Time Video Communication | `profile-realtime-video` | `frame_freeze_rate_pct` | ⚠️ Pending Mentor Approval |
| Bulk File Transfer | `profile-bulk-transfer` | `transfer_goodput_ratio` | ⚠️ Pending Mentor Approval |

> **Important:** All profile threshold values are proposed initial candidates marked `PROPOSED_PENDING_MENTOR_APPROVAL`. They must be confirmed by the hackathon mentor before final submission of reported results.

---

## Network Impairment Scenarios

| ID | Name | Delay | Jitter | Loss |
|----|------|-------|--------|------|
| S1 | Baseline Network | 0ms | 0ms | 0% |
| S2 | High Delay | 150ms | 0ms | 0% |
| S3 | High Jitter | 50ms | 30ms | 0% |
| S4 | Packet Loss | 0ms | 0ms | 1.5% |
| S5 | Combined Delay and Jitter | 100ms | 25ms | 0% |
| S6 | Combined Delay, Jitter and Loss | 100ms | 20ms | 2% |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all application profiles |
| GET | `/api/profiles/{id}` | Get specific profile |
| PUT | `/api/profiles/{id}` | Update profile parameters |
| POST | `/api/profiles/import` | Import profile JSON |
| GET | `/api/scenarios` | List all 6 scenarios |
| PUT | `/api/scenarios/{id}` | Update scenario parameters |
| POST | `/api/scenarios/reset` | Safe baseline network reset |
| POST | `/api/experiments/run` | Execute single experiment |
| POST | `/api/experiments/batch` | Execute matrix batch |
| GET | `/api/experiments` | List experiment history |
| GET | `/api/experiments/{id}` | Get experiment detail |
| GET | `/api/experiments/{id}/logs` | Get harness execution logs |
| POST | `/api/experiments/{id}/cancel` | Cancel active experiment |
| GET | `/api/results/statistics` | Statistical aggregations |
| GET | `/api/results/compare` | Profile comparison analysis |
| GET | `/api/reports/export/csv` | Download results CSV |
| GET | `/api/reports/export/json` | Download results JSON |

Full interactive docs at: `http://localhost:8000/docs`

---

## Testing

```bash
cd backend
pip install pytest
pytest tests/ -v
```

Test coverage includes:
- QoO engine band classification
- QoO evaluation (baseline and severe impairment)
- Experiment harness execution
- Experiment cancellation and baseline reset
- Storage persistence (CSV and JSON)
- Statistical summary computation

---

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │    │   FastAPI    │    │   Gateway    │
│  React App   │───▶│   Backend    │───▶│  tc-netem    │
│  Port 3000   │    │  Port 8000   │    │  Port 8000   │
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │                   │ Apply
                    ┌──────▼───────┐    ┌──────▼───────┐
                    │   QoO        │    │   Client     │
                    │   Engine     │    │   Container  │
                    │  Port 8085   │    │  (probes)    │
                    └──────────────┘    └──────┬───────┘
                                              │
                    ┌──────────────┐    ┌──────▼───────┐
                    │   Grafana    │    │   Server     │
                    │  Port 3001   │    │  DASH+iperf  │
                    └──────┬───────┘    │  Port 8080   │
                           │            └──────────────┘
                    ┌──────▼───────┐
                    │   InfluxDB   │
                    │  Port 8086   │
                    └──────────────┘
```

---

## Key Scientific Findings

1. **Jitter Asymmetry (S3):** Real-time interactive communication degrades severely under 30ms jitter due to strict packet inter-arrival requirements, while buffered bulk transfer absorbs the variation transparently.

2. **High Latency Divergence (S2):** At 150ms delay, real-time video drops to **Critical** band, whereas bulk transfer remains **Acceptable** due to its delay-tolerant TCP nature.

3. **Packet Loss Throttling (S4–S6):** Elevated packet loss throttles TCP goodput and collapses both profiles — demonstrating QoO score convergence at extreme conditions.

---

## Limitations

- Profile threshold values are proposed candidates pending mentor approval.
- goDASH binary integration requires the full Docker testbed. The platform gracefully emulates metrics when goDASH is unavailable.
- tc-netem impairment application requires `NET_ADMIN` capability inside the gateway container.
- InfluxDB push is optional; the platform operates fully with CSV/JSON storage only.

---

## References

- IETF IPPM WG, `draft-ietf-ippm-qoo` — Quality of Outcome Framework
- cj-ike-kunze/ietf-126-hackathon-qoo — Reference Testbed Implementation
- RFC 4594 — DiffServ Service Classes
- RFC 8835 — WebRTC Transport Requirements
- RFC 3168 — ECN and TCP Congestion
- RFC 5348 — TCP Friendly Rate Control (Mathis Formula)
