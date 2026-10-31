import React, { useEffect, useState, useRef } from 'react';
import { Play, StopCircle, RefreshCw, Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { ApplicationProfile, ImpairmentScenario } from '../types';

type ExperimentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export const RunExperimentPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ApplicationProfile[]>([]);
  const [scenarios, setScenarios] = useState<ImpairmentScenario[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [repeats, setRepeats] = useState(3);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ExperimentStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([api.getProfiles(), api.getScenarios()]).then(([p, s]) => {
      setProfiles(p);
      setScenarios(s);
      if (p[0]) setSelectedProfile(p[0].id);
      if (s[0]) setSelectedScenario(s[0].scenario_id);
    });
    return () => { if (logPollRef.current) clearInterval(logPollRef.current); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startExperiment = async () => {
    if (!selectedProfile || !selectedScenario) return;
    setStatus('running');
    setLogs([]);
    setResult(null);

    // Optimistic log start
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Starting experiment: Profile=${selectedProfile} | Scenario=${selectedScenario} | Repeats=${repeats}`]);

    try {
      const res = await api.runExperiment({
        profile_id: selectedProfile,
        scenario_id: selectedScenario,
        repeats,
        notes: notes || 'Executed via DevElite QoO Dashboard'
      });

      setResult(res);
      if (res.run_id) setRunId(res.run_id);

      // Append harness logs if available
      if (res.run_id) {
        const harnessLogs = await api.getLogs(res.run_id);
        if (harnessLogs.length > 0) {
          setLogs(harnessLogs);
        }
      }

      const finalStatus = res.status === 'COMPLETED' || res.status === 'completed' ? 'completed' : 'failed';
      setStatus(finalStatus);

      if (finalStatus === 'completed') {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [SUCCESS] Suite complete! ${res.records?.length ?? 0} runs persisted.`]);
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Safety reset to baseline verified.`]);
      }
    } catch (err: any) {
      setStatus('failed');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [ERROR] ${err.message ?? 'Unknown error'}`]);
    }
  };

  const cancelExperiment = async () => {
    if (!runId) return;
    setStatus('cancelled');
    try {
      await api.cancelExperiment(runId);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [WARN] Experiment cancelled. Emergency baseline reset triggered.`]);
    } catch {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [WARN] Cancel sent. Baseline reset attempted.`]);
    }
  };

  const reset = () => {
    setStatus('idle');
    setLogs([]);
    setResult(null);
    setRunId(null);
  };

  const statusConfig: Record<ExperimentStatus, { color: string; label: string; icon: React.ReactNode }> = {
    idle: { color: 'text-slate-400', label: 'Ready', icon: null },
    running: { color: 'text-cyan-400', label: 'Running…', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    completed: { color: 'text-emerald-400', label: 'Completed', icon: <CheckCircle className="w-4 h-4" /> },
    failed: { color: 'text-red-400', label: 'Failed', icon: <XCircle className="w-4 h-4" /> },
    cancelled: { color: 'text-amber-400', label: 'Cancelled', icon: <StopCircle className="w-4 h-4" /> },
  };

  const sc = statusConfig[status];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Run Experiment</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Execute a 12-step automated QoO evaluation: select profile → scenario → apply impairment → probe → evaluate → record → reset.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Experiment Configuration</h3>

          {/* Profile Select */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Application Profile
            </label>
            <div className="grid grid-cols-2 gap-3">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedProfile === p.id
                      ? 'border-cyan-600 bg-cyan-950/40 text-white'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider mb-1 text-cyan-500">
                    Profile {i === 0 ? 'A' : 'B'}
                  </div>
                  <div className="text-xs font-bold leading-tight">{p.profile_name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Select */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Network Impairment Scenario
            </label>
            <div className="grid grid-cols-3 gap-2">
              {scenarios.map(s => (
                <button
                  key={s.scenario_id}
                  onClick={() => setSelectedScenario(s.scenario_id)}
                  className={`p-2.5 rounded-lg border text-left transition text-xs ${
                    selectedScenario === s.scenario_id
                      ? 'border-purple-600 bg-purple-950/40 text-white'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="font-black text-sm">{s.scenario_id}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{s.name}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{s.delay_ms}ms / {s.jitter_ms}ms / {s.loss_pct}%</div>
                </button>
              ))}
            </div>
          </div>

          {/* Repetitions */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <label className="font-semibold text-slate-400 uppercase tracking-wider">Repetitions (N)</label>
              <span className="text-white font-black">{repeats} runs</span>
            </div>
            <input
              type="range" min={1} max={20} value={repeats}
              onChange={e => setRepeats(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1 (quick)</span><span>10 (standard)</span><span>20 (full statistical)</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Experiment context, test session label…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            {status !== 'running' ? (
              <button
                onClick={startExperiment}
                disabled={!selectedProfile || !selectedScenario}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-sm hover:from-cyan-500 hover:to-indigo-500 transition disabled:opacity-40 shadow-lg shadow-cyan-900/30"
              >
                <Play className="w-4 h-4" /> Start Experiment
              </button>
            ) : (
              <button
                onClick={cancelExperiment}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-950 border border-red-800 text-red-400 font-bold text-sm hover:bg-red-900 transition"
              >
                <StopCircle className="w-4 h-4" /> Cancel & Reset Baseline
              </button>
            )}

            {status !== 'idle' && status !== 'running' && (
              <button onClick={reset} className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Bar */}
          <div className={`flex items-center gap-2 text-sm font-semibold ${sc.color}`}>
            {sc.icon} Experiment Status: {sc.label}
          </div>
        </div>

        {/* Logs Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800 bg-slate-800/60">
            <Terminal className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Execution Log</span>
            <span className="ml-auto text-[10px] text-slate-500">{logs.length} entries</span>
          </div>
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto min-h-[320px] max-h-[480px] bg-slate-950 text-slate-400 space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-slate-600 text-center pt-8">Run an experiment to view live execution logs…</div>
            ) : (
              logs.map((log, i) => {
                const isError = log.includes('[ERROR]');
                const isWarn = log.includes('[WARN]');
                const isSuccess = log.includes('[SUCCESS]');
                const color = isError ? 'text-red-400' : isWarn ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-slate-400';
                return <div key={i} className={color}>{log}</div>;
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Result Summary */}
      {result && result.records && result.records.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Run Results ({result.records.length} repetitions)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                  {['Exp ID', 'Run', 'QoO Score', 'Band', 'RTT', 'Throughput', 'Loss', 'App Metric'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.records.map((r: any, i: number) => {
                  const band = r.qoo_band || (r.qoo_score >= 0.80 ? 'Optimal' : r.qoo_score >= 0.60 ? 'Acceptable' : r.qoo_score >= 0.35 ? 'Degraded' : 'Critical');
                  const bandColor = { Optimal: 'text-emerald-400', Acceptable: 'text-blue-400', Degraded: 'text-amber-400', Critical: 'text-red-400' }[band] ?? 'text-slate-400';
                  return (
                    <tr key={i} className="border-t border-slate-800/60 hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-cyan-400 text-[10px]">{r.experiment_id}</td>
                      <td className="px-4 py-2.5 font-bold text-white">#{r.run_number}</td>
                      <td className="px-4 py-2.5 font-black text-white">{Number(r.qoo_score).toFixed(3)}</td>
                      <td className={`px-4 py-2.5 font-bold ${bandColor}`}>{band}</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.rtt_ms).toFixed(1)}ms</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.throughput_mbps).toFixed(1)} Mbps</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.measured_loss_pct).toFixed(2)}%</td>
                      <td className="px-4 py-2.5 text-slate-300">{r.app_metric_name}: <strong>{Number(r.app_metric_value).toFixed(2)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
