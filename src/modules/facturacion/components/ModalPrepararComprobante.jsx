import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, Alert, CircularProgress,
} from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import facturacionApi from '../facturacionApi';

export default function ModalPrepararComprobante({ onClose, onPrepared }) {
  const [origen, setOrigen] = useState('VENTA');
  const [ventaId, setVentaId] = useState('');
  const [guiaId, setGuiaId] = useState('');
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');
  const [tiposGuia, setTiposGuia] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (origen !== 'GUIA') return;
    api.get('/ventas/tipos-comprobante/', { params: { estado: true } })
      .then((res) => {
        const lista = res.data.results ?? res.data;
        // Solo los configurados como Guía de Remisión Electrónica (código SUNAT 09).
        setTiposGuia(lista.filter((t) => t.codigo_sunat === '09'));
      })
      .catch(() => setTiposGuia([]));
  }, [origen]);

  const handleSubmit = async () => {
    setError('');
    setEnviando(true);
    try {
      if (origen === 'VENTA') {
        if (!ventaId) { setError('Indique el ID de la venta.'); return; }
        await facturacionApi.prepararVenta(ventaId);
      } else {
        if (!guiaId || !tipoComprobanteId) { setError('Indique la guía y el tipo de comprobante SUNAT.'); return; }
        await facturacionApi.prepararGuia(guiaId, tipoComprobanteId);
      }
      Swal.fire('Listo', 'El comprobante quedó preparado en estado Pendiente de Envío.', 'success');
      onPrepared();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo preparar el comprobante.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Preparar comprobante electrónico</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select label="Origen" value={origen}
            onChange={(e) => setOrigen(e.target.value)}
          >
            <MenuItem value="VENTA">Venta (Factura/Boleta)</MenuItem>
            <MenuItem value="GUIA">Guía de Remisión</MenuItem>
          </TextField>

          {origen === 'VENTA' ? (
            <TextField
              label="ID de la Venta" value={ventaId} type="number"
              onChange={(e) => setVentaId(e.target.value)}
              helperText="La venta debe estar Pagada o Al Crédito, con tipo de comprobante y correlativo ya asignados."
            />
          ) : (
            <>
              <TextField
                label="ID de la Guía de Remisión" value={guiaId} type="number"
                onChange={(e) => setGuiaId(e.target.value)}
                helperText="La guía debe tener transportista y vehículo asignado."
              />
              <TextField
                select label="Tipo de comprobante (código SUNAT 09)" value={tipoComprobanteId}
                onChange={(e) => setTipoComprobanteId(e.target.value)}
                helperText={tiposGuia.length === 0 ? 'No hay un Tipo de Comprobante con código SUNAT 09 configurado todavía (Ventas > Configuración).' : ''}
              >
                {tiposGuia.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </TextField>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={enviando}>
          {enviando ? <CircularProgress size={20} /> : 'Preparar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
