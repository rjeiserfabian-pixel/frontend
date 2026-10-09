import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, TextField, MenuItem, TablePagination, Tooltip,
  Chip, FormControlLabel, Switch,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Undo2, Ban, Search } from 'lucide-react';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { herramientasService, mensajeError } from '../services/herramientasService';
import EntregarDialog from '../components/EntregarDialog';
import DevolverDialog from '../components/DevolverDialog';
import AnularAsignacionDialog from '../components/AnularAsignacionDialog';
import FiltroBusqueda from '../components/FiltroBusqueda';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;
const headSx = { fontWeight: 800, color: C.textMuted };

const COLOR_ESTADO = { ACTIVA: C.blue, DEVUELTA: C.emerald, ANULADA: C.textSubtle, NO_DEVUELTA: C.brandLight };

const fmtFecha = (iso) => (iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const fmtDia = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('es-PE') : '—');

export default function AsignacionesPage() {
  const { tienePermiso } = usePermisos();
  const puedeEntregar = tienePermiso('HERRAMIENTAS.ASIGNACIONES.CREAR');
  const puedeDevolver = tienePermiso('HERRAMIENTAS.ASIGNACIONES.EDITAR');
  const puedeAnular = tienePermiso('HERRAMIENTAS.ASIGNACIONES.ELIMINAR');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [tecnicos, setTecnicos] = useState([]);

  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVA');
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [soloVencidas, setSoloVencidas] = useState(false);
  const busquedaDebounced = useDebouncedValue(busqueda, 400);

  const [entregarOpen, setEntregarOpen] = useState(false);
  const [devolverTarget, setDevolverTarget] = useState(null);
  const [anularTarget, setAnularTarget] = useState(null);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  // Técnicos para el filtro (solo quien puede entregar tiene acceso a esa lista)
  useEffect(() => {
    if (!puedeEntregar) return undefined;
    const controller = new AbortController();
    herramientasService.getTecnicos(controller.signal)
      .then(setTecnicos)
      .catch(() => setTecnicos([]));
    return () => controller.abort();
  }, [puedeEntregar]);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: PAGE_SIZE };
    if (busquedaDebounced.trim()) params.search = busquedaDebounced.trim();
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroTecnico) params.tecnico = filtroTecnico;
    if (soloVencidas) params.vencidas = 1;

    setLoading(true);
    setErrorCarga('');
    herramientasService.getAsignaciones(params, controller.signal)
      .then((data) => {
        setItems(data.results || []);
        setTotal(data.count ?? 0);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar las asignaciones'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, busquedaDebounced, filtroEstado, filtroTecnico, soloVencidas, recarga]);

  const cambiarFiltro = (setter) => (e) => { setter(e.target.value); setPage(0); };
  const columnas = 8;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 750, color: C.text }}>
          Asignaciones de Herramientas
        </Typography>
        {puedeEntregar && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => setEntregarOpen(true)}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
            Entregar herramienta
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr auto' }, gap: 2, alignItems: 'center' }}>
          <TextField
            size="small" label="Buscar (herramienta o técnico)" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }}
          />
          <TextField select size="small" label="Estado" value={filtroEstado}
            onChange={cambiarFiltro(setFiltroEstado)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ACTIVA">Activas</MenuItem>
            <MenuItem value="DEVUELTA">Devueltas</MenuItem>
            <MenuItem value="ANULADA">Anuladas</MenuItem>
            <MenuItem value="NO_DEVUELTA">No devueltas (robo o pérdida)</MenuItem>
          </TextField>
          {puedeEntregar ? (
            <FiltroBusqueda label="Técnico" value={filtroTecnico} options={tecnicos}
              onChange={cambiarFiltro(setFiltroTecnico)} />
          ) : <span />}
          <FormControlLabel
            control={<Switch checked={soloVencidas} onChange={(e) => { setSoloVencidas(e.target.checked); setPage(0); }} />}
            label="Solo vencidas"
          />
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={headSx}>Herramienta</TableCell>
                <TableCell sx={headSx}>Técnico</TableCell>
                <TableCell sx={headSx}>Entrega</TableCell>
                <TableCell sx={headSx}>Devolución esperada</TableCell>
                <TableCell sx={headSx}>Devuelta</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'right' }}>Horas</TableCell>
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
                    No hay asignaciones para mostrar
                  </TableCell>
                </TableRow>
              ) : items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: C.text }}>{a.herramienta_nombre}</Typography>
                    <Typography variant="caption" sx={{ color: C.textMuted }}>{a.herramienta_codigo} · {a.sucursal_nombre}</Typography>
                  </TableCell>
                  <TableCell>{a.tecnico_nombre}</TableCell>
                  <TableCell>{fmtFecha(a.fecha_entrega)}</TableCell>
                  <TableCell sx={{ color: a.vencida ? C.brandLight : 'inherit', fontWeight: a.vencida ? 800 : 400 }}>
                    {fmtDia(a.fecha_devolucion_esperada)}{a.vencida ? ' · vencida' : ''}
                  </TableCell>
                  <TableCell>{fmtFecha(a.fecha_devolucion_real)}</TableCell>
                  <TableCell align="right">{a.estado === 'DEVUELTA' ? a.horas_uso_periodo : '—'}</TableCell>
                  <TableCell align="center">
                    <Chip label={a.estado_display} size="small" sx={{
                      bgcolor: alpha(COLOR_ESTADO[a.estado] || C.textMuted, 0.16),
                      color: COLOR_ESTADO[a.estado] || C.textMuted,
                      border: `1px solid ${alpha(COLOR_ESTADO[a.estado] || C.textMuted, 0.4)}`,
                      fontWeight: 700,
                    }} />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {a.estado === 'ACTIVA' && puedeDevolver && (
                      <Tooltip title="Registrar devolución">
                        <IconButton size="small" onClick={() => setDevolverTarget(a)}
                          sx={{ color: C.emerald, mr: 0.75, bgcolor: alpha(C.emerald, 0.09), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                          <Undo2 size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {a.estado === 'ACTIVA' && puedeAnular && (
                      <Tooltip title="Anular asignación">
                        <IconButton size="small" onClick={() => setAnularTarget(a)}
                          sx={{ color: C.brandLight, bgcolor: alpha(C.brand, 0.09), border: `1px solid ${alpha(C.brandLight, 0.2)}` }}>
                          <Ban size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" rowsPerPageOptions={[PAGE_SIZE]} count={total}
          rowsPerPage={PAGE_SIZE} page={page}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <EntregarDialog open={entregarOpen} onClose={() => setEntregarOpen(false)}
        onSaved={() => { setEntregarOpen(false); refrescar(); }} />
      <DevolverDialog open={Boolean(devolverTarget)} asignacion={devolverTarget}
        onClose={() => setDevolverTarget(null)}
        onSaved={() => { setDevolverTarget(null); refrescar(); }} />
      <AnularAsignacionDialog open={Boolean(anularTarget)} asignacion={anularTarget}
        onClose={() => setAnularTarget(null)}
        onSaved={() => { setAnularTarget(null); refrescar(); }} />
    </Box>
  );
}
