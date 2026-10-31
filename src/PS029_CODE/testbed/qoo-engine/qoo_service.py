#!/usr/bin/env python3
"""
Supplied IETF QoO Calculation Service Container (PS-029)
Framework: cj-ike-kunze/ietf-126-hackathon-qoo
Spec: draft-ietf-ippm-qoo
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.getenv("PORT", 8085))

class QoOServiceHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8")
        try:
            req = json.loads(body)
        except Exception:
            req = {}

        rtt = float(req.get("rtt_ms", 12.0))
        jitter = float(req.get("jitter_ms", 0.0))
        loss = float(req.get("loss_pct", 0.0))
        tp = float(req.get("throughput_mbps", 90.0))
        params = req.get("parameters", {})

        d_crit = float(params.get("delay", {}).get("unusable_ms", 150.0))
        j_crit = float(params.get("jitter", {}).get("unusable_ms", 30.0))
        l_crit = float(params.get("loss", {}).get("unusable_pct", 3.0))

        w_d = float(params.get("delay", {}).get("weight", 0.35))
        w_j = float(params.get("jitter", {}).get("weight", 0.30))
        w_l = float(params.get("loss", {}).get("weight", 0.25))
        w_tp = float(params.get("throughput", {}).get("weight", 0.10)) if "throughput" in params else 0.0

        u_d = max(0.0, 1.0 - (rtt / max(d_crit, 1.0)) ** 1.2)
        u_j = max(0.0, 1.0 - (jitter / max(j_crit, 0.1)) ** 1.1)
        u_l = max(0.0, 1.0 - (loss / max(l_crit, 0.01)) ** 1.2)
        u_tp = max(0.0, min(1.0, tp / 80.0))

        score = max(0.0, min(1.0, (w_d * u_d) + (w_j * u_j) + (w_l * u_l) + (w_tp * u_tp)))
        score = round(score, 3)

        if score >= 0.80:
            band = "Optimal"
        elif score >= 0.60:
            band = "Acceptable"
        elif score >= 0.35:
            band = "Degraded"
        else:
            band = "Critical"

        res = {
            "status": "success",
            "framework": "cj-ike-kunze/ietf-126-hackathon-qoo",
            "qoo_score": score,
            "qoo_band": band,
            "utility_components": {
                "u_delay": round(u_d, 3),
                "u_jitter": round(u_j, 3),
                "u_loss": round(u_l, 3),
                "u_throughput": round(u_tp, 3)
            }
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))

if __name__ == "__main__":
    print(f"Starting Supplied IETF QoO Microservice on port {PORT}...")
    server = HTTPServer(("0.0.0.0", PORT), QoOServiceHandler)
    server.serve_forever()
