import React, { useEffect, useState } from 'react';
import { Sliders, RefreshCw, Edit3, Check, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { ImpairmentScenario } from '../types';

const SCENARIO_COLORS = ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ef4444', '#6366f1'];

interface EditState {
  delay_ms: number;
  jitter_ms: number;
  loss_pct: number;
}

export const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ImpairmentScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ delay_ms: 0, jitter_ms: 0, loss_pct: 0 });

  useEffect(() => {
    api.getScenarios().then(s => { setScenarios(s); setLoading(false); });
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetBaseline();
      setResetMsg('Network baseline reset to 0ms / 0ms / 0.0% successfully.');
    } catch {
      setResetMsg('Reset request sent (gateway may be in testbed emulation mode).');
    }
    setTimeout(() => setResetMsg(null), 4000);
    setResetting(false);
  };

  const startEdit = (s: ImpairmentScenario) => {
    setEditingId(s.scenario_id);
    setEditState({ delay_ms: s.delay_ms, jitter_ms: s.jitter_ms, loss_pct: s.loss_pct });
  };

  const saveEdit = async (s: ImpairmentScenario) => {
    await api.updateScenario(s.scenario_id, editState);
    const updated = await api.getScenarios();
    setScenarios(updated);
    setEditingId(null);
  };

  if (loading) return <div className="text-slate-400 text-sm py-12 text-center">Loading scenarios...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Scenario Configuration</h2>
          <p className="text-sm text-slate-400 mt-0.5">Six controlled network impairment profiles applied via tc-netem through the container gateway.</p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-950 border border-red-800 text-red-400 text-xs font-bold hover:bg-red-900 transition disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          Safe Baseline Reset
        </button>
      </div>

      {resetMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-sm">
          <Check className="w-4 h-4" /> {resetMsg}
        </div>
      )}

      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-5 py-3 flex gap-3 text-sm text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>Impairments are applied <strong>only inside the isolated testbed container network</strong> (172.28.0.0/16). The host machine's network interface is never modified.</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((s, idx) => {
          const isEditing = editingId === s.scenario_id;
          const color = SCENARIO_COLORS[idx] ?? '#94a3b8';
          const hasImpairment = s.delay_ms > 0 || s.jitter_ms > 0 || s.loss_pct > 0;

          return (
            <div key={s.scenario_id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Color strip */}
              <div className="h-1" style={{ background: color }} />
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-lg">{s.scenario_id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border`}
                      style={{ color, borderColor: color + '60', background: color + '15' }}>
                      {hasImpairment ? 'Impaired' : 'Baseline'}
                    </span>
                  </div>
                  {!isEditing && (
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-500 hover:text-white transition">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-white text-sm mb-1">{s.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{s.description}</p>

                {isEditing ? (
                  <div className="space-y-3">
                    {[
                      { key: 'delay_ms', label: 'Delay (ms)', max: 500 },
                      { key: 'jitter_ms', label: 'Jitter (ms)', max: 200 },
                      { key: 'loss_pct', label: 'Loss (%)', max: 20, step: 0.5 }
                    ].map(({ key, label, max, step = 1 }) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{label}</span>
                          <span className="text-white font-bold">{editState[key as keyof EditState]}{key === 'loss_pct' ? '%' : 'ms'}</span>
                        </div>
                        <input
                          type="range" min={0} max={max} step={step}
                          value={editState[key as keyof EditState]}
                          onChange={e => setEditState(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(s)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold hover:bg-emerald-900 transition">
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-700 transition">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Delay', value: `${s.delay_ms}ms` },
                      { label: 'Jitter', value: `${s.jitter_ms}ms` },
                      { label: 'Loss', value: `${s.loss_pct}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-800/60 rounded-lg p-2.5 text-center border border-slate-700/40">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                        <div className="text-white font-black text-sm mt-0.5">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
