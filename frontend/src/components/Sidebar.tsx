import { Activity, AlertTriangle, BarChart3, GitCompare, Upload, Users, Home } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/importar', label: 'Import Data', icon: Upload },
  { path: '/atletas', label: 'Athletes', icon: Users },
  { path: '/comparar', label: 'Compare', icon: GitCompare },
  { path: '/alertas', label: 'Alerts', icon: AlertTriangle },
];

export function Sidebar() {
  return (
    <aside className="w-full border-b border-white/10 bg-slate-900/90 p-4 md:h-screen md:w-64 md:border-b-0 md:border-r md:p-6 md:sticky md:top-0">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2">
          <Activity size={22} />
        </div>
        <div>
          <h1 className="font-bold">FieldVision</h1>
          <p className="text-xs text-slate-400">Performance analytics</p>
        </div>
      </div>
      <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                isActive && item.path !== '/'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}