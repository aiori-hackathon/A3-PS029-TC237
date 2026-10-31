import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { BarChart3, TrendingDown, Info } from 'lucide-react';
import { api } from '../services/api';
import { BandBadge } from '../components/BandBadge';
import type { StatisticalSummary, ProfileComparison } from '../types';

const SCENARIO_NAMES: Record<string, string> = {
  S1: 'Baseline', S2: 'High Delay', S3: 'High Jitter',
  S4: 'Packet Loss', S5: 'Delay + Jitter', S6: 'All Combined'
};

const PROFILE_COLORS = ['#38bdf8', '#a855f7'];

export const ResultsPage: React.FC = () => {
  const [summaries, setSummaries] = useState<StatisticalSummary[]>([]);
  const [comparisons, setComparisons] = useState<ProfileComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'qoo' | 'rtt' | 'throughput' | 'app'>('qoo');

  useEffect(() => {
    Promise.all([api.getStatistics(), api.getComparisons()])
      .then(([s, c]) => { setSummaries(s); setComparisons(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm py-12 text-center">Loading analysis data...</div>;

  // Build chart data
  const profileNames = [...new Set(summaries.map(s => s.profile_name))];
  const scenarioIds = [...new Set(summaries.map(s => s.scenario_id))].sort();

  const buildChartData = (metric: 'qoo_mean' | 'rtt_mean_ms' | 'throughput_mean_mbps' | 'app_metric_mean') =>
    scenarioIds.map(sid => {
      const entry: any = { name: SCENARIO_NAMES[sid] ?? sid };
      profileNames.forEach(p => {
        const row = summaries.find(s => s.scenario_id === sid && s.profile_name === p);
        if (row) entry[p.length > 20 ? p.slice(0, 20) + '…' : p] = Number((row[metric] as number).toFixed(3));
      });
      return entry;
    });

  const shortProfiles = profileNames.map(p => p.length > 20 ? p.slice(0, 20) + '…' : p);

  const metricTabs = [
    { id: 'qoo', label: 'QoO Score', dataKey: 'qoo_mean' as const },
    { id: 'rtt', label: 'RTT (ms)', dataKey: 'rtt_mean_ms' as const },
    { id: 'throughput', label: 'Throughput (Mbps)', dataKey: 'throughput_mean_mbps' as const },
    { id: 'app', label: 'App Metric', dataKey: 'app_metric_mean' as const },
  ];

  const currentMetricKey = metricTabs.find(m => m.id === activeMetric)?.dataKey ?? 'qoo_mean';
  const currentChartData = buildChartData(currentMetricKey);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Results & Comparative Analysis</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Application-profile–oriented comparison demonstrating how identical network conditions produce divergent QoO outcomes.
        </p>
      </div>

      {summaries.length === 0 && (
        <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No experiment data yet. Run experiments to populate analysis charts.
        </div>
      )}

      {summaries.length > 0 && (
        <>
          {/* Metric Selector */}
          <div className="flex gap-2 flex-wrap">
            {metricTabs.map(m => (
              <button key={m.id} onClick={() => setActiveMetric(m.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition border ${
                  activeMetric === m.id
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                    : 'text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800/60'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Main Comparison Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-1">
              {metricTabs.find(m => m.id === activeMetric)?.label} — Profile A vs Profile B across 6 Scenarios
            </h3>
            <p className="text-xs text-slate-500 mb-5">Grouped bars show mean values per (scenario, profile) cell. N repetitions per cell.</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentChartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                {shortProfiles.map((p, i) => (
                  <Bar key={p} dataKey={p} fill={PROFILE_COLORS[i] ?? '#6366f1'} radius={[4, 4, 0, 0]} maxBarSize={40} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistical Summary Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-white">Statistical Summary Table</h3>
              <span className="ml-auto text-xs text-slate-500">Mean ± Std | Min | Max across N repetitions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                    {['Scenario', 'Impairment D/J/L', 'Profile', 'QoO Mean ± Std', 'Band', 'RTT (ms)', 'TP (Mbps)', 'App Metric', 'Runs'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s, i) => (
                    <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-2.5 font-black text-white">{s.scenario_id}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">{s.delay_ms}ms / {s.jitter_ms}ms / {s.loss_pct}%</td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-[160px] truncate" title={s.profile_name}>{s.profile_name}</td>
                      <td className="px-4 py-2.5 font-black text-white">
                        {Number(s.qoo_mean).toFixed(3)}
                        <span className="text-slate-500 font-normal text-[10px] ml-1">±{Number(s.qoo_std).toFixed(3)}</span>
                      </td>
                      <td className="px-4 py-2.5"><BandBadge band={s.qoo_band} small /></td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(s.rtt_mean_ms).toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(s.throughput_mean_mbps).toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-[10px]">{s.app_metric_name}: <strong className="text-slate-300">{Number(s.app_metric_mean).toFixed(2)}</strong></td>
                      <td className="px-4 py-2.5 text-slate-400">{s.run_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Divergence Insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" /> QoO Divergence Insights Per Scenario
            </h3>
            {comparisons.filter(c => c.qoo_delta !== undefined && c.qoo_delta !== null).map((comp, i) => {
              const delta = comp.qoo_delta ?? 0;
              const deltaColor = delta > 0.3 ? 'text-red-400' : delta > 0.15 ? 'text-amber-400' : 'text-emerald-400';
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
                  <div className="shrink-0 text-center">
                    <div className="text-xs font-black text-white bg-slate-800 rounded-lg px-3 py-1">{comp.scenario_id}</div>
                    <div className={`text-xs font-black mt-1.5 ${deltaColor}`}>Δ {delta.toFixed(3)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-300 leading-relaxed">{comp.divergence_insight}</div>
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                      <span>Delay: {comp.impairment.delay_ms}ms</span>
                      <span>Jitter: {comp.impairment.jitter_ms}ms</span>
                      <span>Loss: {comp.impairment.loss_pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
