import pytest
from backend.app.services.harness import experiment_harness
from backend.app.services.gateway import gateway_service
from backend.app.models.experiment import ExperimentStatus

def test_single_experiment_execution():
    res = experiment_harness.run_single_experiment(
        profile_id="profile-realtime-video",
        scenario_id="S1",
        repeats=2,
        notes="Automated unit test run"
    )
    assert res["status"] == ExperimentStatus.COMPLETED
    assert len(res["records"]) == 2
    # Verify baseline is pristine after completion
    assert gateway_service.current_state["delay_ms"] == 0.0
    assert gateway_service.current_state["loss_pct"] == 0.0

def test_experiment_cancellation():
    run_id = "TEST-RUN-CANCEL"
    experiment_harness.active_runs[run_id] = {
        "run_id": run_id,
        "status": ExperimentStatus.RUNNING
    }
    success = experiment_harness.cancel_experiment(run_id)
    assert success is True
    assert experiment_harness.active_runs[run_id]["status"] == ExperimentStatus.CANCELLED
    # Verify gateway baseline reset was triggered
    assert gateway_service.current_state["delay_ms"] == 0.0
