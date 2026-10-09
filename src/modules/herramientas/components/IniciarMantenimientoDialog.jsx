import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService, mensajeError } from '../services/herramientasService';
import HerramientaSelector from './HerramientaSelector';

const C = premiumTokens.colors;

/** Abre un mantenimiento. Si se pasa `plan`, queda vinculado y la herramienta viene preseleccionada. */
export default function IniciarMantenimientoDialog({ open, plan, onClose, onSaved }) {
  const [herramienta, setHerramienta] = useState(null);
  const [tipo, setTipo] = useState('PREVENTIVO');
  const [descripcion, setDescripcion] = useState('');
  const [realizadoPor, setRealizadoPor] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTipo('PREVENTIVO'); setRealizadoPor('');
    if (plan) {
      setHerramienta({ id: plan.herramienta, codigo: plan.herramienta_codigo, nombre: plan.herramienta_nombre });
      setDescripcion(plan.nombre);
    } else {
      setHerramienta(null); setDescripcion('');
    }
  }, [open, plan]);

  const valido = herramienta && descripcion.trim().length > 0;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.iniciarMantenimiento({
        herramienta: herramienta.id,
        tipo,
        descripcion: descripcion.trim(),
        plan: plan ? plan.id : null,
        realizado_por: realizadoPor.trim(),
      });
      Swal.fire('Éxito', 'Mantenimiento iniciado. La herramienta quedó fuera de circulación.', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo iniciar el mantenimiento'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Iniciar mantenimiento</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {plan ? (
            <TextField label="Herramienta" value={`${plan.herramienta_codigo} - ${plan.herramienta_nombre}`} disabled />
          ) : (
            <HerramientaSelector open={open} value={herramienta} onChange={setHerramienta} />
          )}
          <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <MenuItem value="PREVENTIVO">Preventivo</MenuItem>
            <MenuItem value="CORRECTIVO">Correctivo (reparación)</MenuItem>
          </TextField>
          <TextField label="Trabajo a realizar" required multiline minRows={2} value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} inputProps={{ maxLength: 1000 }} />
          <TextField label="Realizado por (técnico o proveedor)" value={realizadoPor}
            onChange={(e) => setRealizadoPor(e.target.value)} inputProps={{ maxLength: 150 }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Iniciar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
