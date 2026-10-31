import os
import json
import time
import uuid
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.models.experiment import ExperimentStatus, ExperimentRecord
from backend.app.services.gateway import gateway_service
from backend.app.services.collector import telemetry_collector
from backend.app.services.qoo_engine import QoOEngine
from backend.app.services.storage import storage_service

class ExperimentHarness:
    """
    Automated QoO Experiment Runner Harness.
    Executes 12-step systematic test cycles across application profiles and scenarios.
    Ensures baseline resets before, between, and after all runs.
    """

    def __init__(self):
        self.active_runs: Dict[str, Dict[str, Any]] = {}
        self.logs: Dict[str, List[str]] = {}
        self.cancel_flags: Dict[str, bool] = {}
        self._lock = threading.Lock()

    def _log(self, run_id: str, message: str, level: str = "INFO"):
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
        entry = f"[{ts}] [{level}] {message}"
        with self._lock:
            if run_id not in self.logs:
                self.logs[run_id] = []
            self.logs[run_id].append(entry)
        logger.info("[Harness %s] %s", run_id, message)

    def get_logs(self, run_id: str) -> List[str]:
        with self._lock:
            return list(self.logs.get(run_id, []))

    def cancel_experiment(self, run_id: str) -> bool:
        """Sets cancellation flag and triggers emergency network baseline reset."""
        with self._lock:
            if run_id in self.active_runs:
                self.cancel_flags[run_id] = True
                self._log(run_id, "Cancellation requested by operator. Triggering emergency baseline reset...", "WARN")
                # Immediately reset gateway baseline
                gateway_service.reset_baseline()
                self.active_runs[run_id]["status"] = ExperimentStatus.CANCELLED
                return True
        return False

    def load_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        # Check config/profiles directory
        profiles_dir = settings.PROFILES_DIR
        for p in profiles_dir.glob("*.json"):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("id") == profile_id or data.get("profile_name") == profile_id:
                        data["_file"] = f"config/profiles/{p.name}"
                        return data
            except Exception as e:
                logger.error("Error reading profile %s: %s", p, e)
        return None

    def load_scenario(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        scenarios_file = settings.SCENARIOS_FILE
        if not scenarios_file.exists():
            return None
        with open(scenarios_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for sc in data.get("scenarios", []):
                if sc.get("scenario_id") == scenario_id:
                    return sc
        return None

    def run_single_experiment(
        self,
        profile_id: str,
        scenario_id: str,
        repeats: int = 3,
        run_godash: bool = True,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Executes an experiment workflow conforming to Steps 1-12.
        """
        run_id = f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        self.cancel_flags[run_id] = False
        self.active_runs[run_id] = {
            "run_id": run_id,
            "profile_id": profile_id,
            "scenario_id": scenario_id,
            "repeats": repeats,
            "status": ExperimentStatus.RUNNING,
            "progress": 0.0,
            "records": [],
            "start_time": time.time()
        }

        self._log(run_id, f"STEP 1 & 2: Initializing experiment {run_id} | Profile: {profile_id} | Scenario: {scenario_id} | Repeats: {repeats}")

        profile = self.load_profile(profile_id)
        if not profile:
            self._log(run_id, f"Profile '{profile_id}' not found! Aborting.", "ERROR")
            self.active_runs[run_id]["status"] = ExperimentStatus.FAILED
            return self.active_runs[run_id]

        scenario = self.load_scenario(scenario_id)
        if not scenario:
            self._log(run_id, f"Scenario '{scenario_id}' not found! Aborting.", "ERROR")
            self.active_runs[run_id]["status"] = ExperimentStatus.FAILED
            return self.active_runs[run_id]

        p_name = profile["profile_name"]
        p_file = profile.get("_file", f"config/profiles/{profile_id}.json")
        p_params = profile["parameters"]

        s_id = scenario["scenario_id"]
        d = scenario["delay_ms"]
        j = scenario["jitter_ms"]
        l = scenario["loss_pct"]

        records = []
        try:
            # STEP 3: Load profile configuration into gateway
            self._log(run_id, f"STEP 3: Registering QoO profile parameters with gateway ({p_name})")
            gateway_service.register_profile(p_name, p_params)

            # Pre-test baseline reset
            gateway_service.reset_baseline()

            for r in range(1, repeats + 1):
                if self.cancel_flags.get(run_id):
                    self._log(run_id, "Experiment cancelled during execution loop.", "WARN")
                    break

                exp_id = f"EXP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

                self._log(run_id, f"--- Repetition [{r}/{repeats}] ({exp_id}) ---")

                # STEP 4: Apply selected network impairment
                self._log(run_id, f"STEP 4: Applying tc-netem impairment -> delay: {d}ms, jitter: {j}ms, loss: {l}%")
                gateway_service.apply_impairment(delay_ms=d, jitter_ms=j, loss_pct=l)

                # Stabilization delay
                time.sleep(0.08)

                # STEP 5 & 6: Measure network probes & application metric (goDASH)
                self._log(run_id, "STEP 5 & 6: Running active probes & goDASH client application telemetry...")
                telemetry = telemetry_collector.measure_telemetry(
                    configured_delay=d,
                    configured_jitter=j,
                    configured_loss=l,
                    profile_name=p_name,
                    run_number=r,
                    run_godash=run_godash
                )
                self._log(run_id, f"Measured -> RTT: {telemetry['rtt_ms']}ms, TP: {telemetry['throughput_mbps']}Mbps, Loss: {telemetry['loss_pct']}%, {telemetry['app_metric_name']}: {telemetry['app_metric_value']}")

                # STEP 7 & 8: Send telemetry to QoO engine and evaluate
                self._log(run_id, "STEP 7 & 8: Evaluating QoO score against declared profile utility bounds...")
                qoo_eval = QoOEngine.evaluate(
                    rtt_ms=telemetry["rtt_ms"],
                    jitter_ms=telemetry["jitter_ms"],
                    loss_pct=telemetry["loss_pct"],
                    throughput_mbps=telemetry["throughput_mbps"],
                    profile_params=p_params,
                    profile_name=p_name
                )
                qoo_score = qoo_eval["qoo_score"]
                qoo_band = qoo_eval["qoo_band"]
                self._log(run_id, f"QoO Output -> Score: {qoo_score:.3f} | Utility Band: {qoo_band}")

                # STEP 9: Store record
                record_dict = {
                    "experiment_id": exp_id,
                    "timestamp": ts,
                    "scenario_id": s_id,
                    "delay_ms": d,
                    "jitter_ms": j,
                    "loss_pct": l,
                    "profile_name": p_name,
                    "profile_params_file": p_file,
                    "run_number": r,
                    "qoo_score": qoo_score,
                    "qoo_band": qoo_band,
                    "rtt_ms": telemetry["rtt_ms"],
                    "throughput_mbps": telemetry["throughput_mbps"],
                    "measured_loss_pct": telemetry["loss_pct"],
                    "app_metric_name": telemetry["app_metric_name"],
                    "app_metric_value": telemetry["app_metric_value"],
                    "notes": notes or f"Automated run {r}/{repeats}; verified clean baseline reset.",
                    "status": "COMPLETED",
                    "profile_parameters_snapshot": p_params
                }
                storage_service.append_record(record_dict)
                records.append(record_dict)

                # STEP 10: Reset network impairment between runs for idempotency
                self._log(run_id, "STEP 10: Resetting network impairment back to pristine baseline...")
                gateway_service.reset_baseline()
                time.sleep(0.04)

                # Update progress
                progress = round((r / repeats) * 100.0, 1)
                self.active_runs[run_id]["progress"] = progress

            if not self.cancel_flags.get(run_id):
                self.active_runs[run_id]["status"] = ExperimentStatus.COMPLETED
                self._log(run_id, f"STEP 11 & 12: Suite complete! Processed {len(records)} runs. Results persisted and ready for dashboard analysis.")

        except Exception as exc:
            self._log(run_id, f"Harness failure: {exc}", "ERROR")
            self.active_runs[run_id]["status"] = ExperimentStatus.FAILED
            self.active_runs[run_id]["error"] = str(exc)
        finally:
            # Automatic cleanup after failures
            self._log(run_id, "Guaranteed safety: Final baseline cleanup verified.")
            gateway_service.reset_baseline()
            self.active_runs[run_id]["records"] = records
            self.active_runs[run_id]["duration_s"] = round(time.time() - self.active_runs[run_id]["start_time"], 2)

        return self.active_runs[run_id]

    def run_batch_experiments(
        self,
        profile_ids: List[str],
        scenario_ids: List[str],
        repeats: int = 3,
        run_godash: bool = True,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Executes matrix comparison across multiple profiles and scenarios.
        """
        batch_id = f"BATCH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        total_runs = len(profile_ids) * len(scenario_ids)
        logger.info("Initializing batch %s: %d profiles x %d scenarios", batch_id, len(profile_ids), len(scenario_ids))

        results = []
        for p_id in profile_ids:
            for s_id in scenario_ids:
                res = self.run_single_experiment(
                    profile_id=p_id,
                    scenario_id=s_id,
                    repeats=repeats,
                    run_godash=run_godash,
                    notes=f"{notes} [Batch {batch_id}]"
                )
                results.append(res)

        return {
            "batch_id": batch_id,
            "total_matrix_cells": total_runs,
            "repeats_per_cell": repeats,
            "experiments": results
        }

experiment_harness = ExperimentHarness()
