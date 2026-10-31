import {
  ApplicationProfile,
  ImpairmentScenario,
  ExperimentRecord,
  StatisticalSummary,
  ProfileComparison
} from '../types';

const API_BASE = '/api';

export const api = {
  // Profiles
  async getProfiles(): Promise<ApplicationProfile[]> {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error('Failed to load profiles');
    return res.json();
  },

  async updateProfile(id: string, updates: Partial<ApplicationProfile>): Promise<ApplicationProfile> {
    const res = await fetch(`${API_BASE}/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    return data.profile;
  },

  async importProfile(profile: ApplicationProfile): Promise<any> {
    const res = await fetch(`${API_BASE}/profiles/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to import profile');
    return res.json();
  },

  // Scenarios
  async getScenarios(): Promise<ImpairmentScenario[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to load scenarios');
    return res.json();
  },

  async updateScenario(id: string, updates: Partial<ImpairmentScenario>): Promise<any> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update scenario');
    return res.json();
  },

  async resetBaseline(): Promise<any> {
    const res = await fetch(`${API_BASE}/scenarios/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset network baseline');
    return res.json();
  },

  // Experiments
  async runExperiment(params: {
    profile_id: string;
    scenario_id: string;
    repeats: number;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to start experiment');
    return res.json();
  },

  async cancelExperiment(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/experiments/${runId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel experiment');
    return res.json();
  },

  async getLogs(runId: string): Promise<string[]> {
    const res = await fetch(`${API_BASE}/experiments/${runId}/logs`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  },

  async getResults(): Promise<ExperimentRecord[]> {
    const res = await fetch(`${API_BASE}/results`);
    if (!res.ok) throw new Error('Failed to load results');
    return res.json();
  },

  async getStatistics(): Promise<StatisticalSummary[]> {
    const res = await fetch(`${API_BASE}/results/statistics`);
    if (!res.ok) throw new Error('Failed to load statistics');
    return res.json();
  },

  async getComparisons(): Promise<ProfileComparison[]> {
    const res = await fetch(`${API_BASE}/results/compare`);
    if (!res.ok) throw new Error('Failed to load comparison data');
    return res.json();
  },

  // Reports
  getExportCsvUrl(): string {
    return `${API_BASE}/reports/export/csv`;
  },

  getExportJsonUrl(): string {
    return `${API_BASE}/reports/export/json`;
  },

  async getSummaryReportMarkdown(): Promise<string> {
    const res = await fetch(`${API_BASE}/reports/summary`);
    if (!res.ok) throw new Error('Failed to load summary report');
    return res.text();
  }
};
