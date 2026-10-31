from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ExperimentStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ExperimentRunRequest(BaseModel):
    profile_id: str = Field(..., description="Target profile ID")
    scenario_id: str = Field(..., description="Target scenario ID")
    repeats: int = Field(default=3, ge=1, le=50, description="Repetitions for statistical stability")
    run_godash: bool = Field(default=True, description="Whether to invoke goDASH client if applicable")
    notes: Optional[str] = Field(default="Interactive execution via DevElite Platform")

class BatchRunRequest(BaseModel):
    profile_ids: List[str] = Field(..., description="List of profile IDs to evaluate")
    scenario_ids: List[str] = Field(..., description="List of scenario IDs to evaluate")
    repeats: int = Field(default=3, ge=1, le=20)
    run_godash: bool = Field(default=True)
    notes: Optional[str] = Field(default="Batch execution across matrix")

class ExperimentRecord(BaseModel):
    experiment_id: str
    timestamp: str
    scenario_id: str
    delay_ms: float
    jitter_ms: float
    loss_pct: float
    profile_name: str
    profile_params_file: str
    run_number: int
    qoo_score: Optional[float]
    rtt_ms: float
    throughput_mbps: float
    measured_loss_pct: float
    app_metric_name: str
    app_metric_value: float
    qoo_band: Optional[str] = None
    status: ExperimentStatus = ExperimentStatus.COMPLETED
    execution_duration_s: Optional[float] = 0.0
    notes: Optional[str] = ""
    error_info: Optional[str] = None
    profile_parameters_snapshot: Optional[Dict[str, Any]] = None

class ExperimentFilter(BaseModel):
    profile_name: Optional[str] = None
    scenario_id: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class StatisticalSummary(BaseModel):
    scenario_id: str
    scenario_name: Optional[str] = None
    profile_name: str
    delay_ms: float
    jitter_ms: float
    loss_pct: float
    run_count: int
    qoo_mean: float
    qoo_std: float
    qoo_min: float
    qoo_max: float
    qoo_band: str
    rtt_mean_ms: float
    throughput_mean_mbps: float
    app_metric_name: str
    app_metric_mean: float
