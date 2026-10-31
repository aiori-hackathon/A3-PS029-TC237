import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from backend.app.core.config import settings
from backend.app.services.gateway import gateway_service
from backend.app.models.scenario import ImpairmentScenario, ScenarioUpdate

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

def _load_scenarios() -> Dict[str, Any]:
    with open(settings.SCENARIOS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_scenarios(data: Dict[str, Any]):
    with open(settings.SCENARIOS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

@router.get("", response_model=List[Dict[str, Any]])
def list_scenarios():
    """List all 6 controlled network impairment scenarios."""
    data = _load_scenarios()
    return data.get("scenarios", [])

@router.get("/{scenario_id}")
def get_scenario(scenario_id: str):
    """Retrieve details for a specific scenario."""
    data = _load_scenarios()
    for sc in data.get("scenarios", []):
        if sc.get("scenario_id") == scenario_id:
            return sc
    raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

@router.put("/{scenario_id}")
def update_scenario(scenario_id: str, updates: ScenarioUpdate = Body(...)):
    """Configure scenario parameters (delay, jitter, loss)."""
    data = _load_scenarios()
    scenarios = data.get("scenarios", [])
    target = None
    for sc in scenarios:
        if sc.get("scenario_id") == scenario_id:
            target = sc
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")

    if updates.name is not None:
        target["name"] = updates.name
    if updates.delay_ms is not None:
        target["delay_ms"] = updates.delay_ms
    if updates.jitter_ms is not None:
        target["jitter_ms"] = updates.jitter_ms
    if updates.loss_pct is not None:
        target["loss_pct"] = updates.loss_pct
    if updates.description is not None:
        target["description"] = updates.description

    _save_scenarios(data)
    return {"status": "success", "message": f"Scenario '{scenario_id}' updated", "scenario": target}

@router.post("/reset")
def reset_network_baseline():
    """Safely reset testbed network impairments back to clean line (0ms delay, 0ms jitter, 0% loss)."""
    success = gateway_service.reset_baseline()
    return {
        "status": "success" if success else "warning",
        "action": "RESET_BASELINE",
        "message": "Gateway tc-netem reset to baseline: 0.0ms delay, 0.0ms jitter, 0.00% packet loss.",
        "netem_state": gateway_service.current_state
    }
