import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, IconButton, Typography, Alert, CircularProgress, Divider,
} from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import facturacionApi from '../facturacionApi';

const MOTIVOS = [
  { value: '01', label: 'Anulación de la operación' },
  { value: '02', label: 'Anulación por error en el RUC' },
  { value: '03', label: 'Corrección en la descripción' },
  { value: '04', label: 'Descuento global' },
  { value: '05', label: 'Descuento por ítem' },
  { value: '06', label: 'Devolución total' },
  { value: '07', label: 'Devolución por ítem' },
  { value: '08', label: 'Bonificación' },
  { value: '09', label: 'Disminución en el valor' },
  { value: '10', label: 'Otros conceptos' },
];

const ITEM_VACIO = { descripcion: '', codigo_producto: '', codigo_sunat: '', codigo_unidad: 'NIU', cantidad: 1, precio_base: 0, tipo_igv_codigo: '10' };

export default function ModalGenerarNota({ comprobanteOriginal, onClose, onCreated }) {
  const [tipoDocumento, setTipoDocumento] = useState('07');
  const [motivoCodigo, setMotivoCodigo] = useState('01');
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/ventas/tipos-comprobante/', { params: { estado: true } })
      .then((res) => {
        const lista = res.data.results ?? res.data;
        setTiposDisponibles(lista.filter((t) => t.codigo_sunat === tipoDocumento));
        setTipoComprobanteId('');
      })
      .catch(() => setTiposDisponibles([]));
  }, [tipoDocumento]);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio_base) || 0), 0),
    [items],
  );

  const actualizarItem = (idx, campo, valor) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  };

  const handleSubmit = async () => {
    setError('');
    if (!tipoComprobanteId) { setError('Seleccione el tipo de comprobante SUNAT configurado para esta nota.'); return; }
    if (items.some((it) => !it.descripcion || !it.codigo_sunat || !it.cantidad || !it.precio_base)) {
      setError('Complete descripción, código SUNAT, cantidad y precio base (sin IGV) en todos los ítems.');
      return;
    }
    setEnviando(true);
    try {
      const { data } = await facturacionApi.generarNota(comprobanteOriginal.id, {
        tipo_documento: tipoDocumento,
        motivo_codigo: motivoCodigo,
        tipo_comprobante_id: tipoComprobanteId,
        items,
      });
      Swal.fire('Nota creada', `${data.serie}-${data.numero} quedó pendiente de envío.`, 'success');
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo generar la nota.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Generar Nota sobre {comprobanteOriginal.tipo_documento_display} {comprobanteOriginal.serie}-{comprobanteOriginal.numero}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={2}>
            <TextField select label="Tipo de nota" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="07">Nota de Crédito</MenuItem>
              <MenuItem value="08">Nota de Débito</MenuItem>
            </TextField>
            <TextField select label="Motivo" value={motivoCodigo} onChange={(e) => setMotivoCodigo(e.target.value)} sx={{ minWidth: 240 }}>
              {MOTIVOS.map((m) => <MenuItem key={m.value} value={m.value}>{m.value} - {m.label}</MenuItem>)}
            </TextField>
            <TextField
              select label="Serie SUNAT configurada" value={tipoComprobanteId}
              onChange={(e) => setTipoComprobanteId(e.target.value)} sx={{ minWidth: 220 }}
              helperText={tiposDisponibles.length === 0 ? `No hay un Tipo de Comprobante con código SUNAT ${tipoDocumento} configurado.` : ''}
            >
              {tiposDisponibles.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
            </TextField>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Ítems (precio sin IGV)</Typography>
          {items.map((it, idx) => (
            <Stack key={idx} direction="row" spacing={1} alignItems="center">
              <TextField label="Descripción" value={it.descripcion} onChange={(e) => actualizarItem(idx, 'descripcion', e.target.value)} sx={{ flex: 2 }} size="small" />
              <TextField label="Cód. SUNAT" value={it.codigo_sunat} onChange={(e) => actualizarItem(idx, 'codigo_sunat', e.target.value)} sx={{ flex: 1 }} size="small" />
              <TextField label="Unidad" value={it.codigo_unidad} onChange={(e) => actualizarItem(idx, 'codigo_unidad', e.target.value)} sx={{ width: 90 }} size="small" />
              <TextField label="Cant." type="number" value={it.cantidad} onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)} sx={{ width: 90 }} size="small" />
              <TextField label="Precio base" type="number" value={it.precio_base} onChange={(e) => actualizarItem(idx, 'precio_base', e.target.value)} sx={{ width: 120 }} size="small" />
              <TextField select label="IGV" value={it.tipo_igv_codigo} onChange={(e) => actualizarItem(idx, 'tipo_igv_codigo', e.target.value)} sx={{ width: 100 }} size="small">
                <MenuItem value="10">Gravado</MenuItem>
                <MenuItem value="20">Exonerado</MenuItem>
                <MenuItem value="30">Inafecto</MenuItem>
              </TextField>
              <IconButton size="small" disabled={items.length === 1} onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>
                <Trash2 size={16} />
              </IconButton>
            </Stack>
          ))}
          <Button startIcon={<Plus size={16} />} onClick={() => setItems((prev) => [...prev, { ...ITEM_VACIO }])} sx={{ alignSelf: 'flex-start' }}>
            Agregar ítem
          </Button>
          <Typography variant="body2" align="right"><b>Total (base): {total.toFixed(2)}</b></Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={enviando} onClick={handleSubmit}>
          {enviando ? <CircularProgress size={20} /> : 'Crear nota'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
