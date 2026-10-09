import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, TextField, MenuItem, TablePagination, Tooltip, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, CheckCircle2, XCircle, Search } from 'lucide-react';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { herramientasService, mensajeError } from '../services/herramientasService';
import IniciarMantenimientoDialog from './IniciarMantenimientoDialog';
import FinalizarMantenimientoDialog from './FinalizarMantenimientoDialog';
import MotivoDialog from './MotivoDialog';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;
const headSx = { fontWeight: 800, color: C.textMuted };
const COLOR_ESTADO = { EN_CURSO: C.amber, FINALIZADO: C.emerald, CANCELADO: C.textSubtle };

const fmtFecha = (iso) => (iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function RegistrosTab() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('HERRAMIENTAS.MANTENIMIENTOS.CREAR');
  const puedeEditar = tienePermiso('HERRAMIENTAS.MANTENIMIENTOS.EDITAR');
  const puedeVerCostos = tienePermiso('HERRAMIENTAS.COSTOS.VER');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('EN_CURSO');
  const [tipo, setTipo] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 400);

  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [finalizarTarget, setFinalizarTarget] = useState(null);
  const [cancelarTarget, setCancelarTarget] = useState(null);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: PAGE_SIZE };
    if (busquedaDebounced.trim()) params.search = busquedaDebounced.trim();
    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    setLoading(true);
    setErrorCarga('');
    herramientasService.getMantenimientos(params, controller.signal)
      .then((data) => { setItems(data.results || []); setTotal(data.count ?? 0); })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar los mantenimientos'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, busquedaDebounced, estado, tipo, recarga]);

  const columnas = puedeVerCostos ? 8 : 7;
  const cambiar = (setter) => (e) => { setter(e.target.value); setPage(0); };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr auto' }, gap: 2, alignItems: 'center' }}>
          <TextField size="small" label="Buscar (herramienta o trabajo)" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }} />
          <TextField select size="small" label="Estado" value={estado} onChange={cambiar(setEstado)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="EN_CURSO">En curso</MenuItem>
            <MenuItem value="FINALIZADO">Finalizados</MenuItem>
            <MenuItem value="CANCELADO">Cancelados</MenuItem>
          </TextField>
          <TextField select size="small" label="Tipo" value={tipo} onChange={cambiar(setTipo)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PREVENTIVO">Preventivo</MenuItem>
            <MenuItem value="CORRECTIVO">Correctivo</MenuItem>
          </TextField>
          {puedeCrear && (
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setIniciarOpen(true)}
              sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
              Iniciar mantenimiento
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={headSx}>Herramienta</TableCell>
                <TableCell sx={headSx}>Tipo</TableCell>
                <TableCell sx={headSx}>Trabajo</TableCell>
                <TableCell sx={headSx}>Inicio</TableCell>
                <TableCell sx={headSx}>Fin</TableCell>
                {puedeVerCostos && <TableCell sx={{ ...headSx, textAlign: 'right' }}>Costo</TableCell>}
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
                    No hay mantenimientos para mostrar
                  </TableCell>
                </TableRow>
              ) : items.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: C.text }}>{r.herramienta_nombre}</Typography>
                    <Typography variant="caption" sx={{ color: C.textMuted }}>{r.herramienta_codigo}</Typography>
                  </TableCell>
                  <TableCell>{r.tipo_display}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    {r.descripcion}
                    {r.resultado && <Typography variant="caption" sx={{ display: 'block', color: C.textMuted }}>Resultado: {r.resultado}</Typography>}
                    {r.motivo_cancelacion && <Typography variant="caption" sx={{ display: 'block', color: C.textMuted }}>Cancelado: {r.motivo_cancelacion}</Typography>}
                  </TableCell>
                  <TableCell>{fmtFecha(r.fecha_inicio)}</TableCell>
                  <TableCell>{fmtFecha(r.fecha_fin)}</TableCell>
                  {puedeVerCostos && (
                    <TableCell align="right">{r.costo != null ? `S/ ${Number(r.costo).toFixed(2)}` : '—'}</TableCell>
                  )}
                  <TableCell align="center">
                    <Chip label={r.estado_display} size="small" sx={{
                      bgcolor: alpha(COLOR_ESTADO[r.estado] || C.textMuted, 0.16),
                      color: COLOR_ESTADO[r.estado] || C.textMuted,
                      border: `1px solid ${alpha(COLOR_ESTADO[r.estado] || C.textMuted, 0.4)}`, fontWeight: 700,
                    }} />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {r.estado === 'EN_CURSO' && puedeEditar && (
                      <>
                        <Tooltip title="Finalizar">
                          <IconButton size="small" onClick={() => setFinalizarTarget(r)}
                            sx={{ color: C.emerald, mr: 0.75, bgcolor: alpha(C.emerald, 0.09), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                            <CheckCircle2 size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton size="small" onClick={() => setCancelarTarget(r)}
                            sx={{ color: C.brandLight, bgcolor: alpha(C.brand, 0.09), border: `1px solid ${alpha(C.brandLight, 0.2)}` }}>
                            <XCircle size={18} />
                          </IconButton>
                        </Tooltip>
                      </>
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

      <IniciarMantenimientoDialog open={iniciarOpen} plan={null}
        onClose={() => setIniciarOpen(false)}
        onSaved={() => { setIniciarOpen(false); refrescar(); }} />
      <FinalizarMantenimientoDialog open={Boolean(finalizarTarget)} registro={finalizarTarget}
        puedeVerCostos={puedeVerCostos}
        onClose={() => setFinalizarTarget(null)}
        onSaved={() => { setFinalizarTarget(null); refrescar(); }} />
      <MotivoDialog open={Boolean(cancelarTarget)}
        titulo={`Cancelar mantenimiento — ${cancelarTarget?.herramienta_codigo ?? ''}`}
        descripcion="Úsalo si el mantenimiento se registró por error. La herramienta volverá a estar disponible."
        confirmarLabel="Cancelar mantenimiento"
        exito="El mantenimiento fue cancelado."
        onConfirm={(motivo) => herramientasService.cancelarMantenimiento(cancelarTarget.id, { motivo })}
        onClose={() => setCancelarTarget(null)}
        onSaved={() => { setCancelarTarget(null); refrescar(); }} />
    </Box>
  );
}
