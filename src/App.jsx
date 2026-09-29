import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SucursalProvider } from './shared/contexts/SucursalContext';
import { PermisosProvider } from './shared/contexts/PermisosContext';

const LoginPage = lazy(() => import('./modules/seguridad/pages/LoginPage'));
const DashboardLayout = lazy(() => import('./shared/layouts/DashboardLayout'));
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const UsuariosPage = lazy(() => import('./modules/seguridad/pages/UsuariosPage'));
const RolesPage = lazy(() => import('./modules/seguridad/pages/RolesPage'));
const RolPermisosPage = lazy(() => import('./modules/seguridad/pages/RolPermisosPage'));
const ConfiguracionEmpresaPage = lazy(() => import('./modules/seguridad/pages/ConfiguracionEmpresaPage'));
const SeriesInternasPage = lazy(() => import('./modules/ventas/pages/SeriesInternasPage'));
const UbigeoPage = lazy(() => import('./modules/seguridad/pages/UbigeoPage'));
const PerfilPage = lazy(() => import('./modules/seguridad/pages/PerfilPage'));
const CuentasBancariasPage = lazy(() => import('./modules/seguridad/pages/CuentasBancariasPage'));
const CategoriasPage = lazy(() => import('./modules/inventario/pages/CategoriasPage'));
const MarcasPage = lazy(() => import('./modules/inventario/pages/MarcasPage'));
const UnidadesPage = lazy(() => import('./modules/inventario/pages/UnidadesPage'));
const RepuestosPage = lazy(() => import('./modules/inventario/pages/RepuestosPage'));
const VehiculosPage = lazy(() => import('./modules/vehiculos/pages/VehiculosPage'));
const SucursalesPage = lazy(() => import('./modules/inventario/pages/SucursalesPage'));
const StockUbicacionesPage = lazy(() => import('./modules/inventario/pages/StockUbicacionesPage'));
const AlmacenesPage = lazy(() => import('./modules/inventario/pages/AlmacenesPage'));
const UbicacionesPage = lazy(() => import('./modules/inventario/pages/UbicacionesPage'));
const KardexPage = lazy(() => import('./modules/inventario/pages/KardexPage'));
const TrasladosPage = lazy(() => import('./modules/inventario/pages/TrasladosPage'));
const GuiasRemisionPage = lazy(() => import('./modules/inventario/pages/GuiasRemisionPage'));
const RevisionPreciosPage = lazy(() => import('./modules/inventario/pages/RevisionPreciosPage'));
const ComprobantesElectronicosPage = lazy(() => import('./modules/facturacion/pages/ComprobantesElectronicosPage'));
const ClientesPage = lazy(() => import('./modules/clientes/pages/ClientesPage'));
const ProveedoresPage = lazy(() => import('./modules/clientes/pages/ProveedoresPage'));
const TransportistasPage = lazy(() => import('./modules/clientes/pages/TransportistasPage'));
const VehiculosTransportePage = lazy(() => import('./modules/vehiculos/pages/VehiculosTransportePage'));
const KioskoPage = lazy(() => import('./modules/ventas/pages/KioskoPage'));
const KioskosPage = lazy(() => import('./modules/ventas/pages/KioskosPage'));
const POSPage = lazy(() => import('./modules/ventas/pages/POSPage'));
const ProformasPage = lazy(() => import('./modules/ventas/pages/ProformasPage'));
const ConfiguracionVentasPage = lazy(() => import('./modules/ventas/pages/ConfiguracionVentasPage'));
const ConfiguracionIgvPage = lazy(() => import('./modules/inventario/pages/ConfiguracionIgvPage'));
const RegistroManualVentasPage = lazy(() => import('./modules/ventas/pages/RegistroManualVentasPage'));
const CuentasCobrarResumenPage = lazy(() => import('./modules/ventas/pages/CuentasCobrarResumenPage'));
const CuentasCobrarClientePage = lazy(() => import('./modules/ventas/pages/CuentasCobrarClientePage'));
const CuentasCobrarDetallePage = lazy(() => import('./modules/ventas/pages/CuentasCobrarDetallePage'));
const OrdenesTrabajoPage = lazy(() => import('./modules/taller/pages/OrdenesTrabajoPage'));
const NuevaOrdenPage = lazy(() => import('./modules/taller/pages/NuevaOrdenPage'));
const DetalleOrdenPage = lazy(() => import('./modules/taller/pages/DetalleOrdenPage'));
const PlantillasPage = lazy(() => import('./modules/taller/pages/PlantillasPage'));
const TiposServicioPage = lazy(() => import('./modules/taller/pages/TiposServicioPage'));
const ConsultaVehiculoPage = lazy(() => import('./modules/public/pages/ConsultaVehiculoPage'));
const ComprasPage = lazy(() => import('./modules/compras/pages/ComprasPage'));
const NuevaCompraPage = lazy(() => import('./modules/compras/pages/NuevaCompraPage'));
const CuentasPorPagarPage = lazy(() => import('./modules/compras/pages/CuentasPorPagarPage'));
const CuentasPorPagarProveedorPage = lazy(() => import('./modules/compras/pages/CuentasPorPagarProveedorPage'));
const TiposComprobantePage = lazy(() => import('./modules/compras/pages/TiposComprobantePage'));
const ReporteCajaPage = lazy(() => import('./modules/reportes/pages/ReporteCajaPage'));
const ReporteVentasPage = lazy(() => import('./modules/reportes/pages/ReporteVentasPage'));
const ReporteProductosPage = lazy(() => import('./modules/reportes/pages/ReporteProductosPage'));
const ReporteClientesPage = lazy(() => import('./modules/reportes/pages/ReporteClientesPage'));
const ReporteComprasPage = lazy(() => import('./modules/reportes/pages/ReporteComprasPage'));
const ReporteAvanzadoPage = lazy(() => import('./modules/reportes/pages/ReporteAvanzadoPage'));
const ReporteVehiculosPage = lazy(() => import('./modules/reportes/pages/ReporteVehiculosPage'));
const ReporteKioskosPage = lazy(() => import('./modules/reportes/pages/ReporteKioskosPage'));
const DashboardCajasPage = lazy(() => import('./modules/cajas/pages/DashboardCajasPage'));
const AperturaCajaPage = lazy(() => import('./modules/cajas/pages/AperturaCajaPage'));
const MovimientosPage = lazy(() => import('./modules/cajas/pages/MovimientosPage'));
const TransferenciasPage = lazy(() => import('./modules/cajas/pages/TransferenciasPage'));
const NuevoMovimientoPage = lazy(() => import('./modules/cajas/pages/NuevoMovimientoPage'));
const ArqueoYCierrePage = lazy(() => import('./modules/cajas/pages/ArqueoYCierrePage'));
const HistorialCajasPage = lazy(() => import('./modules/cajas/pages/HistorialCajasPage'));
const HistorialTransferenciasPage = lazy(() => import('./modules/cajas/pages/HistorialTransferenciasPage'));

