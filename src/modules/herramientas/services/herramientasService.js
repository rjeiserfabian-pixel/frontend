import api from '../../../core/api/axios';

export const ESTADOS_OPERATIVOS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'ASIGNADA', label: 'Asignada' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'EN_REPARACION', label: 'En reparación' },
  { value: 'FUERA_DE_SERVICIO', label: 'Fuera de servicio' },
  { value: 'PERDIDA', label: 'Perdida' },
  { value: 'DADA_DE_BAJA', label: 'Dada de baja' },
];

export const ESTADOS_FISICOS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'BUENO', label: 'Bueno' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'MALO', label: 'Malo' },
];

/** Extrae el primer mensaje legible de la respuesta de error del backend. */
export const mensajeError = (error, fallback = 'Ocurrió un error inesperado') => {
  const data = error?.response?.data;
  const primero = (valor) => {
    if (!valor) return null;
    if (typeof valor === 'string') return valor;
    if (Array.isArray(valor)) return primero(valor[0]);
    if (typeof valor === 'object') {
      for (const v of Object.values(valor)) {
        const msg = primero(v);
        if (msg) return msg;
      }
    }
    return null;
  };
  return primero(data?.errores) || primero(data?.detail) || data?.mensaje || fallback;
};

/** Devuelve { campo: mensaje } para mostrar errores de validación bajo cada input. */
export const erroresPorCampo = (error) => {
  const errores = error?.response?.data?.errores;
  if (!errores || typeof errores !== 'object' || Array.isArray(errores)) return {};
  return Object.fromEntries(
    Object.entries(errores).map(([campo, v]) => [campo, Array.isArray(v) ? v[0] : String(v)])
  );
};

export const herramientasService = {
  // Herramientas
  getHerramientas: async (params, signal) => {
    const response = await api.get('herramientas/herramientas/', { params, signal });
    return response.data;
  },
  crearHerramienta: async (data) => {
    const response = await api.post('herramientas/herramientas/', data);
    return response.data;
  },
  actualizarHerramienta: async (id, data) => {
    const response = await api.patch(`herramientas/herramientas/${id}/`, data);
    return response.data;
  },
  eliminarHerramienta: async (id) => {
    await api.delete(`herramientas/herramientas/${id}/`);
  },
  cambiarEstado: async (id, data) => {
    const response = await api.post(`herramientas/herramientas/${id}/cambiar-estado/`, data);
    return response.data;
  },
  getHistorial: async (id, signal) => {
    const response = await api.get(`herramientas/herramientas/${id}/historial/`, { signal });
    return response.data;
  },

  // Categorías (catálogo sin paginar)
  getCategorias: async (params, signal) => {
    const response = await api.get('herramientas/categorias/', { params, signal });
    return response.data;
  },
  crearCategoria: async (data) => {
    const response = await api.post('herramientas/categorias/', data);
    return response.data;
  },
  actualizarCategoria: async (id, data) => {
    const response = await api.patch(`herramientas/categorias/${id}/`, data);
    return response.data;
  },
  eliminarCategoria: async (id) => {
    await api.delete(`herramientas/categorias/${id}/`);
  },

  // Asignaciones (entrega / devolución)
  getAsignaciones: async (params, signal) => {
    const response = await api.get('herramientas/asignaciones/', { params, signal });
    return response.data;
  },
  entregar: async (data) => {
    const response = await api.post('herramientas/asignaciones/', data);
    return response.data;
  },
  devolver: async (id, data) => {
    const response = await api.post(`herramientas/asignaciones/${id}/devolver/`, data);
    return response.data;
  },
  anularAsignacion: async (id, data) => {
    const response = await api.post(`herramientas/asignaciones/${id}/anular/`, data);
    return response.data;
  },
  getTecnicos: async (signal) => {
    const response = await api.get('herramientas/asignaciones/tecnicos/', { signal });
    return response.data;
  },
  getHerramientasDisponibles: async (params, signal) => {
    const response = await api.get('herramientas/asignaciones/herramientas-disponibles/', { params, signal });
    return response.data;
  },

  // Planes de mantenimiento
  getPlanes: async (params, signal) => {
    const response = await api.get('herramientas/planes-mantenimiento/', { params, signal });
    return response.data;
  },
  crearPlan: async (data) => {
    const response = await api.post('herramientas/planes-mantenimiento/', data);
    return response.data;
  },
  actualizarPlan: async (id, data) => {
    const response = await api.patch(`herramientas/planes-mantenimiento/${id}/`, data);
    return response.data;
  },
  desactivarPlan: async (id) => {
    await api.delete(`herramientas/planes-mantenimiento/${id}/`);
  },

  // Registros de mantenimiento
  getMantenimientos: async (params, signal) => {
    const response = await api.get('herramientas/mantenimientos/', { params, signal });
    return response.data;
  },
  iniciarMantenimiento: async (data) => {
    const response = await api.post('herramientas/mantenimientos/', data);
    return response.data;
  },
  finalizarMantenimiento: async (id, data) => {
    const response = await api.post(`herramientas/mantenimientos/${id}/finalizar/`, data);
    return response.data;
  },
  cancelarMantenimiento: async (id, data) => {
    const response = await api.post(`herramientas/mantenimientos/${id}/cancelar/`, data);
    return response.data;
  },

  // Incidencias
  getIncidencias: async (params, signal) => {
    const response = await api.get('herramientas/incidencias/', { params, signal });
    return response.data;
  },
  crearIncidencia: async (data) => {
    const response = await api.post('herramientas/incidencias/', data);
    return response.data;
  },
  resolverIncidencia: async (id, data) => {
    const response = await api.post(`herramientas/incidencias/${id}/resolver/`, data);
    return response.data;
  },

  // Resumen del inventario y reportes
  getResumen: async (params, signal) => {
    const response = await api.get('herramientas/resumen/', { params, signal });
    return response.data;
  },
  getReporte: async (tipo, params, signal) => {
    const response = await api.get(`herramientas/reportes/${tipo}/`, { params, signal });
    return response.data;
  },
  // Devuelve la respuesta completa (blob) para descargarla con descargarBlob
  exportarReporte: (tipo, params, formato) =>
    api.get(`herramientas/reportes/${tipo}/`, {
      params: { ...params, formato },
      responseType: 'blob',
    }),

  // Catálogos de otros módulos (pueden devolver 403 si el rol no tiene ese permiso)
  getAlmacenes: async (sucursalId, signal) => {
    const response = await api.get('inventario/almacenes/', { params: { sucursal: sucursalId }, signal });
    return response.data.results || response.data;
  },
  buscarProveedores: async (search, signal) => {
    const response = await api.get('clientes/proveedores/', { params: { search }, signal });
    return response.data.results || response.data;
  },
};
