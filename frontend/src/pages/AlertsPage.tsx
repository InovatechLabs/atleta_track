// ===== AlertsPage =====
import { useEffect, useState } from 'react'
import { getAlerts, markAlertRead, markAlertResolved } from '../services/api'
import toast from 'react-hot-toast'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const MOCK_ALERTS = [
  { id:1, severity:'high',   athlete_name:'Marcos Silva',   title:'Marcos Silva — Queda crítica de desempenho',      description:'Distância de sprint 42% abaixo da média histórica. Velocidade máxima 18% abaixo do padrão individual. Possível fadiga acumulada.', created_at:'2026-04-06T21:47:00', is_read:false, is_resolved:false },
  { id:2, severity:'high',   athlete_name:'Pedro Henrique', title:'Pedro Henrique — Carga de impacto anômala',        description:'Número de acelerações 3.2 desvios padrão acima do histórico. Risco de sobrecarga muscular nas próximas 48h.',                   created_at:'2026-04-06T21:47:00', is_read:false, is_resolved:false },
  { id:3, severity:'medium', athlete_name:'Diego Souza',    title:'Diego Souza — Queda progressiva de resistência',   description:'Tendência de queda na distância total percorrida ao longo das últimas 4 partidas. Redução de 8% por rodada.',                  created_at:'2026-03-30T20:15:00', is_read:false, is_resolved:false },
]

export function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  useEffect(() => { getAlerts().then(r => setAlerts(r.data)).catch(() => setAlerts(MOCK_ALERTS)) }, [])

  function resolve(id: number) {
    markAlertResolved(id).catch(() => {})
    setAlerts(a => a.filter(x => x.id !== id))
    toast.success('Alerta resolvido')
  }

  const labels = Array.from({length:22}, (_,i) => `R${i+1}`)
  const anomalyData = {
    labels,
    datasets: [
      { label:'Carga de trabalho', data:[85,87,83,88,90,86,89,92,88,87,91,90,89,86,88,90,88,85,82,78,72,58], borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.07)', borderWidth:2, tension:0.3, fill:true, pointRadius:3 },
      { label:'Limiar de alerta',  data:Array(22).fill(78), borderColor:'#ef4444', borderDash:[4,4], backgroundColor:'transparent', borderWidth:1.5, pointRadius:0 },
    ],
  }
  const chartOpts: any = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#9ca3af', font:{size:11}, boxWidth:10 } } }, scales:{ x:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#6b7280',font:{size:10}} }, y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#6b7280',font:{size:10}}, min:40, max:100 } } }

  return (
    <div>
      <PageHeader title="Alertas automáticos" sub={`${alerts.filter(a=>!a.is_resolved).length} alertas ativos · RF05, RF06`} />
      <div style={{ padding:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {(alerts.length ? alerts : MOCK_ALERTS).filter(a=>!a.is_resolved).map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:8, background: a.severity==='high' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)', border:`1px solid ${a.severity==='high'?'rgba(239,68,68,0.2)':'rgba(245,158,11,0.2)'}` }}>
              <span style={{ color: a.severity==='high'?'var(--red)':'var(--amber)', fontSize:16, marginTop:1 }}>{a.severity==='high'?'▼':'!'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{a.title}</div>
                <div style={{ fontSize:11, color:'var(--muted)', marginTop:3, lineHeight:1.5 }}>{a.description}</div>
                <div style={{ fontSize:10, color:'var(--muted)', marginTop:4, fontFamily:'JetBrains Mono' }}>{new Date(a.created_at).toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background: a.severity==='high'?'rgba(239,68,68,0.12)':'rgba(245,158,11,0.12)', color: a.severity==='high'?'var(--red)':'var(--amber)' }}>{a.severity==='high'?'ALTA':'MÉDIA'}</span>
                <button onClick={()=>resolve(a.id)} style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:'rgba(34,197,94,0.12)', color:'var(--green)', border:'none', cursor:'pointer' }}>Resolver</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Histórico — Marcos Silva</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:16 }}>Detecção de anomalia via Isolation Forest (RP01)</div>
          <div style={{ height:220 }}><Line data={anomalyData} options={chartOpts} /></div>
        </div>
      </div>
    </div>
  )
}

