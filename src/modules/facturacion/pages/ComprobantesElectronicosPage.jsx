import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  TablePagination, Chip, MenuItem, TextField, Stack, Tooltip,
} from '@mui/material';
import { Send, RefreshCw, Eye, FilePlus2 } from 'lucide-react';
import Swal from 'sweetalert2';
import facturacionApi from '../facturacionApi';
import ModalDetalleComprobante from '../components/ModalDetalleComprobante';
import ModalPrepararComprobante from '../components/ModalPrepararComprobante';
import { usePermisos } from '../../../shared/contexts/PermisosContext';

const TIPOS_DOCUMENTO = [
  { value: '', label: 'Todos los tipos' },
  { value: '01', label: 'Factura' },
  { value: '03', label: 'Boleta' },
  { value: '07', label: 'Nota de Crédito' },
  { value: '08', label: 'Nota de Débito' },
  { value: '09', label: 'Guía de Remisión' },
];

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE_ENVIO', label: 'Pendiente de Envío' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'OBSERVADO', label: 'Observado' },
  { value: 'ERROR_CONEXION', label: 'Error de Conexión' },
  { value: 'BAJA_SOLICITADA', label: 'Baja Solicitada' },
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
  const [detalleId, setDetalleId] = useState(null);
  const [openPreparar, setOpenPreparar] = useState(false);

  const fetchComprobantes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await facturacionApi.listar({
        page: page + 1,
        page_size: rowsPerPage,
        tipo_documento: filtroTipo || undefined,
        estado: filtroEstado || undefined,
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
      title: comprobante.estado === 'PENDIENTE_ENVIO' ? '¿Emitir a SUNAT?' : '¿Reintentar envío?',
      text: `${comprobante.tipo_documento_display} ${comprobante.serie}-${comprobante.numero}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
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

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Comprobantes Electrónicos</Typography>
        {puedeCrear && (
          <Button variant="contained" startIcon={<FilePlus2 size={18} />} onClick={() => setOpenPreparar(true)}>
            Preparar comprobante
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select size="small" label="Tipo de documento" value={filtroTipo} sx={{ minWidth: 200 }}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(0); }}
        >
          {TIPOS_DOCUMENTO.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Estado" value={filtroEstado} sx={{ minWidth: 200 }}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
        </TextField>
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Serie-Número</TableCell>
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
              ) : comprobantes.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.tipo_documento_display}</TableCell>
                  <TableCell>{c.serie}-{c.numero}</TableCell>
                  <TableCell>{c.cliente_nombre || c.cliente_documento}</TableCell>
                  <TableCell align="right">{Number(c.total).toFixed(2)}</TableCell>
                  <TableCell><Chip size="small" label={c.estado_display} color={COLOR_ESTADO[c.estado] || 'default'} /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => setDetalleId(c.id)}><Eye size={16} /></IconButton>
                    </Tooltip>
                    {puedeEmitir && ['PENDIENTE_ENVIO', 'RECHAZADO', 'OBSERVADO', 'ERROR_CONEXION'].includes(c.estado) && (
                      <Tooltip title={c.estado === 'PENDIENTE_ENVIO' ? 'Emitir a SUNAT' : 'Reintentar envío'}>
                        <span>
                          <IconButton
                            size="small" color="primary" disabled={emitiendoId === c.id}
                            onClick={() => handleEmitir(c)}
                          >
                            {emitiendoId === c.id ? <CircularProgress size={16} /> : (c.estado === 'PENDIENTE_ENVIO' ? <Send size={16} /> : <RefreshCw size={16} />)}
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
        />
      </Paper>

      {detalleId && (
        <ModalDetalleComprobante
          comprobanteId={detalleId}
          onClose={() => setDetalleId(null)}
          onChanged={fetchComprobantes}
        />
      )}

      {openPreparar && (
        <ModalPrepararComprobante
          onClose={() => setOpenPreparar(false)}
          onPrepared={() => { setOpenPreparar(false); fetchComprobantes(); }}
        />
      )}
    </Box>
  );
}
