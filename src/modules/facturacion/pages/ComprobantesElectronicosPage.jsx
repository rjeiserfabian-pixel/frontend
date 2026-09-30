import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Eye, RefreshCw, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import facturacionApi from '../facturacionApi';
import ModalDetalleComprobante from '../components/ModalDetalleComprobante';
import { usePermisos } from '../../../shared/contexts/PermisosContext';

const TIPOS_DOCUMENTO = [
  { value: '', label: 'Todos los tipos' },
  { value: '01', label: 'Factura' },
  { value: '03', label: 'Boleta' },
  { value: '08', label: 'Nota de Debito' },
  { value: '09', label: 'Guia de Remision' },
];

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE_ENVIO', label: 'Pendiente de envio' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'OBSERVADO', label: 'Observado' },
  { value: 'ERROR_CONEXION', label: 'Error de conexion' },
  { value: 'BAJA_SOLICITADA', label: 'Baja solicitada' },
  { value: 'BAJA_ACEPTADA', label: 'Anulado' },
];

const COLOR_ESTADO = {
  PENDIENTE_ENVIO: 'default',
  ENVIADO: 'info',
  ACEPTADO: 'success',
  RECHAZADO: 'error',
  OBSERVADO: 'warning',
  ERROR_CONEXION: 'error',
  BAJA_SOLICITADA: 'warning',
  BAJA_ACEPTADA: 'default',
};

export default function ComprobantesElectronicosPage() {
  const { tienePermiso } = usePermisos();
  const puedeEmitir = tienePermiso('FACTURACION.COMPROBANTES.EMITIR');
  const puedeCrear = tienePermiso('FACTURACION.COMPROBANTES.CREAR');

  const [comprobantes, setComprobantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [emitiendoId, setEmitiendoId] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  const fetchComprobantes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facturacionApi.listar({
        page: page + 1,
        page_size: rowsPerPage,
        tipo_documento: filtroTipo || undefined,
        estado: filtroEstado || undefined,
        excluir_notas_credito: true,
      });
      setComprobantes(res.data.results ?? res.data);
      setTotalCount(res.data.count ?? res.data.length);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar la bandeja de comprobantes.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filtroTipo, filtroEstado]);

  useEffect(() => { fetchComprobantes(); }, [fetchComprobantes]);

  const handleEmitir = async (comprobante) => {
    const confirm = await Swal.fire({
      title: comprobante.estado === 'PENDIENTE_ENVIO' ? 'Emitir a SUNAT' : 'Reintentar envio',
      text: `${comprobante.tipo_documento_display} ${comprobante.serie}-${comprobante.numero}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;

    setEmitiendoId(comprobante.id);
    try {
      const accion = comprobante.estado === 'PENDIENTE_ENVIO' ? facturacionApi.emitir : facturacionApi.reintentar;
      const { data } = await accion(comprobante.id);
      Swal.fire(
        data.estado === 'ACEPTADO' ? 'Aceptado' : 'Enviado',
        `Estado actual: ${data.estado_display}`,
        data.estado === 'ACEPTADO' ? 'success' : 'info',
      );
      fetchComprobantes();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'No se pudo emitir el comprobante.', 'error');
    } finally {
      setEmitiendoId(null);
    }
  };

  const handleSincronizarVentas = async () => {
    setSincronizando(true);
    try {
      const { data } = await facturacionApi.sincronizarVentas();
      const creados = Number(data.creados || 0);
      Swal.fire(
        creados > 0 ? 'Ventas sincronizadas' : 'Sin pendientes',
        creados > 0
          ? `Se prepararon ${creados} venta(s) para envio a SUNAT.`
          : 'No hay facturas o boletas nuevas pendientes de preparar.',
        creados > 0 ? 'success' : 'info',
      );
      fetchComprobantes();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'No se pudieron sincronizar las ventas.', 'error');
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Comprobantes Electronicos</Typography>
          <Typography variant="body2" color="text.secondary">Revision y envio manual a SUNAT de facturas y boletas registradas en ventas.</Typography>
        </Box>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={sincronizando ? <CircularProgress color="inherit" size={18} /> : <RefreshCw size={18} />}
            onClick={handleSincronizarVentas}
            disabled={sincronizando}
          >
            Sincronizar ventas
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Tipo de documento"
          value={filtroTipo}
          sx={{ minWidth: 190 }}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(0); }}
        >
          {TIPOS_DOCUMENTO.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
        </TextField>
        <TextField
          select
          size="small"
          label="Estado"
          value={filtroEstado}
          sx={{ minWidth: 190 }}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          {ESTADOS.map((estado) => <MenuItem key={estado.value} value={estado.value}>{estado.label}</MenuItem>)}
        </TextField>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Serie-numero</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : comprobantes.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No hay comprobantes para mostrar.</TableCell></TableRow>
              ) : comprobantes.map((comprobante) => (
                <TableRow key={comprobante.id} hover>
                  <TableCell>{comprobante.tipo_documento_display}</TableCell>
                  <TableCell>{comprobante.serie}-{comprobante.numero}</TableCell>
                  <TableCell>{comprobante.cliente_nombre || comprobante.cliente_documento}</TableCell>
                  <TableCell align="right">{Number(comprobante.total).toFixed(2)}</TableCell>
                  <TableCell><Chip size="small" label={comprobante.estado_display} color={COLOR_ESTADO[comprobante.estado] || 'default'} /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => setDetalleId(comprobante.id)}><Eye size={16} /></IconButton>
                    </Tooltip>
                    {puedeEmitir && ['PENDIENTE_ENVIO', 'RECHAZADO', 'OBSERVADO', 'ERROR_CONEXION'].includes(comprobante.estado) && (
                      <Tooltip title={comprobante.estado === 'PENDIENTE_ENVIO' ? 'Emitir a SUNAT' : 'Reintentar envio'}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={emitiendoId === comprobante.id}
                            onClick={() => handleEmitir(comprobante)}
                          >
                            {emitiendoId === comprobante.id ? <CircularProgress size={16} /> : (comprobante.estado === 'PENDIENTE_ENVIO' ? <Send size={16} /> : <RefreshCw size={16} />)}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas por pagina:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mas de ${to}`}`}
        />
      </Paper>

      {detalleId && (
        <ModalDetalleComprobante
          comprobanteId={detalleId}
          onClose={() => setDetalleId(null)}
          onChanged={fetchComprobantes}
        />
      )}

    </Box>
  );
}
