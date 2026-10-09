import React, { useEffect, useState } from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  MenuItem, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { ESTADOS_FISICOS, herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

export default function FinalizarMantenimientoDialog({ open, registro, puedeVerCostos, onClose, onSaved }) {
  const [resultado, setResultado] = useState('');
  const [estadoFisico, setEstadoFisico] = useState('BUENO');
  const [fueraDeServicio, setFueraDeServicio] = useState(false);
  const [costo, setCosto] = useState('');
  const [repuestos, setRepuestos] = useState('');
  const [realizadoPor, setRealizadoPor] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open || !registro) return;
    setResultado(''); setEstadoFisico('BUENO'); setFueraDeServicio(false);
    setCosto(''); setRepuestos(''); setRealizadoPor(registro.realizado_por || '');
  }, [open, registro]);

  if (!registro) return null;

  const costoNum = costo === '' ? null : Number(costo);
  const costoInvalido = costoNum !== null && (Number.isNaN(costoNum) || costoNum < 0);
  const valido = resultado.trim().length > 0 && !costoInvalido;

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await herramientasService.finalizarMantenimiento(registro.id, {
        resultado: resultado.trim(),
        estado_fisico_final: estadoFisico,
        dejar_fuera_de_servicio: fueraDeServicio,
        costo: puedeVerCostos ? costoNum : null,
        repuestos_usados: repuestos.trim(),
        realizado_por: realizadoPor.trim(),
      });
      Swal.fire('Éxito', 'Mantenimiento finalizado correctamente', 'success');
      onSaved();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo finalizar el mantenimiento'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Finalizar mantenimiento — {registro.herramienta_codigo}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Typography variant="body2" sx={{ color: C.textMuted }}>
            {registro.herramienta_nombre} · {registro.descripcion}
          </Typography>
          <TextField label="Resultado" required multiline minRows={2} value={resultado}
            onChange={(e) => setResultado(e.target.value)} inputProps={{ maxLength: 1000 }} />
          <TextField select label="Estado físico final" value={estadoFisico}
            onChange={(e) => setEstadoFisico(e.target.value)}>
            {ESTADOS_FISICOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </TextField>
          <TextField label="Repuestos o piezas usadas" value={repuestos}
            onChange={(e) => setRepuestos(e.target.value)} inputProps={{ maxLength: 1000 }} />
          <TextField label="Realizado por" value={realizadoPor}
            onChange={(e) => setRealizadoPor(e.target.value)} inputProps={{ maxLength: 150 }} />
          {puedeVerCostos && (
            <TextField label="Costo (S/)" type="number" value={costo} onChange={(e) => setCosto(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} error={costoInvalido}
              helperText={costoInvalido ? 'Ingrese un monto válido' : 'Solo informativo; no genera un egreso en caja'} />
          )}
          <FormControlLabel
            control={<Checkbox checked={fueraDeServicio} onChange={(e) => setFueraDeServicio(e.target.checked)} />}
            label="No tiene arreglo: dejar fuera de servicio"
          />
          {registro.plan && !fueraDeServicio && (
            <Typography variant="caption" sx={{ color: C.emerald }}>
              Se reiniciará el plan “{registro.plan_nombre}” con la fecha y las horas de hoy.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Finalizar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
