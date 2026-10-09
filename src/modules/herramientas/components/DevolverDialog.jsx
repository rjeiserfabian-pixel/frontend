import React, { useEffect, useState } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { ESTADOS_FISICOS, herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

export default function DevolverDialog({ open, asignacion, onClose, onSaved }) {
  const [estadoFisico, setEstadoFisico] = useState('');
  const [horas, setHoras] = useState('');
  const [mantenimiento, setMantenimiento] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open && asignacion) {
      setEstadoFisico(asignacion.estado_fisico_entrega);
      setHoras(''); setMantenimiento(false); setObservaciones('');
    }
  }, [open, asignacion]);

  if (!asignacion) return null;

  const horasNum = horas === '' ? 0 : Number(horas);
  const horasInvalidas = Number.isNaN(horasNum) || horasNum < 0 || horasNum > 100000;
  const iraAMantenimiento = mantenimiento || estadoFisico === 'MALO';

  const guardar = async () => {
    if (horasInvalidas || !estadoFisico || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.devolver(asignacion.id, {
        estado_fisico_devolucion: estadoFisico,
        horas_uso_periodo: horasNum,
        requiere_mantenimiento: mantenimiento,
        observaciones: observaciones.trim(),
      });
      Swal.fire('Éxito', 'Devolución registrada correctamente', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo registrar la devolución'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Registrar devolución — {asignacion.herramienta_codigo}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Typography variant="body2" sx={{ color: C.textMuted }}>
            {asignacion.herramienta_nombre} · entregada a <b>{asignacion.tecnico_nombre}</b>
          </Typography>
          <TextField select label="Estado físico al devolver" required value={estadoFisico}
            onChange={(e) => setEstadoFisico(e.target.value)}>
            {ESTADOS_FISICOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </TextField>
          <TextField
            label="Horas de uso en este período" type="number" value={horas}
            onChange={(e) => setHoras(e.target.value)}
            inputProps={{ min: 0, max: 100000, step: '0.5' }}
            error={horasInvalidas}
            helperText={horasInvalidas ? 'Ingrese un valor entre 0 y 100000' : 'Se suman al acumulado de la herramienta'}
          />
          <FormControlLabel
            control={<Checkbox checked={mantenimiento} onChange={(e) => setMantenimiento(e.target.checked)} />}
            label="Requiere mantenimiento o revisión"
          />
          {iraAMantenimiento && (
            <Typography variant="body2" sx={{ color: C.amber }}>
              La herramienta quedará en estado “En mantenimiento” y no podrá entregarse hasta revisarla.
            </Typography>
          )}
          <TextField label="Observaciones" multiline minRows={2} value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)} inputProps={{ maxLength: 500 }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={horasInvalidas || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Registrar devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
