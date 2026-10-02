import api from '../../../core/api/axios';

export const tallerService = {
  // Citas
  getCitas: async (params) => {
    const response = await api.get('taller/citas/', { params });
    return response.data;
  },

  getDisponibilidadCitas: async (params) => {
    const response = await api.get('taller/citas/disponibilidad/', { params });
    return response.data;
  },

  getConfiguracionAgenda: async (sucursalId) => {
    const response = await api.get(`taller/configuracion-agenda/por-sucursal/${sucursalId}/`);
    return response.data;
  },

  actualizarConfiguracionAgenda: async (id, data) => {
    const response = await api.patch(`taller/configuracion-agenda/${id}/`, data);
    return response.data;
  },

  getBloqueosAgenda: async (params) => {
    const response = await api.get('taller/bloqueos-agenda/', { params });
    return response.data;
  },

  crearBloqueoAgenda: async (data) => {
    const response = await api.post('taller/bloqueos-agenda/', data);
    return response.data;
  },

  actualizarBloqueoAgenda: async (id, data) => {
    const response = await api.patch(`taller/bloqueos-agenda/${id}/`, data);
    return response.data;
  },

  crearCita: async (data) => {
    const response = await api.post('taller/citas/', data);
    return response.data;
  },

  actualizarCita: async (id, data) => {
    const response = await api.patch(`taller/citas/${id}/`, data);
    return response.data;
  },

  confirmarCita: async (id) => {
    const response = await api.post(`taller/citas/${id}/confirmar/`);
    return response.data;
  },

  cancelarCita: async (id, motivo) => {
    const response = await api.post(`taller/citas/${id}/cancelar/`, { motivo });
    return response.data;
  },

  marcarNoAsistio: async (id) => {
    const response = await api.post(`taller/citas/${id}/no-asistio/`);
    return response.data;
  },

  recepcionarCita: async (id, payload = {}) => {
    const response = await api.post(`taller/citas/${id}/recepcionar/`, payload);
    return response.data;
  },

  getHistorialCita: async (id) => {
    const response = await api.get(`taller/citas/${id}/historial/`);
    return response.data;
  },

  notificarCita: async (id) => {
    const response = await api.post(`taller/citas/${id}/notificar/`);
    return response.data;
  },

  getListaEsperaCitas: async (params) => {
    const response = await api.get('taller/lista-espera-citas/', { params });
    return response.data;
  },

  actualizarListaEsperaCita: async (id, data) => {
    const response = await api.patch(`taller/lista-espera-citas/${id}/`, data);
    return response.data;
  },

  // Ordenes de Trabajo
  getOrdenes: async (params) => {
    const response = await api.get('taller/ordenes/', { params });
    return response.data;
  },

  getOrden: async (id) => {
    const response = await api.get(`taller/ordenes/${id}/`);
    return response.data;
  },

  crearOrden: async (data) => {
    const response = await api.post('taller/ordenes/', data);
    return response.data;
  },

  actualizarOrden: async (id, data) => {
    const response = await api.patch(`taller/ordenes/${id}/`, data);
    return response.data;
  },

  aprobarServicios: async (id, payload) => {
    // payload: { servicios_aprobados: [1,2], repuestos_aprobados: [1] }
    const response = await api.post(`taller/ordenes/${id}/aprobar_servicios/`, payload);
    return response.data;
  },

  finalizarOrden: async (id) => {
    const response = await api.post(`taller/ordenes/${id}/finalizar_orden/`);
    return response.data;
  },

  enviarAPos: async (id, sucursalId) => {
    const response = await api.post(`taller/ordenes/${id}/enviar_a_pos/`, { sucursal_id: sucursalId });
    return response.data;
  },

  anularOrden: async (id, motivo, categoria = null) => {
    const response = await api.post(`taller/ordenes/${id}/anular/`, { motivo, categoria });
    return response.data;
  },


  // Hallazgos
  crearHallazgo: async (data) => {
    const response = await api.post('taller/hallazgos/', data);
    return response.data;
  },

  actualizarHallazgo: async (id, data) => {
    const response = await api.patch(`taller/hallazgos/${id}/`, data);
    return response.data;
  },

  eliminarHallazgo: async (id) => {
    const response = await api.delete(`taller/hallazgos/${id}/`);
    return response.data;
  },

  // Servicios
  crearServicio: async (data) => {
    const response = await api.post('taller/servicios/', data);
    return response.data;
  },
  
  actualizarServicio: async (id, data) => {
    const response = await api.patch(`taller/servicios/${id}/`, data);
    return response.data;
  },

  eliminarServicio: async (id) => {
    const response = await api.delete(`taller/servicios/${id}/`);
    return response.data;
  },

  // Repuestos
  crearRepuesto: async (data) => {
    const response = await api.post('taller/repuestos/', data);
    return response.data;
  },

  actualizarRepuesto: async (id, data) => {
    const response = await api.patch(`taller/repuestos/${id}/`, data);
    return response.data;
  },

  eliminarRepuesto: async (id) => {
    const response = await api.delete(`taller/repuestos/${id}/`);
    return response.data;
  },

  // Plantillas Preventivas
  getPlantillas: async (params) => {
    const response = await api.get('taller/plantillas/', { params });
    return response.data;
  },
  
  crearPlantilla: async (data) => {
    const response = await api.post('taller/plantillas/', data);
    return response.data;
  },
  
  actualizarPlantilla: async (id, data) => {
    const response = await api.put(`taller/plantillas/${id}/`, data);
    return response.data;
  },
  
  eliminarPlantilla: async (id) => {
    const response = await api.delete(`taller/plantillas/${id}/`);
    return response.data;
  },

  // Tipos de Servicio
  getTiposServicio: async (params) => {
    const response = await api.get('taller/tipos-servicio/', { params });
    return response.data;
  },

  crearTipoServicio: async (data) => {
    const response = await api.post('taller/tipos-servicio/', data);
    return response.data;
  },

  actualizarTipoServicio: async (id, data) => {
    const response = await api.put(`taller/tipos-servicio/${id}/`, data);
    return response.data;
  },

  eliminarTipoServicio: async (id) => {
    const response = await api.delete(`taller/tipos-servicio/${id}/`);
    return response.data;
  },

  // Plantillas Correctivas
  getPlantillasCorrectivas: async (params) => {
    const response = await api.get('taller/plantillas-correctivas/', { params });
    return response.data;
  },

  crearPlantillaCorrectiva: async (data) => {
    const response = await api.post('taller/plantillas-correctivas/', data);
    return response.data;
  },

  actualizarPlantillaCorrectiva: async (id, data) => {
    const response = await api.put(`taller/plantillas-correctivas/${id}/`, data);
    return response.data;
  },

  eliminarPlantillaCorrectiva: async (id) => {
    const response = await api.delete(`taller/plantillas-correctivas/${id}/`);
    return response.data;
  },
};
