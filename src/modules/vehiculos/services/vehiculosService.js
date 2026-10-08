import api from '../../../core/api/axios';

const URL_VEHICULOS = 'vehiculos/';

export const vehiculoService = {
  getMantenimientos: async (id, page = 1) => (await api.get(`${URL_VEHICULOS}${id}/mantenimientos/`, { params: { page } })).data,
  crearMantenimiento: async (id, data) => (await api.post(`${URL_VEHICULOS}${id}/mantenimientos/`, data)).data,
  editarMantenimiento: async (id, registroId, data) => (await api.patch(`${URL_VEHICULOS}${id}/mantenimientos/${registroId}/`, data)).data,
  anularMantenimiento: async (id, registroId) => api.delete(`${URL_VEHICULOS}${id}/mantenimientos/${registroId}/`),
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
  },
  vincularCliente: async (vehiculoId, clienteId) => {
    const response = await api.post(`${URL_VEHICULOS}${vehiculoId}/vincular-cliente/`, { cliente_id: clienteId });
    return response.data;
  },
  getHistorial: async (vehiculoId, page = 1) => {
    const response = await api.get(`${URL_VEHICULOS}${vehiculoId}/historial/?page=${page}`);
    return response.data;
  },
  descargarHistorialPdf: async (vehiculoId) => {
    const response = await api.get(`${URL_VEHICULOS}${vehiculoId}/historial/pdf/`, { responseType: 'blob' });
    return response.data;
  },
  getQr: async (vehiculoId) => {
    const response = await api.get(`${URL_VEHICULOS}${vehiculoId}/qr/`);
    return response.data;
  },
  generarQr: async (vehiculoId) => {
    const response = await api.post(`${URL_VEHICULOS}${vehiculoId}/qr/generar/`);
    return response.data;
  },
  regenerarQr: async (vehiculoId) => {
    const response = await api.post(`${URL_VEHICULOS}${vehiculoId}/qr/regenerar/`);
    return response.data;
  },
  desactivarQr: async (vehiculoId) => {
    const response = await api.post(`${URL_VEHICULOS}${vehiculoId}/qr/desactivar/`);
    return response.data;
  },
};
