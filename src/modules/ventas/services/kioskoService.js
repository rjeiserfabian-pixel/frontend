import api from '../../../core/api/axios';

export const kioskoService = {
  listar: async () => {
    const response = await api.get('ventas/kioskos/');
    return response.data.results || response.data;
  },

  crear: async (data) => {
    const response = await api.post('ventas/kioskos/', data);
    return response.data;
  },

  actualizar: async (id, data) => {
    const response = await api.patch(`ventas/kioskos/${id}/`, data);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`ventas/kioskos/${id}/`);
    return response.data;
  },

  // ── Acciones públicas (usadas por el kiosko físico, sin sesión) ──
  activar: async (codigoActivacion) => {
    const response = await api.post('ventas/kioskos/activar/', { codigo_activacion: codigoActivacion });
    return response.data;
  },

  whoami: async (token) => {
    const response = await api.get('ventas/kioskos/whoami/', { params: { token } });
    return response.data;
  },
};
