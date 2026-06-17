import { Athlete } from '../types/models';
export type FiltersState = { athleteId: string; position: string; group: string; segment: string; startDate: string; endDate: string };
export function Filters({ filters, setFilters, athletes }: { filters: FiltersState; setFilters: (f: FiltersState) => void; athletes: Athlete[] }) {
  const positions = [...new Set(athletes.map(a => a.position).filter(Boolean))] as string[];
  const groups = [...new Set(athletes.map(a => a.groups).filter(Boolean))] as string[];
  const set = (k: keyof FiltersState, v: string) => setFilters({ ...filters, [k]: v });
  return <div className="card grid gap-3 md:grid-cols-6">
    <select className="input" value={filters.athleteId} onChange={e=>set('athleteId',e.target.value)}><option value="">Todos atletas</option>{athletes.map(a=><option key={a.id} value={a.id}>{a.id}</option>)}</select>
    <select className="input" value={filters.position} onChange={e=>set('position',e.target.value)}><option value="">Posição</option>{positions.map(p=><option key={p}>{p}</option>)}</select>
    <select className="input" value={filters.group} onChange={e=>set('group',e.target.value)}><option value="">Grupo</option>{groups.map(g=><option key={g}>{g}</option>)}</select>
    <input className="input" placeholder="Segmento" value={filters.segment} onChange={e=>set('segment',e.target.value)} />
    <input className="input" type="date" value={filters.startDate} onChange={e=>set('startDate',e.target.value)} />
    <input className="input" type="date" value={filters.endDate} onChange={e=>set('endDate',e.target.value)} />
  </div>;
}
export const emptyFilters: FiltersState = { athleteId:'', position:'', group:'', segment:'', startDate:'', endDate:'' };
export const toQuery = (f: FiltersState) => new URLSearchParams(Object.entries(f).filter(([,v]) => v) as string[][]).toString();
