import api from '../../../core/api/axios';

const URL_CATEGORIAS = '/inventario/categorias/';
const URL_MARCAS = '/inventario/marcas/';
const URL_REPUESTOS = '/inventario/repuestos/';

export const inventarioService = {
  // --- Categorias ---
  getCategorias: async () => {
    const response = await api.get(URL_CATEGORIAS);
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
  getMarcas: async () => {
    const response = await api.get(URL_MARCAS);
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
  getRepuestos: async (page = 1) => {
    const response = await api.get(`${URL_REPUESTOS}?page=${page}`);
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

  // --- Busqueda Dinamica ---
  getRepuestosCompatibles: async (marca, modelo, motor) => {
    let query = `?marca=${encodeURIComponent(marca)}`;
    if (modelo) query += `&modelo=${encodeURIComponent(modelo)}`;
    if (motor) query += `&motor=${encodeURIComponent(motor)}`;
    
    const response = await api.get(`${URL_REPUESTOS}compatibles/${query}`);
    return response.data;
  }
};
