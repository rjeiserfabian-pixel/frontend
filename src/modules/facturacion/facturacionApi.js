import api from '../../core/api/axios';

const BASE = '/facturacion/comprobantes/';

export const facturacionApi = {
  listar: (params) => api.get(BASE, { params }),
  detalle: (id) => api.get(`${BASE}${id}/`),
  prepararVenta: (ventaId) => api.post(`${BASE}preparar-venta/`, { venta_id: ventaId }),
  sincronizarVentas: () => api.post(`${BASE}sincronizar-ventas/`),
  prepararGuia: (guiaRemisionId, tipoComprobanteId) =>
    api.post(`${BASE}preparar-guia/`, { guia_remision_id: guiaRemisionId, tipo_comprobante_id: tipoComprobanteId }),
  buscarOriginalesNotaCredito: (params) => api.get(`${BASE}buscar-originales-nota-credito/`, { params }),
  itemsNotaCredito: (id) => api.get(`${BASE}${id}/items-nota-credito/`),
  emitir: (id, payload = {}) => api.post(`${BASE}${id}/emitir/`, payload),
  reintentar: (id, payload = {}) => api.post(`${BASE}${id}/reintentar/`, payload),
  aplicarImpactoInterno: (id) => api.post(`${BASE}${id}/aplicar-impacto-interno/`),
  generarNota: (id, payload) => api.post(`${BASE}${id}/generar-nota/`, payload),
  generarNotaCredito: (id, payload) => api.post(`${BASE}${id}/generar-nota-credito/`, payload),
  solicitarBaja: (id, motivo) => api.post(`${BASE}${id}/solicitar-baja/`, { motivo }),
  consultarBaja: (id) => api.post(`${BASE}${id}/consultar-baja/`),
};

export default facturacionApi;
