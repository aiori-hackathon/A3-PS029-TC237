"""
Pseudocode for QoO Experiment Runner Harness (PS-029)
Team DevElite - AIORI Hackathon 3

This describes the logical flow of the 12-step experiment workflow
implemented in backend/app/services/harness.py.
"""

# ============================================================
# PSEUDOCODE: DevElite QoO Experiment Runner (12-Step Harness)
# ============================================================

function run_experiment(profile_id, scenario_id, repeats, notes):

    # STEP 1: Select and validate application profile
    profile = load_profile(profile_id)
    if profile is None:
        log_error("Profile not found. Aborting.")
        return FAILED

    # STEP 2: Select and validate network scenario
    scenario = load_scenario(scenario_id)
    if scenario is None:
        log_error("Scenario not found. Aborting.")
        return FAILED

    # STEP 3: Load profile configuration into gateway
    gateway.register_profile(profile.name, profile.parameters)

    # Pre-test baseline safety reset
    gateway.reset_baseline()

    try:
        for repeat in 1..repeats:

            # STEP 4: Apply network impairment (tc-netem via gateway REST API)
            gateway.apply_impairment(
                delay_ms = scenario.delay_ms,
                jitter_ms = scenario.jitter_ms,
                loss_pct = scenario.loss_pct
            )

            # Stabilization pause (allow tc-netem to propagate)
            sleep(80ms)

            # STEP 5: Run active network probes
            measurements = collector.measure_telemetry(
                configured_delay = scenario.delay_ms,
                configured_jitter = scenario.jitter_ms,
                configured_loss = scenario.loss_pct,
                profile_name = profile.name,
                run_number = repeat
            )
            # Measurements include:
            # - rtt_ms          (ICMP active probe)
            # - jitter_ms       (inter-packet arrival variation)
            # - loss_pct        (measured packet drop rate)
            # - throughput_mbps (iperf3 TCP payload)

            # STEP 6: Run goDASH application measurement (where applicable)
            app_metric = collector.run_godash_or_application_probe(
                profile = profile,
                measurements = measurements
            )
            # Returns profile-specific metric:
            # Profile A (Real-Time Video) -> frame_freeze_rate_pct
            # Profile B (Bulk Transfer)   -> transfer_goodput_ratio

            # STEP 7 & 8: Send measurements to QoO engine and retrieve evaluation
            qoo_result = qoo_engine.evaluate(
                rtt_ms = measurements.rtt_ms,
                jitter_ms = measurements.jitter_ms,
                loss_pct = measurements.loss_pct,
                throughput_mbps = measurements.throughput_mbps,
                profile_params = profile.parameters
            )
            # Returns: qoo_score [0.0, 1.0], qoo_band, utility_components

            # STEP 9: Persist experiment record
            record = ExperimentRecord(
                experiment_id = generate_unique_id(),
                timestamp = now_utc(),
                scenario_id = scenario.scenario_id,
                delay_ms = scenario.delay_ms,
                jitter_ms = scenario.jitter_ms,
                loss_pct = scenario.loss_pct,
                profile_name = profile.name,
                profile_params_file = profile.file_path,
                run_number = repeat,
                qoo_score = qoo_result.qoo_score,
                qoo_band = qoo_result.qoo_band,
                rtt_ms = measurements.rtt_ms,
                throughput_mbps = measurements.throughput_mbps,
                measured_loss_pct = measurements.loss_pct,
                app_metric_name = app_metric.name,
                app_metric_value = app_metric.value,
                notes = notes,
                profile_parameters_snapshot = profile.parameters
            )
            storage.append_record(record)  # to CSV + JSON

            # STEP 10: Reset network to baseline between runs (idempotency)
            gateway.reset_baseline()
            sleep(40ms)

            # Update progress
            progress = (repeat / repeats) * 100.0

        # STEP 11: Final completion
        log("Suite complete! All records persisted.")

    except CancellationRequested:
        log_warning("Cancellation flag raised. Immediate baseline reset.")
    except Exception as error:
        log_error("Harness failure: " + error)
        return FAILED

    finally:
        # STEP 12: Guaranteed safety cleanup
        gateway.reset_baseline()
        log("Final baseline cleanup verified.")

    return COMPLETED


# ============================================================
# BATCH EXPERIMENT MATRIX (Cross-Profile × Cross-Scenario)
# ============================================================

function run_batch_matrix(profile_ids, scenario_ids, repeats):
    for profile_id in profile_ids:
        for scenario_id in scenario_ids:
            run_experiment(profile_id, scenario_id, repeats)
            # Both profiles evaluated under IDENTICAL network conditions
            # This is the core comparison mechanism of the study
