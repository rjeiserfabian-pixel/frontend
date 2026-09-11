import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: `${API_URL}/compras`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Para cuentas por pagar, corrigiendo la ruta para que apunte correctamente a /compras/cuentas-por-pagar
const cuentasApiClient = axios.create({
  baseURL: `${API_URL}/compras/cuentas-por-pagar`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
cuentasApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const pagosApiClient = axios.create({
  baseURL: `${API_URL}/compras/pagos-cuenta`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
pagosApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const comprasService = {
  // Compras
  getCompras: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/compras/?${queryString}`);
    return response.data;
  },

  getCompraById: async (id) => {
    const response = await apiClient.get(`/compras/${id}/`);
    return response.data;
  },

  crearCompra: async (payload) => {
    const response = await apiClient.post('/compras/', payload);
    return response.data;
  },

  anularCompra: async (id) => {
    const response = await apiClient.post(`/compras/${id}/anular/`);
    return response.data;
  },

  // Cuentas por Pagar
  getCuentasPorPagar: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await cuentasApiClient.get(`/?${queryString}`);
    return response.data;
  },

  getCuentaPorPagarById: async (id) => {
    const response = await cuentasApiClient.get(`/${id}/`);
    return response.data;
  },

  // Pagos
  getPagosPorCuenta: async (cuentaId) => {
    const response = await pagosApiClient.get(`/?cuenta_id=${cuentaId}`);
    return response.data;
  },

  registrarPago: async (payload) => {
    const response = await pagosApiClient.post('/', payload);
    return response.data;
  },

  // Tipos de Comprobante
  getTiposComprobante: async () => {
    const response = await apiClient.get('/tipos-comprobante/');
    return response.data;
  },
  
  createTipoComprobante: async (payload) => {
    const response = await apiClient.post('/tipos-comprobante/', payload);
    return response.data;
  },
  
  updateTipoComprobante: async (id, payload) => {
    const response = await apiClient.put(`/tipos-comprobante/${id}/`, payload);
    return response.data;
  },
  
  deleteTipoComprobante: async (id) => {
    const response = await apiClient.delete(`/tipos-comprobante/${id}/`);
    return response.data;
  }
};
