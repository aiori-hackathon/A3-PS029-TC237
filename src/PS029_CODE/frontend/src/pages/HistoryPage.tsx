import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, History } from 'lucide-react';
import { api } from '../services/api';
import { BandBadge } from '../components/BandBadge';
import type { ExperimentRecord } from '../types';

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProfile, setFilterProfile] = useState('');
  const [filterScenario, setFilterScenario] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    api.getResults().then(r => {
      setRecords(r.reverse()); // newest first
      setLoading(false);
    });
  }, []);

  const profiles = [...new Set(records.map(r => r.profile_name))];
  const scenarios = [...new Set(records.map(r => r.scenario_id))].sort();

  const filtered = records.filter(r => {
    if (filterProfile && !r.profile_name.includes(filterProfile)) return false;
    if (filterScenario && r.scenario_id !== filterScenario) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.experiment_id?.toString().toLowerCase().includes(s) ||
        r.profile_name?.toString().toLowerCase().includes(s) ||
        r.scenario_id?.toString().toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <div className="text-slate-400 text-sm py-12 text-center">Loading experiment history...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Experiment History</h2>
        <p className="text-sm text-slate-400 mt-0.5">{records.length} experiments recorded — search, filter, and inspect detailed records.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Search by ID, profile, scenario…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-600"
          />
        </div>

        <select value={filterProfile} onChange={e => { setFilterProfile(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600">
          <option value="">All Profiles</option>
          {profiles.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filterScenario} onChange={e => { setFilterScenario(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-600">
          <option value="">All Scenarios</option>
          {scenarios.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400">{filtered.length} records shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                {['', 'Experiment ID', 'Timestamp', 'Scenario', 'Profile', 'QoO Score', 'Band', 'RTT (ms)', 'Throughput', 'Loss'].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => {
                const score = Number(r.qoo_score);
                const band = score >= 0.80 ? 'Optimal' : score >= 0.60 ? 'Acceptable' : score >= 0.35 ? 'Degraded' : 'Critical';
                const isExpanded = expandedId === r.experiment_id;
                return (
                  <React.Fragment key={i}>
                    <tr
                      className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(prev => prev === r.experiment_id ? null : r.experiment_id as string)}
                    >
                      <td className="px-3 py-2.5 text-slate-600">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-cyan-400 text-[10px]">{r.experiment_id}</td>
                      <td className="px-4 py-2.5 text-slate-400">{String(r.timestamp).slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.scenario_id}</td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-[160px] truncate" title={String(r.profile_name)}>{r.profile_name}</td>
                      <td className="px-4 py-2.5 font-black text-white">{Number(r.qoo_score).toFixed(3)}</td>
                      <td className="px-4 py-2.5"><BandBadge band={band} small /></td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.rtt_ms).toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.throughput_mbps).toFixed(1)} Mbps</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.measured_loss_pct).toFixed(2)}%</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-slate-700/40">
                        <td colSpan={10} className="bg-slate-950/60 px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div><span className="text-slate-500 block">App Metric</span><code className="text-cyan-300">{r.app_metric_name}: {Number(r.app_metric_value).toFixed(2)}</code></div>
                            <div><span className="text-slate-500 block">Profile File</span><code className="text-slate-300 text-[10px]">{r.profile_params_file}</code></div>
                            <div><span className="text-slate-500 block">Run Number</span><span className="text-white">#{r.run_number}</span></div>
                            <div><span className="text-slate-500 block">Notes</span><span className="text-slate-400">{r.notes ?? 'N/A'}</span></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">No experiments matching filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 text-xs text-slate-400">
            <span>Page {page} of {totalPages} ({filtered.length} records)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
