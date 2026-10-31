from typing import Optional
from pydantic import BaseModel, Field

class ImpairmentScenario(BaseModel):
    scenario_id: str = Field(..., description="Unique scenario ID, e.g. S1, S2")
    name: str = Field(..., description="Scenario display name")
    delay_ms: float = Field(..., ge=0.0, description="Injected one-way delay in milliseconds")
    jitter_ms: float = Field(..., ge=0.0, description="Injected delay variation (jitter) in milliseconds")
    loss_pct: float = Field(..., ge=0.0, le=100.0, description="Injected packet loss percentage")
    description: str = Field(..., description="Realistic condition and behavioral expectation")

class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    delay_ms: Optional[float] = Field(None, ge=0.0)
    jitter_ms: Optional[float] = Field(None, ge=0.0)
    loss_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    description: Optional[str] = None
