import React from 'react';
import { Activity, Layers, Sliders, Play, BarChart3, History, FileDown, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gatewayStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, gatewayStatus = "Online" }) => {
  const tabs = [
    { id: 'dashboard', label: 'Main Dashboard', icon: Activity },
    { id: 'profiles', label: 'Application Profiles', icon: Layers },
    { id: 'scenarios', label: 'Scenario Config', icon: Sliders },
    { id: 'run', label: 'Run Experiment', icon: Play },
    { id: 'results', label: 'Results & Analysis', icon: BarChart3 },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'reports', label: 'Reports & Downloads', icon: FileDown },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
            QoO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base tracking-tight">
                DevElite – QoO Network Evaluation Platform
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full">
                PS-029
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AIORI Hackathon 3 | draft-ietf-ippm-qoo | cj-ike-kunze/ietf-126-hackathon-qoo
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway: <strong className="text-emerald-400">{gatewayStatus}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-xs text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>tc-netem Active</span>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80 pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