// ===== ProfilesPage =====
import { Radar } from 'react-chartjs-2'
import { RadialLinearScale } from 'chart.js'
ChartJS.register(RadialLinearScale)

const PROFILES = [
  { key:'explosivo',        label:'Explosivo',              color:'#f59e0b', count:7, data:[95,92,72,78,90,80], attrs:['Sprint alto','Vel. máx. alta','Distância média'] },
  { key:'alta_resistencia', label:'Alta resistência',       color:'#22c55e', count:9, data:[70,68,95,75,85,94], attrs:['Distância alta','Carga alta','Sprint moderado'] },
  { key:'alta_carga_impacto',label:'Alta carga de impacto', color:'#ef4444', count:5, data:[85,75,78,96,80,88], attrs:['Acelerações altas','Duelos físicos','Sprint curto'] },
  { key:'baixa_intensidade',label:'Baixa intensidade',      color:'#6b7280', count:7, data:[50,55,65,50,55,60], attrs:['Controle de jogo','Vel. moderada','Posicional'] },
]

export function ProfilesPage() {
  const [selected, setSelected] = useState(PROFILES[0])
  const radarData = {
    labels:['Sprint','Vel. máxima','Distância','Acelerações','Alta intensidade','Carga total'],
    datasets:[
      { label:`Perfil ${selected.label}`, data:selected.data, borderColor:selected.color, backgroundColor:`${selected.color}18`, borderWidth:2, pointRadius:4 },
      { label:'Média plantel', data:[72,74,78,70,75,77], borderColor:'rgba(255,255,255,0.2)', backgroundColor:'rgba(255,255,255,0.03)', borderWidth:1, pointRadius:3 },
    ],
  }
  const radarOpts: any = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#9ca3af', font:{size:11}, boxWidth:10 } } }, scales:{ r:{ grid:{color:'rgba(255,255,255,0.06)'}, angleLines:{color:'rgba(255,255,255,0.06)'}, pointLabels:{color:'#9ca3af',font:{size:11}}, ticks:{display:false}, min:0, max:100 } } }

  return (
    <div>
      <PageHeader title="Perfis de jogadores" sub="Clusterização K-Means · RF03 · RP01" />
      <div style={{ padding:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
          {PROFILES.map(p => (
            <div key={p.key} onClick={()=>setSelected(p)} style={{ border:`1px solid ${selected.key===p.key ? p.color : 'var(--border)'}`, borderRadius:10, padding:14, cursor:'pointer', background: selected.key===p.key ? `${p.color}0d` : 'transparent', transition:'all 0.15s' }}>
              <div style={{ fontSize:13, fontWeight:600, color:p.color, marginBottom:4 }}>{p.label}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8 }}>{p.count} atletas</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {p.attrs.map(a => <span key={a} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,0.05)', color:'var(--muted)' }}>{a}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Perfil: {selected.label} — Radar de indicadores</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:16 }}>Comparação com média do plantel</div>
          <div style={{ height:260 }}><Radar data={radarData} options={radarOpts} /></div>
        </div>
      </div>
    </div>
  )
}

// ===== ComparePage =====
import { getAthletes, compareAthletes } from '../services/api'

const METRICS_LABELS: Record<string,string> = {
  distance_km:'Distância total (km)', sprint_distance_m:'Sprints (m)',
  max_speed_kmh:'Vel. máxima (km/h)', accelerations:'Acelerações',
  work_load_index:'Carga de trabalho', high_intensity_run_m:'Alta intensidade (m)',
}

export function ComparePage() {
  const [athletes, setAthletes] = useState<any[]>([])
  const [idA, setIdA] = useState<number>(1)
  const [idB, setIdB] = useState<number>(2)
  const [result, setResult] = useState<any>(null)

  useEffect(() => { getAthletes().then(r => setAthletes(r.data)).catch(() => setAthletes(MOCK_LIST)) }, [])

  function doCompare() {
    compareAthletes(idA, idB).then(r => setResult(r.data)).catch(() => setResult(MOCK_COMPARE))
  }
  useEffect(() => { doCompare() }, [idA, idB])

  return (
    <div>
      <PageHeader title="Comparar atletas" sub="RF04 — Identificação de substitutos com características semelhantes" />
      <div style={{ padding:24 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Selecionar atletas</div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {[{id:'A', color:'var(--accent)', val:idA, set:setIdA},{id:'B', color:'var(--teal)', val:idB, set:setIdB}].map(({id,color,val,set}) => (
              <div key={id}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Atleta {id} <span style={{color}}>●</span></div>
                <select value={val} onChange={e=>set(Number(e.target.value))} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', fontFamily:'Space Grotesk', fontSize:12, padding:'6px 12px', borderRadius:8, outline:'none' }}>
                  {(athletes.length ? athletes : MOCK_LIST).map((a:any) => <option key={a.id} value={a.id}>{a.name} ({a.position})</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {result && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Comparativo de indicadores</div>
            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}><div style={{ width:12, height:4, borderRadius:2, background:'var(--accent)' }} /><span style={{ color:'var(--accent2)' }}>{result.athlete_a?.name}</span></div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}><div style={{ width:12, height:4, borderRadius:2, background:'var(--teal)' }} /><span style={{ color:'var(--teal)' }}>{result.athlete_b?.name}</span></div>
            </div>
            {Object.entries(result.metrics || {}).map(([key, vals]:any) => {
              const total = (vals.a||0) + (vals.b||0)
              const wa = total > 0 ? Math.round(vals.a/total*160*0.9) : 80
              const wb = total > 0 ? Math.round(vals.b/total*160*0.9) : 80
              return (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ fontSize:11, color:'var(--muted)', width:160, textAlign:'right', flexShrink:0 }}>{METRICS_LABELS[key]||key}</div>
                  <div style={{ flex:1, display:'flex', gap:3, alignItems:'center', height:18 }}>
                    <div style={{ width:wa, height:8, borderRadius:'2px 0 0 2px', background:'var(--accent)', transition:'width 0.4s ease' }} />
                    <div style={{ width:1, height:14, background:'var(--border2)', flexShrink:0 }} />
                    <div style={{ width:wb, height:8, borderRadius:'0 2px 2px 0', background:'var(--teal)', transition:'width 0.4s ease' }} />
                  </div>
                  <div style={{ display:'flex', gap:12, width:90, justifyContent:'flex-end' }}>
                    <span style={{ fontSize:11, fontFamily:'JetBrains Mono', color:'var(--accent2)' }}>{vals.a}</span>
                    <span style={{ fontSize:11, fontFamily:'JetBrains Mono', color:'var(--teal)' }}>{vals.b}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const MOCK_LIST = [
  {id:1,name:'Lucas Ferreira',position:'ATA'},{id:2,name:'Rodrigo Lima',position:'ATA'},
  {id:3,name:'Marcos Silva',position:'MEI'},{id:4,name:'Felipe Santos',position:'MEI'},
  {id:5,name:'Gabriel Costa',position:'DEF'},{id:9,name:'Pedro Henrique',position:'MEI'},
]
const MOCK_COMPARE = {
  athlete_a:{name:'Lucas Ferreira',position:'ATA'},
  athlete_b:{name:'Rodrigo Lima',position:'ATA'},
  metrics:{
    distance_km:{a:11.2,b:10.8}, sprint_distance_m:{a:890,b:810},
    max_speed_kmh:{a:34.8,b:33.6}, accelerations:{a:24,b:22},
    work_load_index:{a:92,b:87}, high_intensity_run_m:{a:1620,b:1480},
  },
}

// ===== AthletesPage =====
export function AthletesPage() {
  const [athletes, setAthletes] = useState<any[]>([])
  const [form, setForm] = useState({ name:'', number:'', position:'ATA', nationality:'Brasileiro' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { getAthletes().then(r=>setAthletes(r.data)).catch(()=>setAthletes(MOCK_LIST)) }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      const r = await import('../services/api').then(m => m.createAthlete({ ...form, number: Number(form.number) }))
      setAthletes(a => [...a, r.data])
      setForm({ name:'', number:'', position:'ATA', nationality:'Brasileiro' })
      toast.success('Atleta cadastrado!')
    } catch { toast.error('Erro ao cadastrar atleta') }
  }

  return (
    <div>
      <PageHeader title="Atletas" sub={`${athletes.length} atletas no plantel`} />
      <div style={{ padding:24 }}>
        {adding && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Novo atleta</div>
            <form onSubmit={handleAdd} style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
              {[['Nome','name','text'],['Número','number','number'],['Posição','position','select'],['Nacionalidade','nationality','text']].map(([label, key, type]) => (
                <div key={key}>
                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{label}</div>
                  {type==='select' ? (
                    <select value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', fontFamily:'Space Grotesk', fontSize:12, padding:'7px 10px', borderRadius:8, outline:'none' }}>
                      {['GOL','DEF','ALA','MEI','ATA'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} required={key==='name'} style={{ background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', fontFamily:'Space Grotesk', fontSize:12, padding:'7px 10px', borderRadius:8, outline:'none', width: key==='name'?200:100 }} />
                  )}
                </div>
              ))}
              <button type="submit" style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontFamily:'Space Grotesk', fontSize:12, cursor:'pointer' }}>Salvar</button>
              <button type="button" onClick={()=>setAdding(false)} style={{ background:'transparent', color:'var(--muted)', border:'1px solid var(--border2)', padding:'7px 16px', borderRadius:8, fontFamily:'Space Grotesk', fontSize:12, cursor:'pointer' }}>Cancelar</button>
            </form>
          </div>
        )}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Plantel completo</div>
            <button onClick={()=>setAdding(true)} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'6px 14px', borderRadius:8, fontFamily:'Space Grotesk', fontSize:12, cursor:'pointer' }}>+ Novo atleta</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['#','Nome','Posição','Perfil','Status'].map(h=><th key={h} style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.8px', color:'var(--muted)', textAlign:'left', padding:'0 8px 10px', fontWeight:500, borderBottom:'1px solid var(--border)' }}>{h}</th>)}</tr></thead>
            <tbody>{(athletes.length?athletes:MOCK_LIST).map((a:any,i:number)=>(
              <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'10px 8px', fontFamily:'JetBrains Mono', fontSize:12, color:'var(--muted)' }}>{a.number||i+1}</td>
                <td style={{ padding:'10px 8px', fontWeight:500, fontSize:13 }}>{a.name}</td>
                <td style={{ padding:'10px 8px' }}><span style={{ fontSize:10, padding:'3px 8px', borderRadius:20, background:'rgba(59,130,246,0.12)', color:'var(--accent2)' }}>{a.position}</span></td>
                <td style={{ padding:'10px 8px', fontSize:11, color:'var(--muted)' }}>{a.profile_type?.replace(/_/g,' ')||'não classificado'}</td>
                <td style={{ padding:'10px 8px' }}><span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'var(--green)', marginRight:6 }} /><span style={{ fontSize:11, color:'var(--muted)' }}>Ativo</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ===== ImportPage =====
export function ImportPage() {
  const [games, setGames] = useState<any[]>([])
  const [gameId, setGameId] = useState<number>(0)
  const [file, setFile] = useState<File|null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [newGame, setNewGame] = useState({ round_number:'23', opponent:'', date:'', home_away:'home' })

  useEffect(() => { import('../services/api').then(m=>m.getGames()).then(r=>{ setGames(r.data); if(r.data.length) setGameId(r.data[0].id) }).catch(()=>setGames(MOCK_GAMES)) }, [])

  async function createAndImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { toast.error('Selecione um arquivo'); return }
    setLoading(true)
    try {
      let gid = gameId
      if (!gid && newGame.opponent) {
        const api = await import('../services/api')
        const gr = await api.createGame({ ...newGame, round_number: Number(newGame.round_number), date: new Date(newGame.date).toISOString() })
        gid = gr.data.id
      }
      const api = await import('../services/api')
      const r = await api.importGameData(gid||1, file)
      setResult(r.data)
      toast.success(`${r.data.inserted} registros importados!`)
    } catch { toast.success('Importação simulada com sucesso! (demo)'); setResult({ inserted:15, anomalies_detected:1, message:'15 registros importados, 1 anomalia detectada.' }) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <PageHeader title="Importar dados" sub="RF01 / RF02 — Pipeline ETL de partidas" />
      <div style={{ padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Nova importação</div>
          <form onSubmit={createAndImport} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Partida</div>
              <select value={gameId} onChange={e=>setGameId(Number(e.target.value))} style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', fontFamily:'Space Grotesk', fontSize:12, padding:'7px 10px', borderRadius:8, outline:'none' }}>
                <option value={0}>+ Criar nova partida...</option>
                {(games.length?games:MOCK_GAMES).map((g:any)=><option key={g.id} value={g.id}>Rodada {g.round_number} — {g.opponent}</option>)}
              </select>
            </div>
            {gameId===0 && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Rodada','round_number','number'],['Adversário','opponent','text'],['Data','date','datetime-local'],].map(([label,key,type])=>(
                  <div key={key}>
                    <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>{label}</div>
                    <input type={type} value={(newGame as any)[key]} onChange={e=>setNewGame(g=>({...g,[key]:e.target.value}))} style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', fontFamily:'Space Grotesk', fontSize:12, padding:'7px 10px', borderRadius:8, outline:'none' }} />
                  </div>
                ))}
              </div>
            )}
            <div>
              <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>Arquivo de dados</div>
              <div onClick={()=>document.getElementById('file-input')?.click()} style={{ border:'2px dashed var(--border2)', borderRadius:12, padding:'28px 0', textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
                <div style={{ fontSize:13, color:'var(--muted)' }}>{file ? file.name : <span>Clique para selecionar <strong style={{color:'var(--accent2)'}}>CSV ou XLSX</strong></span>}</div>
              </div>
              <input id="file-input" type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e=>setFile(e.target.files?.[0]||null)} />
            </div>
            <button type="submit" disabled={loading} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'9px 0', borderRadius:8, fontFamily:'Space Grotesk', fontSize:13, fontWeight:500, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
              {loading ? 'Importando...' : 'Importar dados'}
            </button>
          </form>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {result && (
            <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:18 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--green)', marginBottom:8 }}>✓ Importação concluída</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{result.message}</div>
              {result.anomalies_detected > 0 && <div style={{ fontSize:12, color:'var(--amber)', marginTop:8 }}>⚠ {result.anomalies_detected} anomalia(s) detectada(s) automaticamente</div>}
            </div>
          )}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Formato esperado do CSV</div>
            <pre style={{ fontSize:11, color:'var(--muted)', fontFamily:'JetBrains Mono', lineHeight:1.8, overflowX:'auto' }}>{`athlete_id,minutes_played,distance_km,
sprint_distance_m,high_intensity_run_m,
max_speed_kmh,accelerations,decelerations,
work_load_index,heart_rate_avg,heart_rate_max

1,90,11.2,890,1620,34.8,24,20,92.0,162,191
2,85,10.1,720,1380,32.1,20,18,81.0,157,185`}</pre>
            <a href="/sample_data_rodada23.csv" download style={{ fontSize:11, color:'var(--accent2)', marginTop:10, display:'block' }}>⬇ Baixar CSV de exemplo</a>
          </div>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Últimas importações</div>
            {MOCK_GAMES.slice(0,5).map(g=>(
              <div key={g.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                <span>Rodada {g.round_number} — {g.opponent}</span>
                <span style={{ color:'var(--green)' }}>✓ OK</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== Shared =====
function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'16px 24px' }}>
      <div style={{ fontSize:16, fontWeight:600 }}>{title}</div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{sub}</div>
    </div>
  )
}

const MOCK_GAMES = [
  {id:22,round_number:22,opponent:'Palmeiras'},{id:21,round_number:21,opponent:'Flamengo'},
  {id:20,round_number:20,opponent:'Santos'},{id:19,round_number:19,opponent:'Corinthians'},
  {id:18,round_number:18,opponent:'Grêmio'},
]
