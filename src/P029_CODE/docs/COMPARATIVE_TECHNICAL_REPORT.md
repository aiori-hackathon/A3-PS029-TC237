# Comprehensive Technical & Comparative Report (PS-029)
## Application-Oriented Network Quality Evaluation Using QoO
**Team:** Team DevElite (Team Code: `A3-PS029-TC237`)  
**Hackathon:** AIORI Hackathon 3 – Internet Measurement  
**Problem Statement:** PS-029  
**Reference Specification:** `draft-ietf-ippm-qoo` (IETF IPPM Working Group)  
**Testbed Framework:** `cj-ike-kunze/ietf-126-hackathon-qoo`  

---

## 1. Executive Summary

Traditional Quality of Service (QoS) measurements quantify transport-layer network impairment parameters—such as round-trip time (RTT), delay variation (jitter), packet loss rate, and link throughput—in isolation. However, these scalar figures fail to express whether any given application can tolerate specific network degradation. For example, an injected one-way delay of 150 ms or a jitter variation of 30 ms induces severe degradation in real-time interactive communications, while remaining virtually imperceptible to elastic bulk data synchronization or adaptive bitrate streaming sessions.

In this research project, **Team DevElite** deployed a fully automated, idempotent experiment platform integrating the supplied IETF Quality of Outcome (QoO) framework with a containerized `tc-netem` impairment testbed. Across six controlled network scenarios (S1 through S6) evaluated over repeated measurement runs, we evaluated two distinct application profiles:
1. **Profile A: Real-Time Video Communication** (`profile-realtime-video` — proposed candidate pending mentor approval)
2. **Profile B: Bulk File Transfer** (`profile-bulk-transfer` — proposed candidate pending mentor approval)

Our empirical findings demonstrate marked **asymmetric sensitivity**: under identical network conditions, user-perceived outcome diverges across different utility bands.

---

## 2. Mathematical Foundation: IETF Quality of Outcome (QoO)

Per `draft-ietf-ippm-qoo`, QoO calculates a normalized utility score $Q \in [0.0, 1.0]$ based on declared application requirement bounds rather than an arbitrary universal score:

$$Q = \sum_{i \in \{D, J, L, T\}} w_i \cdot U_i(m_i)$$

Subject to $\sum w_i = 1.0$ and $w_i \ge 0$.

### Component Utility Functions $U_i(m_i)$

1. **Latency Utility ($U_D$):**
   $$U_D = \max\left(0, 1 - \left(\frac{\text{RTT}}{D_{\text{unusable}}}\right)^{1.2}\right)$$
   Where $D_{\text{unusable}}$ is the declared critical latency threshold (150 ms for interactive video, 1200 ms for bulk transfer).

2. **Jitter Utility ($U_J$):**
   $$U_J = \max\left(0, 1 - \left(\frac{\text{Jitter}}{J_{\text{unusable}}}\right)^{1.1}\right)$$
   Where $J_{\text{unusable}}$ defines the maximum delay variation before buffer depletion or frame drop occurs.

3. **Packet Loss Utility ($U_L$):**
   $$U_L = \max\left(0, 1 - \left(\frac{\text{Loss}}{L_{\text{unusable}}}\right)^{1.2}\right)$$
   Capturing non-linear degradation from packet loss on TCP congestion windows and RTP frame decoding.

4. **Throughput Utility ($U_T$):**
   $$U_T = \min\left(1.0, \frac{\text{Throughput}}{T_{\text{target}}}\right)$$

### Standardized IETF IPPM Utility Bands

| Utility Band | Numerical Range | Operational Meaning |
| :--- | :---: | :--- |
| **Optimal** | $[0.80, 1.00]$ | Pristine performance; all application constraints fully satisfied. |
| **Acceptable** | $[0.60, 0.80)$ | Satisfactory operation; transient delays absorbed by playout buffers. |
| **Degraded** | $[0.35, 0.60)$ | Noticeable impairment; visible video freezing or throughput throttling. |
| **Critical** | $[0.00, 0.35)$ | Severe failure; conversational breakdown or buffer starvation. |

---

## 3. Experimental Profiles & Scenarios

### A. Candidate Application Profiles (Pending Mentor Approval)

*Note: All parameters below are proposed candidates subject to formal mentor approval.*

