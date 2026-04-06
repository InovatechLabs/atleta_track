import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { ProfilesPage, ComparePage, AlertsPage, AthletesPage, ImportPage } from './pages/AlertsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profiles"  element={<ProfilesPage />} />
        <Route path="compare"   element={<ComparePage />} />
        <Route path="alerts"    element={<AlertsPage />} />
        <Route path="athletes"  element={<AthletesPage />} />
        <Route path="import"    element={<ImportPage />} />
      </Route>
    </Routes>
  )
}
