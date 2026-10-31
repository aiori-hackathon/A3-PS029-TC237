import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = 'text-white', icon }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      {icon && <span className="text-slate-500">{icon}</span>}
    </div>
    <div className={`text-3xl font-black ${color}`}>{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </div>
);
