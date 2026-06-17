import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AthleteDetails } from '../types/models';
import { n, profileLabel } from '../utils/format';
import { LineMetricChart } from '../components/charts/Charts';

export function AthleteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<AthleteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    
    api.get<AthleteDetails>(`/athletes/${id}`)
      .then(response => setData(response.data))
      .catch(err => setError('Erro ao carregar detalhes do atleta.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card">Carregando detalhes do atleta...</div>;
  if (error) return <div className="card text-red-400">{error}</div>;
  if (!data) return <div className="card">Atleta não encontrado.</div>;

  return (
    <section className="space-y-4">
      <button className="btn" onClick={() => navigate('/atletas')}>
        Voltar para Atletas
      </button>
      
      <div className="card">
        <h2 className="text-2xl font-bold">Atleta {data.athlete.id}</h2>
        <p className="text-slate-400">
          {data.athlete.position} · {data.athlete.group} · {profileLabel(data.athlete.profile)}
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(data.averages).map(([k, v]) => (
          <div className="card" key={k}>
            <p className="text-xs uppercase text-slate-400">{k}</p>
            <h3 className="mt-2 text-2xl font-bold">{n(v as number)}</h3>
          </div>
        ))}
      </div>
      
      <div className="card">
        <h3 className="mb-3 font-semibold">Evolução histórica</h3>
        <LineMetricChart data={data.evolution.map(e => ({ date: e.date, workload: e.workload, distance: e.distance }))} />
      </div>
      
      <div className="card">
        <h3 className="mb-3 font-semibold">Alertas individuais</h3>
        {data.alerts.length === 0 ? (
          <p className="text-sm text-slate-400">Sem alertas ativos.</p>
        ) : (
          data.alerts.map(a => (
            <div key={a.id} className="mb-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm">
              {a.message}
            </div>
          ))
        )}
      </div>
    </section>
  );
}