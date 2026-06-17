import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function LineMetricChart({ data }: { data: any[] }) {
  return <div className="h-72"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="date" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155' }}/><Legend/><Line type="monotone" dataKey="workload" name="Workload" stroke="#60a5fa"/><Line type="monotone" dataKey="distance" name="Distância" stroke="#34d399"/></LineChart></ResponsiveContainer></div>;
}

export function BarMetricChart({ data, label }: { data: any[]; label: string }) {
  return <div className="h-72"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="athleteId" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/><Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155' }}/><Bar dataKey="value" name={label} fill="#60a5fa" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>;
}

export function ProfilePie({ data }: { data: any[] }) {
  const colors = ['#60a5fa','#34d399','#f59e0b','#ef4444','#a78bfa'];
  return <div className="h-72"><ResponsiveContainer><PieChart><Pie data={data} dataKey="total" nameKey="profile" outerRadius={95} label>{data.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155' }}/><Legend/></PieChart></ResponsiveContainer></div>;
}
