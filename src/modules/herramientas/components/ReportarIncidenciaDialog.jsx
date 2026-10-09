import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService, mensajeError } from '../services/herramientasService';
import HerramientaSelector from './HerramientaSelector';

const C = premiumTokens.colors;

const TIPOS = [
  { value: 'DANO', label: 'Daño' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'PERDIDA', label: 'Pérdida' },
  { value: 'OTRO', label: 'Otro' },
];

export default function ReportarIncidenciaDialog({ open, onClose, onSaved }) {
  const [herramienta, setHerramienta] = useState(null);
  const [tipo, setTipo] = useState('DANO');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) { setHerramienta(null); setTipo('DANO'); setDescripcion(''); }
  }, [open]);

  const valido = herramienta && descripcion.trim().length > 0;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.crearIncidencia({
        herramienta: herramienta.id, tipo, descripcion: descripcion.trim(),
      });
      Swal.fire('Registrada', 'La incidencia fue reportada correctamente', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo registrar la incidencia'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Reportar incidencia</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <HerramientaSelector open={open} value={herramienta} onChange={setHerramienta} />
          <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField label="¿Qué ocurrió?" required multiline minRows={3} value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} inputProps={{ maxLength: 1000 }}
            helperText={`${descripcion.length}/1000`} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Reportar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
