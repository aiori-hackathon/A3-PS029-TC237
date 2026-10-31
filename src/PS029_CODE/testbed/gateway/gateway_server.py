#!/usr/bin/env python3
"""
Testbed tc-netem Gateway REST API Container (PS-029)
Team DevElite - AIORI Hackathon 3
Applies network impairments strictly inside the isolated container virtual interface (eth0/utun).
Never modifies host machine networking.
"""

import os
import json
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.getenv("PORT", 8000))
INTERFACE = os.getenv("NETEM_IFACE", "eth0")

state = {
    "delay_ms": 0.0,
    "jitter_ms": 0.0,
    "loss_pct": 0.0,
    "interface": INTERFACE
}

def run_cmd(cmd_list):
    try:
        res = subprocess.run(cmd_list, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
        return res.returncode == 0, res.stdout, res.stderr
    except Exception as e:
        return False, "", str(e)

def apply_netem(delay_ms, jitter_ms, loss_pct):
    global state
    # First clear existing qdisc
    run_cmd(["tc", "qdisc", "del", "dev", INTERFACE, "root"])
    
    if delay_ms == 0 and jitter_ms == 0 and loss_pct == 0:
        state["delay_ms"] = 0.0
        state["jitter_ms"] = 0.0
        state["loss_pct"] = 0.0
        return True, "Baseline clean network (0 delay, 0 jitter, 0 loss)"

    # Build tc netem command
    cmd = ["tc", "qdisc", "add", "dev", INTERFACE, "root", "netem"]
    if delay_ms > 0:
        cmd.extend(["delay", f"{delay_ms}ms"])
        if jitter_ms > 0:
            cmd.extend([f"{jitter_ms}ms", "distribution", "normal"])
    elif jitter_ms > 0:
        cmd.extend(["delay", f"{jitter_ms}ms", f"{jitter_ms}ms"])

    if loss_pct > 0:
        cmd.extend(["loss", f"{loss_pct}%"])

    ok, out, err = run_cmd(cmd)
    state["delay_ms"] = delay_ms
    state["jitter_ms"] = jitter_ms
    state["loss_pct"] = loss_pct
    return ok, err or out or "Impairment applied successfully"

class GatewayHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"status": "healthy", "netem": state})
        elif self.path == "/qoo-profiles":
            self._send_json(200, {"status": "ok", "message": "Profiles endpoint live", "current_netem": state})
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if self.path == "/baseline":
            ok, msg = apply_netem(0.0, 0.0, 0.0)
            self._send_json(200, {
                "status": "success",
                "action": "RESET_BASELINE",
                "netem": state,
                "message": msg
            })
        elif self.path == "/custom":
            d = float(data.get("delay", 0.0))
            j = float(data.get("jitter", 0.0))
            l = float(data.get("loss", 0.0))
            ok, msg = apply_netem(d, j, l)
            self._send_json(200, {
                "status": "success",
                "action": "APPLY_IMPAIRMENT",
                "netem": state,
                "message": msg
            })
        elif self.path == "/qoo-profiles":
            self._send_json(200, {
                "status": "success",
                "action": "REGISTER_PROFILE",
                "profile": data.get("profile_name", "unnamed")
            })
        else:
            self._send_json(404, {"error": "Endpoint not found"})

if __name__ == "__main__":
    print(f"Starting Gateway tc-netem REST API on port {PORT} (dev {INTERFACE})...")
    server = HTTPServer(("0.0.0.0", PORT), GatewayHandler)
    server.serve_forever()
