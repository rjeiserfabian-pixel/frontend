import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress,
  TextField, MenuItem, Autocomplete, TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const ESTADOS = [
  'RECEPCIONADO', 'INSPECCION', 'ESPERANDO_APROBACION', 'APROBADO',
  'FINALIZADO', 'FACTURADO', 'CANCELADO'
];
const DEFAULT_ROWS_PER_PAGE = 10;
const SERVER_BATCH_SIZE = 25;

export default function OrdenesTrabajoPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('ORDENES_TRABAJO.CREAR');

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mecanicos, setMecanicos] = useState([]);
  const navigate = useNavigate();

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const defaultDesde = `${currentYear}-${currentMonth}-01`;
  const defaultHasta = `${currentYear}-${currentMonth}-${currentDay}`;

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroMecanico, setFiltroMecanico] = useState(null);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(defaultDesde);
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(defaultHasta);

  useEffect(() => {
    api.get('seguridad/usuarios/?rol=MECANICO')
      .then((res) => {
        const dataList = res.data?.data ? (res.data.data.results || res.data.data) : (res.data.results || res.data);
        setMecanicos(Array.isArray(dataList) ? dataList : []);
      })
      .catch((error) => console.error('Error al cargar mecánicos:', error));
  }, []);

  useEffect(() => {
    fetchOrdenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filtroEstado, filtroMecanico, filtroPlaca, filtroFechaDesde, filtroFechaHasta]);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroMecanico) params.mecanico_asignado = filtroMecanico.id_usuario;
      if (filtroPlaca) params.placa = filtroPlaca;
      if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
      if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;

      const firstRowIndex = page * rowsPerPage;
      const serverPage = Math.floor(firstRowIndex / SERVER_BATCH_SIZE) + 1;
      const serverOffset = firstRowIndex % SERVER_BATCH_SIZE;
      const requiredBatches = Math.ceil((serverOffset + rowsPerPage) / SERVER_BATCH_SIZE);
      const serverPages = Array.from({ length: requiredBatches }, (_, index) => serverPage + index);

      const responses = await Promise.all(
        serverPages.map((currentPage) => tallerService.getOrdenes({ ...params, page: currentPage }))
      );
      const serverRows = responses.flatMap((data) => {
        const list = data.results || data;
        return Array.isArray(list) ? list : [];
      });

      setOrdenes(serverRows.slice(serverOffset, serverOffset + rowsPerPage));
      const firstResponse = responses[0];
      setTotalCount(firstResponse.count !== undefined ? firstResponse.count : serverRows.length);
    } catch (error) {
      console.error('Error fetching ordenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarFiltro = (setter) => (valor) => {
    setPage(0);
    setter(valor);
  };

  const hayFiltrosActivos = !!(filtroEstado || filtroMecanico || filtroPlaca || filtroFechaDesde !== defaultDesde || filtroFechaHasta !== defaultHasta);

  const limpiarFiltros = () => {
    setPage(0);
    setFiltroEstado('');
    setFiltroMecanico(null);
    setFiltroPlaca('');
    setFiltroFechaDesde(defaultDesde);
    setFiltroFechaHasta(defaultHasta);
  };

  const getStatusColor = (estado) => {
    const colors = {
      RECEPCIONADO: 'default',
      INSPECCION: 'info',
      ESPERANDO_APROBACION: 'warning',
      APROBADO: 'primary',
      FINALIZADO: 'success',
      FACTURADO: 'success',
      CANCELADO: 'error'
    };
    return colors[estado] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="600">Órdenes de Trabajo</Typography>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/taller/ordenes/nueva')}
          >
            Nueva Orden
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.06)}, transparent 42%)` }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Estado"
            sx={{ width: 180 }}
            value={filtroEstado}
            onChange={(e) => cambiarFiltro(setFiltroEstado)(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((estado) => (
              <MenuItem key={estado} value={estado}>{estado.replace(/_/g, ' ')}</MenuItem>
            ))}
          </TextField>
          <Autocomplete
            size="small"
            sx={{ width: 220 }}
            options={mecanicos}
            getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
            value={filtroMecanico}
            onChange={(e, val) => cambiarFiltro(setFiltroMecanico)(val)}
            renderInput={(params) => <TextField {...params} label="Mecánico" />}
          />
          <TextField
            size="small"
            label="Placa"
            sx={{ width: 140 }}
            value={filtroPlaca}
            onChange={(e) => cambiarFiltro(setFiltroPlaca)(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            inputProps={{ style: { colorScheme: 'dark' } }}
            sx={{ width: 160 }}
            value={filtroFechaDesde}
            onChange={(e) => cambiarFiltro(setFiltroFechaDesde)(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            inputProps={{ style: { colorScheme: 'dark' } }}
            sx={{ width: 160 }}
            value={filtroFechaHasta}
            onChange={(e) => cambiarFiltro(setFiltroFechaHasta)(e.target.value)}
          />
          {hayFiltrosActivos && (
            <Button size="small" onClick={limpiarFiltros} sx={{ textTransform: 'none' }}>
              Limpiar filtros
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell>Nro Orden</TableCell>
                <TableCell>Fecha Ingreso</TableCell>
                <TableCell>Placa</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Mecánico</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : ordenes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay órdenes registradas.
                  </TableCell>
                </TableRow>
              ) : (
                ordenes.map((orden) => (
                  <TableRow key={orden.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#bae6fd' }}>OT-{orden.numero}</TableCell>
                    <TableCell>{new Date(orden.fecha_ingreso).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={orden.vehiculo_placa} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{orden.cliente_nombre}</TableCell>
                    <TableCell>{orden.mecanico_nombre || 'Sin Asignar'}</TableCell>
                    <TableCell>
                      <Chip
                        label={orden.estado.replace('_', ' ')}
                        color={getStatusColor(orden.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/taller/ordenes/${orden.id}`)} color="primary" sx={{ bgcolor: alpha(C.blue, 0.09), border: `1px solid ${alpha(C.blue, 0.2)}` }}>
                        <Eye size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>
    </Box>
  );
}
