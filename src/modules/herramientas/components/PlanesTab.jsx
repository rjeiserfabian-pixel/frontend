import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, TextField, MenuItem, TablePagination, Tooltip, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Wrench, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { herramientasService, mensajeError } from '../services/herramientasService';
import PlanFormDialog from './PlanFormDialog';
import IniciarMantenimientoDialog from './IniciarMantenimientoDialog';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;
const headSx = { fontWeight: 800, color: C.textMuted };

const VENCIMIENTO = {
  VENCIDO: { label: 'Vencido', color: C.brandLight },
  POR_VENCER: { label: 'Por vencer', color: C.amber },
  AL_DIA: { label: 'Al día', color: C.emerald },
  INACTIVO: { label: 'Inactivo', color: C.textSubtle },
};

const fmtDia = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('es-PE') : '—');
const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString('es-PE', { maximumFractionDigits: 1 }));

function Intervalo({ plan }) {
  const partes = [];
  if (plan.intervalo_dias) partes.push(`${plan.intervalo_dias} d`);
  if (plan.intervalo_horas) partes.push(`${fmtNum(plan.intervalo_horas)} h`);
  return partes.join(' / ') || '—';
}

function Restante({ plan }) {
  const partes = [];
  if (plan.dias_restantes != null) {
    partes.push(plan.dias_restantes < 0 ? `${-plan.dias_restantes} d de atraso` : `${plan.dias_restantes} d`);
  }
  if (plan.horas_restantes != null) {
    const h = Number(plan.horas_restantes);
    partes.push(h < 0 ? `${fmtNum(-h)} h de exceso` : `${fmtNum(h)} h`);
  }
  return partes.join(' · ') || '—';
}

export default function PlanesTab() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('HERRAMIENTAS.MANTENIMIENTOS.CREAR');
  const puedeEditar = tienePermiso('HERRAMIENTAS.MANTENIMIENTOS.EDITAR');
  const puedeEliminar = tienePermiso('HERRAMIENTAS.MANTENIMIENTOS.ELIMINAR');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 400);

  const [formTarget, setFormTarget] = useState({ open: false, plan: null });
  const [iniciarTarget, setIniciarTarget] = useState(null);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: PAGE_SIZE };
    if (busquedaDebounced.trim()) params.search = busquedaDebounced.trim();
    if (vencimiento) params.vencimiento = vencimiento;
    setLoading(true);
    setErrorCarga('');
    herramientasService.getPlanes(params, controller.signal)
      .then((data) => { setItems(data.results || []); setTotal(data.count ?? 0); })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar los planes'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, busquedaDebounced, vencimiento, recarga]);

  const desactivar = async (plan) => {
    const r = await Swal.fire({
      title: '¿Desactivar plan?', text: `${plan.herramienta_codigo} · ${plan.nombre}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, desactivar', cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    try {
      await herramientasService.desactivarPlan(plan.id);
      if (items.length === 1 && page > 0) setPage(page - 1);
      refrescar();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo desactivar el plan'), 'error');
    }
  };

  const columnas = 7;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' }, gap: 2, alignItems: 'center' }}>
          <TextField size="small" label="Buscar (plan o herramienta)" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }} />
          <TextField select size="small" label="Vencimiento" value={vencimiento}
            onChange={(e) => { setVencimiento(e.target.value); setPage(0); }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="VENCIDO">Vencidos</MenuItem>
            <MenuItem value="POR_VENCER">Por vencer</MenuItem>
          </TextField>
          {puedeCrear && (
            <Button variant="contained" startIcon={<Plus size={18} />}
              onClick={() => setFormTarget({ open: true, plan: null })}
              sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
              Nuevo plan
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
                <TableCell sx={headSx}>Plan</TableCell>
                <TableCell sx={headSx}>Cada</TableCell>
                <TableCell sx={headSx}>Próximo</TableCell>
                <TableCell sx={headSx}>Restante</TableCell>
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
                    No hay planes de mantenimiento para mostrar
                  </TableCell>
                </TableRow>
              ) : items.map((p) => {
                const v = VENCIMIENTO[p.vencimiento] || VENCIMIENTO.AL_DIA;
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: C.text }}>{p.herramienta_nombre}</Typography>
                      <Typography variant="caption" sx={{ color: C.textMuted }}>{p.herramienta_codigo} · {fmtNum(p.horas_actuales)} h de uso</Typography>
                    </TableCell>
                    <TableCell>{p.nombre}<br /><Typography variant="caption" sx={{ color: C.textMuted }}>{p.tipo_display}</Typography></TableCell>
                    <TableCell><Intervalo plan={p} /></TableCell>
                    <TableCell>
                      {p.proxima_fecha ? fmtDia(p.proxima_fecha) : ''}
                      {p.proxima_fecha && p.proximas_horas != null ? ' / ' : ''}
                      {p.proximas_horas != null ? `${fmtNum(p.proximas_horas)} h` : ''}
                    </TableCell>
                    <TableCell><Restante plan={p} /></TableCell>
                    <TableCell align="center">
                      <Chip label={v.label} size="small" sx={{
                        bgcolor: alpha(v.color, 0.16), color: v.color, border: `1px solid ${alpha(v.color, 0.4)}`, fontWeight: 700,
                      }} />
                    </TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {puedeCrear && p.activo && (
                        <Tooltip title="Iniciar mantenimiento">
                          <IconButton size="small" onClick={() => setIniciarTarget(p)}
                            sx={{ color: C.amber, mr: 0.75, bgcolor: alpha(C.amber, 0.09), border: `1px solid ${alpha(C.amber, 0.2)}` }}>
                            <Wrench size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {puedeEditar && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => setFormTarget({ open: true, plan: p })}
                            sx={{ color: C.blue, mr: 0.75, bgcolor: alpha(C.blue, 0.09), border: `1px solid ${alpha(C.blue, 0.2)}` }}>
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {puedeEliminar && p.activo && (
                        <Tooltip title="Desactivar">
                          <IconButton size="small" onClick={() => desactivar(p)}
                            sx={{ color: C.brandLight, bgcolor: alpha(C.brand, 0.09), border: `1px solid ${alpha(C.brandLight, 0.2)}` }}>
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" rowsPerPageOptions={[PAGE_SIZE]} count={total}
          rowsPerPage={PAGE_SIZE} page={page} onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
      </Paper>

      <PlanFormDialog open={formTarget.open} plan={formTarget.plan}
        onClose={() => setFormTarget({ open: false, plan: null })}
        onSaved={() => { setFormTarget({ open: false, plan: null }); refrescar(); }} />
      <IniciarMantenimientoDialog open={Boolean(iniciarTarget)} plan={iniciarTarget}
        onClose={() => setIniciarTarget(null)}
        onSaved={() => { setIniciarTarget(null); refrescar(); }} />
    </Box>
  );
}
