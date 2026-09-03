import api from '../../../core/api/axios';

export const tallerService = {
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

  enviarAPos: async (id) => {
    const response = await api.post(`taller/ordenes/${id}/enviar_a_pos/`);
    return response.data;
  },


  // Hallazgos
  crearHallazgo: async (data) => {
    const response = await api.post('taller/hallazgos/', data);
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
  
  eliminarServicio: async (id) => {
    const response = await api.delete(`taller/servicios/${id}/`);
    return response.data;
  },

  // Repuestos
  crearRepuesto: async (data) => {
    const response = await api.post('taller/repuestos/', data);
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
  }
};
