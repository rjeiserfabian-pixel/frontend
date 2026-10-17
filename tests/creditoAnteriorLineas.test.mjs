import test from 'node:test';
import assert from 'node:assert/strict';
import { agruparServiciosAnteriores, cambiarTipoLinea, detalleAnteriorParaEnviar, listarCatalogoServiciosCompleto, seleccionarRepuestoAnterior, seleccionarServicioAnterior, resumenImportesCreditoAnterior } from '../src/modules/ventas/utils/creditoAnteriorLineas.js';

const linea = { tipo: 'REPUESTO', repuesto: null, codigo_original: '', descripcion: '', unidad: '', cantidad: '2', precio_unitario: '75.00', descuento: '5.00' };

test('Repuesto: copia unidad del catálogo y conserva importes del documento anterior', () => {
  const resultado = seleccionarRepuestoAnterior(linea, { id: 1, codigo: 'ACE-1', nombre: 'Aceite', unidad_medida_abreviatura: 'LTR', unidad_medida_nombre: 'Litro', precio_lista: '150.00' });
  assert.equal(resultado.unidad, 'LTR');
  assert.equal(resultado.precio_unitario, '75.00');
  assert.equal(resultado.cantidad, '2');
  assert.equal(resultado.descuento, '5.00');
  assert.equal(resultado.repuesto, 1);
});

test('Repuesto sin abreviatura usa nombre; sin unidad no arrastra la del artículo previo', () => {
  assert.equal(seleccionarRepuestoAnterior(linea, { id: 1, nombre: 'Filtro', unidad_medida_nombre: 'Unidad' }).unidad, 'Unidad');
  assert.equal(seleccionarRepuestoAnterior({ ...linea, unidad: 'LTR' }, { id: 2, nombre: 'Sin unidad' }).unidad, '');
});

test('Servicio preventivo/correctivo: completa nombre y ZZ sin aplicar el precio base actual', () => {
  for (const categoria of ['Preventivos', 'Correctivos']) {
    const resultado = seleccionarServicioAnterior(cambiarTipoLinea(linea, 'SERVICIO'), { id: 1, nombre: 'Cambio de aceite', categoria, precio_base: '200.00' });
    assert.equal(resultado.descripcion, 'Cambio de aceite');
    assert.equal(resultado.unidad, 'ZZ');
    assert.equal(resultado.precio_unitario, '75.00');
    assert.equal(resultado.descuento, '5.00');
    assert.equal(resultado.repuesto, null);
  }
});

test('Cambiar de tipo elimina vínculos y unidades del tipo anterior', () => {
  const producto = seleccionarRepuestoAnterior(linea, { id: 1, nombre: 'Filtro', codigo: 'FIL', unidad_medida_abreviatura: 'UND' });
  const servicio = cambiarTipoLinea(producto, 'SERVICIO');
  assert.equal(servicio.repuesto, null);
  assert.equal(servicio.descripcion, '');
  assert.equal(servicio.unidad, 'ZZ');
  assert.equal(cambiarTipoLinea(servicio, 'REPUESTO').unidad, '');
});

test('Desvincular catálogo conserva los datos históricos escritos', () => {
  const seleccionado = seleccionarRepuestoAnterior(linea, { id: 1, nombre: 'Filtro', codigo: 'FIL', unidad_medida_abreviatura: 'UND' });
  const manual = seleccionarRepuestoAnterior(seleccionado, null);
  assert.equal(manual.repuesto, null);
  assert.equal(manual.descripcion, 'Filtro');
  assert.equal(manual.unidad, 'UND');
});

test('La API recibe solo el detalle histórico, sin objetos ni precios actuales del catálogo', () => {
  const seleccionado = seleccionarRepuestoAnterior({ ...linea, _filaId: 'local' }, { id: 1, nombre: 'Filtro', codigo: 'FIL', unidad_medida_abreviatura: 'UND', precio_lista: 300 });
  const payload = detalleAnteriorParaEnviar(seleccionado);
  assert.equal(payload.unidad, 'UND');
  assert.equal(payload.precio_unitario, '75.00');
  assert.equal('_catalogo' in payload, false);
  assert.equal('_filaId' in payload, false);
});

