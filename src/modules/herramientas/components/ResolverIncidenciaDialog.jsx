import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

const AYUDA = {
  REPARAR: 'Se abrirá un mantenimiento correctivo y la herramienta quedará en reparación.',
  DAR_DE_BAJA: 'La herramienta quedará dada de baja (o perdida, si fue robo o pérdida). No se puede deshacer.',
  REPONER: 'Solo se registra la decisión de comprar otra; el estado de la herramienta no cambia.',
  SIN_ACCION: 'Se cierra la incidencia sin cambios en la herramienta.',
};

export default function ResolverIncidenciaDialog({ open, incidencia, puedeDarDeBaja, onClose, onSaved }) {
  const [decision, setDecision] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) { setDecision(''); setNotas(''); }
  }, [open]);

  if (!incidencia) return null;

  const esPerdida = incidencia.tipo === 'ROBO' || incidencia.tipo === 'PERDIDA';
  const opciones = [
    ...(!esPerdida ? [{ value: 'REPARAR', label: 'Reparar' }] : []),
    ...(puedeDarDeBaja ? [{ value: 'DAR_DE_BAJA', label: 'Dar de baja' }] : []),
    { value: 'REPONER', label: 'Reponer (comprar otra)' },
    { value: 'SIN_ACCION', label: 'Sin acción' },
  ];

  const guardar = async () => {
    if (!decision || enviando) return;
    if (decision === 'DAR_DE_BAJA') {
      const r = await Swal.fire({
        title: '¿Dar de baja la herramienta?', text: 'Esta acción no se puede deshacer.', icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, dar de baja', cancelButtonText: 'Cancelar',
      });
      if (!r.isConfirmed) return;
    }
    try {
      setEnviando(true);
      await herramientasService.resolverIncidencia(incidencia.id, { decision, notas: notas.trim() });
      Swal.fire('Resuelta', 'La incidencia fue resuelta correctamente', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo resolver la incidencia'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Resolver incidencia — {incidencia.herramienta_codigo}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Typography variant="body2" sx={{ color: C.textMuted }}>
            {incidencia.tipo_display}: {incidencia.descripcion}
          </Typography>
          <TextField select label="Decisión" required value={decision} onChange={(e) => setDecision(e.target.value)}
            helperText={AYUDA[decision] || ' '}>
            {opciones.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField label="Notas" multiline minRows={2} value={notas}
            onChange={(e) => setNotas(e.target.value)} inputProps={{ maxLength: 1000 }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!decision || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Resolver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
