import api from '../../../core/api/axios';

const URL_CATEGORIAS = '/inventario/categorias/';
const URL_MARCAS = '/inventario/marcas/';
const URL_REPUESTOS = '/inventario/repuestos/';

export const inventarioService = {
  // --- Impuestos / IGV ---
  getTiposIgv: async () => {
    const response = await api.get('/ventas/impuestos/');
    return response.data;
  },

  // --- Categorias ---
  getCategorias: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`${URL_CATEGORIAS}${queryString}`);
    return response.data;
  },
  createCategoria: async (data) => {
    const response = await api.post(URL_CATEGORIAS, data);
    return response.data;
  },
  updateCategoria: async (id, data) => {
    const response = await api.put(`${URL_CATEGORIAS}${id}/`, data);
    return response.data;
  },
  deleteCategoria: async (id) => {
    const response = await api.delete(`${URL_CATEGORIAS}${id}/`);
    return response.data;
  },

  // --- Marcas ---
  getMarcas: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`${URL_MARCAS}${queryString}`);
    return response.data;
  },
  createMarca: async (data) => {
    const response = await api.post(URL_MARCAS, data);
    return response.data;
  },
  updateMarca: async (id, data) => {
    const response = await api.put(`${URL_MARCAS}${id}/`, data);
    return response.data;
  },
  deleteMarca: async (id) => {
    const response = await api.delete(`${URL_MARCAS}${id}/`);
    return response.data;
  },

  // --- Repuestos ---
  getRepuestos: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.search) query.append('search', params.search);
    if (params.categoria) query.append('categoria', params.categoria);
    if (params.marca) query.append('marca', params.marca);
    if (params.ordering) query.append('ordering', params.ordering);
    
    const response = await api.get(`${URL_REPUESTOS}?${query.toString()}`);
    return response.data;
  },
  createRepuesto: async (data) => {
    const response = await api.post(URL_REPUESTOS, data);
    return response.data;
  },
  updateRepuesto: async (id, data) => {
    const response = await api.put(`${URL_REPUESTOS}${id}/`, data);
    return response.data;
  },
  deleteRepuesto: async (id) => {
    const response = await api.delete(`${URL_REPUESTOS}${id}/`);
    return response.data;
  },
  exportarExcel: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`${URL_REPUESTOS}exportar_excel/?${query}`, { responseType: 'blob' });
    return response.data;
  },
  exportarPDF: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`${URL_REPUESTOS}exportar_pdf/?${query}`, { responseType: 'blob' });
    return response.data;
  },

  // --- Busqueda Dinamica ---
  getRepuestosCompatibles: async (marca, modelo, motor) => {
    let query = `?marca=${encodeURIComponent(marca)}`;
    if (modelo) query += `&modelo=${encodeURIComponent(modelo)}`;
    if (motor) query += `&motor=${encodeURIComponent(motor)}`;
    
    const response = await api.get(`${URL_REPUESTOS}compatibles/${query}`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // NUEVOS MÉTODOS: SUCURSALES
  // ──────────────────────────────────────────────
  getSucursales: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/inventario/sucursales/${queryString}`);
    return response.data;
  },
  createSucursal: async (data) => {
    const response = await api.post('/inventario/sucursales/', data);
    return response.data;
  },
  updateSucursal: async (id, data) => {
    const response = await api.put(`/inventario/sucursales/${id}/`, data);
    return response.data;
  },
  deleteSucursal: async (id) => {
    const response = await api.delete(`/inventario/sucursales/${id}/`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // NUEVOS MÉTODOS: ALMACENES
  // ──────────────────────────────────────────────
  getAlmacenes: async (sucursalId = null, params = {}) => {
    const queryParams = new URLSearchParams();
    if (sucursalId) queryParams.append('sucursal', sucursalId);
    if (params.page) queryParams.append('page', params.page);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`/inventario/almacenes/${queryString}`);
    return response.data;
  },
  createAlmacen: async (data) => {
    const response = await api.post('/inventario/almacenes/', data);
    return response.data;
  },
  updateAlmacen: async (id, data) => {
    const response = await api.put(`/inventario/almacenes/${id}/`, data);
    return response.data;
  },
  deleteAlmacen: async (id) => {
    const response = await api.delete(`/inventario/almacenes/${id}/`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // NUEVOS MÉTODOS: UBICACIONES FÍSICAS
  // ──────────────────────────────────────────────
  getUbicaciones: async (almacenId = null, sucursalId = null, paramsObj = {}) => {
    const params = new URLSearchParams();
    if (almacenId) params.append('almacen', almacenId);
    if (sucursalId) params.append('sucursal', sucursalId);
    if (paramsObj.page) params.append('page', paramsObj.page);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/inventario/ubicaciones/${query}`);
    return response.data;
  },
  createUbicacion: async (data) => {
    const response = await api.post('/inventario/ubicaciones/', data);
    return response.data;
  },
  updateUbicacion: async (id, data) => {
    const response = await api.put(`/inventario/ubicaciones/${id}/`, data);
    return response.data;
  },
  deleteUbicacion: async (id) => {
    const response = await api.delete(`/inventario/ubicaciones/${id}/`);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // NUEVOS MÉTODOS: STOCK POR UBICACIÓN
  // ──────────────────────────────────────────────
  getStock: async (repuestoId = null, ubicacionId = null) => {
    const params = new URLSearchParams();
    if (repuestoId) params.append('repuesto', repuestoId);
    if (ubicacionId) params.append('ubicacion', ubicacionId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/inventario/stock/${query}`);
    return response.data;
  },
  createStock: async (data) => {
    const response = await api.post('/inventario/stock/', data);
    return response.data;
  },
  updateStock: async (id, data) => {
    const response = await api.patch(`/inventario/stock/${id}/`, data);
    return response.data;
  },

  // ──────────────────────────────────────────────
  // NUEVOS MÉTODOS: KARDEX (solo lectura)
  // ──────────────────────────────────────────────
  getKardex: async ({ repuestoId = null, ubicacionId = null, tipo = null, page = 1, page_size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (repuestoId) params.append('repuesto', repuestoId);
    if (ubicacionId) params.append('ubicacion', ubicacionId);
    if (tipo) params.append('tipo', tipo);
    params.append('page', page);
    params.append('page_size', page_size);
    const response = await api.get(`/inventario/kardex/?${params.toString()}`);
    return response.data;
  },
};
