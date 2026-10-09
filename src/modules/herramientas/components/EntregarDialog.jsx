import React, { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField,
} from '@mui/material';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import FiltroBusqueda from './FiltroBusqueda';
import { herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

const hoy = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function EntregarDialog({ open, onClose, onSaved }) {
  const { tienePermiso } = usePermisos();
  const puedeExcepcion = tienePermiso('HERRAMIENTAS.ASIGNACIONES.EXCEPCION');
  const [herramienta, setHerramienta] = useState(null);
  const [opciones, setOpciones] = useState([]);
  const [texto, setTexto] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnico, setTecnico] = useState('');
  const [fecha, setFecha] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const busqueda = useDebouncedValue(texto, 400);

  // Reinicia el formulario y carga los técnicos al abrir
  useEffect(() => {
    if (!open) return undefined;
    setHerramienta(null); setTexto(''); setTecnico(''); setFecha(''); setObservaciones('');
    setErrorCarga('');
    const controller = new AbortController();
    herramientasService.getTecnicos(controller.signal)
      .then(setTecnicos)
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setErrorCarga(mensajeError(err, 'No se pudo cargar la lista de técnicos'));
      });
    return () => controller.abort();
  }, [open]);

  // Herramientas disponibles (búsqueda con debounce)
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    herramientasService.getHerramientasDisponibles(
      busqueda.trim() ? { search: busqueda.trim() } : {}, controller.signal
    )
      .then(setOpciones)
      .catch((err) => { if (err.code !== 'ERR_CANCELED') setOpciones([]); });
    return () => controller.abort();
  }, [open, busqueda]);

  const valido = Boolean(herramienta && tecnico);

  const enviar = async (extra = {}) => {
    const res = await herramientasService.entregar({
      herramienta: herramienta.id,
      tecnico,
      fecha_devolucion_esperada: fecha || null,
      observaciones: observaciones.trim(),
      ...extra,
    });
    if (res.advertencias?.length) {
      await Swal.fire('Entrega registrada', res.advertencias.join(' '), 'warning');
    } else {
      Swal.fire('Éxito', 'Herramienta entregada correctamente', 'success');
    }
    onSaved();
  };

  const guardar = async () => {
    if (!valido || enviando) return;
    try {
      setEnviando(true);
      await enviar();
    } catch (error) {
      const vencido = error?.response?.data?.errores?.codigo === 'MANTENIMIENTO_VENCIDO';
      if (!vencido) {
        Swal.fire('Error', mensajeError(error, 'No se pudo registrar la entrega'), 'error');
      } else if (!puedeExcepcion) {
        Swal.fire(
          'Mantenimiento vencido',
          `${mensajeError(error)} Registre el mantenimiento antes de entregarla o pida autorización a un responsable.`,
          'warning'
        );
      } else {
        const r = await Swal.fire({
          title: 'Mantenimiento vencido',
          text: `${mensajeError(error)} ¿Entregar de todos modos?`,
          icon: 'warning',
          input: 'text',
          inputLabel: 'Motivo de la excepción',
          showCancelButton: true,
          confirmButtonText: 'Entregar con excepción',
          cancelButtonText: 'Cancelar',
          inputValidator: (v) => (!v || !v.trim() ? 'El motivo es obligatorio' : undefined),
        });
        if (r.isConfirmed) {
          try {
            await enviar({ forzar: true, motivo_excepcion: r.value.trim() });
          } catch (err2) {
            Swal.fire('Error', mensajeError(err2, 'No se pudo registrar la entrega'), 'error');
          }
        }
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Entregar herramienta</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Autocomplete
            options={opciones}
            value={herramienta}
            onChange={(_, v) => setHerramienta(v)}
            onInputChange={(_, v, reason) => { if (reason === 'input') setTexto(v); }}
            getOptionLabel={(o) => (o ? `${o.codigo} - ${o.nombre}` : '')}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            filterOptions={(x) => x}
            noOptionsText="No hay herramientas disponibles"
            renderInput={(params) => <TextField {...params} label="Herramienta" required />}
          />
          <FiltroBusqueda
            size="medium" label="Técnico" required
            options={tecnicos} value={tecnico}
            onChange={(e) => setTecnico(e.target.value)}
            error={Boolean(errorCarga)}
            helperText={errorCarga || (tecnicos.length === 0 ? 'No hay técnicos disponibles' : '')}
          />
          <TextField
            label="Devolución esperada" type="date" value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy() } }}
            helperText="Opcional. Sirve para avisar de préstamos vencidos."
          />
          <TextField
            label="Observaciones" multiline minRows={2} value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ color: '#64748b' }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={!valido || enviando}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          {enviando ? 'Guardando...' : 'Entregar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
