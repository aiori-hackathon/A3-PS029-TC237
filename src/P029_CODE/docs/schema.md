# Dataset Schema Specification (PS-029)

**Project:** Application-Oriented Network Quality Evaluation Using QoO
**Team:** Team DevElite (Code: `A3-PS029-TC237`)
**Specification:** `draft-ietf-ippm-qoo` | Testbed: `cj-ike-kunze/ietf-126-hackathon-qoo`

---

## results.csv — 16-Column Standard Schema

Every experiment run appended to `data/results.csv` conforms to the following schema:

| Column | Type | Units/Format | Description |
|--------|------|-------------|-------------|
| `experiment_id` | String | `EXP-YYYYMMDD-XXXXXX` | Globally unique experiment run identifier |
| `timestamp` | ISO-8601 | `YYYY-MM-DDTHH:MM:SSZ` | UTC timestamp at run commencement |
| `scenario_id` | Enum | `S1`–`S6` | Designated scenario ID matching `config/scenarios.json` |
| `delay_ms` | Float | ms | Injected one-way delay configured in tc-netem |
| `jitter_ms` | Float | ms | Injected delay variance (jitter) configured in tc-netem |
| `loss_pct` | Float | % | Injected packet drop percentage configured in tc-netem |
| `profile_name` | String | — | Application profile name applied to QoO evaluation |
| `profile_params_file` | String | Path | Relative path to profile JSON configuration file |
| `run_number` | Integer | 1, 2, 3… | Repetition index for statistical variance computation |
| `qoo_score` | Float | [0.0, 1.0] | Quality of Outcome score per `draft-ietf-ippm-qoo` |
| `rtt_ms` | Float | ms | Measured mean Round-Trip Time via active ICMP probes |
| `throughput_mbps` | Float | Mbps | Measured TCP payload throughput via iperf3 |
| `measured_loss_pct` | Float | % | Observed packet loss during measurement window |
| `app_metric_name` | String | — | Application-specific metric identifier |
| `app_metric_value` | Float | Metric-dependent | Value corresponding to `app_metric_name` |
| `notes` | String | Text | Execution notes, condition flags, or error context |

---

## Application Metric Definitions

### Profile A — Real-Time Video Communication
- **Metric:** `frame_freeze_rate_pct`
- **Unit:** %
- **Description:** Percentage of video frames delayed past playout deadline causing visible freeze artifact.
- **Target:** 0.0% | **Degraded:** ≥ 1.5% | **Critical:** ≥ 5.0%
- **Collection:** Derived from RTT headroom vs. conversational latency budget and packet loss keyframe drop rate.

### Profile B — Bulk File Transfer
- **Metric:** `transfer_goodput_ratio`
- **Unit:** ratio [0.0–1.0]
- **Description:** Ratio of actual delivered application payload throughput to nominal physical link capacity.
- **Target:** ≥ 0.95 | **Degraded:** ≤ 0.60 | **Critical:** ≤ 0.25
- **Collection:** Computed as `measured_throughput / nominal_link_capacity` from iperf3 measurements.

---

## QoO Band Classification

| Band | Score Range | Description |
|------|-------------|-------------|
| **Optimal** | [0.80, 1.00] | All application constraints met; zero perceptible degradation |
| **Acceptable** | [0.60, 0.80) | Minor impairment absorbed by application buffers |
| **Degraded** | [0.35, 0.60) | Noticeable degradation; application quality visible to user |
| **Critical** | [0.00, 0.35) | Severe impairment; application unusable |

---

## Value Distinction

The schema distinguishes three categories of values:

1. **Configured Values** (`delay_ms`, `jitter_ms`, `loss_pct`) — tc-netem injection parameters from `config/scenarios.json`.
2. **Measured Values** (`rtt_ms`, `throughput_mbps`, `measured_loss_pct`) — active probe measurements from ICMP/iperf3.
3. **QoO Evaluation Outputs** (`qoo_score`, `app_metric_value`) — computed by the QoO engine against declared profile bounds.