| Parameter | Profile A: Real-Time Video Communication | Profile B: Bulk File Transfer |
| :--- | :---: | :---: |
| **Category** | Interactive Real-Time Media (WebRTC) | Elastic Bulk Data Transfer (TCP) |
| **Target Latency ($D_{\text{target}}$)** | $\le 50.0\text{ ms}$ | $\le 100.0\text{ ms}$ |
| **Acceptable Latency ($D_{\text{accept}}$)** | $\le 150.0\text{ ms}$ | $\le 400.0\text{ ms}$ |
| **Unusable Latency ($D_{\text{unusable}}$)** | $300.0\text{ ms}$ | $1200.0\text{ ms}$ |
| **Latency Weight ($w_D$)** | **0.35** | **0.05** |
| **Target Jitter ($J_{\text{target}}$)** | $\le 5.0\text{ ms}$ | $\le 20.0\text{ ms}$ |
| **Acceptable Jitter ($J_{\text{accept}}$)** | $\le 20.0\text{ ms}$ | $\le 100.0\text{ ms}$ |
| **Jitter Weight ($w_J$)** | **0.30** | **0.05** |
| **Target Loss ($L_{\text{target}}$)** | $0.0\%$ | $0.0\%$ |
| **Unusable Loss ($L_{\text{unusable}}$)** | $4.0\%$ | $3.0\%$ |
| **Loss Weight ($w_L$)** | **0.25** | **0.50** |
| **Throughput Target ($T_{\text{target}}$)** | $10.0\text{ Mbps}$ | $80.0\text{ Mbps}$ |
| **Throughput Weight ($w_T$)** | **0.10** | **0.40** |
| **Primary App Metric** | `frame_freeze_rate_pct` | `transfer_goodput_ratio` |

### B. Controlled Impairment Scenarios (S1–S6)

| Scenario ID | Name | Delay ($d$) | Jitter ($j$) | Loss ($l$) | Physical Network Analog |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **S1** | Baseline Network | $0\text{ ms}$ | $0\text{ ms}$ | $0.0\%$ | Clean dedicated optical LAN |
| **S2** | High Delay | $150\text{ ms}$ | $0\text{ ms}$ | $0.0\%$ | Geostationary satellite / intercontinental hop |
| **S3** | High Jitter | $50\text{ ms}$ | $30\text{ ms}$ | $0.0\%$ | Congested 4G/LTE or multi-hop Wi-Fi |
| **S4** | Packet Loss | $0\text{ ms}$ | $0\text{ ms}$ | $1.5\%$ | Buffer overflow / random link drops |
| **S5** | Combined Delay + Jitter | $100\text{ ms}$ | $25\text{ ms}$ | $0.0\%$ | Variable queuing delay without drops |
| **S6** | Combined Delay, Jitter + Loss | $100\text{ ms}$ | $20\text{ ms}$ | $2.0\%$ | Severely degraded mobile WAN |

---

## 4. Empirical Results & Comparative Analysis

The table below presents the aggregated empirical measurements from automated matrix execution:

| Scenario | Injected (D / J / L) | Profile | Mean QoO ($Q$) | Band | Mean RTT | Throughput | Primary App Metric |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **S1** | 0ms / 0ms / 0% | Profile A (Video Comm) | **0.991** | `Optimal` | 12.1 ms | 94.6 Mbps | `frame_freeze_rate_pct`: 0.00% |
| **S1** | 0ms / 0ms / 0% | Profile B (Bulk Transfer) | **1.000** | `Optimal` | 12.1 ms | 94.6 Mbps | `transfer_goodput_ratio`: 0.996 |
| **S2** | 150ms / 0ms / 0% | Profile A (Video Comm) | **0.647** | `Acceptable` | 312.4 ms | 82.3 Mbps | `frame_freeze_rate_pct`: 5.77% |
| **S2** | 150ms / 0ms / 0% | Profile B (Bulk Transfer) | **0.990** | `Optimal` | 312.4 ms | 82.3 Mbps | `transfer_goodput_ratio`: 0.866 |
| **S3** | 50ms / 30ms / 0% | Profile A (Video Comm) | **0.720** | `Acceptable` | 112.4 ms | 88.2 Mbps | `frame_freeze_rate_pct`: 1.50% |
| **S3** | 50ms / 30ms / 0% | Profile B (Bulk Transfer) | **0.993** | `Optimal` | 112.4 ms | 88.2 Mbps | `transfer_goodput_ratio`: 0.928 |
| **S4** | 0ms / 0ms / 1.5% | Profile A (Video Comm) | **0.803** | `Optimal` | 12.2 ms | 71.5 Mbps | `frame_freeze_rate_pct`: 2.70% |
| **S4** | 0ms / 0ms / 1.5% | Profile B (Bulk Transfer) | **0.654** | `Acceptable` | 12.2 ms | 71.5 Mbps | `transfer_goodput_ratio`: 0.753 |
| **S5** | 100ms / 25ms / 0% | Profile A (Video Comm) | **0.672** | `Acceptable` | 212.3 ms | 79.4 Mbps | `frame_freeze_rate_pct`: 4.02% |
| **S5** | 100ms / 25ms / 0% | Profile B (Bulk Transfer) | **0.975** | `Optimal` | 212.3 ms | 79.4 Mbps | `transfer_goodput_ratio`: 0.836 |
| **S6** | 100ms / 20ms / 2% | Profile A (Video Comm) | **0.545** | `Degraded` | 212.4 ms | 44.1 Mbps | `frame_freeze_rate_pct`: 6.39% |
| **S6** | 100ms / 20ms / 2% | Profile B (Bulk Transfer) | **0.495** | `Degraded` | 212.4 ms | 44.1 Mbps | `transfer_goodput_ratio`: 0.464 |

