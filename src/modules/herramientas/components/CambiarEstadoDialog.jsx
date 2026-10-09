import React, { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { ESTADOS_OPERATIVOS, herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;
const ESTADOS_DE_BAJA = ['PERDIDA', 'DADA_DE_BAJA'];

export default function CambiarEstadoDialog({ open, herramienta, puedeDarDeBaja, onClose, onSaved }) {
  const [estado, setEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) { setEstado(''); setMotivo(''); }
  }, [open]);

  if (!herramienta) return null;

  // "Asignada" solo se fija al entregar (fase 2); las bajas requieren permiso específico.
  const opciones = ESTADOS_OPERATIVOS.filter(
    (e) => e.value !== 'ASIGNADA'
      && e.value !== herramienta.estado_operativo
      && (puedeDarDeBaja || !ESTADOS_DE_BAJA.includes(e.value))
  );
  const valido = estado && motivo.trim().length > 0;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.cambiarEstado(herramienta.id, {
        estado_operativo: estado, motivo: motivo.trim(),
      });
      Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo cambiar el estado'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Cambiar estado — {herramienta.codigo}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" sx={{ color: C.textMuted }}>
          Estado actual: <b>{herramienta.estado_operativo_display}</b>
        </Typography>
        <TextField select label="Nuevo estado" value={estado} onChange={(e) => setEstado(e.target.value)} required>
          {opciones.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
        </TextField>
        <TextField
          label="Motivo" value={motivo} required multiline minRows={2}
          onChange={(e) => setMotivo(e.target.value)}
          inputProps={{ maxLength: 255 }}
          helperText={`${motivo.length}/255`}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
