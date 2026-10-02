import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, MenuItem, Paper, TextField, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CalendarDays, CheckCircle2, Clock, Send, Wrench } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

const toDateInput = (date) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const addDaysInput = (dateValue, days) => {
  const base = new Date(`${dateValue}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toDateInput(base);
};

const formatDayTitle = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(date);
};

const emptyForm = {
  sucursal: '',
  tipo_servicio: '',
  fecha_inicio: '',
  duracion_minutos: 60,
  documento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  email: '',
  placa: '',
  marca: '',
  modelo: '',
  motivo: '',
};

export default function ReservaCitaPublicaPage() {
  const hoy = toDateInput(new Date());
  const [catalogo, setCatalogo] = useState({ sucursales: [], tipos_servicio: [] });
  const [form, setForm] = useState(emptyForm);
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultado, setResultado] = useState(null);

  const fechaHasta = addDaysInput(fechaInicio, 6);

  useEffect(() => {
    api.get('taller/public/citas/catalogo/')
      .then((res) => {
        const sucursales = res.data?.sucursales || [];
        const tipos = res.data?.tipos_servicio || [];
        setCatalogo({ sucursales, tipos_servicio: tipos });
        setForm(prev => ({
          ...prev,
          sucursal: prev.sucursal || sucursales[0]?.id || '',
          tipo_servicio: prev.tipo_servicio || tipos[0]?.id || '',
        }));
      })
      .catch(() => Swal.fire('Error', 'No se pudo cargar el catalogo de reservas.', 'error'));
  }, []);

  useEffect(() => {
    if (!form.sucursal) return;
    setLoading(true);
    api.get('taller/public/citas/disponibilidad/', {
      params: {
        sucursal: form.sucursal,
        fecha_desde: fechaInicio,
        fecha_hasta: fechaHasta,
        duracion_minutos: form.duracion_minutos,
      },
    }).then((res) => setDisponibilidad(res.data))
      .catch(() => setDisponibilidad(null))
      .finally(() => setLoading(false));
  }, [form.sucursal, form.duracion_minutos, fechaInicio, fechaHasta]);

  const totalLibres = useMemo(() => (
    disponibilidad?.dias?.reduce((total, dia) => total + dia.slots.filter(s => s.disponible).length, 0) || 0
  ), [disponibilidad]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const seleccionarSlot = (slot) => {
    updateForm('fecha_inicio', slot.inicio);
  };

  const validar = (requiereHorario = true) => {
    const requeridos = ['sucursal', 'documento', 'nombres', 'telefono', 'placa'];
    if (requiereHorario) requeridos.splice(1, 0, 'fecha_inicio');
    const falta = requeridos.find((field) => !String(form[field] || '').trim());
    if (falta) {
      const mensaje = requiereHorario
        ? 'Completa sucursal, horario, documento, nombre, teléfono y placa.'
        : 'Completa sucursal, documento, nombre, teléfono y placa para la lista de espera.';
      Swal.fire('Datos incompletos', mensaje, 'warning');
      return false;
    }
    return true;
  };

  const enviarReserva = async (listaEspera = false) => {
    if (!validar(!listaEspera)) return;
    try {
      setSending(true);
      const fecha = form.fecha_inicio || `${fechaInicio}T08:00:00`;
      const payload = {
        ...form,
        tipo_servicio: form.tipo_servicio || null,
        placa: form.placa.trim().replaceAll('-', '').replaceAll(' ', '').toUpperCase(),
        fecha_inicio: fecha,
        duracion_minutos: Number(form.duracion_minutos),
        lista_espera: listaEspera,
      };
      const res = await api.post('taller/public/citas/reservar/', payload);
      setResultado(res.data);
      Swal.fire('Listo', res.data?.mensaje || 'Solicitud registrada.', 'success');
    } catch (err) {
      const data = err.response?.data;
      const detail = data?.non_field_errors?.[0] || data?.detail || data?.error || 'No se pudo registrar la solicitud.';
      Swal.fire('Error', detail, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#07111f', color: '#e5edf8', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ width: 52, height: 52, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha('#ef4444', 0.2), border: '1px solid rgba(248,113,113,.35)' }}>
            <Wrench />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="900">Reserva tu cita</Typography>
            <Typography color="#94a3b8">Elige un horario disponible o solicita lista de espera.</Typography>
          </Box>
        </Box>

        {resultado ? (
          <Paper sx={{ p: 4, bgcolor: '#0f172a', color: '#e5edf8', border: '1px solid rgba(148,163,184,.2)' }}>
            <CheckCircle2 color="#34d399" size={44} />
            <Typography variant="h5" fontWeight="900" sx={{ mt: 2 }}>Solicitud registrada</Typography>
            <Typography sx={{ mt: 1 }}>{resultado.mensaje}</Typography>
            {resultado.numero && <Typography sx={{ mt: 1 }}>Numero de cita: <strong>CT-{resultado.numero}</strong></Typography>}
            <Button sx={{ mt: 3 }} variant="contained" onClick={() => { setResultado(null); setForm(emptyForm); }}>
              Registrar otra solicitud
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '360px 1fr' }, gap: 3 }}>
            <Paper sx={{ p: 2.5, bgcolor: '#0f172a', color: '#e5edf8', border: '1px solid rgba(148,163,184,.2)' }}>
              <Typography fontWeight="900" sx={{ mb: 2 }}>Tus datos</Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <TextField select label="Sucursal" value={form.sucursal} onChange={(e) => updateForm('sucursal', e.target.value)}>
                  {catalogo.sucursales.map(s => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                </TextField>
                <TextField select label="Servicio" value={form.tipo_servicio} onChange={(e) => updateForm('tipo_servicio', e.target.value)}>
                  <MenuItem value="">Por definir</MenuItem>
                  {catalogo.tipos_servicio.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                </TextField>
                <TextField select label="Duracion estimada" value={form.duracion_minutos} onChange={(e) => updateForm('duracion_minutos', e.target.value)}>
                  {[30, 45, 60, 90, 120].map(min => <MenuItem key={min} value={min}>{min} min</MenuItem>)}
                </TextField>
                <TextField label="Documento DNI/RUC" value={form.documento} onChange={(e) => updateForm('documento', e.target.value)} />
                <TextField label="Nombres / razon social" value={form.nombres} onChange={(e) => updateForm('nombres', e.target.value)} />
                <TextField label="Apellidos" value={form.apellidos} onChange={(e) => updateForm('apellidos', e.target.value)} />
                <TextField label="Telefono" value={form.telefono} onChange={(e) => updateForm('telefono', e.target.value)} />
                <TextField label="Email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                <TextField label="Placa" value={form.placa} onChange={(e) => updateForm('placa', e.target.value.toUpperCase())} />
                <TextField label="Marca" value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} />
                <TextField label="Modelo" value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} />
                <TextField multiline minRows={2} label="Motivo" value={form.motivo} onChange={(e) => updateForm('motivo', e.target.value)} />
                <Button variant="contained" startIcon={sending ? <CircularProgress color="inherit" size={18} /> : <Send size={18} />} disabled={sending} onClick={() => enviarReserva(false)}>
                  Solicitar cita
                </Button>
                <Button variant="outlined" startIcon={<Clock size={18} />} disabled={sending} onClick={() => enviarReserva(true)}>
                  Entrar a lista de espera
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 2.5, bgcolor: '#0f172a', color: '#e5edf8', border: '1px solid rgba(148,163,184,.2)', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography fontWeight="900"><CalendarDays size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Disponibilidad</Typography>
                  <Typography color="#94a3b8" variant="body2">{totalLibres} horarios libres en la semana</Typography>
                </Box>
                <TextField type="date" size="small" label="Semana" InputLabelProps={{ shrink: true }} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </Box>
              {loading ? (
                <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(7, minmax(130px, 1fr))' }, gap: 1, overflowX: 'auto' }}>
                  {(disponibilidad?.dias || []).map((dia) => (
                    <Box key={dia.fecha} sx={{ minWidth: 130 }}>
                      <Typography fontWeight="800" sx={{ mb: 1, textTransform: 'capitalize' }}>{formatDayTitle(dia.fecha)}</Typography>
                      {dia.cerrado ? (
                        <Box sx={{ p: 2, border: '1px dashed rgba(148,163,184,.25)', borderRadius: 1.5, color: '#94a3b8', textAlign: 'center' }}>Cerrado</Box>
                      ) : (
                        <Box sx={{ display: 'grid', gap: 0.75 }}>
                          {dia.slots.map(slot => (
                            <Button
                              key={slot.inicio}
                              disabled={!slot.disponible}
                              onClick={() => seleccionarSlot(slot)}
                              sx={{
                                justifyContent: 'space-between',
                                color: slot.disponible ? '#dcfce7' : '#94a3b8',
                                border: `1px solid ${form.fecha_inicio === slot.inicio ? '#38bdf8' : (slot.disponible ? 'rgba(52,211,153,.35)' : 'rgba(248,113,113,.25)')}`,
                                bgcolor: form.fecha_inicio === slot.inicio ? 'rgba(14,165,233,.25)' : (slot.disponible ? 'rgba(5,150,105,.22)' : 'rgba(127,29,29,.16)'),
                              }}
                            >
                              <span>{slot.hora}</span>
                              <Chip size="small" label={slot.disponible ? 'Libre' : 'Ocupado'} color={slot.disponible ? 'success' : 'default'} />
                            </Button>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
