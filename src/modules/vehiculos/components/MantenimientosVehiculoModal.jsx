import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Edit, Save, Trash2, Wrench, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';

const tipos = {
  ACEITE: 'Cambio de aceite', FILTRO_ACEITE: 'Filtro de aceite',
  FILTRO_AIRE: 'Filtro de aire', FILTRO_COMBUSTIBLE: 'Filtro de combustible',
};
const fechaHoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
const inicial = () => ({ tipo: 'ACEITE', fecha_realizado: fechaHoy(), kilometraje_realizado: '', intervalo_km: '', intervalo_meses: '' });
const km = (value) => value == null ? 'Sin lectura registrada' : `${Number(value).toLocaleString('es-PE')} km`;
const fecha = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-PE') : '-';

export default function MantenimientosVehiculoModal({ vehiculoId, puedeGestionar, onClose }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(inicial);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    vehiculoService.getMantenimientos(vehiculoId, page)
      .then((res) => {
        if (!active) return;
        setError('');
        setData(res);
        setForm((prev) => ({ ...prev, kilometraje_realizado: prev.kilometraje_realizado === '' ? (res.vehiculo.kilometraje_actual ?? '') : prev.kilometraje_realizado }));
      })
      .catch(() => { if (active) setError('No se pudieron cargar los mantenimientos.'); });
    return () => { active = false; };
  }, [vehiculoId, page, reload]);

  const cambiar = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const guardar = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      ...form,
      kilometraje_realizado: Number(form.kilometraje_realizado),
      intervalo_km: form.intervalo_km === '' ? null : Number(form.intervalo_km),
      intervalo_meses: form.intervalo_meses === '' ? null : Number(form.intervalo_meses),
    };
    try {
      if (editing) await vehiculoService.editarMantenimiento(vehiculoId, editing, payload);
      else await vehiculoService.crearMantenimiento(vehiculoId, payload);
      setEditing(null);
      setForm({ ...inicial(), kilometraje_realizado: data?.vehiculo.kilometraje_actual ?? '' });
      setPage(1);
      setReload((value) => value + 1);
    } catch (err) {
      const details = err.response?.data;
      setError(details ? Object.values(details).flat().join(' ') : 'No se pudo guardar el mantenimiento.');
    } finally { setBusy(false); }
  };
  const anular = async (registro) => {
    const result = await Swal.fire({ title: 'Anular registro', text: 'El proximo mantenimiento se calculara con el registro anterior de este tipo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Anular', cancelButtonText: 'Cancelar' });
    if (!result.isConfirmed) return;
    setBusy(true);
    try {
      await vehiculoService.anularMantenimiento(vehiculoId, registro.id);
      if (editing === registro.id) { setEditing(null); setForm(inicial()); }
      setPage(1);
      setReload((value) => value + 1);
    } catch { setError('No se pudo anular el registro.'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={busy ? undefined : onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Wrench size={21} /> Mantenimientos {data?.vehiculo.placa || ''}
        <Box sx={{ flex: 1 }} />
        <IconButton aria-label="Cerrar" onClick={onClose} disabled={busy}><X size={20} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!data ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {error ? <Button onClick={() => setReload((value) => value + 1)}>Reintentar</Button> : <CircularProgress />}
          </Box>
        ) : (
          <>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Ultimo kilometraje registrado: {km(data.vehiculo.kilometraje_actual)}</Typography>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Proximos mantenimientos</Typography>
            {data.proximos.length === 0 && <Typography color="text.secondary" variant="body2">Sin mantenimientos registrados.</Typography>}
            {data.proximos.map((item) => (
              <Box key={item.tipo} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Box>
                  <Typography fontWeight={600}>{item.tipo_display}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[item.proximo_km != null ? km(item.proximo_km) : null, item.proxima_fecha ? fecha(item.proxima_fecha) : null].filter(Boolean).join(' o ')}
                  </Typography>
                  {item.km_restantes != null && <Typography variant="caption">{item.km_restantes > 0 ? `Faltan ${km(item.km_restantes)}` : 'Limite de kilometraje alcanzado'}</Typography>}
                </Box>
                <Chip size="small" label={item.estado === 'VENCIDO' ? 'Corresponde realizar' : item.estado === 'VERIFICAR_KILOMETRAJE' ? 'Verificar kilometraje' : 'Pendiente'} color={item.estado === 'VENCIDO' ? 'error' : item.estado === 'VERIFICAR_KILOMETRAJE' ? 'warning' : 'success'} />
              </Box>
            ))}

            {puedeGestionar && (
              <Box component="form" onSubmit={guardar} sx={{ mt: 3, mb: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 2 }}>{editing ? 'Corregir registro' : 'Registrar mantenimiento realizado'}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                  <TextField select label="Mantenimiento" value={form.tipo} onChange={cambiar('tipo')} disabled={busy}>{Object.entries(tipos).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
                  <TextField type="date" label="Fecha realizada" value={form.fecha_realizado} onChange={cambiar('fecha_realizado')} required disabled={busy} InputLabelProps={{ shrink: true }} inputProps={{ max: fechaHoy() }} />
                  <TextField type="number" label="Kilometraje realizado" value={form.kilometraje_realizado} onChange={cambiar('kilometraje_realizado')} required disabled={busy} inputProps={{ min: 0, step: 1 }} />
                  <TextField type="number" label="Intervalo recomendado (km)" value={form.intervalo_km} onChange={cambiar('intervalo_km')} disabled={busy} inputProps={{ min: 1, max: 1000000, step: 1 }} />
                  <TextField type="number" label="Intervalo recomendado (meses)" value={form.intervalo_meses} onChange={cambiar('intervalo_meses')} disabled={busy} inputProps={{ min: 1, max: 120, step: 1 }} />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button type="submit" variant="contained" startIcon={<Save size={18} />} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
                  {editing && <Button disabled={busy} onClick={() => { setEditing(null); setForm(inicial()); }}>Cancelar edicion</Button>}
                </Box>
              </Box>
            )}

            <Typography fontWeight={700} sx={{ mt: 3, mb: 1 }}>Historial de mantenimientos</Typography>
            {data.historial.results.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600}>{item.tipo_display}</Typography>
                  <Typography variant="body2" color="text.secondary">{fecha(item.fecha_realizado)} / {km(item.kilometraje_realizado)}</Typography>
                  <Typography variant="caption">Intervalo: {[item.intervalo_km ? km(item.intervalo_km) : null, item.intervalo_meses ? `${item.intervalo_meses} meses` : null].filter(Boolean).join(' / ')}</Typography>
                </Box>
                {puedeGestionar && <>
                  <Tooltip title="Corregir"><IconButton disabled={busy} aria-label="Corregir mantenimiento" onClick={() => { setEditing(item.id); setForm({ tipo: item.tipo, fecha_realizado: item.fecha_realizado, kilometraje_realizado: item.kilometraje_realizado, intervalo_km: item.intervalo_km ?? '', intervalo_meses: item.intervalo_meses ?? '' }); }}><Edit size={18} /></IconButton></Tooltip>
                  <Tooltip title="Anular"><IconButton disabled={busy} color="error" aria-label="Anular mantenimiento" onClick={() => anular(item)}><Trash2 size={18} /></IconButton></Tooltip>
                </>}
              </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <IconButton aria-label="Pagina anterior" disabled={busy || !data.historial.previous} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={18} /></IconButton>
              <Typography variant="caption">Pagina {page}</Typography>
              <IconButton aria-label="Pagina siguiente" disabled={busy || !data.historial.next} onClick={() => setPage((value) => value + 1)}><ChevronRight size={18} /></IconButton>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={busy}>Cerrar</Button></DialogActions>
    </Dialog>
  );
}