test('El catálogo de servicios recorre todas las páginas y omite inactivos', async () => {
  const paginas = [];
  const resultado = await listarCatalogoServiciosCompleto(async ({ page }) => {
    paginas.push(page);
    return page === 1 ? { results: [{ id: 1, activo: true }], next: '?page=2' } : { results: [{ id: 2, activo: true }, { id: 3, activo: false }], next: null };
  });
  assert.deepEqual(paginas, [1, 2]);
  assert.deepEqual(resultado.map(r => r.id), [1, 2]);
  assert.deepEqual(await listarCatalogoServiciosCompleto(async () => [{ id: 7, activo: true }]), [{ id: 7, activo: true }]);
});

test('Un mismo ID en preventivos y correctivos identifica servicios distintos', () => {
  const opciones = agruparServiciosAnteriores([{ id: 1, nombre: 'Cambio de aceite' }], [{ id: 1, nombre: 'Reparar motor' }]);
  assert.deepEqual(opciones.map(o => o.categoria), ['Preventivos', 'Correctivos']);
  assert.notEqual(opciones[0].clave, opciones[1].clave);
});

const formulario = (extra = {}) => ({ importe_original: '250', abonos_anteriores: '20', ajuste_documento: '0', motivo_ajuste: '', sin_detalle: false, detalles: [{ cantidad: '1', precio_unitario: '250', descuento: '0' }], cronograma: [{ monto: '200', fecha_vencimiento: '2026-10-19' }], ...extra });

test('La cuota única refleja exactamente original menos abonos aunque hubiera un monto manual', () => {
  const resumen = resumenImportesCreditoAnterior(formulario());
  assert.equal(resumen.saldo, 230);
  assert.equal(resumen.cronograma[0].monto, '230.00');
  assert.deepEqual(resumen.errores, []);
});

test('Detalle 250 y original 150 señalan diferencia aunque la cuota única sea 130', () => {
  const resumen = resumenImportesCreditoAnterior(formulario({ importe_original: '150' }));
  assert.equal(resumen.cronograma[0].monto, '130.00');
  assert.ok(resumen.errores.some(e => e.includes('250.00') && e.includes('150.00')));
});

test('Modificar abonos recalcula la cuota; sin abonos se conserva el importe completo', () => {
  assert.equal(resumenImportesCreditoAnterior(formulario({ abonos_anteriores: '' })).cronograma[0].monto, '250.00');
  assert.equal(resumenImportesCreditoAnterior(formulario({ abonos_anteriores: '50' })).cronograma[0].monto, '200.00');
});

test('Varias cuotas no pueden sumar más ni menos del saldo pendiente', () => {
  for (const monto of ['20', '200']) {
    const resumen = resumenImportesCreditoAnterior(formulario({ cronograma: [{ monto: '100' }, { monto }] }));
    assert.ok(resumen.errores.some(e => e.includes('deben sumar exactamente')));
  }
  assert.deepEqual(resumenImportesCreditoAnterior(formulario({ cronograma: [{ monto: '100' }, { monto: '130' }] })).errores, []);
});

test('Quitar cuotas hasta dejar una vuelve a asignar todo el saldo sin conservar el importe parcial', () => {
  assert.equal(resumenImportesCreditoAnterior(formulario({ cronograma: [{ monto: '50' }] })).cronograma[0].monto, '230.00');
});

test('Comparación por céntimos evita errores de coma flotante al distribuir cuotas', () => {
  const resumen = resumenImportesCreditoAnterior(formulario({ importe_original: '0.30', abonos_anteriores: '0', detalles: [{ cantidad: '3', precio_unitario: '0.10', descuento: '0' }], cronograma: [{ monto: '0.10' }, { monto: '0.20' }] }));
  assert.deepEqual(resumen.errores, []);
});

test('Un ajuste debe conciliar con el original y tener explicación; no sustituye abonos', () => {
  const resumen = resumenImportesCreditoAnterior(formulario({ importe_original: '240', ajuste_documento: '-10', motivo_ajuste: 'Descuento global del documento' }));
  assert.equal(resumen.saldo, 220);
  assert.deepEqual(resumen.errores, []);
  assert.ok(resumenImportesCreditoAnterior(formulario({ ajuste_documento: '-10' })).errores.some(e => e.includes('motivo')));
});

test('No permite incorporar saldo cero/negativo ni abonos negativos', () => {
  for (const abonos of ['250', '300', '-20']) {
    assert.ok(resumenImportesCreditoAnterior(formulario({ abonos_anteriores: abonos })).errores.some(e => e.includes('abonos anteriores')));
  }
});
