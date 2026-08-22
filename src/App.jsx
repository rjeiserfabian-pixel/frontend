import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './modules/seguridad/pages/LoginPage';
import DashboardLayout from './shared/layouts/DashboardLayout';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import UsuariosPage from './modules/seguridad/pages/UsuariosPage';
import RolesPage from './modules/seguridad/pages/RolesPage';
import CategoriasPage from './modules/inventario/pages/CategoriasPage';
import MarcasPage from './modules/inventario/pages/MarcasPage';
import RepuestosPage from './modules/inventario/pages/RepuestosPage';
import VehiculosPage from './modules/vehiculos/pages/VehiculosPage';
import SucursalesPage from './modules/inventario/pages/SucursalesPage';
import AlmacenesPage from './modules/inventario/pages/AlmacenesPage';
import UbicacionesPage from './modules/inventario/pages/UbicacionesPage';
import KardexPage from './modules/inventario/pages/KardexPage';
import ClientesPage from './modules/clientes/pages/ClientesPage';

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
          <Route path="/inventario/categorias" element={<CategoriasPage />} />
          <Route path="/inventario/marcas" element={<MarcasPage />} />
          <Route path="/inventario/repuestos" element={<RepuestosPage />} />
          <Route path="/inventario/sucursales" element={<SucursalesPage />} />
          <Route path="/inventario/almacenes" element={<AlmacenesPage />} />
          <Route path="/inventario/ubicaciones" element={<UbicacionesPage />} />
          <Route path="/inventario/kardex" element={<KardexPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
