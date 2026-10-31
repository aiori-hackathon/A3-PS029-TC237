from fastapi import APIRouter
from fastapi.responses import FileResponse, PlainTextResponse
from backend.app.core.config import settings
from backend.app.services.storage import storage_service

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/export/csv")
def export_csv():
    """Download full 16-column experiment dataset as CSV."""
    if not settings.RESULTS_CSV.exists():
        storage_service._init_files()
    return FileResponse(
        path=str(settings.RESULTS_CSV),
        media_type="text/csv",
        filename="develite_qoo_experiment_results.csv"
    )

@router.get("/export/json")
def export_json():
    """Download full experiment dataset with complete profile snapshots as JSON."""
    if not settings.RESULTS_JSON.exists():
        storage_service._init_files()
    return FileResponse(
        path=str(settings.RESULTS_JSON),
        media_type="application/json",
        filename="develite_qoo_experiment_results.json"
    )

@router.get("/export/summary-csv")
def export_summary_csv():
    """Download aggregate statistical summary table as CSV."""
    storage_service.recompute_summaries()
    return FileResponse(
        path=str(settings.SUMMARY_CSV),
        media_type="text/csv",
        filename="develite_qoo_statistical_summary.csv"
    )

@router.get("/summary", response_class=PlainTextResponse)
def get_summary_report():
    """Return formatted Markdown report of experimental findings."""
    summaries = storage_service.recompute_summaries()
    lines = [
        "# Executive Experiment Summary Report (PS-029)",
        "**Project:** Application-Oriented Network Quality Evaluation Using QoO",
        "**Team:** Team DevElite (Code: `A3-PS029-TC237`)",
        "**Hackathon:** AIORI-3 Internet Measurement Hackathon",
        "**Specification:** `draft-ietf-ippm-qoo` / Testbed `cj-ike-kunze/ietf-126-hackathon-qoo`\n",
        "## 1. Scenario Results & Utility Band Classifications\n",
        "| Scenario | Impairment (D/J/L) | Profile | Mean QoO | Band | RTT (ms) | Throughput (Mbps) | App Metric |",
        "| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |"
    ]
    for s in summaries:
        imp = f"{s['delay_ms']}ms / {s['jitter_ms']}ms / {s['loss_pct']}%"
        lines.append(f"| **{s['scenario_id']}** | {imp} | {s['profile_name']} | **{s['qoo_mean']:.3f}** (±{s['qoo_std']:.2f}) | `{s['qoo_band']}` | {s['rtt_mean_ms']:.1f} | {s['throughput_mean_mbps']:.1f} | `{s['app_metric_name']}`={s['app_metric_mean']:.2f} |")

    lines.append("\n## 2. Key Scientific Findings\n")
    lines.append("1. **Asymmetric Jitter Sensitivity (S3):** Real-time interactive communication degrades under 30ms jitter due to strict conversational packet arrival bounds, while buffered streaming/transfer applications absorb delay variations transparently.")
    lines.append("2. **High Latency Divergence (S2):** At 150ms delay, real-time interactive traffic drops into Critical band, whereas elastic bulk file transfer and buffered video maintain Acceptable utility.")
    lines.append("3. **Packet Loss Throttling (S4-S6):** High packet loss throttles TCP throughput and collapses QoO scores across all profiles.")

    return "\n".join(lines)
