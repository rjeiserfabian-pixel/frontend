import api from '../../../core/api/axios';

const URL_VEHICULOS = 'vehiculos/';

export const vehiculoService = {
  getVehiculos: async (page = 1, search = '') => {
    const params = new URLSearchParams({ page });
    if (search) params.append('search', search);
    const response = await api.get(`${URL_VEHICULOS}?${params.toString()}`);
    return response.data;
  },
  createVehiculo: async (data) => {
    const response = await api.post(URL_VEHICULOS, data);
    return response.data;
  },
  updateVehiculo: async (id, data) => {
    const response = await api.put(`${URL_VEHICULOS}${id}/`, data);
    return response.data;
  },
  deleteVehiculo: async (id) => {
    const response = await api.delete(`${URL_VEHICULOS}${id}/`);
    return response.data;
  },
  buscarPorPlaca: async (placa, signal) => {
    const response = await api.post(`${URL_VEHICULOS}consulta-placa/`, { placa }, { signal });
    return response.data;
  }
};
