import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@atletatrack.app')
  const [password, setPassword] = useState('atletatrack123')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      toast.error('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 380, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>AtletaTrack</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Sistema de análise de desempenho</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'Space Grotesk', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>Senha</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 14, fontFamily: 'Space Grotesk', outline: 'none' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ marginTop: 8, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Space Grotesk' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 500, marginBottom: 4 }}>Credenciais de demonstração</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>admin@atletatrack.app</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>atletatrack123</div>
        </div>
      </div>
    </div>
  )
}
