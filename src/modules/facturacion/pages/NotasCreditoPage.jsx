import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, MenuItem, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Eye, FilePlus2, RefreshCw, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import facturacionApi from '../facturacionApi';
import ModalDetalleComprobante from '../components/ModalDetalleComprobante';
import ModalNuevaNotaCredito from '../components/ModalNuevaNotaCredito';
import { usePermisos } from '../../../shared/contexts/PermisosContext';

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE_ENVIO', label: 'Pendiente de envio' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'OBSERVADO', label: 'Observado' },
  { value: 'ERROR_CONEXION', label: 'Error de conexion' },
];

const COLOR_ESTADO = {
  PENDIENTE_ENVIO: 'default',
  ENVIADO: 'info',
  ACEPTADO: 'success',
  RECHAZADO: 'error',
  OBSERVADO: 'warning',
  ERROR_CONEXION: 'error',
};

export default function NotasCreditoPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('FACTURACION.COMPROBANTES.CREAR');
  const puedeEmitir = tienePermiso('FACTURACION.COMPROBANTES.EMITIR');

  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [filtros, setFiltros] = useState({ estado: '', search: '', fecha_desde: '', fecha_hasta: '' });
  const [detalleId, setDetalleId] = useState(null);
  const [openNueva, setOpenNueva] = useState(false);
  const [emitiendoId, setEmitiendoId] = useState(null);
  const [aplicandoImpactoId, setAplicandoImpactoId] = useState(null);

  const obtenerImpactoInterno = (nota) => nota.datos_adicionales?.impacto_interno || {};

  const tieneImpactoPendiente = (nota) => {
    const impacto = obtenerImpactoInterno(nota);
    const tieneAcciones = Boolean(
      impacto.reingresar_stock ||
      impacto.registrar_devolucion_caja ||
      impacto.reducir_cuenta_por_cobrar,
    );
    return nota.estado === 'ACEPTADO' && tieneAcciones && !impacto.aplicado_en;
  };

  const fetchNotas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        tipo_documento: '07',
        page: page + 1,
        page_size: rowsPerPage,
        estado: filtros.estado || undefined,
        search: filtros.search || undefined,
        fecha_desde: filtros.fecha_desde || undefined,
        fecha_hasta: filtros.fecha_hasta || undefined,
      };
      const { data } = await facturacionApi.listar(params);
      setNotas(data.results ?? data);
      setTotalCount(data.count ?? data.length);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo cargar el listado de notas de credito.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filtros]);

  useEffect(() => { fetchNotas(); }, [fetchNotas]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(0);
  };

  const handleEmitir = async (nota) => {
    const confirm = await Swal.fire({
      title: nota.estado === 'PENDIENTE_ENVIO' ? 'Enviar nota a SUNAT' : 'Reintentar envio',
      text: `${nota.serie}-${nota.numero}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;

    setEmitiendoId(nota.id);
    try {
      const accion = nota.estado === 'PENDIENTE_ENVIO' ? facturacionApi.emitir : facturacionApi.reintentar;
      const { data } = await accion(nota.id);
      Swal.fire(
        data.estado === 'ACEPTADO' ? 'Aceptada' : 'Enviada',
        `Estado actual: ${data.estado_display}`,
        data.estado === 'ACEPTADO' ? 'success' : 'info',
      );
      fetchNotas();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo enviar la nota.', 'error');
    } finally {
      setEmitiendoId(null);
    }
  };

  const handleAplicarImpacto = async (nota) => {
    const impacto = obtenerImpactoInterno(nota);
    const detalle = [
      impacto.reingresar_stock ? 'reingreso de stock' : null,
      impacto.registrar_devolucion_caja ? 'egreso de caja' : null,
      impacto.reducir_cuenta_por_cobrar ? 'cuenta por cobrar' : null,
    ].filter(Boolean).join(', ');

    const confirm = await Swal.fire({
      title: 'Aplicar impacto interno',
      text: `${nota.serie}-${nota.numero}${detalle ? `: ${detalle}` : ''}`,
      icon: impacto.error_aplicacion ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
    });
    if (!confirm.isConfirmed) return;

    setAplicandoImpactoId(nota.id);
    try {
      const { data } = await facturacionApi.aplicarImpactoInterno(nota.id);
      Swal.fire('Impacto aplicado', `La nota ${data.serie}-${data.numero} ya actualizo los movimientos internos.`, 'success');
      fetchNotas();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo aplicar el impacto interno.', 'error');
    } finally {
      setAplicandoImpactoId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Notas de Credito</Typography>
          <Typography variant="body2" color="text.secondary">Creacion, revision y envio manual de notas de credito.</Typography>
        </Box>
        {puedeCrear && (
          <Button variant="contained" startIcon={<FilePlus2 size={18} />} onClick={() => setOpenNueva(true)}>
            Nueva nota de credito
          </Button>
        )}
      </Stack>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select size="small" label="Estado" value={filtros.estado} sx={{ minWidth: 190 }}
          onChange={(e) => actualizarFiltro('estado', e.target.value)}
        >
          {ESTADOS.map((estado) => <MenuItem key={estado.value} value={estado.value}>{estado.label}</MenuItem>)}
        </TextField>
        <TextField
          size="small" label="Buscar" value={filtros.search} sx={{ minWidth: 260 }}
          placeholder="Nota, comprobante, venta o cliente"
          onChange={(e) => actualizarFiltro('search', e.target.value)}
        />
        <TextField
          size="small" type="date" label="Desde" slotProps={{ inputLabel: { shrink: true } }}
          value={filtros.fecha_desde}
          onChange={(e) => actualizarFiltro('fecha_desde', e.target.value)}
        />
        <TextField
          size="small" type="date" label="Hasta" slotProps={{ inputLabel: { shrink: true } }}
          value={filtros.fecha_hasta}
          onChange={(e) => actualizarFiltro('fecha_hasta', e.target.value)}
        />
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nota</TableCell>
                <TableCell>Comprobante afectado</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell align="right">Total base</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : notas.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No hay notas de credito registradas.</TableCell></TableRow>
              ) : notas.map((nota) => (
                <TableRow key={nota.id} hover>
                  <TableCell>{nota.serie}-{nota.numero}</TableCell>
                  <TableCell>{nota.comprobante_relacionado_codigo || '-'}</TableCell>
                  <TableCell>{nota.cliente_nombre || nota.cliente_documento}</TableCell>
                  <TableCell>{nota.motivo_codigo || '-'}</TableCell>
                  <TableCell align="right">{nota.moneda} {Number(nota.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip size="small" label={nota.estado_display} color={COLOR_ESTADO[nota.estado] || 'default'} />
                      {tieneImpactoPendiente(nota) && (
                        <Chip
                          size="small"
                          label={obtenerImpactoInterno(nota).error_aplicacion ? 'Impacto con error' : 'Impacto pendiente'}
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => setDetalleId(nota.id)}><Eye size={16} /></IconButton>
                    </Tooltip>
                    {puedeEmitir && ['PENDIENTE_ENVIO', 'RECHAZADO', 'OBSERVADO', 'ERROR_CONEXION'].includes(nota.estado) && (
                      <Tooltip title={nota.estado === 'PENDIENTE_ENVIO' ? 'Enviar a SUNAT' : 'Reintentar envio'}>
                        <span>
                          <IconButton size="small" color="primary" disabled={emitiendoId === nota.id} onClick={() => handleEmitir(nota)}>
                            {emitiendoId === nota.id ? <CircularProgress size={16} /> : (nota.estado === 'PENDIENTE_ENVIO' ? <Send size={16} /> : <RefreshCw size={16} />)}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {puedeEmitir && tieneImpactoPendiente(nota) && (
                      <Tooltip title={obtenerImpactoInterno(nota).error_aplicacion ? 'Reintentar impacto interno' : 'Aplicar impacto interno'}>
                        <span>
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={aplicandoImpactoId === nota.id}
                            onClick={() => handleAplicarImpacto(nota)}
                          >
                            {aplicandoImpactoId === nota.id ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
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
          onChanged={fetchNotas}
        />
      )}

      {openNueva && (
        <ModalNuevaNotaCredito
          onClose={() => setOpenNueva(false)}
          onCreated={() => { setOpenNueva(false); fetchNotas(); }}
        />
      )}
    </Box>
  );
}
