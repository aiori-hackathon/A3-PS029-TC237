import pytest
from backend.app.services.storage import storage_service

def test_storage_csv_and_json_persistence():
    records = storage_service.get_all_records()
    assert len(records) > 0
    # Check that required columns exist
    r0 = records[0]
    assert "experiment_id" in r0
    assert "scenario_id" in r0
    assert "profile_name" in r0
    assert "qoo_score" in r0

def test_recompute_summaries():
    summaries = storage_service.recompute_summaries()
    assert len(summaries) > 0
    for s in summaries:
        assert "qoo_mean" in s
        assert "qoo_std" in s
        assert "qoo_band" in s
        assert s["run_count"] > 0
