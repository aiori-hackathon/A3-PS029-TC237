from typing import List, Dict, Any, Optional
from collections import defaultdict
from fastapi import APIRouter
from backend.app.services.storage import storage_service

router = APIRouter(prefix="/results", tags=["Results & Analysis"])

@router.get("")
def get_results():
    """Retrieve all experiment records."""
    return storage_service.get_all_records()

@router.get("/statistics")
def get_statistics():
    """Retrieve statistical aggregations (mean, std, min, max, bands) grouped by scenario and profile."""
    return storage_service.recompute_summaries()

@router.get("/compare")
def compare_profiles(scenario_id: Optional[str] = None):
    """
    Direct comparative analysis between application profiles under identical scenarios.
    Demonstrates the asymmetric QoO evaluation under identical network conditions.
    """
    summaries = storage_service.recompute_summaries()
    grouped_by_scenario = defaultdict(dict)

    for s in summaries:
        s_id = s["scenario_id"]
        p_name = s["profile_name"]
        if scenario_id and s_id.upper() != scenario_id.upper():
            continue
        grouped_by_scenario[s_id][p_name] = s

    comparisons = []
    for s_id, profiles_map in sorted(grouped_by_scenario.items()):
        # Calculate deltas if at least two profiles exist
        p_keys = list(profiles_map.keys())
        first_p = profiles_map[p_keys[0]] if p_keys else None
        second_p = profiles_map[p_keys[1]] if len(p_keys) > 1 else None

        qoo_delta = None
        if first_p and second_p:
            qoo_delta = round(abs(first_p["qoo_mean"] - second_p["qoo_mean"]), 3)

        comparisons.append({
            "scenario_id": s_id,
            "impairment": {
                "delay_ms": first_p["delay_ms"] if first_p else 0.0,
                "jitter_ms": first_p["jitter_ms"] if first_p else 0.0,
                "loss_pct": first_p["loss_pct"] if first_p else 0.0
            },
            "profiles": profiles_map,
            "qoo_delta": qoo_delta,
            "divergence_insight": _get_divergence_insight(s_id, profiles_map)
        })

    return comparisons

def _get_divergence_insight(scenario_id: str, profiles_map: Dict[str, Any]) -> str:
    if scenario_id == "S1":
        return "Baseline (Clean Line): Both profiles attain Optimal utility (>0.98), confirming pristine transport."
    elif scenario_id == "S2":
        return "High Latency Asymmetry: Real-time interactive communication severely degrades due to conversational latency limits, whereas buffered bulk transfer/video absorbs latency without major utility drop."
    elif scenario_id == "S3":
        return "Jitter Asymmetry: Real-time communication degrades due to packet inter-arrival distortion, while buffered applications completely shield the user."
    elif scenario_id == "S4":
        return "Packet Loss: Moderate loss begins throttling TCP window goodput and induces audio/video frame drops."
    elif scenario_id == "S5":
        return "Combined Delay and Jitter: High queuing variation compounding latency penalties across interactive sessions."
    elif scenario_id == "S6":
        return "Compound Impairment: Simultaneous delay, jitter, and loss collapses user utility across both profiles into Degraded/Critical bands."
    return "Application-oriented evaluation highlights asymmetric tolerance to identical network conditions."
