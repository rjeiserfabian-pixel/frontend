import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography,
} from '@mui/material';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { erroresPorCampo, herramientasService, mensajeError } from '../services/herramientasService';
import HerramientaSelector from './HerramientaSelector';

const C = premiumTokens.colors;

export const TIPOS_PLAN = [
  { value: 'PREVENTIVO', label: 'Preventivo' },
  { value: 'CALIBRACION', label: 'Calibración' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'CAMBIO_PIEZAS', label: 'Cambio de piezas (discos, carbones, etc.)' },
  { value: 'OTRO', label: 'Otro' },
];

const hoy = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function PlanFormDialog({ open, plan, onClose, onSaved }) {
  const editando = Boolean(plan);
  const [herramienta, setHerramienta] = useState(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('PREVENTIVO');
  const [dias, setDias] = useState('');
  const [horas, setHoras] = useState('');
  const [ultimaFecha, setUltimaFecha] = useState(hoy());
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrores({});
    if (plan) {
      setHerramienta({ id: plan.herramienta, codigo: plan.herramienta_codigo, nombre: plan.herramienta_nombre });
      setNombre(plan.nombre); setTipo(plan.tipo);
      setDias(plan.intervalo_dias ?? ''); setHoras(plan.intervalo_horas ?? '');
      setUltimaFecha(plan.ultima_fecha);
    } else {
      setHerramienta(null); setNombre(''); setTipo('PREVENTIVO');
      setDias(''); setHoras(''); setUltimaFecha(hoy());
    }
  }, [open, plan]);

  const diasNum = dias === '' ? null : Number(dias);
  const horasNum = horas === '' ? null : Number(horas);
  const sinIntervalo = !diasNum && !horasNum;
  const invalido = !herramienta || !nombre.trim() || sinIntervalo
    || (diasNum !== null && (!Number.isInteger(diasNum) || diasNum < 0))
    || (horasNum !== null && (Number.isNaN(horasNum) || horasNum < 0));

  const guardar = async () => {
    if (invalido || enviando) return;
    const payload = {
      nombre: nombre.trim(), tipo,
      intervalo_dias: diasNum || null,
      intervalo_horas: horasNum || null,
      ultima_fecha: ultimaFecha,
    };
    try {
      setEnviando(true);
      if (editando) await herramientasService.actualizarPlan(plan.id, payload);
      else await herramientasService.crearPlan({ ...payload, herramienta: herramienta.id });
      Swal.fire('Éxito', `Plan ${editando ? 'actualizado' : 'creado'} correctamente`, 'success');
      onSaved();
    } catch (error) {
      const porCampo = erroresPorCampo(error);
      if (Object.keys(porCampo).length) setErrores(porCampo);
      else Swal.fire('Error', mensajeError(error, 'No se pudo guardar el plan'), 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{editando ? 'Editar plan de mantenimiento' : 'Nuevo plan de mantenimiento'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {editando ? (
            <Typography variant="body2" sx={{ color: C.textMuted }}>
              Herramienta: <b>{plan.herramienta_codigo} - {plan.herramienta_nombre}</b>
            </Typography>
          ) : (
            <HerramientaSelector open={open} value={herramienta} onChange={setHerramienta} />
          )}
          <TextField label="Nombre del plan" required placeholder="Ej. Cambio de carbones" value={nombre}
            onChange={(e) => setNombre(e.target.value)} inputProps={{ maxLength: 120 }}
            error={!!errores.nombre} helperText={errores.nombre} />
          <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_PLAN.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Cada (días)" type="number" value={dias} onChange={(e) => setDias(e.target.value)}
              inputProps={{ min: 1, step: 1 }} error={!!errores.intervalo_dias} helperText={errores.intervalo_dias} />
            <TextField label="Cada (horas de uso)" type="number" value={horas} onChange={(e) => setHoras(e.target.value)}
              inputProps={{ min: 0.5, step: '0.5' }} error={!!errores.intervalo_horas} helperText={errores.intervalo_horas} />
          </Box>
          <Typography variant="caption" sx={{ color: sinIntervalo ? C.amber : C.textMuted }}>
            Indique días, horas o ambos. Con ambos, vence lo que ocurra primero.
          </Typography>
          <TextField label="Último mantenimiento" type="date" value={ultimaFecha}
            onChange={(e) => setUltimaFecha(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoy() } }} error={!!errores.ultima_fecha}
            helperText={errores.ultima_fecha || 'Desde esta fecha se cuenta el intervalo en días'} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={invalido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