const AppLoading = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0b0f19',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 700,
    }}
  >
    Cargando...
  </div>
);

function App() {
  return (
    <SucursalProvider>
      <PermisosProvider>
        <BrowserRouter>
          <Suspense fallback={<AppLoading />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/kiosko" element={<KioskoPage />} />
              <Route path="/kiosko/activar/:codigo" element={<KioskoPage />} />
              <Route path="/estado-vehiculo" element={<ConsultaVehiculoPage />} />

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/roles/:id/permisos" element={<RolPermisosPage />} />
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
                <Route path="/inventario/stock-ubicaciones" element={<StockUbicacionesPage />} />
                <Route path="/inventario/almacenes" element={<AlmacenesPage />} />
                <Route path="/inventario/ubicaciones" element={<UbicacionesPage />} />
                <Route path="/inventario/kardex" element={<KardexPage />} />
                <Route path="/inventario/traslados" element={<TrasladosPage />} />
                <Route path="/inventario/guias-remision" element={<GuiasRemisionPage />} />
                <Route path="/inventario/revision-precios" element={<RevisionPreciosPage />} />
                <Route path="/inventario/impuestos" element={<ConfiguracionIgvPage />} />
                <Route path="/facturacion/comprobantes" element={<ComprobantesElectronicosPage />} />
                <Route path="/taller/ordenes" element={<OrdenesTrabajoPage />} />
                <Route path="/taller/ordenes/nueva" element={<NuevaOrdenPage />} />
                <Route path="/taller/ordenes/:id" element={<DetalleOrdenPage />} />
                <Route path="/taller/plantillas" element={<PlantillasPage />} />
                <Route path="/taller/tipos-servicio" element={<TiposServicioPage />} />
                <Route path="/vehiculos" element={<VehiculosPage />} />
                <Route path="/contactos/clientes" element={<ClientesPage />} />
                <Route path="/contactos/proveedores" element={<ProveedoresPage />} />
                <Route path="/contactos/transportistas" element={<TransportistasPage />} />
                <Route path="/configuracion/vehiculos-transporte" element={<VehiculosTransportePage />} />
                <Route path="/configuracion/kioskos" element={<KioskosPage />} />
                <Route path="/ventas/pos" element={<POSPage />} />
                <Route path="/ventas/proformas" element={<ProformasPage />} />
                <Route path="/ventas/registro-manual" element={<RegistroManualVentasPage />} />
                <Route path="/ventas/configuracion" element={<ConfiguracionVentasPage />} />
                <Route path="/cuentas/por-cobrar" element={<CuentasCobrarResumenPage />} />
                <Route path="/cuentas/por-cobrar/cliente/:clienteId" element={<CuentasCobrarClientePage />} />
                <Route path="/cuentas/por-cobrar/credito/:id" element={<CuentasCobrarDetallePage />} />
                <Route path="/compras" element={<ComprasPage />} />
                <Route path="/compras/nueva" element={<NuevaCompraPage />} />
                <Route path="/compras/tipos-comprobante" element={<TiposComprobantePage />} />
                <Route path="/compras/cuentas-por-pagar" element={<CuentasPorPagarPage />} />
                <Route path="/compras/cuentas-por-pagar/proveedor/:proveedorId" element={<CuentasPorPagarProveedorPage />} />
                <Route path="/reportes/caja" element={<ReporteCajaPage />} />
                <Route path="/reportes/ventas" element={<ReporteVentasPage />} />
                <Route path="/reportes/productos" element={<ReporteProductosPage />} />
                <Route path="/reportes/clientes" element={<ReporteClientesPage />} />
                <Route path="/reportes/compras" element={<ReporteComprasPage />} />
                <Route path="/reportes/avanzado" element={<ReporteAvanzadoPage />} />
                <Route path="/reportes/vehiculos" element={<ReporteVehiculosPage />} />
                <Route path="/reportes/kioskos" element={<ReporteKioskosPage />} />
                <Route path="/cajas" element={<DashboardCajasPage />} />
                <Route path="/cajas/apertura" element={<AperturaCajaPage />} />
                <Route path="/cajas/sesion/:id" element={<MovimientosPage />} />
                <Route path="/cajas/movimiento/nuevo" element={<NuevoMovimientoPage />} />
                <Route path="/cajas/transferencias" element={<TransferenciasPage />} />
                <Route path="/cajas/transferencias/historial" element={<HistorialTransferenciasPage />} />
                <Route path="/cajas/historial" element={<HistorialCajasPage />} />
                <Route path="/cajas/cierre/:id" element={<ArqueoYCierrePage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PermisosProvider>
    </SucursalProvider>
  );
}

export default App;
