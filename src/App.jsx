import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './modules/seguridad/pages/LoginPage';
import DashboardLayout from './shared/layouts/DashboardLayout';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import UsuariosPage from './modules/seguridad/pages/UsuariosPage';
import RolesPage from './modules/seguridad/pages/RolesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas Protegidas (Requieren Login) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
