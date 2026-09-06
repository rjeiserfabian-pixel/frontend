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

// Para cuentas por pagar, ya que la ruta no es /compras/cuentas-por-pagar sino /api/cuentas-por-pagar
const cuentasApiClient = axios.create({
  baseURL: `${API_URL}/cuentas-por-pagar`,
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
  baseURL: `${API_URL}/pagos-cuenta`,
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
    const response = await apiClient.get(`/?${queryString}`);
    return response.data;
  },

  getCompraById: async (id) => {
    const response = await apiClient.get(`/${id}/`);
    return response.data;
  },

  crearCompra: async (payload) => {
    const response = await apiClient.post('/', payload);
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
  registrarPago: async (payload) => {
    const response = await pagosApiClient.post('/', payload);
    return response.data;
  },
};
