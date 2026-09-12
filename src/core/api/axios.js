import axios from 'axios';
import { authStorage } from '../auth/authStorage';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', // Cambiar en producción con variable de entorno
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para atrapar errores 401 y renovar token (o forzar logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        // Intenta renovar el access token
        const res = await axios.post('http://127.0.0.1:8000/api/seguridad/token/refresh/', {
          refresh: refreshToken,
        });

        const newAccessToken = res.data.access;
        authStorage.setAccessToken(newAccessToken);

        // Reintenta la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Si el refresh token falló o expiró, forzar logout
        authStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
