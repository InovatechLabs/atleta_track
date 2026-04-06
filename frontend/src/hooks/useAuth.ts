import { create } from 'zustand'
import { login as apiLogin } from '../services/api'

interface AuthState {
  token: string | null
  user: { name: string; email: string; role: string } | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('access_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (email, password) => {
    const res = await apiLogin(email, password)
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    set({ token: access_token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
