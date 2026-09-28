import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Stack,
  Typography, Alert, CircularProgress, Divider, Box, Link as MuiLink,
} from '@mui/material';
import Swal from 'sweetalert2';
import facturacionApi from '../facturacionApi';
import ModalGenerarNota from './ModalGenerarNota';

const REENVIABLES = ['PENDIENTE_ENVIO', 'RECHAZADO', 'OBSERVADO', 'ERROR_CONEXION'];

async function pedirDatosGuia() {
  const { value } = await Swal.fire({
    title: 'Datos del traslado (SUNAT)',
    html: `
      <input id="peso_total" class="swal2-input" placeholder="Peso total" type="number">
      <input id="cantidad_bultos" class="swal2-input" placeholder="Cantidad de bultos" type="number" value="1">
      <input id="motivo_traslado_codigo" class="swal2-input" placeholder="Código motivo traslado (ej. 01)" value="01">
      <input id="ubigeo_partida" class="swal2-input" placeholder="Ubigeo de partida (6 dígitos)">
      <input id="ubigeo_llegada" class="swal2-input" placeholder="Ubigeo de llegada (6 dígitos)">
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    preConfirm: () => ({
      peso_total: document.getElementById('peso_total').value,
      cantidad_bultos: document.getElementById('cantidad_bultos').value,
      motivo_traslado_codigo: document.getElementById('motivo_traslado_codigo').value,
      ubigeo_partida: document.getElementById('ubigeo_partida').value,
      ubigeo_llegada: document.getElementById('ubigeo_llegada').value,
    }),
  });
  return value || null;
}

export default function ModalDetalleComprobante({ comprobanteId, onClose, onChanged }) {
  const [comprobante, setComprobante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [openNota, setOpenNota] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await facturacionApi.detalle(comprobanteId);
      setComprobante(data);
    } catch {
      Swal.fire('Error', 'No se pudo cargar el detalle del comprobante.', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [comprobanteId, onClose]);

  useEffect(() => { cargar(); }, [cargar]);

  const refrescar = (data) => {
    setComprobante(data);
    onChanged();
  };

  const handleEmitir = async () => {
    let datosAdicionales = null;
    if (comprobante.tipo_documento === '09' && !comprobante.datos_adicionales?.peso_total) {
      datosAdicionales = await pedirDatosGuia();
      if (!datosAdicionales) return;
    }
    setEnviando(true);
    try {
      const accion = comprobante.estado === 'PENDIENTE_ENVIO' ? facturacionApi.emitir : facturacionApi.reintentar;
      const { data } = await accion(comprobante.id, datosAdicionales ? { datos_adicionales: datosAdicionales } : {});
      refrescar(data);
      Swal.fire(
        data.estado === 'ACEPTADO' ? 'Aceptado' : 'Enviado',
        `Estado actual: ${data.estado_display}`,
        data.estado === 'ACEPTADO' ? 'success' : 'info',
      );
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo emitir el comprobante.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleReenviarConCorreccion = async () => {
    const { value: texto } = await Swal.fire({
      title: 'Corregir datos antes de reenviar',
      input: 'textarea',
      inputLabel: 'JSON con los campos a corregir (ej. {"cliente": {"numero_documento": "12345678"}})',
      inputPlaceholder: '{"cliente": {"numero_documento": "..."}}',
      showCancelButton: true,
    });
    if (!texto) return;
    let correcciones;
    try {
      correcciones = JSON.parse(texto);
    } catch {
      Swal.fire('Error', 'El JSON de correcciones no es válido.', 'error');
      return;
    }
    setEnviando(true);
    try {
      const { data } = await facturacionApi.reintentar(comprobante.id, { correcciones });
      refrescar(data);
      Swal.fire('Reenviado', `Estado actual: ${data.estado_display}`, 'info');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo reenviar.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleSolicitarBaja = async () => {
    const { value: motivo } = await Swal.fire({
      title: 'Motivo de la anulación', input: 'text', showCancelButton: true, confirmButtonText: 'Solicitar baja',
    });
    if (!motivo) return;
    try {
      const { data } = await facturacionApi.solicitarBaja(comprobante.id, motivo);
      refrescar(data);
      Swal.fire('Baja solicitada', `Ticket: ${data.ticket_sunat || 'pendiente'}`, 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo solicitar la baja.', 'error');
    }
  };

  const handleConsultarBaja = async () => {
    try {
      const { data } = await facturacionApi.consultarBaja(comprobante.id);
      refrescar(data);
      Swal.fire('Consultado', `Estado actual: ${data.estado_display}`, 'info');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo consultar el ticket.', 'error');
    }
  };

  if (loading || !comprobante) {
    return (
      <Dialog open onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></DialogContent>
      </Dialog>
    );
  }

  const puedeGenerarNota = comprobante.estado === 'ACEPTADO' && ['01', '03'].includes(comprobante.tipo_documento);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {comprobante.tipo_documento_display} {comprobante.serie}-{comprobante.numero}{' '}
        <Chip size="small" label={comprobante.estado_display} sx={{ ml: 1 }} />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={4}>
            <Typography variant="body2"><b>Cliente:</b> {comprobante.cliente_nombre || comprobante.cliente_documento}</Typography>
            <Typography variant="body2"><b>Total:</b> {comprobante.moneda} {Number(comprobante.total).toFixed(2)}</Typography>
            <Typography variant="body2"><b>Intentos:</b> {comprobante.intentos}</Typography>
          </Stack>

          {comprobante.mensaje_error && <Alert severity="warning">{comprobante.mensaje_error}</Alert>}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {comprobante.pdf_url && <MuiLink href={comprobante.pdf_url} target="_blank" rel="noreferrer">PDF</MuiLink>}
            {comprobante.xml_url && <MuiLink href={comprobante.xml_url} target="_blank" rel="noreferrer">XML</MuiLink>}
            {comprobante.cdr_url && <MuiLink href={comprobante.cdr_url} target="_blank" rel="noreferrer">CDR</MuiLink>}
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Historial de envíos</Typography>
          {comprobante.logs.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aún no se ha intentado enviar.</Typography>
          ) : comprobante.logs.map((log) => (
            <Box key={log.id} sx={{ p: 1, border: '1px solid #eee', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(log.fecha).toLocaleString()} · {log.endpoint} · {log.usuario_nombre} · {log.exitoso ? 'OK' : 'Error'}
              </Typography>
              {log.mensaje && <Typography variant="body2">{log.mensaje}</Typography>}
            </Box>
          ))}

          {comprobante.respuesta_api && (
            <>
              <Divider />
              <Typography variant="subtitle2">Última respuesta de la API (JSON crudo)</Typography>
              <Box component="pre" sx={{ fontSize: 12, bgcolor: '#0f172a', color: '#e2e8f0', p: 1.5, borderRadius: 1, overflow: 'auto', maxHeight: 220 }}>
                {JSON.stringify(comprobante.respuesta_api, null, 2)}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {REENVIABLES.includes(comprobante.estado) && (
          <Button variant="contained" disabled={enviando} onClick={handleEmitir}>
            {enviando ? <CircularProgress size={20} /> : (comprobante.estado === 'PENDIENTE_ENVIO' ? 'Emitir a SUNAT' : 'Reintentar envío')}
          </Button>
        )}
        {['RECHAZADO', 'OBSERVADO'].includes(comprobante.estado) && (
          <Button variant="outlined" disabled={enviando} onClick={handleReenviarConCorreccion}>
            Corregir y reenviar
          </Button>
        )}
        {puedeGenerarNota && (
          <Button variant="outlined" onClick={() => setOpenNota(true)}>Generar Nota Crédito/Débito</Button>
        )}
        {comprobante.estado === 'ACEPTADO' && (
          <Button color="error" variant="outlined" onClick={handleSolicitarBaja}>Solicitar Baja</Button>
        )}
        {comprobante.estado === 'BAJA_SOLICITADA' && (
          <Button variant="outlined" onClick={handleConsultarBaja}>Consultar estado de baja</Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>

      {openNota && (
        <ModalGenerarNota
          comprobanteOriginal={comprobante}
          onClose={() => setOpenNota(false)}
          onCreated={() => { setOpenNota(false); onChanged(); onClose(); }}
        />
      )}
    </Dialog>
  );
}
