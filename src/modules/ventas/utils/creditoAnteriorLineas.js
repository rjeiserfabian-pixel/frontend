export function cambiarTipoLinea(linea, tipo) {
  return {
    ...linea, tipo, repuesto: null, _catalogo: null,
    unidad: tipo === 'SERVICIO' ? 'ZZ' : '',
    ...(linea._catalogo || linea.repuesto ? { codigo_original: '', descripcion: '' } : {}),
  };
}

export function seleccionarRepuestoAnterior(linea, repuesto) {
  if (!repuesto) return { ...linea, repuesto: null, _catalogo: null };
  return {
    ...linea, repuesto: repuesto.id, _catalogo: repuesto,
    codigo_original: repuesto.codigo || '', descripcion: repuesto.nombre,
    unidad: repuesto.unidad_medida_abreviatura || repuesto.unidad_medida_nombre || '',
  };
}

export function seleccionarServicioAnterior(linea, servicio) {
  if (!servicio) return { ...linea, _catalogo: null };
  return {
    ...linea, tipo: 'SERVICIO', repuesto: null, _catalogo: servicio,
    descripcion: servicio.nombre, unidad: 'ZZ',
  };
}

export function detalleAnteriorParaEnviar(linea) {
  const campos = ['tipo', 'repuesto', 'codigo_original', 'descripcion', 'unidad', 'cantidad', 'precio_unitario', 'descuento'];
  return Object.fromEntries(campos.map(campo => [campo, linea[campo]]));
}

export async function listarCatalogoServiciosCompleto(listar) {
  const filas = [];
  let page = 1;
  let respuesta;
  do {
    respuesta = await listar({ page, page_size: 100, activo: 'true' });
    filas.push(...(Array.isArray(respuesta) ? respuesta : respuesta.results || []));
    page += 1;
  } while (!Array.isArray(respuesta) && respuesta.next);
  return filas.filter(s => s.activo !== false);
}

export function agruparServiciosAnteriores(preventivos, correctivos) {
  return [
    ...preventivos.map(s => ({ ...s, clave: `PREVENTIVO:${s.id}`, categoria: 'Preventivos' })),
    ...correctivos.map(s => ({ ...s, clave: `CORRECTIVO:${s.id}`, categoria: 'Correctivos' })),
  ];
}

export function ajusteDocumentoParaEnviar(form) {
  if (!('descuento_global' in form)) return Number(form.ajuste_documento || 0);
  return Number(form.cargo_adicional || 0) - Number(form.descuento_global || 0);
}

export function resumenImportesCreditoAnterior(form) {
  const centimos = valor => Math.round((Number(valor || 0) + Number.EPSILON) * 100);
  const original = centimos(form.importe_original);
  const abonos = centimos(form.abonos_anteriores);
  const saldo = original - abonos;
  const ajuste = ajusteDocumentoParaEnviar(form);
  const detalle = (form.detalles || []).reduce((total, d) => total + centimos(Number(d.cantidad || 0) * Number(d.precio_unitario || 0) - Number(d.descuento || 0)), 0) + centimos(ajuste);
  const cronograma = (form.cronograma || []).map(c => ({ ...c, ...(form.cronograma.length === 1 ? { monto: (saldo / 100).toFixed(2) } : {}) }));
  const totalCuotas = cronograma.reduce((total, c) => total + centimos(c.monto), 0);
  const errores = [];
  if (!Number.isFinite(original) || original <= 0) errores.push('Ingrese un importe original mayor a cero.');
  if (!Number.isFinite(abonos) || abonos < 0 || saldo <= 0) errores.push('Los abonos anteriores deben ser positivos o cero y menores que el importe original.');
  if ('descuento_global' in form && (!Number.isFinite(Number(form.descuento_global || 0)) || Number(form.descuento_global || 0) < 0)) errores.push('El descuento global debe ser un monto positivo o cero; no escriba el signo menos.');
  if ('cargo_adicional' in form && (!Number.isFinite(Number(form.cargo_adicional || 0)) || Number(form.cargo_adicional || 0) < 0)) errores.push('El cargo adicional debe ser positivo o cero.');
  if (!form.sin_detalle && (!Number.isFinite(detalle) || detalle !== original)) errores.push(`El total de servicios y repuestos, después del descuento global${Number(form.cargo_adicional) > 0 ? ' y el cargo adicional' : ''}, es S/ ${(detalle / 100).toFixed(2)}, pero el total original de la deuda es S/ ${(original / 100).toFixed(2)}. Corrija los datos según su documento.`);
  if (centimos(ajuste) !== 0 && !form.motivo_ajuste?.trim()) errores.push(Number(form.cargo_adicional) > 0 ? 'Indique el motivo del cargo o descuento.' : 'Indique el motivo del descuento global.');
  if (!cronograma.length || cronograma.some(c => !Number.isFinite(centimos(c.monto)) || centimos(c.monto) <= 0)) errores.push('Todas las cuotas deben tener un importe mayor a cero.');
  if (totalCuotas !== saldo) errores.push(`Las cuotas suman S/ ${(totalCuotas / 100).toFixed(2)} y deben sumar exactamente el saldo pendiente: S/ ${(saldo / 100).toFixed(2)}.`);
  return { saldo: saldo / 100, detalleTotal: detalle / 100, cronograma, totalCuotas: totalCuotas / 100, errores };
}