---

## 5. Key Scientific Findings

### Finding 1: High Latency Asymmetry (Scenario S2)
- At 150 ms one-way delay (312 ms measured RTT), **Profile A drops by 0.344 points to 0.647 (Acceptable/Degraded boundary)**, and frame freeze rates exceed 5.7%. Interactive conversational exchange is severely impaired.
- In contrast, **Profile B maintains an Optimal QoO of 0.990**. Because bulk data transfers are non-interactive, fixed propagation delay only marginally affects TCP window growth, leaving user utility intact.

### Finding 2: Jitter Sensitivity Asymmetry (Scenario S3)
- Under 30 ms injected jitter, Profile A's QoO falls to **0.720** with increased frame freezing due to jitter buffer expansion limits.
- Profile B scores **0.993 (Optimal)**, as packet inter-arrival jitter has zero direct impact on total file delivery completion time when TCP reordering buffers are present.

### Finding 3: Inverted Sensitivity to Packet Loss (Scenario S4)
- Under 1.5% packet loss, the sensitivity reverses:
  - **Profile A scores 0.803 (Optimal/Acceptable)** because modern video codecs employ Forward Error Correction (FEC) and packet loss concealment (PLC).
  - **Profile B drops significantly to 0.654 (Acceptable)** because packet drops trigger TCP congestion window deflation (halving `cwnd`), directly collapsing bulk goodput.

### Finding 4: Compound Impairment Convergence (Scenario S6)
- Under combined delay, jitter, and packet loss, both profiles degrade into the **Degraded** utility band ($Q_A = 0.545, Q_B = 0.495$), confirming that compound impairments overwhelm application-layer mitigation mechanisms.

---

## 6. System Architecture & Component Interaction

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Operator Web Interface (Port 3000)                │
│    React / Vite / TypeScript / Tailwind CSS / Recharts / Lucide React   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP REST Requests
┌────────────────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend Platform (Port 8000)                  │
│  - /api/profiles         - /api/experiments/run   - /api/results        │
│  - /api/scenarios        - /api/reports/export    - /api/statistics     │
└──────────────┬─────────────────────┬───────────────────┬────────────────┘
               │ tc-netem commands   │ Telemetry metrics │ QoO Evaluation
┌──────────────▼──────┐   ┌──────────▼────────┐   ┌──────▼──────────────┐
│  tc-netem Gateway   │   │ Active Collector  │   │ Supplied QoO Engine │
│  Container (8000)   │   │ ping, iperf3,     │   │ draft-ietf-ippm-qoo │
│  Interface: eth0    │   │ goDASH Client     │   │ Port 8085           │
└──────────────┬──────┘   └──────────┬────────┘   └─────────────────────┘
               │ Virtual Impairment  │ Active Traffic
┌──────────────▼─────────────────────▼────────────────────────────────────┐
│          Application Media Server (Port 8080 & iperf3: 5201)             │
│            DASH Stream Manifests, Segments & Bulk Datasets              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Conclusions & Hackathon Deliverables Summary

1. **Demonstrated Value of QoO:** Traditional QoS measurements (e.g. 150 ms delay) cannot predict user outcome without taking application profiles into account. The IETF QoO metric accurately reflects application-dependent quality degradation.
2. **Reproducibility:** All 12 experiment workflow steps are automated, parameters are persisted to `data/results.csv` and `data/results.json`, and baseline resets are guaranteed before, between, and after every run.
3. **Turnkey Deployment:** The platform is packaged with Docker Compose, FastAPI, React/TypeScript, and companion scripts, ready for hackathon mentor review.
