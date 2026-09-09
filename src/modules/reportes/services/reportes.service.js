/**
 * reportes.service.js
 * Todas las peticiones al módulo de Reportes del backend.
 * Cada función devuelve la promesa de axios para que el hook la maneje.
 */
import api from '../../../core/api/axios';

/** Construye query string limpio a partir de un objeto, omitiendo nulls y vacíos */
const buildParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );

// ── Filtros auxiliares (selectores) ─────────────────────────────────────────

export const getFiltrosAuxiliares = () =>
  api.get('reportes/filtros/');

// ── Reporte de Caja ──────────────────────────────────────────────────────────

export const getReporteCaja = (params) =>
  api.get('reportes/caja/', { params: buildParams(params) });

export const exportarCaja = (params, formato) => {
  const url = `reportes/caja/`;
  return api.get(url, {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });
};

// ── Reporte de Ventas ────────────────────────────────────────────────────────

export const getReporteVentas = (params) =>
  api.get('reportes/ventas/', { params: buildParams(params) });

export const exportarVentas = (params, formato) =>
  api.get('reportes/ventas/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Reporte de Productos ─────────────────────────────────────────────────────

export const getReporteProductos = (params) =>
  api.get('reportes/productos/', { params: buildParams(params) });

export const exportarProductos = (params, formato) =>
  api.get('reportes/productos/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Reporte de Clientes ──────────────────────────────────────────────────────

export const getReporteClientes = (params) =>
  api.get('reportes/clientes/', { params: buildParams(params) });

export const exportarClientes = (params, formato) =>
  api.get('reportes/clientes/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Reporte de Compras ───────────────────────────────────────────────────────

export const getReporteCompras = (params) =>
  api.get('reportes/compras/', { params: buildParams(params) });

export const exportarCompras = (params, formato) =>
  api.get('reportes/compras/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Reporte Avanzado ─────────────────────────────────────────────────────────

export const getReporteAvanzado = (params) =>
  api.get('reportes/avanzado/', { params: buildParams(params) });

export const exportarAvanzado = (params, formato) =>
  api.get('reportes/avanzado/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Reporte de Vehículos ─────────────────────────────────────────────────────

export const getReporteVehiculos = (params) =>
  api.get('reportes/vehiculos/', { params: buildParams(params) });

export const exportarVehiculos = (params, formato) =>
  api.get('reportes/vehiculos/', {
    params: buildParams({ ...params, formato }),
    responseType: 'blob',
  });

// ── Helper: dispara descarga de blob ────────────────────────────────────────

/**
 * Recibe la respuesta blob de axios y dispara la descarga en el navegador.
 * @param {import('axios').AxiosResponse} response
 * @param {string} filename  p.ej. "Reporte_Ventas.xlsx"
 */
export const descargarBlob = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
