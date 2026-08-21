import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Chip, Grid, FormControl, InputLabel, Select, MenuItem,
  Pagination, TextField
} from '@mui/material';
import { inventarioService } from '../services/inventarioService';
import Swal from 'sweetalert2';

// Mapa de colores por tipo de movimiento
const TIPO_COLORES = {
  ENTRADA: 'success',
  SALIDA: 'error',
  TRASLADO_ENTRADA: 'info',
  TRASLADO_SALIDA: 'info',
  AJUSTE_POSITIVO: 'warning',
  AJUSTE_NEGATIVO: 'warning',
  RESERVA: 'secondary',
  LIBERACION_RESERVA: 'secondary',
  MERMA: 'error',
  INVENTARIO_INICIAL: 'default',
};

const TIPOS_MOVIMIENTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA', label: 'Salida' },
  { value: 'AJUSTE_POSITIVO', label: 'Ajuste Positivo' },
  { value: 'AJUSTE_NEGATIVO', label: 'Ajuste Negativo' },
  { value: 'RESERVA', label: 'Reserva' },
  { value: 'LIBERACION_RESERVA', label: 'Liberación de Reserva' },
  { value: 'TRASLADO_ENTRADA', label: 'Traslado Entrada' },
  { value: 'TRASLADO_SALIDA', label: 'Traslado Salida' },
  { value: 'MERMA', label: 'Merma' },
  { value: 'INVENTARIO_INICIAL', label: 'Inventario Inicial' },
];

// Custom hook: lógica separada de la vista
function useKardex() {
  const [movimientos, setMovimientos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filtros
  const [filtros, setFiltros] = useState({
    repuestoId: '',
    tipo: '',
    page: 1,
  });

  // Debounce: no se disparan peticiones por cada cambio de filtro de inmediato
  const debounceTimer = useRef(null);

  const fetchMovimientos = useCallback(async (params) => {
    try {
      setLoading(true);
      const data = await inventarioService.getKardex({
        repuestoId: params.repuestoId || null,
        tipo: params.tipo || null,
        page: params.page,
      });
      setMovimientos(data.results || data);
      // Calcular total de páginas desde el count de la paginación DRF
      if (data.count !== undefined) {
        setTotalPages(Math.ceil(data.count / 25));
      }
    } catch (error) {
      console.error('Error al cargar el kardex:', error);
      Swal.fire('Error', 'No se pudo cargar el Kardex.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepuestos = useCallback(async () => {
    try {
      const data = await inventarioService.getRepuestos();
      setRepuestos(data.results || data);
    } catch (error) {
      console.error('Error al cargar repuestos:', error);
    }
  }, []);

  // Debounce al cambiar filtros: espera 300ms antes de hacer la petición
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchMovimientos(filtros);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [filtros, fetchMovimientos]);

  useEffect(() => {
    fetchRepuestos();
  }, [fetchRepuestos]);

  const handleFiltroChange = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (_, newPage) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
  };

  return { movimientos, repuestos, loading, filtros, totalPages, handleFiltroChange, handlePageChange };
}

export default function KardexPage() {
  const { movimientos, repuestos, loading, filtros, totalPages, handleFiltroChange, handlePageChange } = useKardex();

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Kardex de Inventario</Typography>
        <Typography variant="body2" color="text.secondary">
          Historial inmutable de todos los movimientos de stock. Solo lectura.
        </Typography>
      </Box>

      {/* Panel de Filtros */}
      <Paper sx={{ p: 2, mb: 3, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Repuesto</InputLabel>
              <Select
                label="Filtrar por Repuesto"
                value={filtros.repuestoId}
                onChange={(e) => handleFiltroChange('repuestoId', e.target.value)}
              >
                <MenuItem value="">Todos los repuestos</MenuItem>
                {repuestos.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.codigo} — {r.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                label="Tipo de Movimiento"
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              >
                {TIPOS_MOVIMIENTO.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Movimientos */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Repuesto</strong></TableCell>
                    <TableCell><strong>Ubicación</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell align="center"><strong>Cantidad</strong></TableCell>
                    <TableCell align="center"><strong>Stock Resultante</strong></TableCell>
                    <TableCell><strong>Motivo</strong></TableCell>
                    <TableCell><strong>Usuario</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay movimientos registrados con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((mov) => (
                      <TableRow key={mov.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                          {formatFecha(mov.fecha)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{mov.repuesto_codigo}</Typography>
                          <Typography variant="caption" color="text.secondary">{mov.repuesto_nombre}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{mov.ubicacion_codigo}</TableCell>
                        <TableCell>
                          <Chip
                            label={mov.tipo_movimiento.replace(/_/g, ' ')}
                            color={TIPO_COLORES[mov.tipo_movimiento] || 'default'}
                            size="small"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={mov.cantidad >= 0 ? 'success.main' : 'error.main'}
                          >
                            {mov.cantidad >= 0 ? `+${mov.cantidad}` : mov.cantidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{mov.stock_resultante}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                          <Typography variant="caption" noWrap title={mov.motivo}>
                            {mov.motivo}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{mov.usuario_nombre}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={totalPages}
                  page={filtros.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
