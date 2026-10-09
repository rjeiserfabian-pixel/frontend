import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

export default function AnularAsignacionDialog({ open, asignacion, onClose, onSaved }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  if (!asignacion) return null;
  const valido = motivo.trim().length > 0;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.anularAsignacion(asignacion.id, { motivo: motivo.trim() });
      Swal.fire('Anulada', 'La asignación fue anulada y la herramienta quedó disponible.', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo anular la asignación'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Anular asignación — {asignacion.herramienta_codigo}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: C.textMuted }}>
          Úsalo solo para entregas registradas por error. Si el técnico ya devolvió la herramienta,
          registra la devolución en su lugar.
        </Typography>
        <TextField label="Motivo" required multiline minRows={2} value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          inputProps={{ maxLength: 255 }} helperText={`${motivo.length}/255`} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Anular asignación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
