import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, TextField, MenuItem, TablePagination, Tooltip, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, CheckCircle2, Search } from 'lucide-react';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { herramientasService, mensajeError } from '../services/herramientasService';
import ReportarIncidenciaDialog from '../components/ReportarIncidenciaDialog';
import ResolverIncidenciaDialog from '../components/ResolverIncidenciaDialog';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;
const headSx = { fontWeight: 800, color: C.textMuted };

const fmtFecha = (iso) => (iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function IncidenciasPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('HERRAMIENTAS.INCIDENCIAS.CREAR');
  const puedeResolver = tienePermiso('HERRAMIENTAS.INCIDENCIAS.EDITAR');
  const puedeDarDeBaja = tienePermiso('HERRAMIENTAS.BAJA.APROBAR');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('ABIERTA');
  const [tipo, setTipo] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 400);

  const [reportarOpen, setReportarOpen] = useState(false);
  const [resolverTarget, setResolverTarget] = useState(null);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: PAGE_SIZE };
    if (busquedaDebounced.trim()) params.search = busquedaDebounced.trim();
    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    setLoading(true);
    setErrorCarga('');
    herramientasService.getIncidencias(params, controller.signal)
      .then((data) => { setItems(data.results || []); setTotal(data.count ?? 0); })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar las incidencias'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, busquedaDebounced, estado, tipo, recarga]);

  const cambiar = (setter) => (e) => { setter(e.target.value); setPage(0); };
  const columnas = 7;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 750, color: C.text }}>Incidencias de Herramientas</Typography>
        {puedeCrear && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => setReportarOpen(true)}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
            Reportar incidencia
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField size="small" label="Buscar (herramienta o descripción)" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }} />
          <TextField select size="small" label="Estado" value={estado} onChange={cambiar(setEstado)}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="ABIERTA">Abiertas</MenuItem>
            <MenuItem value="RESUELTA">Resueltas</MenuItem>
          </TextField>
          <TextField select size="small" label="Tipo" value={tipo} onChange={cambiar(setTipo)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="DANO">Daño</MenuItem>
            <MenuItem value="ROBO">Robo</MenuItem>
            <MenuItem value="PERDIDA">Pérdida</MenuItem>
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={headSx}>Herramienta</TableCell>
                <TableCell sx={headSx}>Tipo</TableCell>
                <TableCell sx={headSx}>Descripción</TableCell>
                <TableCell sx={headSx}>Responsable</TableCell>
                <TableCell sx={headSx}>Fecha</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Estado</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={columnas} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : errorCarga ? (
                <TableRow>
                  <TableCell colSpan={columnas} align="center" sx={{ py: 4 }}>
                    <Typography color="error" sx={{ mb: 1 }}>{errorCarga}</Typography>
                    <Button size="small" onClick={refrescar}>Reintentar</Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnas} align="center" sx={{ py: 4, color: C.textMuted }}>
                    No hay incidencias para mostrar
                  </TableCell>
                </TableRow>
              ) : items.map((i) => (
                <TableRow key={i.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: C.text }}>{i.herramienta_nombre}</Typography>
                    <Typography variant="caption" sx={{ color: C.textMuted }}>{i.herramienta_codigo}</Typography>
                  </TableCell>
                  <TableCell>{i.tipo_display}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    {i.descripcion}
                    {i.estado === 'RESUELTA' && (
                      <Typography variant="caption" sx={{ display: 'block', color: C.textMuted }}>
                        {i.decision_display}{i.notas_resolucion ? ` — ${i.notas_resolucion}` : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{i.responsable_nombre || '—'}</TableCell>
                  <TableCell>{fmtFecha(i.fecha)}</TableCell>
                  <TableCell align="center">
                    <Chip label={i.estado_display} size="small" sx={{
                      bgcolor: alpha(i.estado === 'ABIERTA' ? C.amber : C.emerald, 0.16),
                      color: i.estado === 'ABIERTA' ? C.amber : C.emerald,
                      border: `1px solid ${alpha(i.estado === 'ABIERTA' ? C.amber : C.emerald, 0.4)}`, fontWeight: 700,
                    }} />
                  </TableCell>
                  <TableCell align="center">
                    {i.estado === 'ABIERTA' && puedeResolver && (
                      <Tooltip title="Resolver">
                        <IconButton size="small" onClick={() => setResolverTarget(i)}
                          sx={{ color: C.emerald, bgcolor: alpha(C.emerald, 0.09), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                          <CheckCircle2 size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" rowsPerPageOptions={[PAGE_SIZE]} count={total}
          rowsPerPage={PAGE_SIZE} page={page} onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
      </Paper>

      <ReportarIncidenciaDialog open={reportarOpen} onClose={() => setReportarOpen(false)}
        onSaved={() => { setReportarOpen(false); refrescar(); }} />
      <ResolverIncidenciaDialog open={Boolean(resolverTarget)} incidencia={resolverTarget}
        puedeDarDeBaja={puedeDarDeBaja}
        onClose={() => setResolverTarget(null)}
        onSaved={() => { setResolverTarget(null); refrescar(); }} />
    </Box>
  );
}
