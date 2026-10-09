import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

/** Diálogo genérico que pide un motivo obligatorio y ejecuta `onConfirm(motivo)`. */
export default function MotivoDialog({
  open, titulo, descripcion, confirmarLabel = 'Confirmar', exito, onConfirm, onClose, onSaved,
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  const valido = motivo.trim().length > 0;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await onConfirm(motivo.trim());
      if (exito) Swal.fire('Listo', exito, 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo completar la acción'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{titulo}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {descripcion && <Typography variant="body2" sx={{ color: C.textMuted }}>{descripcion}</Typography>}
        <TextField label="Motivo" required multiline minRows={2} value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          inputProps={{ maxLength: 255 }} helperText={`${motivo.length}/255`} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : confirmarLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
