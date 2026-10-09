import api from '../../../core/api/axios';

export const TIPOS_AVISO = [
  { id: 'CITA', nombre: 'Recordatorio de cita' },
  { id: 'VEHICULO_LISTO', nombre: 'Vehículo listo' },
  { id: 'COTIZACION', nombre: 'Cotización por vencer' },
  { id: 'MANTENIMIENTO', nombre: 'Mantenimiento próximo' },
  { id: 'DOCUMENTO', nombre: 'Documento por vencer' },
  { id: 'CUOTA', nombre: 'Cobranza de cuota' },
];

export const avisosService = {
  listar: async (params, signal) => {
    const response = await api.get('avisos/', { params, signal });
    return response.data;
  },
  generar: async () => {
    const response = await api.post('avisos/generar/');
    return response.data;
  },
  resumen: async () => {
    const response = await api.get('avisos/resumen/');
    return response.data;
  },
  marcarEnviado: async (id) => (await api.post(`avisos/${id}/marcar-enviado/`)).data,
  descartar: async (id) => (await api.post(`avisos/${id}/descartar/`)).data,
  reabrir: async (id) => (await api.post(`avisos/${id}/reabrir/`)).data,
};
