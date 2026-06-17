import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../types/models';
import { n } from '../utils/format';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAlerts() {
    try {
      const response = await api.get<Alert[]>('/alerts');
      setAlerts(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAlerts(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await api.post('/alerts/recalculate');
      await loadAlerts();
    } finally {
      setRefreshing(false);
    }
  }

  const severityClass = (severity: string) => {
    if (severity === 'high') return 'text-red-300 bg-red-500/10 border-red-400/30';
    if (severity === 'medium') return 'text-amber-300 bg-amber-500/10 border-amber-400/30';
    return 'text-cyan-300 bg-cyan-500/10 border-cyan-400/30';
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Alerts</h2>
          <p className="text-sm text-slate-400">Explainable alerts based on individual baseline, recent sessions and workload changes.</p>
        </div>
        <button className="btn flex items-center gap-2" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating...' : 'Recalculate'}
        </button>
      </div>

      {loading ? (
        <div className="card text-slate-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="card flex items-center gap-3 text-slate-400">
          <ShieldAlert className="h-5 w-5 text-emerald-300" />
          No active alerts. Import more sessions to improve trend detection.
        </div>
      ) : (
        <div className="grid gap-3">
          {alerts.map(a => (
            <div key={a.id} className={`card border ${severityClass(a.severity)}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-semibold text-white"><AlertTriangle className="h-4 w-4" /> Athlete {a.athleteId} · {a.metric}</h3>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${severityClass(a.severity)}`}>{a.severity}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{a.message}</p>
              <p className="mt-2 text-xs text-slate-400">Baseline: {n(a.historical)} · Current: {n(a.recent)} · Drop: {n(a.dropPercent)}%</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
