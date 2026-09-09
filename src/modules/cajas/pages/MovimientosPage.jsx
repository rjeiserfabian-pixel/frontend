import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Divider, IconButton, Tooltip,
  TextField, MenuItem, Grid, TablePagination, Stack
} from '@mui/material';
import { ArrowLeft, RefreshCw, Plus, Check, X } from 'lucide-react';
import { getDetalleSesion, aprobarMovimiento, rechazarMovimiento } from '../services/cajas.service';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

const fmtDate = (d) => d ? new Date(d).toLocaleString('es-PE') : '—';

const TipoBadge = ({ tipo }) => (
  <Chip
    label={tipo === 'INGRESO' ? '▲ Ingreso' : '▼ Egreso'}
    size="small"
    color={tipo === 'INGRESO' ? 'success' : 'error'}
    variant="outlined"
    sx={{ fontWeight: 600 }}
  />
);

const EstadoBadge = ({ estado }) => {
  const cfg = {
    APROBADO:  { label: 'Aprobado',  color: 'success' },
    PENDIENTE: { label: 'Pendiente', color: 'warning' },
    RECHAZADO: { label: 'Rechazado', color: 'error'   },
  };
  const { label, color } = cfg[estado] ?? { label: estado, color: 'default' };
  return <Chip label={label} size="small" color={color} />;
};

