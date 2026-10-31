from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from backend.app.models.experiment import ExperimentRunRequest, BatchRunRequest
from backend.app.services.harness import experiment_harness
from backend.app.services.storage import storage_service

router = APIRouter(prefix="/experiments", tags=["Experiments"])

@router.post("/run")
def run_experiment(request: ExperimentRunRequest = Body(...)):
    """
    Execute single experiment workflow across configured repetitions (N).
    Follows Steps 1 through 12, resetting baseline before, between, and after.
    """
    result = experiment_harness.run_single_experiment(
        profile_id=request.profile_id,
        scenario_id=request.scenario_id,
        repeats=request.repeats,
        run_godash=request.run_godash,
        notes=request.notes or ""
    )
    return result

@router.post("/batch")
def run_batch_matrix(request: BatchRunRequest = Body(...)):
    """
    Execute matrix execution across multiple profiles and scenarios.
    """
    batch_res = experiment_harness.run_batch_experiments(
        profile_ids=request.profile_ids,
        scenario_ids=request.scenario_ids,
        repeats=request.repeats,
        run_godash=request.run_godash,
        notes=request.notes or ""
    )
    return batch_res

@router.get("")
def list_experiments(
    profile: Optional[str] = None,
    scenario: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Retrieve historical experiments from results dataset."""
    return storage_service.get_all_records(
        profile_name=profile,
        scenario_id=scenario,
        status=status,
        search=search
    )

@router.get("/{experiment_id}")
def get_experiment_details(experiment_id: str):
    """Retrieve full record with profile parameters snapshot."""
    record = storage_service.get_record_by_id(experiment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found")
    return record

@router.get("/{run_id}/logs")
def get_experiment_logs(run_id: str):
    """Fetch live execution logs for a running or completed harness execution."""
    logs = experiment_harness.get_logs(run_id)
    return {"run_id": run_id, "logs": logs}

@router.post("/{run_id}/cancel")
def cancel_active_experiment(run_id: str):
    """Cancel an active running experiment and safely reset impairments to baseline."""
    success = experiment_harness.cancel_experiment(run_id)
    if not success:
        raise HTTPException(status_code=400, detail=f"Run '{run_id}' not actively running or not found")
    return {"status": "success", "message": f"Run '{run_id}' cancelled and network baseline reset"}
