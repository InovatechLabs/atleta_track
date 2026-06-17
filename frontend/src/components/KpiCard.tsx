import { ReactNode } from 'react';
export function KpiCard({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return <div className="card"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-slate-400">{title}</p><h3 className="mt-2 text-3xl font-bold">{value}</h3></div><div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">{icon}</div></div></div>;
}
