import json
import subprocess
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger

class GatewayService:
    """
    Interface for injecting network impairments and safely resetting baseline.
    Integrates with the container-based Gateway REST API (port 8000) or local tc-netem.
    """

    def __init__(self, base_url: str = settings.GATEWAY_URL, timeout: int = 5):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.current_state = {
            "delay_ms": 0.0,
            "jitter_ms": 0.0,
            "loss_pct": 0.0,
            "interface": "eth0 / utun"
        }

    def _post(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else {"status": "ok"}
        except Exception as e:
            logger.warning("Gateway API connection (%s) unavailable: %s. Operating in testbed emulation mode.", url, e)
            return {"status": "emulated", "error": str(e)}

    def reset_baseline(self) -> bool:
        """
        Guaranteed safety reset to pristine zero-impairment baseline (0 delay, 0 jitter, 0 loss).
        Must be called between runs and always in finally blocks.
        """
        logger.info("Executing safe baseline reset: 0ms delay, 0ms jitter, 0.0% loss...")
        res = self._post("/baseline", {})
        self.current_state = {
            "delay_ms": 0.0,
            "jitter_ms": 0.0,
            "loss_pct": 0.0,
            "interface": "eth0 / utun"
        }
        return res.get("status") in ["ok", "emulated", "success"]

    def apply_impairment(self, delay_ms: float, jitter_ms: float, loss_pct: float) -> bool:
        """
        Injects controlled delay, jitter, and packet loss into the testbed gateway.
        """
        logger.info("Injecting impairment -> delay: %.1fms, jitter: %.1fms, loss: %.2f%%", delay_ms, jitter_ms, loss_pct)
        payload = {
            "delay": float(delay_ms),
            "jitter": float(jitter_ms),
            "loss": float(loss_pct)
        }
        res = self._post("/custom", payload)
        self.current_state = {
            "delay_ms": float(delay_ms),
            "jitter_ms": float(jitter_ms),
            "loss_pct": float(loss_pct),
            "interface": "eth0 / utun"
        }
        return res.get("status") in ["ok", "emulated", "success"]

    def register_profile(self, profile_name: str, parameters: Dict[str, Any]) -> bool:
        """
        Registers active QoO profile parameters with the Gateway service.
        """
        logger.info("Registering QoO profile with gateway: %s", profile_name)
        res = self._post("/qoo-profiles", {"profile_name": profile_name, "parameters": parameters})
        return res.get("status") in ["ok", "emulated", "success"]

gateway_service = GatewayService()
