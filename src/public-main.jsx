import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './core/theme/theme';
import './index.css';

const Estado = lazy(() => import('./modules/public/pages/ConsultaVehiculoPage'));
const Repuestos = lazy(() => import('./modules/public/pages/ConsultaRepuestosPage'));
const Citas = lazy(() => import('./modules/public/pages/ReservaCitaPublicaPage'));
const Historial = lazy(() => import('./modules/public/pages/HistorialVehiculoQrPage'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<div role="status" style={{ padding: 24 }}>Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/estado-vehiculo" replace />} />
            <Route path="/estado-vehiculo" element={<Estado />} />
            <Route path="/consulta-repuestos" element={<Repuestos />} />
            <Route path="/reservar-cita" element={<Citas />} />
            <Route path="/historial-vehiculo/:token" element={<Historial />} />
            <Route path="*" element={<div role="alert" style={{ padding: 24 }}>Pagina no disponible.</div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
