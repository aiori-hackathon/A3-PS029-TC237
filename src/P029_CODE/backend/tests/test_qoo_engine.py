import pytest
from backend.app.services.qoo_engine import QoOEngine, BANDS

def test_band_classification():
    assert QoOEngine.classify_band(0.95)[0] == "Optimal"
    assert QoOEngine.classify_band(0.75)[0] == "Acceptable"
    assert QoOEngine.classify_band(0.45)[0] == "Degraded"
    assert QoOEngine.classify_band(0.15)[0] == "Critical"
    assert QoOEngine.classify_band(None)[0] == "Unknown"

def test_qoo_evaluation_baseline():
    params = {
        "delay": {"target_ms": 20, "acceptable_ms": 60, "unusable_ms": 150, "weight": 0.4},
        "jitter": {"target_ms": 3, "acceptable_ms": 12, "unusable_ms": 30, "weight": 0.35},
        "loss": {"target_pct": 0, "acceptable_pct": 0.5, "unusable_pct": 3.0, "weight": 0.25}
    }
    # Ideal clean conditions
    result = QoOEngine.evaluate(rtt_ms=12.0, jitter_ms=1.0, loss_pct=0.0, throughput_mbps=95.0, profile_params=params)
    assert result["qoo_score"] >= 0.80
    assert result["qoo_band"] == "Optimal"

def test_qoo_evaluation_severe_impairment():
    params = {
        "delay": {"target_ms": 20, "acceptable_ms": 60, "unusable_ms": 150, "weight": 0.4},
        "jitter": {"target_ms": 3, "acceptable_ms": 12, "unusable_ms": 30, "weight": 0.35},
        "loss": {"target_pct": 0, "acceptable_pct": 0.5, "unusable_pct": 3.0, "weight": 0.25}
    }
    # Severe delay (300ms) and loss (5%)
    result = QoOEngine.evaluate(rtt_ms=300.0, jitter_ms=40.0, loss_pct=5.0, throughput_mbps=10.0, profile_params=params)
    assert result["qoo_score"] < 0.35
    assert result["qoo_band"] == "Critical"
