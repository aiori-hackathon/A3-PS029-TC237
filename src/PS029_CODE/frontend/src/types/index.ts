export interface DelayBounds {
  target_ms: number;
  acceptable_ms: number;
  unusable_ms: number;
  max_acceptable_ms?: number;
  weight: number;
}

export interface JitterBounds {
  target_ms: number;
  acceptable_ms: number;
  unusable_ms: number;
  max_acceptable_ms?: number;
  weight: number;
}

export interface LossBounds {
  target_pct: number;
  acceptable_pct: number;
  unusable_pct: number;
  max_acceptable_pct?: number;
  weight: number;
}

export interface ThroughputBounds {
  min_required_mbps: number;
  target_mbps: number;
  weight: number;
}

export interface ApplicationTelemetrySpec {
  metric_name: string;
  description?: string;
  target_value: number;
  degraded_threshold: number;
  critical_threshold: number;
  unit: string;
}

export interface ApplicationProfile {
  id: string;
  profile_name: string;
  category: string;
  status: string; // e.g. "PROPOSED_PENDING_MENTOR_APPROVAL" | "MENTOR_APPROVED"
  version: string;
  reference_rfc?: string;
  description: string;
  parameters: {
    delay: DelayBounds;
    jitter: JitterBounds;
    loss: LossBounds;
    throughput?: ThroughputBounds;
  };
  utility_function: string;
  application_telemetry: ApplicationTelemetrySpec;
}

export interface ImpairmentScenario {
  scenario_id: string;
  name: string;
  delay_ms: number;
  jitter_ms: number;
  loss_pct: number;
  description: string;
}

export interface ExperimentRecord {
  experiment_id: string;
  timestamp: string;
  scenario_id: string;
  delay_ms: string | number;
  jitter_ms: string | number;
  loss_pct: string | number;
  profile_name: string;
  profile_params_file: string;
  run_number: string | number;
  qoo_score: string | number;
  rtt_ms: string | number;
  throughput_mbps: string | number;
  measured_loss_pct: string | number;
  app_metric_name: string;
  app_metric_value: string | number;
  notes?: string;
}

export interface StatisticalSummary {
  scenario_id: string;
  profile_name: string;
  delay_ms: number;
  jitter_ms: number;
  loss_pct: number;
  run_count: number;
  qoo_mean: number;
  qoo_std: number;
  qoo_min: number;
  qoo_max: number;
  qoo_band: 'Optimal' | 'Acceptable' | 'Degraded' | 'Critical';
  rtt_mean_ms: number;
  throughput_mean_mbps: number;
  app_metric_name: string;
  app_metric_mean: number;
}

export interface ProfileComparison {
  scenario_id: string;
  impairment: {
    delay_ms: number;
    jitter_ms: number;
    loss_pct: number;
  };
  profiles: Record<string, StatisticalSummary>;
  qoo_delta?: number;
  divergence_insight: string;
}
