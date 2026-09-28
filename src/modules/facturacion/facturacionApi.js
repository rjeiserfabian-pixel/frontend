import api from '../../core/api/axios';

const BASE = '/facturacion/comprobantes/';

export const facturacionApi = {
  listar: (params) => api.get(BASE, { params }),
  detalle: (id) => api.get(`${BASE}${id}/`),
  prepararVenta: (ventaId) => api.post(`${BASE}preparar-venta/`, { venta_id: ventaId }),
  prepararGuia: (guiaRemisionId, tipoComprobanteId) =>
    api.post(`${BASE}preparar-guia/`, { guia_remision_id: guiaRemisionId, tipo_comprobante_id: tipoComprobanteId }),
  emitir: (id, payload = {}) => api.post(`${BASE}${id}/emitir/`, payload),
  reintentar: (id, payload = {}) => api.post(`${BASE}${id}/reintentar/`, payload),
  generarNota: (id, payload) => api.post(`${BASE}${id}/generar-nota/`, payload),
  solicitarBaja: (id, motivo) => api.post(`${BASE}${id}/solicitar-baja/`, { motivo }),
  consultarBaja: (id) => api.post(`${BASE}${id}/consultar-baja/`),
};

export default facturacionApi;
