import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GitCompareArrows, Bell, Upload, LogOut, Dumbbell } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'
import { useEffect, useState } from 'react'
import { getAlerts } from '../services/api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profiles',  icon: Users,           label: 'Perfis de jogadores' },
  { to: '/compare',   icon: GitCompareArrows, label: 'Comparar atletas' },
  { to: '/alerts',    icon: Bell,            label: 'Alertas' },
  { to: '/athletes',  icon: Dumbbell,        label: 'Atletas' },
  { to: '/import',    icon: Upload,          label: 'Importar dados' },
]

export default function Layout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    getAlerts().then(r => {
      setAlertCount((r.data || []).filter((a: any) => !a.is_read).length)
    }).catch(() => setAlertCount(3)) // fallback for demo
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>AtletaTrack</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Análise de desempenho</div>
        </div>

        <div style={{ padding: '0 12px', flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', padding: '0 8px', marginBottom: 6 }}>Painel</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 8, cursor: 'pointer', textDecoration: 'none',
              color: isActive ? 'var(--accent2)' : 'var(--muted)',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              fontWeight: isActive ? 500 : 400, fontSize: 13, marginBottom: 2,
              transition: 'all 0.15s',
            })}>
              <Icon size={15} />
              <span>{label}</span>
              {label === 'Alertas' && alertCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 20px 0', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: 13, cursor: 'pointer', padding: '8px 0',
          }}>
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto slide-in">
        <Outlet />
      </main>
    </div>
  )
}
