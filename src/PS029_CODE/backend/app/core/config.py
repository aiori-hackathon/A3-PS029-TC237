import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
DOCS_DIR = BASE_DIR / "docs"
PROFILES_DIR = CONFIG_DIR / "profiles"

class Settings(BaseModel):
    PROJECT_NAME: str = "DevElite QoO Network Evaluation Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    GATEWAY_URL: str = os.getenv("GATEWAY_URL", "http://127.0.0.1:8000")
    INFLUX_URL: str = os.getenv("INFLUX_URL", "http://127.0.0.1:8086")
    INFLUX_TOKEN: str = os.getenv("INFLUX_TOKEN", "my-secret-token")
    INFLUX_ORG: str = os.getenv("INFLUX_ORG", "develite")
    INFLUX_BUCKET: str = os.getenv("INFLUX_BUCKET", "telemetry")
    
    SCENARIOS_FILE: Path = CONFIG_DIR / "scenarios.json"
    RESULTS_CSV: Path = DATA_DIR / "results.csv"
    SUMMARY_CSV: Path = DATA_DIR / "summary.csv"
    RESULTS_JSON: Path = DATA_DIR / "results.json"
    
    PROFILES_PATH: Path = PROFILES_DIR
    EMULATION_FALLBACK: bool = True

settings = Settings()
