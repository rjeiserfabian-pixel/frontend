import { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import { getMediaUrl } from '../../../core/utils/mediaUrl';
import { mensajeError } from '../../../shared/utils/errores';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

/**
 * Configura el QR de cobro (Yape, Plin...) de un método de pago. El POS lo muestra al cliente
 * y el cajero confirma el pago a mano con el número de operación.
 */
export default function QrMetodoPagoDialog({ metodo, onClose, onSaved }) {
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const inputArchivo = useRef(null);

  useEffect(() => {
    setArchivo(null);
    setVistaPrevia(null);
    setDescripcion(metodo?.qr_descripcion || '');
  }, [metodo]);

  // Vista previa de la imagen elegida (se libera la URL temporal al cambiar o cerrar)
  useEffect(() => {
    if (!archivo) return undefined;
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  if (!metodo) return null;
  const imagenActual = vistaPrevia || getMediaUrl(metodo.qr_url);

  const guardar = async () => {
    if (!archivo && !metodo.tiene_qr) {
      Swal.fire('Atención', 'Elija la imagen del QR.', 'warning');
      return;
    }
    const form = new FormData();
    if (archivo) form.append('imagen', archivo);
    form.append('descripcion', descripcion);
    setEnviando(true);
    try {
      await api.post(`ventas/metodos-pago/${metodo.id}/qr/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo guardar el QR'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  const quitar = async () => {
    const r = await Swal.fire({
      title: '¿Quitar el QR?', text: 'El POS dejará de mostrar el QR para este método de pago.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar', confirmButtonColor: '#d33',
    });
    if (!r.isConfirmed) return;
    setEnviando(true);
    try {
      await api.delete(`ventas/metodos-pago/${metodo.id}/qr/`);
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo quitar el QR'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onClose={enviando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>QR de cobro · {metodo.nombre}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {imagenActual ? (
            <Box component="img" src={imagenActual} alt={`QR de ${metodo.nombre}`}
              sx={{ width: 220, height: 220, objectFit: 'contain', bgcolor: '#fff', borderRadius: 2, p: 1 }} />
          ) : (
            <Typography sx={{ color: C.textMuted, py: 4 }}>Aún no hay un QR configurado.</Typography>
          )}
          <input ref={inputArchivo} type="file" hidden accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
          <Button variant="outlined" onClick={() => inputArchivo.current?.click()} disabled={enviando}>
            {metodo.tiene_qr || archivo ? 'Cambiar imagen' : 'Subir imagen del QR'}
          </Button>
          <Typography variant="caption" sx={{ color: C.textMuted }}>PNG, JPG o WEBP de hasta 2 MB</Typography>
          <TextField
            label="Texto que verá el cliente (opcional)" fullWidth value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Yape · 987 654 321 · Omega Automotriz"
            slotProps={{ htmlInput: { maxLength: 150 } }}
          />
          <Typography variant="caption" sx={{ color: C.textMuted }}>
            Recomendación: marque el método como &quot;Requiere Referencia&quot; para que el cajero registre el número de operación.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          {metodo.tiene_qr && (
            <Button color="error" onClick={quitar} disabled={enviando}>Quitar QR</Button>
          )}
        </Box>
        <Box>
          <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={enviando}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