export default function MovimientosPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  // Resumen de sesión (KPIs)
  const [resumen, setResumen]         = useState(null);
  // Movimientos paginados
  const [movimientos, setMovimientos] = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(0);         // 0-indexed (MUI)
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [loading, setLoading]       = useState(true);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const [error, setError]           = useState(null);

  // Filtros
  const [filtroTipo,   setFiltroTipo]   = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');

  // ── Cargar resumen de sesión ─────────────────────────────
  const cargarResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDetalleSesion(id);
      setResumen(res.data);
      const movsData = res.data.movimientos;
      setMovimientos(movsData?.results ?? []);
      setTotal(movsData?.count ?? 0);
    } catch {
      setError('No se pudo cargar el detalle de la sesión.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Cargar página de movimientos ─────────────────────────
  const cargarMovimientos = useCallback(async (pg, rows, tipo, origen) => {
    setLoadingMovs(true);
    try {
      const params = { page: pg + 1, page_size: rows };
      if (tipo)   params.tipo   = tipo;
      if (origen) params.origen_movimiento = origen;
      const res = await api.get(`cajas/sesiones/${id}/detalle/`, { params });
      setMovimientos(res.data.movimientos?.results ?? []);
      setTotal(res.data.movimientos?.count ?? 0);
    } catch {
      setError('Error al cargar la página de movimientos.');
    } finally {
      setLoadingMovs(false);
    }
  }, [id]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  // Recargar cuando cambian filtros o página
  useEffect(() => {
    if (!loading) {
      cargarMovimientos(page, rowsPerPage, filtroTipo, filtroOrigen);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filtroTipo, filtroOrigen]);

  const handleFiltroTipo = (v) => { setFiltroTipo(v);   setPage(0); };
  const handleFiltroOrigen = (v) => { setFiltroOrigen(v); setPage(0); };
  const handleRefresh = () => { cargarResumen(); setPage(0); };

  const handleAprobar = async (movId) => {
    if (!window.confirm('¿Está seguro de aprobar este movimiento?')) return;
    try {
      setLoadingMovs(true);
      await aprobarMovimiento(movId);
      Swal.fire({ icon: 'success', title: 'Movimiento aprobado', timer: 1500, showConfirmButton: false });
      cargarResumen();
      cargarMovimientos(page, rowsPerPage, filtroTipo, filtroOrigen);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al aprobar', text: err.response?.data?.error });
      setLoadingMovs(false);
    }
  };

  const handleRechazar = async (movId) => {
    const motivo = window.prompt('Ingrese el motivo de rechazo:');
    if (!motivo) return; // Si cancela o deja vacío, no hacemos nada
    try {
      setLoadingMovs(true);
      await rechazarMovimiento(movId, motivo);
      Swal.fire({ icon: 'success', title: 'Movimiento rechazado', timer: 1500, showConfirmButton: false });
      cargarResumen();
      cargarMovimientos(page, rowsPerPage, filtroTipo, filtroOrigen);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al rechazar', text: err.response?.data?.error });
      setLoadingMovs(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (error && !resumen) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ py: 2 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/cajas')}>
            Dashboard
          </Button>
          <Typography variant="h6" fontWeight={700}>
            Movimientos — {resumen?.sesion?.caja_nombre}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Actualizar">
            <span>
              <IconButton onClick={handleRefresh} disabled={loading || loadingMovs}>
                <RefreshCw size={18} />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained" size="small" startIcon={<Plus size={16} />}
            onClick={() => navigate(`/cajas/movimiento/nuevo?sesion=${id}`)}
          >
            Registrar
          </Button>
          <Button
            variant="outlined" color="error" size="small"
            onClick={() => navigate(`/cajas/cierre/${id}`)}
          >
            Cerrar Caja
          </Button>
        </Stack>
      </Box>

      {/* KPIs */}
      <Box sx={{ marginBottom: '24px' }}>
      <Grid container spacing={3}>
        {[
          { label: 'Saldo Inicial', value: fmtMoney(resumen?.saldo_inicial), color: '#64748b', bg: '#f1f5f9' },
          { label: 'Ingresos',      value: fmtMoney(resumen?.ingresos),      color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Egresos',       value: fmtMoney(resumen?.egresos),       color: '#dc2626', bg: '#fef2f2' },
          { label: 'Saldo Actual',  value: fmtMoney(resumen?.saldo_actual),  color: '#2563eb', bg: '#eff6ff' },
        ].map(k => (
          <Grid item xs={12} sm={6} md={3} key={k.label}>
            <Card elevation={0} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'box-shadow .2s',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
            }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'inline-block', bgcolor: k.bg, borderRadius: 1.5, px: 1, py: 0.25, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: k.color, fontWeight: 600 }}>{k.label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ color: k.color }} lineHeight={1}>
                  {k.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Stack direction="row" spacing={2} sx={{ marginBottom: '20px' }} alignItems="center">
        <TextField
          select label="Tipo" value={filtroTipo}
          onChange={e => handleFiltroTipo(e.target.value)}
          size="small"
          sx={{
            minWidth: 130,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              height: '36px',
              backgroundColor: '#fff',
              '& fieldset': { borderColor: '#d1d5db' },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
            },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
            '& .MuiSelect-select': { fontSize: '0.85rem', paddingTop: '8px', paddingBottom: '8px' },
          }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="INGRESO">Ingreso</MenuItem>
          <MenuItem value="EGRESO">Egreso</MenuItem>
        </TextField>
        <TextField
          select label="Origen" value={filtroOrigen}
          onChange={e => handleFiltroOrigen(e.target.value)}
          size="small"
          sx={{
            minWidth: 165,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              height: '36px',
              backgroundColor: '#fff',
              '& fieldset': { borderColor: '#d1d5db' },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
            },
            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
            '& .MuiSelect-select': { fontSize: '0.85rem', paddingTop: '8px', paddingBottom: '8px' },
          }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="VENTA">Venta</MenuItem>
          <MenuItem value="COBRO">Cobro de Cuota</MenuItem>
          <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
          <MenuItem value="AJUSTE_MANUAL">Manual</MenuItem>
        </TextField>
        <Typography variant="caption" color="text.secondary" ml="auto">
          {total} movimiento{total !== 1 ? 's' : ''} en total
        </Typography>
      </Stack>

      {/* Tabla con paginación */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fecha / Hora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Concepto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Referencia</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingMovs ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : movimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay movimientos registrados
                  </TableCell>
                </TableRow>
              ) : movimientos.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDate(m.fecha)}</TableCell>
                  <TableCell><TipoBadge tipo={m.tipo} /></TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{m.concepto_display}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{m.origen_display}</Typography>
                    {m.referencia_origen && (
                      <Typography variant="caption" display="block" color="primary.main">{m.referencia_origen}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{m.metodo_pago_nombre}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{m.referencia ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2" fontWeight={600}
                      color={m.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                    >
                      {m.tipo === 'INGRESO' ? '+' : '-'}{fmtMoney(m.monto)}
                    </Typography>
                  </TableCell>
                  <TableCell><EstadoBadge estado={m.estado_movimiento} /></TableCell>
                  <TableCell align="center">
                    {m.estado_movimiento === 'PENDIENTE' && (
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Aprobar">
                          <IconButton size="small" color="success" onClick={() => handleAprobar(m.id)}>
                            <Check size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rechazar">
                          <IconButton size="small" color="error" onClick={() => handleRechazar(m.id)}>
                            <X size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Controles de paginación */}
        <Divider />
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
}
