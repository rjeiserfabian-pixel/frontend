import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './modules/seguridad/pages/LoginPage';
import DashboardLayout from './shared/layouts/DashboardLayout';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import UsuariosPage from './modules/seguridad/pages/UsuariosPage';
import RolesPage from './modules/seguridad/pages/RolesPage';
import ConfiguracionEmpresaPage from './modules/seguridad/pages/ConfiguracionEmpresaPage';
import SeriesInternasPage from './modules/ventas/pages/SeriesInternasPage';
import UbigeoPage from './modules/seguridad/pages/UbigeoPage';
import PerfilPage from './modules/seguridad/pages/PerfilPage';
import CuentasBancariasPage from './modules/seguridad/pages/CuentasBancariasPage';
import CategoriasPage from './modules/inventario/pages/CategoriasPage';
import MarcasPage from './modules/inventario/pages/MarcasPage';
import UnidadesPage from './modules/inventario/pages/UnidadesPage';
import RepuestosPage from './modules/inventario/pages/RepuestosPage';
import VehiculosPage from './modules/vehiculos/pages/VehiculosPage';
import SucursalesPage from './modules/inventario/pages/SucursalesPage';
import AlmacenesPage from './modules/inventario/pages/AlmacenesPage';
import UbicacionesPage from './modules/inventario/pages/UbicacionesPage';
import KardexPage from './modules/inventario/pages/KardexPage';
import ClientesPage from './modules/clientes/pages/ClientesPage';
import ProveedoresPage from './modules/clientes/pages/ProveedoresPage';
import KioskoPage from './modules/ventas/pages/KioskoPage';
import CajaPage from './modules/ventas/pages/CajaPage';
import POSPage from './modules/ventas/pages/POSPage';
import ConfiguracionVentasPage from './modules/ventas/pages/ConfiguracionVentasPage';
import ConfiguracionIgvPage from './modules/inventario/pages/ConfiguracionIgvPage';
import RegistroManualVentasPage from './modules/ventas/pages/RegistroManualVentasPage';
import CuentasCobrarResumenPage from './modules/ventas/pages/CuentasCobrarResumenPage';
import CuentasCobrarClientePage from './modules/ventas/pages/CuentasCobrarClientePage';
import CuentasCobrarDetallePage from './modules/ventas/pages/CuentasCobrarDetallePage';
import OrdenesTrabajoPage from './modules/taller/pages/OrdenesTrabajoPage';
import NuevaOrdenPage from './modules/taller/pages/NuevaOrdenPage';
import DetalleOrdenPage from './modules/taller/pages/DetalleOrdenPage';
import PlantillasPage from './modules/taller/pages/PlantillasPage';
import TiposServicioPage from './modules/taller/pages/TiposServicioPage';
import ConsultaVehiculoPage from './modules/public/pages/ConsultaVehiculoPage';
import { SucursalProvider } from './shared/contexts/SucursalContext';

function App() {
  return (
    <SucursalProvider>
      <BrowserRouter>
      <Routes>
        {/* Rutas Públicas / Kiosko (Full Screen) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kiosko" element={<KioskoPage />} />
        <Route path="/estado-vehiculo" element={<ConsultaVehiculoPage />} />
        
        {/* Rutas Protegidas (Requieren Login) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/seguridad/empresa" element={<ConfiguracionEmpresaPage />} />
          <Route path="/seguridad/series-internas" element={<SeriesInternasPage />} />
          <Route path="/seguridad/ubigeo" element={<UbigeoPage />} />
          <Route path="/seguridad/cuentas-bancarias" element={<CuentasBancariasPage />} />
          <Route path="/seguridad/perfil" element={<PerfilPage />} />
          <Route path="/inventario/categorias" element={<CategoriasPage />} />
          <Route path="/inventario/marcas" element={<MarcasPage />} />
          <Route path="/inventario/unidades" element={<UnidadesPage />} />
          <Route path="/inventario/repuestos" element={<RepuestosPage />} />
          <Route path="/inventario/sucursales" element={<SucursalesPage />} />
          <Route path="/inventario/almacenes" element={<AlmacenesPage />} />
          <Route path="/inventario/ubicaciones" element={<UbicacionesPage />} />
          <Route path="/inventario/kardex" element={<KardexPage />} />
          <Route path="/inventario/impuestos" element={<ConfiguracionIgvPage />} />
          <Route path="/taller/ordenes" element={<OrdenesTrabajoPage />} />
          <Route path="/taller/ordenes/nueva" element={<NuevaOrdenPage />} />
          <Route path="/taller/ordenes/:id" element={<DetalleOrdenPage />} />
          <Route path="/taller/plantillas" element={<PlantillasPage />} />
          <Route path="/taller/tipos-servicio" element={<TiposServicioPage />} />
          <Route path="/vehiculos" element={<VehiculosPage />} />
          <Route path="/contactos/clientes" element={<ClientesPage />} />
          <Route path="/contactos/proveedores" element={<ProveedoresPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/ventas/pos" element={<POSPage />} />
          <Route path="/ventas/registro-manual" element={<RegistroManualVentasPage />} />
          <Route path="/ventas/configuracion" element={<ConfiguracionVentasPage />} />
          <Route path="/cuentas/por-cobrar" element={<CuentasCobrarResumenPage />} />
          <Route path="/cuentas/por-cobrar/cliente/:clienteId" element={<CuentasCobrarClientePage />} />
          <Route path="/cuentas/por-cobrar/credito/:id" element={<CuentasCobrarDetallePage />} />
        </Route>
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </BrowserRouter>
    </SucursalProvider>
  );
}

export default App;
