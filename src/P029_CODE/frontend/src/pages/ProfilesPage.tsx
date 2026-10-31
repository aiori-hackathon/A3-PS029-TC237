import React, { useEffect, useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Download, Upload, Edit3, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { ApplicationProfile } from '../types';

const FIELD_COLOR: Record<string, string> = {
  delay: 'text-cyan-400',
  jitter: 'text-purple-400',
  loss: 'text-amber-400',
  throughput: 'text-emerald-400',
};

export const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ApplicationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getProfiles().then(p => { setProfiles(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const handleExport = (profile: ApplicationProfile) => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        await api.importProfile(data);
        const updated = await api.getProfiles();
        setProfiles(updated);
        setMsg('Profile imported successfully.');
        setTimeout(() => setMsg(null), 3000);
      } catch {
        setMsg('Import failed: invalid profile JSON.');
        setTimeout(() => setMsg(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="text-slate-400 text-sm py-12 text-center">Loading profiles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Application Profiles</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            QoO profile parameters conforming to <code className="text-cyan-400">draft-ietf-ippm-qoo</code>. Status: <span className="text-amber-400 font-semibold">Pending Mentor Approval</span>
          </p>
        </div>
        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition">
          <Upload className="w-3.5 h-3.5" /> Import Profile JSON
          <input type="file" accept=".json" className="hidden" onChange={handleImport} />
        </label>
      </div>

      {msg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}

      <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-5 py-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <strong>Mentor Approval Disclaimer:</strong> The threshold values below (acceptable/unusable bounds and weights) are proposed initial candidates.
          All parameters are clearly marked <code className="text-amber-400">PROPOSED_PENDING_MENTOR_APPROVAL</code> and must be confirmed by the hackathon mentor before use in final reported results.
          No QoO mathematics have been invented; the utility formulas follow <code className="text-amber-400">draft-ietf-ippm-qoo</code>.
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {profiles.map((p, idx) => {
          const isExpanded = expandedId === p.id;
          const profileLabel = idx === 0 ? 'Profile A' : 'Profile B';
          const profileColor = idx === 0 ? 'border-cyan-700/40 bg-cyan-950/20' : 'border-purple-700/40 bg-purple-950/20';
          const accentColor = idx === 0 ? 'text-cyan-400' : 'text-purple-400';

          return (
            <div key={p.id} className={`bg-slate-900 border rounded-xl overflow-hidden ${profileColor}`}>
              {/* Header */}
              <div className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${idx === 0 ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' : 'text-purple-400 bg-purple-950/60 border-purple-800/60'}`}>
                      {profileLabel}
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full font-semibold uppercase">
                      Pending Approval
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-base">{p.profile_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleExport(p)} className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggle(p.id)} className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 pb-3 text-xs text-slate-400 leading-relaxed">{p.description}</div>

              {/* Quick Parameter Summary */}
              <div className="mx-5 mb-4 grid grid-cols-3 gap-3">
                {Object.entries(p.parameters).map(([key, bounds]) => {
                  if (key === 'throughput') return null;
                  const b = bounds as any;
                  return (
                    <div key={key} className="bg-slate-800/70 rounded-lg p-3 border border-slate-700/50">
                      <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${FIELD_COLOR[key] ?? 'text-slate-400'}`}>{key}</div>
                      <div className="text-white font-bold text-sm">
                        ≤{b.acceptable_ms ?? b.acceptable_pct ?? '?'}{key === 'loss' ? '%' : 'ms'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">w = {b.weight}</div>
                    </div>
                  );
                })}
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-slate-800 px-5 py-4 space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Parameter Bounds</div>
                  {Object.entries(p.parameters).map(([key, bounds]) => {
                    const b = bounds as any;
                    return (
                      <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/40">
                        <div className={`text-xs font-black uppercase tracking-wider mb-2 ${FIELD_COLOR[key] ?? 'text-slate-400'}`}>{key}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(b).filter(([k]) => k !== 'weight').map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                              <span className="text-slate-200 font-semibold">{String(v)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between col-span-2 pt-1 border-t border-slate-700/50">
                            <span className="text-slate-500">Weight in utility fn</span>
                            <span className="text-white font-bold">{b.weight}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/40">
                    <div className={`text-xs font-black uppercase tracking-wider mb-2 ${accentColor}`}>Application Telemetry Metric</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-slate-500">Metric</span><span className="font-mono text-white">{p.application_telemetry.metric_name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Target</span><span className="text-emerald-400 font-semibold">{p.application_telemetry.target_value} {p.application_telemetry.unit}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Degraded ≥</span><span className="text-amber-400 font-semibold">{p.application_telemetry.degraded_threshold}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Critical ≥</span><span className="text-red-400 font-semibold">{p.application_telemetry.critical_threshold}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">RFC Reference:</span>
                    <code className="text-xs text-slate-300">{p.reference_rfc ?? 'draft-ietf-ippm-qoo'}</code>
                    <span className="text-xs text-slate-500 ml-auto">Utility fn:</span>
                    <code className="text-xs text-cyan-300">{p.utility_function}</code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
