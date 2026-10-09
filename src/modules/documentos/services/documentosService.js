import api from '../../../core/api/axios';

export const TIPOS_POR_ENTIDAD = {
  VEHICULO: [
    { id: 'SOAT', nombre: 'SOAT' },
    { id: 'REVISION_TECNICA', nombre: 'Revisión técnica' },
    { id: 'TARJETA_PROPIEDAD', nombre: 'Tarjeta de propiedad' },
    { id: 'CERTIFICADO_GAS', nombre: 'Certificado de gas (GNV/GLP)' },
    { id: 'OTRO', nombre: 'Otro' },
  ],
  CLIENTE: [
    { id: 'LICENCIA_CONDUCIR', nombre: 'Licencia de conducir' },
    { id: 'DOCUMENTO_IDENTIDAD', nombre: 'Copia de documento de identidad' },
    { id: 'CONTRATO', nombre: 'Contrato / convenio' },
    { id: 'OTRO', nombre: 'Otro' },
  ],
};

// Arma el FormData (los campos vacíos se omiten salvo las fechas, que sí pueden limpiarse).
const aFormData = (datos) => {
  const form = new FormData();
  Object.entries(datos).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null) return;
    if (clave === 'archivo') {
      if (valor instanceof File) form.append('archivo', valor);
      return;
    }
    form.append(clave, valor);
  });
  return form;
};

export const documentosService = {
  listar: async (params, signal) => {
    const response = await api.get('documentos/', { params: { page_size: 100, ...params }, signal });
    return response.data;
  },
  crear: async (datos) => {
    const response = await api.post('documentos/', aFormData(datos), { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  actualizar: async (id, datos) => {
    const response = await api.patch(`documentos/${id}/`, aFormData(datos), { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  eliminar: async (id) => {
    await api.delete(`documentos/${id}/`);
  },
  resumen: async () => {
    const response = await api.get('documentos/resumen/');
    return response.data;
  },
  // El archivo se pide con el token (no hay URL pública) y se abre desde una URL temporal.
  abrirArchivo: async (id) => {
    const ventana = window.open('', '_blank'); // se abre antes del await para que el navegador no la bloquee
    try {
      const response = await api.get(`documentos/${id}/archivo/`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      if (ventana) ventana.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (ventana) ventana.close();
      throw error;
    }
  },
};
