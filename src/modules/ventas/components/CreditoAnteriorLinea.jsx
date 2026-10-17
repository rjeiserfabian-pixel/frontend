import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Button, MenuItem, TextField } from '@mui/material';
import { inventarioService } from '../../inventario/services/inventarioService';
import { cambiarTipoLinea, seleccionarRepuestoAnterior, seleccionarServicioAnterior } from '../utils/creditoAnteriorLineas';

export default function CreditoAnteriorLinea({ linea, servicios, cargandoServicios, errorServicios, onChange, onRemove }) {
  const [busqueda, setBusqueda] = useState('');
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const esServicio = linea.tipo === 'SERVICIO';

  useEffect(() => {
    if (esServicio || busqueda.trim().length < 2) { setRepuestos([]); setCargando(false); return; }
    let activo = true;
    const timer = setTimeout(async () => {
      setCargando(true); setError('');
      try {
        const r = await inventarioService.getRepuestos({ search: busqueda, page_size: 20 });
        if (activo) setRepuestos(r.results || r);
      } catch { if (activo) { setRepuestos([]); setError('No se pudo consultar el catálogo. Puede ingresar los datos originales manualmente.'); } }
      finally { if (activo) setCargando(false); }
    }, 300);
    return () => { activo = false; clearTimeout(timer); };
  }, [busqueda, esServicio]);

  const seleccion = linea._catalogo || null;
  const opciones = esServicio ? servicios : seleccion && !repuestos.some(r => r.id === seleccion.id) ? [seleccion, ...repuestos] : repuestos;
  return <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
    <Autocomplete sx={{ mb: 1 }} size="small" options={opciones} value={seleccion}
      loading={esServicio ? cargandoServicios : cargando} loadingText="Cargando catálogo…"
      {...(esServicio ? { groupBy: s => s.categoria } : { filterOptions: x => x })}
      getOptionLabel={r => esServicio ? r.nombre : `${r.codigo} · ${r.nombre}`}
      isOptionEqualToValue={(a, b) => esServicio ? a.clave === b.clave : a.id === b.id}
      onInputChange={(_, v, reason) => { if (!esServicio && (reason === 'input' || reason === 'clear')) setBusqueda(v); }}
      onChange={(_, r) => onChange(esServicio ? seleccionarServicioAnterior(linea, r) : seleccionarRepuestoAnterior(linea, r))}
      noOptionsText={esServicio ? 'No hay coincidencias. Puede escribir el servicio anterior abajo.' : busqueda.trim().length < 2 ? 'Escriba al menos 2 letras o números.' : 'Sin coincidencias. Puede escribir el repuesto anterior abajo.'}
      renderOption={(props, r) => { const { key: _key, ...resto } = props; return <li key={esServicio ? r.clave : r.id} {...resto}>{esServicio ? r.nombre : `${r.codigo} · ${r.nombre}`}</li>; }}
      renderInput={params => <TextField {...params} label={esServicio ? 'Seleccionar servicio preventivo o correctivo (opcional)' : 'Seleccionar repuesto del catálogo (opcional)'}
        error={Boolean(esServicio ? errorServicios : error)} helperText={esServicio ? errorServicios || 'Completa el nombre y la unidad ZZ. Ingrese el precio al que se realizó el servicio anterior.' : error || (seleccion && !linea.unidad ? 'Este repuesto no tiene unidad registrada en el catálogo; ingrese la unidad del documento original.' : 'Completa el nombre, código y unidad del repuesto. El precio histórico se mantiene editable.')} />} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
      <TextField select size="small" label="Tipo" value={linea.tipo} onChange={e => onChange(cambiarTipoLinea(linea, e.target.value))}><MenuItem value="REPUESTO">Repuesto</MenuItem><MenuItem value="SERVICIO">Servicio</MenuItem></TextField>
      {['codigo_original', 'descripcion', 'unidad', 'cantidad', 'precio_unitario', 'descuento'].map((campo, n) => <TextField key={campo} size="small" type={n >= 3 ? 'number' : 'text'}
        label={['Código anterior (opcional)', 'Nombre / descripción original', esServicio ? 'Unidad del servicio (ZZ)' : 'Unidad de medida', 'Cantidad', 'Precio unitario final (S/)', 'Descuento de esta fila (S/)'][n]}
        value={linea[campo] ?? ''} onChange={e => onChange({ ...linea, [campo]: e.target.value })}
        helperText={campo === 'descuento' ? 'Dejar en 0 si no hubo descuento.' : undefined} />)}
      <Button color="error" onClick={onRemove}>Quitar línea</Button>
    </Box>
  </Box>;
}
