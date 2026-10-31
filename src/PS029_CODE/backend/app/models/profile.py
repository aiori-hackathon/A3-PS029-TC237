from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class DelayBounds(BaseModel):
    target_ms: float = Field(..., description="Ideal target latency in ms")
    acceptable_ms: float = Field(..., description="Acceptable latency threshold in ms")
    unusable_ms: float = Field(..., description="Critical latency threshold in ms")
    max_acceptable_ms: Optional[float] = None
    weight: float = Field(..., ge=0.0, le=1.0, description="Weight in utility function")

class JitterBounds(BaseModel):
    target_ms: float = Field(..., description="Ideal target jitter in ms")
    acceptable_ms: float = Field(..., description="Acceptable jitter in ms")
    unusable_ms: float = Field(..., description="Critical jitter in ms")
    max_acceptable_ms: Optional[float] = None
    weight: float = Field(..., ge=0.0, le=1.0)

class LossBounds(BaseModel):
    target_pct: float = Field(..., description="Target packet loss percentage")
    acceptable_pct: float = Field(..., description="Acceptable packet loss percentage")
    unusable_pct: float = Field(..., description="Critical packet loss percentage")
    max_acceptable_pct: Optional[float] = None
    weight: float = Field(..., ge=0.0, le=1.0)

class ThroughputBounds(BaseModel):
    min_required_mbps: float = Field(default=0.0, description="Minimum acceptable throughput in Mbps")
    target_mbps: float = Field(default=50.0, description="Target throughput in Mbps")
    weight: float = Field(default=0.0, ge=0.0, le=1.0)

class ProfileParameters(BaseModel):
    delay: DelayBounds
    jitter: JitterBounds
    loss: LossBounds
    throughput: Optional[ThroughputBounds] = None

class ApplicationTelemetrySpec(BaseModel):
    metric_name: str
    description: Optional[str] = None
    target_value: float
    degraded_threshold: float
    critical_threshold: float
    unit: str = ""

class ApplicationProfile(BaseModel):
    id: str
    profile_name: str
    category: str
    status: str = Field(default="PROPOSED_PENDING_MENTOR_APPROVAL", description="Approval status")
    version: str = "1.0.0"
    reference_rfc: Optional[str] = None
    description: str
    parameters: ProfileParameters
    utility_function: str = "concave_exponential_penalty"
    application_telemetry: ApplicationTelemetrySpec

class ProfileUpdate(BaseModel):
    profile_name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[ProfileParameters] = None
    application_telemetry: Optional[ApplicationTelemetrySpec] = None
