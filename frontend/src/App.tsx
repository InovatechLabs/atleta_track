import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ImportPage } from './pages/ImportPage';
import { AthletesPage } from './pages/AthletesPage';
import { AthleteDetailsPage } from './pages/AthleteDetailsPage';
import { ComparePage } from './pages/ComparePage';
import { AlertsPage } from './pages/AlertsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* A Rota principal ("/") renderiza a Home fora do Layout com Sidebar */}
        <Route path="/" element={<HomePage />} />
        
        {/* O painel de controle fica dentro do Layout, que contém a Sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/importar" element={<ImportPage />} />
          <Route path="/atletas" element={<AthletesPage />} />
          <Route path="/atletas/:id" element={<AthleteDetailsPage />} />
          <Route path="/comparar" element={<ComparePage />} />
          <Route path="/alertas" element={<AlertsPage />} />
        </Route>

        {/* Rota de fallback para links não encontrados */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}