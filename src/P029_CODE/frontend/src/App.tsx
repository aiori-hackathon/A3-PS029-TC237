import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MainDashboard } from './pages/MainDashboard';
import { ProfilesPage } from './pages/ProfilesPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { RunExperimentPage } from './pages/RunExperimentPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';

type Tab = 'dashboard' | 'profiles' | 'scenarios' | 'run' | 'results' | 'history' | 'reports';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':  return <MainDashboard />;
      case 'profiles':   return <ProfilesPage />;
      case 'scenarios':  return <ScenariosPage />;
      case 'run':        return <RunExperimentPage />;
      case 'results':    return <ResultsPage />;
      case 'history':    return <HistoryPage />;
      case 'reports':    return <ReportsPage />;
      default:           return <MainDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={(t) => setActiveTab(t as Tab)} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {renderPage()}
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/50 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            <strong className="text-slate-400">DevElite QoO Network Evaluation Platform</strong> ·
            Team DevElite (A3-PS029-TC237) · AIORI Hackathon 3 – Internet Measurement
          </span>
          <span>Specification: <code className="text-slate-400">draft-ietf-ippm-qoo</code> · Testbed: <code className="text-slate-400">cj-ike-kunze/ietf-126-hackathon-qoo</code></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
