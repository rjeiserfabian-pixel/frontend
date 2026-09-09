import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, IconButton, Tooltip, Stack, TablePagination, Chip
} from '@mui/material';
import { History, Eye, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { getSesiones } from '../services/cajas.service';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(d));
};

const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

const EstadoSesionBadge = ({ estado }) => {
  const map = {
    'ABIERTA':   { label: 'Abierta',   color: 'primary', icon: <Clock size={14} /> },
    'CERRADA':   { label: 'Cerrada',   color: 'success', icon: <CheckCircle2 size={14} /> },
    'DIFERENCIA':{ label: 'Diferencia',color: 'warning', icon: <AlertTriangle size={14} /> }
  };
  const conf = map[estado] || { label: estado, color: 'default', icon: null };
  return (
    <Chip
      size="small"
      icon={conf.icon}
      label={conf.label}
      color={conf.color}
      sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5 }}
    />
  );
};

export default function HistorialCajasPage() {
  const navigate = useNavigate();

  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const cargarSesiones = useCallback(async (pg, limit) => {
    setLoading(true);
    try {
      // Pasamos page_size y page al backend (page de MUI es 0-indexed)
      const res = await getSesiones({ page: pg + 1, page_size: limit });
      // Soporta tanto paginación explícita (results, count) como array directo
      const data = res.data?.results || res.data;
      const count = res.data?.count || data.length;
      setSesiones(data);
      setTotal(count);
      setError(null);
    } catch (err) {
      setError('Error al cargar el historial de cajas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSesiones(page, rowsPerPage);
  }, [cargarSesiones, page, rowsPerPage]);

  return (
    <Box sx={{ py: 2 }}>
      {/* Encabezado Visual */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', p: 3, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <History size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Historial de Sesiones de Caja</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Auditoría y registro histórico de todas las aperturas y cierres
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabla */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Caja y Responsable</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Apertura</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Cierre</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 2 }}>Saldo Inicial</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 2 }}>Efectivo Cierre</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : sesiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No se encontraron sesiones de caja.
                  </TableCell>
                </TableRow>
              ) : (
                sesiones.map(s => (
                  <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">{s.caja_nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.usuario_nombre}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDate(s.fecha_apertura)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDate(s.fecha_cierre)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{fmtMoney(s.saldo_inicial)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {s.estado === 'ABIERTA' ? '—' : fmtMoney(s.saldo_contado)}
                    </TableCell>
                    <TableCell align="center"><EstadoSesionBadge estado={s.estado} /></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Detalle de Movimientos">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/cajas/sesion/${s.id}`)}>
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas:"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>
    </Box>
  );
}
