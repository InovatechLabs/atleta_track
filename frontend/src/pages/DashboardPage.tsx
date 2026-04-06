import { useEffect, useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { getKPIs, getAthletes, getAlerts } from '../services/api'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

const MOCK_WORKLOAD = [72,74,71,76,78,73,80,82,79,77,83,85,84,80,82,86,85,83,81,79,80,84]
const ROUNDS = Array.from({length: 22}, (_, i) => `R${i+1}`)

const STATUS_COLOR: Record<string, string> = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' }

function KPICard({ label, value, delta, color, accent }: any) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: '12px 12px 0 0' }} />
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono', color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 6, color: delta.startsWith('↑') ? 'var(--green)' : delta.startsWith('↓') ? 'var(--red)' : 'var(--muted)' }}>{delta}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [athletes, setAthletes] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    getKPIs().then(r => setKpis(r.data)).catch(() => setKpis({
      avg_distance_km: 10.4, avg_max_speed: 34.2, avg_sprint_distance: 720,
      avg_accelerations: 21, avg_work_load: 82, athletes_in_alert: 3,
      athletes_normal: 25, total_athletes: 28,
    }))
    getAthletes().then(r => setAthletes(r.data)).catch(() => setAthletes(MOCK_ATHLETES))
    getAlerts().then(r => setAlerts(r.data)).catch(() => setAlerts(MOCK_ALERTS))
  }, [])

  const workloadData = {
    labels: ROUNDS,
    datasets: [{
      label: 'Carga média',
      data: MOCK_WORKLOAD,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.08)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 2,
      pointHoverRadius: 5,
    }],
  }

  const statusData = {
    labels: ['Normal', 'Atenção', 'Alerta'],
    datasets: [{ data: [kpis?.athletes_normal ?? 23, 2, kpis?.athletes_in_alert ?? 3], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 6 }],
  }

  const chartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 10 } }, min: 60, max: 100 },
    },
  }

  const doughnutOpts: any = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', font: { size: 11 }, boxWidth: 10, padding: 12 } } },
  }

  return (
    <div>
      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Dashboard — Visão geral</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Temporada 2025/26 · Plantel: {kpis?.total_athletes ?? 28} atletas · Última partida: Rodada 22</div>
        </div>
        <select style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'Space Grotesk', fontSize: 12, padding: '6px 12px', borderRadius: 8, outline: 'none' }}>
          <option>Temporada 2025/26</option>
          <option>Temporada 2024/25</option>
        </select>
      </div>

      <div style={{ padding: 24 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14, marginBottom: 24 }}>
          <KPICard label="Distância média (km)" value={kpis?.avg_distance_km ?? '10.4'} delta="↑ 0.6 vs jogo anterior" color="var(--accent2)" accent="var(--accent)" />
          <KPICard label="Vel. máxima (km/h)" value={kpis?.avg_max_speed ?? '34.2'} delta="→ estável" color="var(--green)" accent="var(--green)" />
          <KPICard label="Sprints (m média)" value={kpis?.avg_sprint_distance ?? '720'} delta="↓ 30m vs média temporada" color="var(--amber)" accent="var(--amber)" />
          <KPICard label="Atletas em alerta" value={kpis?.athletes_in_alert ?? '3'} delta="↑ 2 desde rodada 20" color="var(--red)" accent="var(--red)" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          <Card title="Carga de trabalho — temporada" sub="Média do plantel por rodada" tag="RF07">
            <div style={{ height: 200 }}><Line data={workloadData} options={chartOpts} /></div>
          </Card>
          <Card title="Status do plantel" sub="Distribuição por condição" tag="RF05">
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={statusData} options={doughnutOpts} />
            </div>
          </Card>
        </div>

        {/* Athlete table */}
        <Card title={`Indicadores por atleta — Rodada 22 (${athletes.length || MOCK_ATHLETES.length} atletas)`} sub="Ordenado por carga de trabalho" tag="RF07">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Atleta','Pos.','Dist. km','Sprint m','Vel. máx.','Acel.','Carga','Status'].map(h => (
                  <th key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', textAlign: 'left', padding: '0 8px 10px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(athletes.length ? athletes : MOCK_ATHLETES).map((a: any, i: number) => (
                  <AthleteRow key={i} athlete={a} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent alerts */}
        {alerts.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Card title="Alertas recentes" sub="Últimas anomalias detectadas" tag="RF06">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(alerts.length ? alerts : MOCK_ALERTS).slice(0,3).map((a: any) => (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8,
                    background: a.severity === 'high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                    border: `1px solid ${a.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  }}>
                    <span style={{ color: STATUS_COLOR[a.severity], marginTop: 1, fontSize: 14 }}>{a.severity === 'high' ? '▼' : '!'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{a.title || a.athlete_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.description}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: a.severity === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: STATUS_COLOR[a.severity] }}>{a.severity === 'high' ? 'ALTA' : 'MÉDIA'}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, sub, tag, children }: any) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
        </div>
        {tag && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.15)', color: 'var(--accent2)' }}>{tag}</span>}
      </div>
      {children}
    </div>
  )
}

