import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ===== Auth =====
export const login = (email: string, password: string) =>
  api.post('/api/auth/login', new URLSearchParams({ username: email, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

// ===== Athletes =====
export const getAthletes = () => api.get('/api/athletes/')
export const getAthlete = (id: number) => api.get(`/api/athletes/${id}`)
export const createAthlete = (data: object) => api.post('/api/athletes/', data)
export const getAthletePerformances = (id: number) => api.get(`/api/athletes/${id}/performances`)
export const compareAthletes = (a: number, b: number) => api.get(`/api/athletes/compare/${a}/${b}`)
export const classifyProfiles = () => api.post('/api/athletes/classify-profiles')

// ===== Games =====
export const getGames = () => api.get('/api/games/')
export const createGame = (data: object) => api.post('/api/games/', data)
export const importGameData = (gameId: number, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/api/games/${gameId}/import`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const getKPIs = () => api.get('/api/games/dashboard/kpis')

// ===== Alerts =====
export const getAlerts = () => api.get('/api/alerts/')
export const markAlertRead = (id: number) => api.patch(`/api/alerts/${id}/read`)
export const markAlertResolved = (id: number) => api.patch(`/api/alerts/${id}/resolve`)

// ===== Profiles =====
export const getProfilesSummary = () => api.get('/api/profiles/summary')

export default api
