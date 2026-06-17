import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadPerformance } from '../api/client';

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  async function submit() {
    if (!file) return;
    setLoading(true);
    setMessage('');
    
    try {
      // Como migramos para o Axios, a resposta direta (res.data) já vem formatada
      const res: any = await uploadPerformance(file);
      setMessage(`Importação concluída: ${res.importedRows} registros salvos. Ignorados: ${res.ignoredRows}.`);
      
      // Opcional: Redirecionar para o dashboard após alguns segundos
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (e: any) {
      setMessage(e.response?.data?.message || e.message || 'Erro na importação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Importar planilha real</h2>
      <div className="card space-y-4">
        <p className="text-sm text-slate-400">
          Envie um arquivo .xlsx ou .csv com as colunas oficiais do dataset. Os dados serão validados, persistidos no PostgreSQL e usados imediatamente nos dashboards.
        </p>
        <input 
          className="input w-full" 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={e => setFile(e.target.files?.[0] ?? null)} 
        />
        <button 
          className="btn" 
          disabled={!file || loading} 
          onClick={submit}
        >
          {loading ? 'Importando...' : 'Importar dados'}
        </button>
        {message && (
          <div className={`rounded-xl border p-3 text-sm ${message.includes('Erro') ? 'border-red-400/10 bg-red-950 text-red-400' : 'border-white/10 bg-slate-950 text-green-400'}`}>
            {message}
          </div>
        )}
      </div>
    </section>
  );
}