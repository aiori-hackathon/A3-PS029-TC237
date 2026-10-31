import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, Layers, CheckCircle, XCircle, FlaskConical, Network, Clock } from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { BandBadge } from '../components/BandBadge';
import type { ExperimentRecord, StatisticalSummary } from '../types';

export const MainDashboard: React.FC = () => {
  const [records, setRecords] = useState<ExperimentRecord[]>([]);
  const [summaries, setSummaries] = useState<StatisticalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getResults(), api.getStatistics()])
      .then(([r, s]) => { setRecords(r); setSummaries(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = records.length;
  const completed = records.filter(r => Number(r.qoo_score) > 0).length;
  const failed = records.filter(r => !r.qoo_score || Number(r.qoo_score) === 0).length;
  const latest = records[records.length - 1];

  // Chart data — QoO by scenario (mean per scenario, both profiles)
  const qooChartData = summaries.map(s => ({
    name: s.scenario_id,
    profile: s.profile_name.includes('video') || s.profile_name.includes('bulk') || s.profile_name.includes('Video') ? 'Profile B' : 'Profile A',
    QoO: Number(s.qoo_mean.toFixed(3)),
    RTT: Number(s.rtt_mean_ms.toFixed(1)),
    Throughput: Number(s.throughput_mean_mbps.toFixed(1)),
  }));

  // Build side-by-side for profiles
  const scenarioSet: string[] = [];
  const chartByScenario: Record<string, any> = {};
  summaries.forEach(s => {
    if (!scenarioSet.includes(s.scenario_id)) scenarioSet.push(s.scenario_id);
    if (!chartByScenario[s.scenario_id]) chartByScenario[s.scenario_id] = { name: s.scenario_id };
    const shortName = s.profile_name.length > 22 ? s.profile_name.slice(0, 22) + '…' : s.profile_name;
    chartByScenario[s.scenario_id][shortName] = Number(s.qoo_mean.toFixed(3));
  });
  const barData = Object.values(chartByScenario);

  const profileNames = [...new Set(summaries.map(s => s.profile_name.length > 22 ? s.profile_name.slice(0, 22) + '…' : s.profile_name))];

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
      <Activity className="w-5 h-5 mr-2 animate-pulse" /> Loading dashboard data...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-white">Main Dashboard</h2>
        <p className="text-sm text-slate-400 mt-0.5">Real-time overview of QoO experiment results across all profiles and scenarios.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Runs" value={total} sub="All experiments" icon={<FlaskConical className="w-4 h-4" />} />
        <StatCard label="Completed" value={completed} color="text-emerald-400" sub="With QoO score" icon={<CheckCircle className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Failed / Zero" value={failed} color={failed > 0 ? 'text-red-400' : 'text-slate-300'} icon={<XCircle className="w-4 h-4 text-red-700" />} />
        <StatCard label="Profiles" value={2} sub="A & B configured" icon={<Layers className="w-4 h-4" />} />
        <StatCard label="Scenarios" value={6} sub="S1 → S6" icon={<Network className="w-4 h-4" />} />
        <StatCard
          label="Latest Run"
          value={latest ? `${String(latest.qoo_score).slice(0, 5)}` : 'N/A'}
          sub={latest ? `${latest.scenario_id} · ${latest.timestamp?.slice(0, 10)}` : 'No runs yet'}
          color="text-cyan-400"
          icon={<Clock className="w-4 h-4 text-cyan-700" />}
        />
      </div>

      {/* Band Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Optimal', 'Acceptable', 'Degraded', 'Critical'].map(band => {
          const count = summaries.filter(s => s.qoo_band === band).length;
          return (
            <div key={band} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <BandBadge band={band} />
              <div className="text-3xl font-black text-white">{count}</div>
              <div className="text-xs text-slate-500">scenario × profile cells</div>
            </div>
          );
        })}
      </div>

      {/* Main Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* QoO Comparison Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">QoO Score by Scenario (Both Profiles)</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {profileNames.map((p, i) => (
                  <Bar key={p} dataKey={p} fill={i === 0 ? '#38bdf8' : '#a855f7'} radius={[3, 3, 0, 0]} maxBarSize={32} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No experiment data yet. Run experiments to populate charts.</div>
          )}
        </div>

        {/* RTT Line Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Mean RTT by Scenario & Profile (ms)</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {profileNames.map((p, i) => (
                  <Bar key={`rtt-${p}`} dataKey={p} name={`RTT: ${p}`} fill={i === 0 ? '#10b981' : '#f59e0b'} radius={[3, 3, 0, 0]} maxBarSize={32} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-500 text-sm">No data yet.</div>
          )}
        </div>
      </div>

      {/* Recent Experiments Table */}
      {records.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Recent Experiments (Last 10)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                  {['Experiment ID', 'Timestamp', 'Scenario', 'Profile', 'QoO Score', 'RTT (ms)', 'Throughput', 'Band'].map(h => (
                    <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.slice(-10).reverse().map((r, i) => {
                  const score = Number(r.qoo_score);
                  const band = score >= 0.80 ? 'Optimal' : score >= 0.60 ? 'Acceptable' : score >= 0.35 ? 'Degraded' : 'Critical';
                  return (
                    <tr key={i} className="border-t border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-cyan-400 text-[10px]">{r.experiment_id}</td>
                      <td className="px-4 py-2.5 text-slate-400">{String(r.timestamp).slice(0, 16).replace('T', ' ')}</td>
                      <td className="px-4 py-2.5 font-bold text-white">{r.scenario_id}</td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-[140px] truncate">{r.profile_name}</td>
                      <td className="px-4 py-2.5 font-black text-white">{Number(r.qoo_score).toFixed(3)}</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.rtt_ms).toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-300">{Number(r.throughput_mbps).toFixed(1)} Mbps</td>
                      <td className="px-4 py-2.5"><BandBadge band={band} small /></td>
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
