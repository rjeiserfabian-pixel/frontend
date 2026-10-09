import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, TextField, MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { premiumTokens } from '../../../core/theme/theme';
import ExportButtons from '../../reportes/components/ExportButtons';
import { descargarBlob } from '../../reportes/services/reportes.service';
import {
  ESTADOS_OPERATIVOS, herramientasService, mensajeError,
} from '../services/herramientasService';
import FiltroBusqueda from '../components/FiltroBusqueda';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const REPORTES = [
  { id: 'inventario', nombre: 'Inventario de herramientas', filtros: ['sucursal', 'categoria', 'estado'] },
  { id: 'por-responsable', nombre: 'Herramientas por responsable', filtros: ['sucursal'] },
  { id: 'costos-mantenimiento', nombre: 'Costo de mantenimiento por herramienta', filtros: ['sucursal', 'categoria', 'fechas'], costos: true },
  { id: 'mas-fallas', nombre: 'Herramientas con más fallas', filtros: ['sucursal', 'categoria', 'fechas'] },
];

const fmtCelda = (v) => (typeof v === 'number' && !Number.isInteger(v)
  ? v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : v);

export default function ReportesHerramientasPage() {
  const { tienePermiso } = usePermisos();
  const { sucursales } = useSucursal();
  const puedeExportar = tienePermiso('HERRAMIENTAS.REPORTES.EXPORTAR');
  const puedeVerCostos = tienePermiso('HERRAMIENTAS.COSTOS.VER');

  const disponibles = useMemo(
    () => REPORTES.filter((r) => !r.costos || puedeVerCostos),
    [puedeVerCostos]
  );
  const [tipo, setTipo] = useState('inventario');
  const [sucursal, setSucursal] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [categorias, setCategorias] = useState([]);

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consulta, setConsulta] = useState(0);

  const reporte = REPORTES.find((r) => r.id === tipo) || REPORTES[0];
  const fechasInvalidas = Boolean(desde && hasta && desde > hasta);

  const params = useMemo(() => {
    const p = {};
    if (sucursal) p.sucursal = sucursal;
    if (reporte.filtros.includes('categoria') && categoria) p.categoria = categoria;
    if (reporte.filtros.includes('estado') && estado) p.estado_operativo = estado;
    if (reporte.filtros.includes('fechas')) {
      if (desde) p.desde = desde;
      if (hasta) p.hasta = hasta;
    }
    return p;
  }, [reporte, sucursal, categoria, estado, desde, hasta]);

  useEffect(() => {
    const controller = new AbortController();
    herramientasService.getCategorias(undefined, controller.signal)
      .then(setCategorias)
      .catch(() => setCategorias([]));
    return () => controller.abort();
  }, []);

  // Cambiar de reporte limpia el resultado anterior (sus columnas ya no corresponden)
  useEffect(() => { setResultado(null); setError(''); }, [tipo]);

  useEffect(() => {
    if (consulta === 0) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    herramientasService.getReporte(tipo, params, controller.signal)
      .then(setResultado)
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setResultado(null);
        setError(mensajeError(err, 'No se pudo generar el reporte'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // Solo se consulta al pulsar "Generar" (cambia `consulta`); tipo y params se leen en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 750, color: C.text, mb: 3 }}>
        Reportes de Herramientas
      </Typography>

      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <TextField select size="small" label="Reporte" value={tipo} onChange={(e) => setTipo(e.target.value)}
            sx={{ gridColumn: { md: 'span 2' } }}>
            {disponibles.map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
          </TextField>
          <FiltroBusqueda label="Sucursal" value={sucursal} options={sucursales} onChange={(e) => setSucursal(e.target.value)} />
          {reporte.filtros.includes('categoria') && (
            <FiltroBusqueda label="Categoría" value={categoria} options={categorias} onChange={(e) => setCategoria(e.target.value)} />
          )}
          {reporte.filtros.includes('estado') && (
            <TextField select size="small" label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_OPERATIVOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
            </TextField>
          )}
          {reporte.filtros.includes('fechas') && (
            <>
              <TextField size="small" label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} error={fechasInvalidas} />
              <TextField size="small" label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} error={fechasInvalidas}
                helperText={fechasInvalidas ? 'Debe ser posterior a la fecha inicial' : ''} />
            </>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={loading || fechasInvalidas} onClick={() => setConsulta((n) => n + 1)}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
            {loading ? 'Generando...' : 'Generar reporte'}
          </Button>
          {puedeExportar && !fechasInvalidas && (
            <ExportButtons
              filename={reporte.nombre}
              onExport={(formato) => herramientasService.exportarReporte(tipo, params, formato)}
            />
          )}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>
            <Button size="small" onClick={() => setConsulta((n) => n + 1)}>Reintentar</Button>
          </Box>
        ) : !resultado ? (
          <Typography sx={{ textAlign: 'center', py: 5, color: C.textMuted }}>
            Elija un reporte y pulse “Generar reporte”.
          </Typography>
        ) : resultado.rows.length === 0 ? (
          <Typography sx={{ textAlign: 'center', py: 5, color: C.textMuted }}>
            No hay datos para los filtros seleccionados.
          </Typography>
        ) : (
          <>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{resultado.titulo}</Typography>
              {resultado.truncado && (
                <Typography variant="caption" sx={{ color: C.amber }}>
                  Vista previa de {resultado.rows.length} de {resultado.total_filas} filas. La exportación incluye todas.
                </Typography>
              )}
            </Box>
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {resultado.headers.map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 800, color: C.textMuted, bgcolor: alpha(C.surfaceSoft, 0.98) }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultado.rows.map((fila, i) => (
                    <TableRow key={i} hover sx={fila[0] === 'TOTAL' ? { '& td': { fontWeight: 800 } } : undefined}>
                      {fila.map((celda, j) => <TableCell key={j}>{fmtCelda(celda)}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
}
