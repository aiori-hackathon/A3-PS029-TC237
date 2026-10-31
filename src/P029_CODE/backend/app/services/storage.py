import os
import csv
import json
import math
from typing import List, Dict, Any, Optional
from collections import defaultdict
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.models.experiment import ExperimentRecord, StatisticalSummary

CSV_HEADER = [
    "experiment_id", "timestamp", "scenario_id", "delay_ms", "jitter_ms", "loss_pct",
    "profile_name", "profile_params_file", "run_number", "qoo_score", "rtt_ms",
    "throughput_mbps", "measured_loss_pct", "app_metric_name", "app_metric_value", "notes"
]

class StorageService:
    def __init__(self):
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        self.csv_path = settings.RESULTS_CSV
        self.json_path = settings.RESULTS_JSON
        self.summary_csv_path = settings.SUMMARY_CSV
        self._init_files()

    def _init_files(self):
        if not os.path.exists(self.csv_path) or os.path.getsize(self.csv_path) == 0:
            with open(self.csv_path, "w", encoding="utf-8", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(CSV_HEADER)
            logger.info("Initialized results CSV at %s", self.csv_path)

        if not os.path.exists(self.json_path):
            with open(self.json_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def append_record(self, record: Dict[str, Any]):
        """
        Appends record to both results.csv (standard 16-col) and results.json (complete snapshot).
        """
        # Append to CSV
        qoo_str = f"{record.get('qoo_score', 0.0):.3f}" if record.get("qoo_score") is not None else ""
        row = [
            record.get("experiment_id", ""),
            record.get("timestamp", ""),
            record.get("scenario_id", ""),
            f"{float(record.get('delay_ms', 0.0)):.1f}",
            f"{float(record.get('jitter_ms', 0.0)):.1f}",
            f"{float(record.get('loss_pct', 0.0)):.2f}",
            record.get("profile_name", ""),
            record.get("profile_params_file", ""),
            record.get("run_number", 1),
            qoo_str,
            f"{float(record.get('rtt_ms', 0.0)):.2f}",
            f"{float(record.get('throughput_mbps', 0.0)):.2f}",
            f"{float(record.get('measured_loss_pct', 0.0)):.2f}",
            record.get("app_metric_name", ""),
            f"{float(record.get('app_metric_value', 0.0)):.2f}",
            record.get("notes", "")
        ]
        with open(self.csv_path, "a", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(row)

        # Append to JSON
        json_records = self.get_all_json()
        json_records.append(record)
        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump(json_records, f, indent=2)

        # Update summary statistics
        self.recompute_summaries()

    def get_all_records(
        self,
        profile_name: Optional[str] = None,
        scenario_id: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Reads all records from CSV with optional filtering."""
        if not os.path.exists(self.csv_path):
            return []

        results = []
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                # Apply filters
                if profile_name and profile_name.lower() not in r["profile_name"].lower():
                    continue
                if scenario_id and scenario_id.upper() != r["scenario_id"].upper():
                    continue
                if search:
                    s_lower = search.lower()
                    if (s_lower not in r["experiment_id"].lower() and
                        s_lower not in r["scenario_id"].lower() and
                        s_lower not in r["profile_name"].lower()):
                        continue
                results.append(r)
        return results

    def get_all_json(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.json_path):
            return []
        try:
            with open(self.json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def get_record_by_id(self, exp_id: str) -> Optional[Dict[str, Any]]:
        # Check JSON first for rich profile snapshot
        json_records = self.get_all_json()
        for r in json_records:
            if r.get("experiment_id") == exp_id:
                return r
        # Fallback to CSV
        csv_records = self.get_all_records()
        for r in csv_records:
            if r.get("experiment_id") == exp_id:
                return r
        return None

    def recompute_summaries(self) -> List[Dict[str, Any]]:
        records = self.get_all_records()
        if not records:
            return []

        grouped = defaultdict(list)
        for r in records:
            key = (r["scenario_id"], r["profile_name"])
            grouped[key].append(r)

        summaries = []
        for (s_id, p_name), rows in sorted(grouped.items()):
            qoo_vals = [float(x["qoo_score"]) for x in rows if x.get("qoo_score") and x["qoo_score"] != ""]
            rtt_vals = [float(x["rtt_ms"]) for x in rows if x.get("rtt_ms")]
            tp_vals = [float(x["throughput_mbps"]) for x in rows if x.get("throughput_mbps")]
            app_vals = [float(x["app_metric_value"]) for x in rows if x.get("app_metric_value")]

            def stats(vals):
                if not vals:
                    return 0.0, 0.0, 0.0, 0.0
                m = sum(vals) / len(vals)
                v = sum((x - m) ** 2 for x in vals) / len(vals)
                return round(m, 3), round(math.sqrt(v), 3), round(min(vals), 3), round(max(vals), 3)

            qoo_m, qoo_s, qoo_min, qoo_max = stats(qoo_vals)
            rtt_m, _, _, _ = stats(rtt_vals)
            tp_m, _, _, _ = stats(tp_vals)
            app_m, _, _, _ = stats(app_vals)

            if qoo_m >= 0.80:
                band = "Optimal"
            elif qoo_m >= 0.60:
                band = "Acceptable"
            elif qoo_m >= 0.35:
                band = "Degraded"
            else:
                band = "Critical"

            d_val = float(rows[0]["delay_ms"])
            j_val = float(rows[0]["jitter_ms"])
            l_val = float(rows[0]["loss_pct"])
            app_name = rows[0]["app_metric_name"]

            summaries.append({
                "scenario_id": s_id,
                "profile_name": p_name,
                "delay_ms": d_val,
                "jitter_ms": j_val,
                "loss_pct": l_val,
                "run_count": len(rows),
                "qoo_mean": qoo_m,
                "qoo_std": qoo_s,
                "qoo_min": qoo_min,
                "qoo_max": qoo_max,
                "qoo_band": band,
                "rtt_mean_ms": rtt_m,
                "throughput_mean_mbps": tp_m,
                "app_metric_name": app_name,
                "app_metric_mean": app_m
            })

        # Save to summary.csv
        fieldnames = [
            "scenario_id", "profile_name", "delay_ms", "jitter_ms", "loss_pct",
            "run_count", "qoo_mean", "qoo_std", "qoo_min", "qoo_max", "qoo_band",
            "rtt_mean_ms", "throughput_mean_mbps", "app_metric_name", "app_metric_mean"
        ]
        with open(self.summary_csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(summaries)

        return summaries

storage_service = StorageService()
