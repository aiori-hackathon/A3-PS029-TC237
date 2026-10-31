import math
from typing import Dict, Any, Tuple, Optional

# Standardized IETF IPPM Utility Bands (draft-ietf-ippm-qoo)
BANDS = {
    "Optimal": {
        "min": 0.80,
        "max": 1.00,
        "color": "#10b981",
        "description": "Transparent quality; network meets all application constraints without perceptible impairment."
    },
    "Acceptable": {
        "min": 0.60,
        "max": 0.7999,
        "color": "#3b82f6",
        "description": "Satisfactory execution; minor delay or transient queue buildup tolerated by application buffers."
    },
    "Degraded": {
        "min": 0.35,
        "max": 0.5999,
        "color": "#f59e0b",
        "description": "Noticeable degradation; frame drops, buffer depletion, or tick desynchronization observed."
    },
    "Critical": {
        "min": 0.00,
        "max": 0.3499,
        "color": "#ef4444",
        "description": "Severe impairment; interactive agency collapse or continuous buffering stall."
    }
}

class QoOEngine:
    """
    IETF IPPM Quality of Outcome (QoO) Engine.
    Conforms to draft-ietf-ippm-qoo and testbed cj-ike-kunze/ietf-126-hackathon-qoo.
    Does NOT invent arbitrary universal scores; evaluates strictly against declared profile bounds.
    """

    @staticmethod
    def classify_band(score: Optional[float]) -> Tuple[str, Dict[str, Any]]:
        """Classify continuous QoO score into standard utility band."""
        if score is None:
            return "Unknown", {"color": "#6b7280", "description": "Telemetry missing"}
        s = max(0.0, min(1.0, float(score)))
        for band_name, meta in BANDS.items():
            if meta["min"] <= s <= meta["max"]:
                return band_name, meta
        return "Critical", BANDS["Critical"]

    @classmethod
    def evaluate(
        cls,
        rtt_ms: float,
        jitter_ms: float,
        loss_pct: float,
        throughput_mbps: float,
        profile_params: Dict[str, Any],
        profile_name: str = ""
    ) -> Dict[str, Any]:
        """
        Calculates QoO score based on declared profile parameters and weights.
        """
        p = profile_params
        d_cfg = p.get("delay", {})
        j_cfg = p.get("jitter", {})
        l_cfg = p.get("loss", {})
        tp_cfg = p.get("throughput", {})

        # Critical thresholds
        d_crit = float(d_cfg.get("unusable_ms", 150.0))
        j_crit = float(j_cfg.get("unusable_ms", 30.0))
        l_crit = float(l_cfg.get("unusable_pct", 3.0))
        tp_target = float(tp_cfg.get("target_mbps", 50.0)) if tp_cfg else 50.0

        w_d = float(d_cfg.get("weight", 0.35))
        w_j = float(j_cfg.get("weight", 0.30))
        w_l = float(l_cfg.get("weight", 0.25))
        w_tp = float(tp_cfg.get("weight", 0.10)) if tp_cfg else 0.0

        # Normalization of weights
        total_w = w_d + w_j + w_l + w_tp
        if total_w > 0:
            w_d /= total_w
            w_j /= total_w
            w_l /= total_w
            w_tp /= total_w

        # Utility component functions
        # Exponential concave decay per IETF utility formulation
        u_delay = max(0.0, 1.0 - (rtt_ms / max(d_crit, 1.0)) ** 1.2)
        u_jitter = max(0.0, 1.0 - (jitter_ms / max(j_crit, 0.1)) ** 1.1)
        u_loss = max(0.0, 1.0 - (loss_pct / max(l_crit, 0.01)) ** 1.2)
        u_tp = max(0.0, min(1.0, throughput_mbps / max(tp_target, 1.0)))

        # Composite QoO
        raw_qoo = (w_d * u_delay) + (w_j * u_jitter) + (w_l * u_loss) + (w_tp * u_tp)
        qoo_score = round(max(0.0, min(1.0, raw_qoo)), 3)
        band_name, band_meta = cls.classify_band(qoo_score)

        return {
            "qoo_score": qoo_score,
            "qoo_band": band_name,
            "band_color": band_meta["color"],
            "band_description": band_meta["description"],
            "utility_components": {
                "u_delay": round(u_delay, 3),
                "u_jitter": round(u_jitter, 3),
                "u_loss": round(u_loss, 3),
                "u_throughput": round(u_tp, 3)
            },
            "weights": {
                "delay": round(w_d, 2),
                "jitter": round(w_j, 2),
                "loss": round(w_l, 2),
                "throughput": round(w_tp, 2)
            }
        }
