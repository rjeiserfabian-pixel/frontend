import axios from 'axios';

// Usar variable de entorno si existe, de lo contrario localhost para dev local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: `${API_URL}/ventas`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token de SimpleJWT si está en localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ventasService = {
  // ==========================================
  // KIOSKO
  // ==========================================
  generarTicket: async (payload) => {
    // payload: { cliente_id, vehiculo_id, sucursal_id, detalles: [{repuesto_id, cantidad, precio_unitario}] }
    const response = await apiClient.post('/transacciones/kiosko/generar-ticket/', payload);
    return response.data;
  },

  // ==========================================
  // CAJA / PUNTO DE VENTA
  // ==========================================
  aperturarCaja: async (cajaId, saldoInicial) => {
    const response = await apiClient.post('/sesiones/aperturar/', {
      caja_id: cajaId,
      saldo_inicial: saldoInicial
    });
    return response.data;
  },

  cerrarCaja: async (sesionId, saldoReal) => {
    const response = await apiClient.post(`/sesiones/${sesionId}/cerrar/`, {
      saldo_cierre_real: saldoReal
    });
    return response.data;
  },

  obtenerReporteCierre: async (sesionId) => {
    const response = await apiClient.get(`/sesiones/${sesionId}/reporte-cierre/`);
    return response.data;
  },

  obtenerPreVenta: async (ticketId) => {
    // Idealmente tendríamos un endpoint custom, pero podemos filtrar por ticket o id
    const response = await apiClient.get(`/transacciones/?ticket_kiosko=${ticketId}`);
    return response.data;
  },

  procesarVenta: async (ventaId, payload) => {
    // payload: { sesion_caja_id, tipo_comprobante, pagos: [{metodo_pago_id, monto, referencia}] }
    const response = await apiClient.post(`/transacciones/${ventaId}/procesar/`, payload);
    return response.data;
  },

  // ==========================================
  // MANTENIMIENTOS
  // ==========================================
  getMetodosPago: async () => {
    const response = await apiClient.get('/metodos-pago/');
    return response.data;
  },
  
  getCajas: async () => {
    const response = await apiClient.get('/cajas/');
    return response.data;
  }
};
