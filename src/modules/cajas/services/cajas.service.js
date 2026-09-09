/**
 * cajas.service.js
 * Servicio de API para el Módulo de Cajas.
 * Usa el interceptor de auth de axios configurado en core/api/axios.js.
 */
import api from '../../../core/api/axios';

const BASE = 'cajas';

// ── Dashboard ────────────────────────────────
export const getDashboardCajas = (sucursalId) =>
  api.get(`${BASE}/dashboard/`, { params: sucursalId ? { sucursal_id: sucursalId } : {} });

// ── Cajas (CRUD) ─────────────────────────────
export const getCajas       = (params) => api.get(`${BASE}/lista/`, { params });
export const createCaja     = (data)   => api.post(`${BASE}/lista/`, data);
export const updateCaja     = (id, d)  => api.patch(`${BASE}/lista/${id}/`, d);

// ── Sesiones ─────────────────────────────────
export const getSesiones    = (params) => api.get(`${BASE}/sesiones/`, { params });
export const getSesion      = (id)     => api.get(`${BASE}/sesiones/${id}/`);
export const getDetalleSesion = (id)   => api.get(`${BASE}/sesiones/${id}/detalle/`);
export const abrirCaja      = (data)   => api.post(`${BASE}/sesiones/abrir/`, data);
export const cerrarCaja     = (id, d)  => api.post(`${BASE}/sesiones/${id}/cerrar/`, d);

// ── Movimientos manuales ──────────────────────
export const getMovimientos = (params) => api.get(`${BASE}/movimientos/`, { params });
export const registrarMovimiento = (data) => api.post(`${BASE}/movimientos/`, data);
export const aprobarMovimiento   = (id)   => api.post(`${BASE}/movimientos/${id}/aprobar/`);
export const rechazarMovimiento  = (id, motivo) =>
  api.post(`${BASE}/movimientos/${id}/rechazar/`, { motivo });

// ── Transferencias ───────────────────────────
export const getTransferencias = (params) => api.get(`${BASE}/transferencias/`, { params });
export const crearTransferencia = (data)  => api.post(`${BASE}/transferencias/`, data);

// ── Arqueos ──────────────────────────────────
export const calcularArqueo   = (sesionId) => api.get(`${BASE}/arqueo/${sesionId}/calcular/`);
export const registrarArqueo  = (sesionId, data) => api.post(`${BASE}/arqueo/${sesionId}/registrar/`, data);

// ── Métodos de pago (de ventas) ───────────────
export const getMetodosPago = () => api.get('ventas/metodos-pago/');
