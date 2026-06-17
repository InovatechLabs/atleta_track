import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Athlete } from '../types/models';
import { n, profileLabel } from '../utils/format';

export function ComparePage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    api.get<Athlete[]>('/athletes')
      .then(response => setAthletes(response.data))
      .catch(err => console.error('Erro ao buscar lista de atletas', err))
      .finally(() => setLoadingAthletes(false));
  }, []);

  async function load() {
    if (ids.length < 2) return;
    setLoadingComparison(true);
    
    try {
      const response = await api.get(`/compare?ids=${ids.join(',')}`);
      setRows(response.data);
    } catch (error) {
      console.error("Erro ao comparar atletas:", error);
    } finally {
      setLoadingComparison(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Comparação entre atletas</h2>
      
      <div className="card space-y-3">
        {loadingAthletes ? (
          <p className="text-sm text-slate-400">Carregando lista de atletas...</p>
        ) : (
          <select 
            multiple 
            className="input h-40 w-full" 
            value={ids} 
            onChange={e => setIds([...e.target.selectedOptions].map(o => o.value))}
          >
            {athletes.map(a => (
              <option key={a.id} value={a.id}>
                {a.id} · {a.position}
              </option>
            ))}
          </select>
        )}
        
        <button 
          className="btn" 
          onClick={load} 
          disabled={ids.length < 2 || loadingComparison}
        >
          {loadingComparison ? 'Comparando...' : 'Comparar selecionados'}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                {['Atleta', 'Perfil', 'Distância', 'Sprint', 'Workload', 'Intensidade', 'Top speed', 'Avg speed', 'Acel.', 'Desac.', 'HIR', 'Sprints'].map(h => (
                  <th key={h} className="py-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.athleteId} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold">{r.athleteId}</td>
                  <td>{profileLabel(r.profile)}</td>
                  <td>{n(r.distance)}</td>
                  <td>{n(r.sprintDistance)}</td>
                  <td>{n(r.workload)}</td>
                  <td>{n(r.workloadIntensity)}</td>
                  <td>{n(r.topSpeed)}</td>
                  <td>{n(r.avgSpeed)}</td>
                  <td>{n(r.accelerations)}</td>
                  <td>{n(r.decelerations)}</td>
                  <td>{n(r.highIntensityRunning)}</td>
                  <td>{n(r.sprints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}