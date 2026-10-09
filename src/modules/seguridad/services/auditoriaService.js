import api from '../../../core/api/axios';

export const auditoriaService = {
  listar: async (params, signal) => {
    const response = await api.get('seguridad/auditoria/', { params, signal });
    return response.data;
  },
  opciones: async () => {
    const response = await api.get('seguridad/auditoria/opciones/');
    return response.data;
  },
};
