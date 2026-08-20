import api from '../../../core/api/axios';

const URL_VEHICULOS = '/vehiculos/';

export const vehiculoService = {
  getVehiculos: async (page = 1) => {
    const response = await api.get(`${URL_VEHICULOS}?page=${page}`);
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
  
  // Búsqueda por placa desde el backend o API externa (esto puede requerir un endpoint especial si la integración es en backend)
  buscarPorPlaca: async (placa) => {
    // Asumiendo que el backend maneja la consulta a la API de Sunarp
    const response = await api.get(`/vehiculos/buscar_placa/?placa=${placa}`);
    return response.data;
  }
};