function AthleteRow({ athlete }: { athlete: any }) {
  const status = athlete.profile_type === 'nao_classificado' ? 'warn' : 'ok'
  const perf = athlete._perf || {}
  const dist  = +(perf.distance_km    ?? (9 + Math.random() * 3)).toFixed(1)
  const spr   = Math.round(perf.sprint_distance_m ?? (400 + Math.random() * 700))
  const vmax  = +(perf.max_speed_kmh  ?? (27 + Math.random() * 9)).toFixed(1)
  const acel  = Math.round(perf.accelerations     ?? (10 + Math.random() * 25))
  const load  = Math.round(perf.work_load_index   ?? (60 + Math.random() * 35))
  const loadColor = load >= 80 ? 'var(--green)' : load >= 60 ? 'var(--amber)' : 'var(--red)'
  const dotClass = load < 60 ? 'pulse-dot' : ''

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{athlete.name}</div>
      </td>
      <td style={{ padding: '10px 8px' }}>
        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', color: 'var(--accent2)' }}>{athlete.position || 'MEI'}</span>
      </td>
      <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{dist}</td>
      <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{spr}</td>
      <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{vmax}</td>
      <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{acel}</td>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: loadColor }}>{load}%</div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginTop: 4, overflow: 'hidden', width: 80 }}>
          <div style={{ height: '100%', width: `${load}%`, background: loadColor, borderRadius: 2 }} />
        </div>
      </td>
      <td style={{ padding: '10px 8px' }}>
        <span className={dotClass} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: loadColor, marginRight: 6 }} />
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{load >= 75 ? 'Normal' : load >= 60 ? 'Atenção' : 'Alerta'}</span>
      </td>
    </tr>
  )
}

const MOCK_ATHLETES = [
  { id:1, name:'Lucas Ferreira',  position:'ATA', profile_type:'explosivo' },
  { id:2, name:'Rodrigo Lima',    position:'ATA', profile_type:'explosivo' },
  { id:3, name:'Marcos Silva',    position:'MEI', profile_type:'baixa_intensidade', _perf: { work_load_index: 55, distance_km: 8.6, sprint_distance_m: 420, max_speed_kmh: 28.1, accelerations: 18 } },
  { id:4, name:'Felipe Santos',   position:'MEI', profile_type:'alta_resistencia' },
  { id:5, name:'Gabriel Costa',   position:'DEF', profile_type:'alta_resistencia' },
  { id:6, name:'Carlos Mota',     position:'DEF', profile_type:'alta_resistencia' },
  { id:7, name:'Diego Souza',     position:'ALA', profile_type:'explosivo' },
  { id:8, name:'Rafael Alves',    position:'DEF', profile_type:'alta_carga_impacto' },
  { id:9, name:'Pedro Henrique',  position:'MEI', profile_type:'alta_carga_impacto' },
  { id:10,name:'Thiago Alves',    position:'GOL', profile_type:'baixa_intensidade' },
]

const MOCK_ALERTS = [
  { id:1, severity:'high',   title:'Marcos Silva — Queda crítica de desempenho', description:'Distância de sprint 42% abaixo da média histórica. Velocidade máxima 18% abaixo do padrão individual.' },
  { id:2, severity:'high',   title:'Pedro Henrique — Carga de impacto anômala', description:'Número de acelerações 3.2 desvios padrão acima do histórico. Risco de sobrecarga muscular.' },
  { id:3, severity:'medium', title:'Diego Souza — Queda progressiva de resistência', description:'Tendência de queda na distância total percorrida ao longo das últimas 4 partidas.' },
]
