import api from '../../../core/api/axios';

const BASE_URL = 'vehiculos/transporte/';

export const vehiculoTransporteService = {
  listar: async (page = 1, search = '') => {
    const params = new URLSearchParams({ page });
    if (search) params.append('search', search);
    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`${BASE_URL}${id}/`);
    return response.data;
  },

  crear: async (datos) => {
    const response = await api.post(BASE_URL, datos);
    return response.data;
  },

  actualizar: async (id, datos) => {
    const response = await api.put(`${BASE_URL}${id}/`, datos);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`${BASE_URL}${id}/`);
    return response.data;
  },

  consultarPlaca: async (placa, signal) => {
    const response = await api.post(
      `${BASE_URL}consulta-placa/`,
      { placa },
      { signal }
    );
    return response.data;
  }
};
