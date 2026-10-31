import React, { useEffect, useState } from 'react';
import { FileDown, FileJson, FileSpreadsheet, BookOpen, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [summaryMd, setSummaryMd] = useState('');
  const [loadingMd, setLoadingMd] = useState(false);

  const loadSummary = async () => {
    setLoadingMd(true);
    try {
      const md = await api.getSummaryReportMarkdown();
      setSummaryMd(md);
    } catch {
      setSummaryMd('Failed to load summary report. Run experiments first.');
    }
    setLoadingMd(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">Reports & Downloads</h2>
        <p className="text-sm text-slate-400 mt-0.5">Export experimental datasets, statistical summaries, and formatted technical reports.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Download Tiles */}
        {[
          {
            icon: <FileSpreadsheet className="w-6 h-6 text-emerald-400" />,
            title: 'Full Experiment Dataset (CSV)',
            desc: '16-column conformant dataset per docs/schema.md. All experiment records with timestamps, QoO scores, network metrics, and application telemetry.',
            action: 'Download CSV',
            color: 'border-emerald-800/50 hover:border-emerald-700',
            href: api.getExportCsvUrl()
          },
          {
            icon: <FileJson className="w-6 h-6 text-cyan-400" />,
            title: 'Full Dataset (JSON)',
            desc: 'Complete experiment records with full profile parameter snapshots embedded per record. Suitable for programmatic analysis.',
            action: 'Download JSON',
            color: 'border-cyan-800/50 hover:border-cyan-700',
            href: api.getExportJsonUrl()
          },
          {
            icon: <ClipboardList className="w-6 h-6 text-purple-400" />,
            title: 'Statistical Summary CSV',
            desc: 'Aggregated mean, std, min, max per (scenario, profile) cell with QoO utility band classification.',
            action: 'Download Summary CSV',
            color: 'border-purple-800/50 hover:border-purple-700',
            href: '/api/reports/export/summary-csv'
          },
        ].map((item, i) => (
          <a key={i} href={item.href} download
            className={`bg-slate-900 border rounded-xl p-5 flex gap-4 items-start transition group ${item.color}`}>
            <div className="shrink-0 mt-1">{item.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-white transition">
                <FileDown className="w-3.5 h-3.5" /> {item.action}
              </div>
            </div>
          </a>
        ))}

        {/* Markdown Report Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex gap-4 items-start">
          <div className="shrink-0 mt-1"><BookOpen className="w-6 h-6 text-amber-400" /></div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm mb-1">Executive Markdown Summary Report</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Auto-generated executive summary report with scenario-level results table and key scientific findings.
            </p>
            <button onClick={loadSummary} disabled={loadingMd}
              className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition disabled:opacity-60">
              <BookOpen className="w-3.5 h-3.5" /> {loadingMd ? 'Loading…' : 'View Report Below'}
            </button>
          </div>
        </div>
      </div>

      {/* Rendered Summary Report */}
      {summaryMd && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/40">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Executive Summary Report</span>
          </div>
          <pre className="p-5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[600px] overflow-y-auto">
            {summaryMd}
          </pre>
        </div>
      )}

      {/* Documentation References */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" /> RFC & Specification References
        </h3>
        <div className="space-y-2 text-xs">
          {[
            { ref: 'draft-ietf-ippm-qoo', desc: 'IETF IPPM Working Group: Quality of Outcome (QoO) Framework', type: 'Primary Specification' },
            { ref: 'cj-ike-kunze/ietf-126-hackathon-qoo', desc: 'IETF 126 Hackathon QoO Reference Implementation (GitHub)', type: 'Testbed Framework' },
            { ref: 'RFC 4594', desc: 'Configuration Guidelines for DiffServ Service Classes', type: 'Traffic Classification' },
            { ref: 'RFC 8835', desc: 'Transports for WebRTC — Latency and Jitter Requirements', type: 'Profile A Reference' },
            { ref: 'RFC 3168', desc: 'The Addition of ECN to IP — TCP Congestion Window Behavior', type: 'Profile B Reference' },
            { ref: 'RFC 5348', desc: 'TCP Friendly Rate Control (TFRC) — Mathis Formula Basis', type: 'Throughput Modeling' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
              <code className="text-cyan-400 shrink-0 w-56">{r.ref}</code>
              <span className="text-slate-400 flex-1">{r.desc}</span>
              <span className="text-slate-600 text-[10px] shrink-0">{r.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
