import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem,
  Paper, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Edit, List, LogIn, Plus, Save, Search, Settings, UserX, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api/axios';
import { premiumTokens } from '../../../core/theme/theme';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { tallerService } from '../services/tallerService';
import VehiculosForm from '../../vehiculos/components/VehiculosForm';
import ClientesForm from '../../clientes/components/ClientesForm';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const ESTADOS = ['SOLICITADA', 'CONFIRMADA', 'REPROGRAMADA', 'RECEPCIONADA', 'CANCELADA', 'NO_ASISTIO'];
const ORIGENES = ['LLAMADA', 'WHATSAPP', 'PORTAL', 'PRESENCIAL', 'OTRO'];
const DEFAULT_ROWS_PER_PAGE = 10;
const DIAS_SEMANA = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miercoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sabado' },
  { value: 6, label: 'Domingo' },
];

const estadoColor = {
  SOLICITADA: 'warning',
  CONFIRMADA: 'primary',
  REPROGRAMADA: 'info',
  RECEPCIONADA: 'success',
  CANCELADA: 'error',
  NO_ASISTIO: 'default',
};

const emptyForm = {
  cliente: null,
  vehiculo: null,
  sucursal: '',
  tipo_servicio: null,
  fecha_inicio: '',
  duracion_minutos: 60,
  origen: 'LLAMADA',
  estado: 'CONFIRMADA',
  mecanico_preferido: null,
  kilometraje_estimado: '',
  motivo: '',
  observaciones_cliente: '',
  observaciones_internas: '',
};

const emptyBloqueoForm = {
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
};

const toInputDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toApiDateTime = (value) => value ? new Date(value).toISOString() : null;

const addMinutesIso = (value, minutes) => {
  if (!value) return null;
  return new Date(new Date(value).getTime() + Number(minutes || 60) * 60000).toISOString();
};

const getList = (data) => data?.results || data?.data?.results || data?.data || data || [];

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

const normalizarHorarios = (horarios = []) => {
  const porDia = new Map(horarios.map((horario) => [Number(horario.dia_semana), horario]));
  return DIAS_SEMANA.map((dia) => ({
    dia_semana: dia.value,
    dia_semana_display: dia.label,
    hora_inicio: porDia.get(dia.value)?.hora_inicio?.slice(0, 5) || '08:00',
    hora_fin: porDia.get(dia.value)?.hora_fin?.slice(0, 5) || '18:00',
    cerrado: Boolean(porDia.get(dia.value)?.cerrado ?? dia.value === 6),
  }));
};

export default function CitasPage() {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const { activeSucursalId } = useSucursal();

  const puedeCrear = tienePermiso('CITAS.CREAR');
  const puedeEditar = tienePermiso('CITAS.EDITAR');
  const puedeCambiarEstado = tienePermiso('CITAS.CAMBIAR_ESTADO');
  const puedeRecepcionar = tienePermiso('CITAS.RECEPCIONAR');
  const puedeConfigurarAgenda = tienePermiso('CITAS.CONFIGURAR_AGENDA');

  const hoy = new Date();
  const defaultDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const defaultHasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString().slice(0, 10);

  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // Quick registration modals
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [totalCount, setTotalCount] = useState(0);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState(activeSucursalId || '');
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [filtroDesde, setFiltroDesde] = useState(defaultDesde);
  const [filtroHasta, setFiltroHasta] = useState(defaultHasta);
  const [viewMode, setViewMode] = useState('agenda');
  const [agendaStartDate, setAgendaStartDate] = useState(toDateInput(hoy));
  const [agendaDuracion, setAgendaDuracion] = useState(60);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [agendaConfig, setAgendaConfig] = useState(null);
  const [bloqueosAgenda, setBloqueosAgenda] = useState([]);
  const [bloqueoForm, setBloqueoForm] = useState(emptyBloqueoForm);

  const agendaSucursal = filtroSucursal || activeSucursalId || sucursales[0]?.id || '';
  const agendaEndDate = addDaysInput(agendaStartDate, 6);

  useEffect(() => {
    setFiltroSucursal(activeSucursalId || '');
  }, [activeSucursalId]);

  useEffect(() => {
    Promise.all([
      api.get('inventario/sucursales/', { params: { page_size: 100 } }),
      tallerService.getTiposServicio({ estado: true, page_size: 100 }),
      api.get('seguridad/usuarios/?rol=MECANICO'),
    ]).then(([sucRes, tiposRes, mecRes]) => {
      setSucursales(getList(sucRes.data));
      setTiposServicio(getList(tiposRes));
      setMecanicos(getList(mecRes.data));
    }).catch((err) => {
      console.error('Error cargando catalogos de citas:', err);
    });
  }, []);

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filtroEstado, filtroSucursal, filtroPlaca, filtroDesde, filtroHasta]);

  useEffect(() => {
    if (viewMode !== 'agenda' || !agendaSucursal) return;
    fetchDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, agendaSucursal, agendaStartDate, agendaDuracion]);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, page_size: rowsPerPage };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroSucursal) params.sucursal = filtroSucursal;
      if (filtroPlaca) params.placa = filtroPlaca;
      if (filtroDesde) params.fecha_desde = filtroDesde;
      if (filtroHasta) params.fecha_hasta = filtroHasta;

      const data = await tallerService.getCitas(params);
      const lista = data.results || data;
      setCitas(Array.isArray(lista) ? lista : []);
      setTotalCount(data.count !== undefined ? data.count : (Array.isArray(lista) ? lista.length : 0));
    } catch (err) {
      console.error('Error cargando citas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilidad = async () => {
    try {
      setAgendaLoading(true);
      const data = await tallerService.getDisponibilidadCitas({
        sucursal: agendaSucursal,
        fecha_desde: agendaStartDate,
        fecha_hasta: agendaEndDate,
        duracion_minutos: agendaDuracion,
      });
      setDisponibilidad(data);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
      setDisponibilidad(null);
    } finally {
      setAgendaLoading(false);
    }
  };

  const fetchBloqueosAgenda = async (sucursalId = agendaSucursal) => {
    if (!sucursalId) return;
    const data = await tallerService.getBloqueosAgenda({
      sucursal: sucursalId,
      fecha_desde: agendaStartDate,
      fecha_hasta: agendaEndDate,
      activo: true,
      page_size: 100,
    });
    setBloqueosAgenda(getList(data));
  };

  const openConfigAgenda = async () => {
    if (!agendaSucursal) {
      Swal.fire('Sucursal requerida', 'Selecciona una sucursal para configurar su agenda.', 'warning');
      return;
    }
    try {
      setConfigOpen(true);
      setConfigLoading(true);
      const [config] = await Promise.all([
        tallerService.getConfiguracionAgenda(agendaSucursal),
        fetchBloqueosAgenda(agendaSucursal),
      ]);
      setAgendaConfig({
        ...config,
        horarios: normalizarHorarios(config.horarios),
      });
      setBloqueoForm({
        fecha_inicio: `${agendaStartDate}T08:00`,
        fecha_fin: `${agendaStartDate}T18:00`,
        motivo: '',
      });
    } catch (err) {
      console.error('Error cargando configuracion de agenda:', err);
      Swal.fire('Error', 'No se pudo cargar la configuracion de la agenda.', 'error');
      setConfigOpen(false);
    } finally {
      setConfigLoading(false);
    }
  };

  const updateAgendaHorario = (diaSemana, changes) => {
    setAgendaConfig((prev) => ({
      ...prev,
      horarios: prev.horarios.map((horario) => (
        horario.dia_semana === diaSemana ? { ...horario, ...changes } : horario
      )),
    }));
  };

  const saveAgendaConfig = async () => {
    if (!agendaConfig?.id) return;
    const horarioInvalido = agendaConfig.horarios.some((horario) => (
      !horario.cerrado && horario.hora_fin <= horario.hora_inicio
    ));
    if (horarioInvalido) {
      Swal.fire('Horario invalido', 'La hora de cierre debe ser mayor que la hora de inicio en los dias abiertos.', 'warning');
      return;
    }
    try {
      setConfigSaving(true);
      const payload = {
        intervalo_minutos: Number(agendaConfig.intervalo_minutos),
        capacidad_simultanea: Number(agendaConfig.capacidad_simultanea),
        activo: agendaConfig.activo,
        horarios: agendaConfig.horarios.map((horario) => ({
          dia_semana: horario.dia_semana,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          cerrado: horario.cerrado,
        })),
      };
      const updated = await tallerService.actualizarConfiguracionAgenda(agendaConfig.id, payload);
      setAgendaConfig({ ...updated, horarios: normalizarHorarios(updated.horarios) });
      await fetchDisponibilidad();
      Swal.fire('Listo', 'Configuracion de agenda actualizada.', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'No se pudo guardar la configuracion.';
      Swal.fire('Error', detail, 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  const crearBloqueoAgenda = async () => {
    if (!bloqueoForm.fecha_inicio || !bloqueoForm.fecha_fin || !bloqueoForm.motivo.trim()) {
      Swal.fire('Datos incompletos', 'Indica inicio, fin y motivo del bloqueo.', 'warning');
      return;
    }
    if (new Date(bloqueoForm.fecha_fin) <= new Date(bloqueoForm.fecha_inicio)) {
      Swal.fire('Horario invalido', 'El fin del bloqueo debe ser posterior al inicio.', 'warning');
      return;
    }
    try {
      setConfigSaving(true);
      await tallerService.crearBloqueoAgenda({
        sucursal: agendaSucursal,
        fecha_inicio: toApiDateTime(bloqueoForm.fecha_inicio),
        fecha_fin: toApiDateTime(bloqueoForm.fecha_fin),
        motivo: bloqueoForm.motivo.trim(),
        activo: true,
      });
      setBloqueoForm(emptyBloqueoForm);
      await fetchBloqueosAgenda();
      await fetchDisponibilidad();
      Swal.fire('Listo', 'Bloqueo registrado en la agenda.', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'No se pudo registrar el bloqueo.';
      Swal.fire('Error', detail, 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  const desactivarBloqueoAgenda = async (bloqueo) => {
    try {
      await tallerService.actualizarBloqueoAgenda(bloqueo.id, { activo: false });
      await fetchBloqueosAgenda();
      await fetchDisponibilidad();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo desactivar el bloqueo.', 'error');
    }
  };

  const fetchClientes = async (query = '') => {
    if (query.length === 1) return;
    const res = await api.get('clientes/', { params: { search: query } });
    setClientes(getList(res.data));
  };

  const fetchVehiculos = async (query = '') => {
    if (query.length === 1) return;
    const res = await api.get('vehiculos/', { params: { search: query } });
    setVehiculos(getList(res.data));
  };

  const openNewDialog = (slotInicio = null) => {
    setEditing(null);
    setErrors({});
    setForm({
      ...emptyForm,
      sucursal: agendaSucursal || activeSucursalId || sucursales[0]?.id || '',
      fecha_inicio: slotInicio ? toInputDateTime(slotInicio) : toInputDateTime(new Date()),
      duracion_minutos: agendaDuracion,
    });
    setDialogOpen(true);
    if (clientes.length === 0) fetchClientes('');
    if (vehiculos.length === 0) fetchVehiculos('');
  };

  const openEditDialog = (cita) => {
    setEditing(cita);
    setErrors({});
    setForm({
      cliente: cita.cliente_detalle || null,
      vehiculo: cita.vehiculo_detalle || null,
      sucursal: cita.sucursal || '',
      tipo_servicio: cita.tipo_servicio_detalle || null,
      fecha_inicio: toInputDateTime(cita.fecha_inicio),
      duracion_minutos: cita.duracion_minutos || 60,
      origen: cita.origen || 'LLAMADA',
      estado: cita.estado || 'CONFIRMADA',
      mecanico_preferido: mecanicos.find(m => m.id_usuario === cita.mecanico_preferido) || null,
      kilometraje_estimado: cita.kilometraje_estimado || '',
      motivo: cita.motivo || '',
      observaciones_cliente: cita.observaciones_cliente || '',
      observaciones_internas: cita.observaciones_internas || '',
    });
    setClientes(prev => cita.cliente_detalle && !prev.some(c => c.id === cita.cliente_detalle.id) ? [cita.cliente_detalle, ...prev] : prev);
    setVehiculos(prev => cita.vehiculo_detalle && !prev.some(v => v.id === cita.vehiculo_detalle.id) ? [cita.vehiculo_detalle, ...prev] : prev);
    setDialogOpen(true);
  };

  const validateForm = () => {
    const next = {};
    if (!form.cliente?.id) next.cliente = 'Selecciona un cliente';
    if (!form.vehiculo?.id) next.vehiculo = 'Selecciona un vehiculo';
    if (!form.sucursal) next.sucursal = 'Selecciona una sucursal';
    if (!form.fecha_inicio) next.fecha_inicio = 'Indica fecha y hora';
    if (!form.duracion_minutos || Number(form.duracion_minutos) <= 0) next.duracion_minutos = 'Duracion invalida';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const fechaInicioIso = toApiDateTime(form.fecha_inicio);
      const payload = {
        cliente: form.cliente.id,
        vehiculo: form.vehiculo.id,
        sucursal: form.sucursal,
        tipo_servicio: form.tipo_servicio?.id || null,
        fecha_inicio: fechaInicioIso,
        fecha_fin: addMinutesIso(form.fecha_inicio, form.duracion_minutos),
        duracion_minutos: Number(form.duracion_minutos),
        origen: form.origen,
        estado: editing ? form.estado : form.estado || 'CONFIRMADA',
        mecanico_preferido: form.mecanico_preferido?.id_usuario || null,
        kilometraje_estimado: form.kilometraje_estimado ? Number(form.kilometraje_estimado) : null,
        motivo: form.motivo || null,
        observaciones_cliente: form.observaciones_cliente || null,
        observaciones_internas: form.observaciones_internas || null,
      };

      if (editing) {
        await tallerService.actualizarCita(editing.id, payload);
      } else {
        await tallerService.crearCita(payload);
      }
      setDialogOpen(false);
      await fetchCitas();
      if (viewMode === 'agenda' && agendaSucursal) await fetchDisponibilidad();
      Swal.fire('Listo', editing ? 'Cita actualizada.' : 'Cita registrada.', 'success');
    } catch (err) {
      const detail = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || err.response?.data?.error || 'No se pudo guardar la cita.';
      Swal.fire('Error', detail, 'error');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (label, action) => {
    const result = await Swal.fire({
      title: label,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, continuar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await action();
      await fetchCitas();
      if (viewMode === 'agenda' && agendaSucursal) await fetchDisponibilidad();
      Swal.fire('Listo', 'Accion registrada.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo completar la accion.', 'error');
    }
  };

  const cancelarCita = async (cita) => {
    const result = await Swal.fire({
      title: 'Cancelar cita',
      input: 'textarea',
      inputLabel: 'Motivo',
      inputPlaceholder: 'Indica el motivo de cancelacion',
      showCancelButton: true,
      confirmButtonText: 'Cancelar cita',
      cancelButtonText: 'Volver',
    });
    if (!result.isConfirmed) return;
    try {
      await tallerService.cancelarCita(cita.id, result.value || '');
      await fetchCitas();
      if (viewMode === 'agenda' && agendaSucursal) await fetchDisponibilidad();
      Swal.fire('Listo', 'Cita cancelada.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo cancelar la cita.', 'error');
    }
  };

  const recepcionar = async (cita) => {
    const result = await Swal.fire({
      title: 'Recepcionar y crear orden de trabajo',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, recepcionar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      const updated = await tallerService.recepcionarCita(cita.id);
      if (updated?.orden_trabajo) {
        navigate(`/taller/ordenes/${updated.orden_trabajo}`);
      } else {
        await fetchCitas();
        if (viewMode === 'agenda' && agendaSucursal) await fetchDisponibilidad();
        Swal.fire('Listo', 'Cita recepcionada.', 'success');
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'No se pudo recepcionar la cita.', 'error');
    }
  };

  const rows = useMemo(() => citas, [citas]);
  const totalSlots = disponibilidad?.dias?.reduce((total, dia) => total + dia.slots.length, 0) || 0;
  const freeSlots = disponibilidad?.dias?.reduce((total, dia) => total + dia.slots.filter(slot => slot.disponible).length, 0) || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="700">Citas</Typography>
          <Typography variant="body2" color="text.secondary">Agenda interna y recepcion de vehiculos.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={viewMode}
            onChange={(e, value) => value && setViewMode(value)}
            sx={{
              bgcolor: alpha('#ffffff', 0.035),
              border: `1px solid ${C.border}`,
              '& .MuiToggleButton-root': { color: C.textMuted, borderColor: C.border, px: 1.5 },
              '& .Mui-selected': { color: C.text, bgcolor: alpha(C.brand, 0.18) },
            }}
          >
            <ToggleButton value="agenda"><CalendarDays size={16} style={{ marginRight: 6 }} />Agenda</ToggleButton>
            <ToggleButton value="lista"><List size={16} style={{ marginRight: 6 }} />Lista</ToggleButton>
          </ToggleButtonGroup>
          {viewMode === 'agenda' && puedeConfigurarAgenda && (
            <Button
              variant="outlined"
              startIcon={<Settings size={18} />}
              onClick={openConfigAgenda}
              disabled={!agendaSucursal}
            >
              Configurar agenda
            </Button>
          )}
          {puedeCrear && (
            <Button variant="contained" startIcon={<CalendarPlus size={18} />} onClick={() => openNewDialog()}>
              Nueva Cita
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.06)}, transparent 42%)` }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField select size="small" label="Estado" sx={{ width: 180 }} value={filtroEstado} onChange={(e) => { setPage(0); setFiltroEstado(e.target.value); }}>
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((estado) => <MenuItem key={estado} value={estado}>{estado.replace('_', ' ')}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Sucursal" sx={{ width: 220 }} value={filtroSucursal} onChange={(e) => { setPage(0); setFiltroSucursal(e.target.value); }}>
            <MenuItem value="">Todas</MenuItem>
            {sucursales.map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Placa" sx={{ width: 140 }} value={filtroPlaca} onChange={(e) => { setPage(0); setFiltroPlaca(e.target.value); }} InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }} />
          <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} value={filtroDesde} onChange={(e) => { setPage(0); setFiltroDesde(e.target.value); }} />
          <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} value={filtroHasta} onChange={(e) => { setPage(0); setFiltroHasta(e.target.value); }} />
          {viewMode === 'agenda' && (
            <TextField
              select
              size="small"
              label="Duracion agenda"
              sx={{ width: 170 }}
              value={agendaDuracion}
              onChange={(e) => setAgendaDuracion(Number(e.target.value))}
            >
              {[30, 45, 60, 90, 120].map((min) => (
                <MenuItem key={min} value={min}>{min} min</MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </Paper>

      {viewMode === 'agenda' && (
        <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, bgcolor: C.surface }}>
          <Box sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${C.border}`,
            backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.08)}, transparent 48%)`,
          }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="800">Disponibilidad semanal</Typography>
              <Typography variant="body2" color="text.secondary">
                {agendaSucursal
                  ? `${freeSlots} horarios libres de ${totalSlots} | Intervalo ${disponibilidad?.intervalo_minutos || '-'} min | Capacidad ${disponibilidad?.capacidad || '-'}`
                  : 'Selecciona una sucursal para ver horarios'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <IconButton
                onClick={() => setAgendaStartDate(addDaysInput(agendaStartDate, -7))}
                sx={{ border: `1px solid ${C.border}`, bgcolor: alpha('#ffffff', 0.04) }}
              >
                <ChevronLeft size={18} />
              </IconButton>
              <TextField
                type="date"
                size="small"
                label="Inicio"
                InputLabelProps={{ shrink: true }}
                value={agendaStartDate}
                onChange={(e) => setAgendaStartDate(e.target.value)}
                sx={{ width: 160 }}
              />
              <IconButton
                onClick={() => setAgendaStartDate(addDaysInput(agendaStartDate, 7))}
                sx={{ border: `1px solid ${C.border}`, bgcolor: alpha('#ffffff', 0.04) }}
              >
                <ChevronRight size={18} />
              </IconButton>
            </Box>
          </Box>

          {agendaLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
              <CircularProgress size={30} />
            </Box>
          ) : !agendaSucursal ? (
            <Box sx={{ p: 4, textAlign: 'center', color: C.textMuted }}>
              Selecciona una sucursal para calcular disponibilidad.
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: `repeat(${disponibilidad?.dias?.length || 1}, minmax(150px, 1fr))` },
              gap: 0,
              overflowX: 'auto',
            }}>
              {(disponibilidad?.dias || []).map((dia) => (
                <Box key={dia.fecha} sx={{ minWidth: 155, borderRight: { md: `1px solid ${C.border}` }, '&:last-child': { borderRight: 0 } }}>
                  <Box sx={{ p: 1.5, borderBottom: `1px solid ${C.border}`, bgcolor: alpha('#ffffff', 0.035), position: 'sticky', top: 0, zIndex: 1 }}>
                    <Typography fontWeight="800" sx={{ textTransform: 'capitalize' }}>{formatDayTitle(dia.fecha)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dia.cerrado ? 'Cerrado' : `${dia.hora_inicio} - ${dia.hora_fin} | ${dia.slots.filter(slot => slot.disponible).length} libres`}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1, display: 'grid', gap: 0.75 }}>
                    {dia.cerrado ? (
                      <Box sx={{
                        minHeight: 110,
                        display: 'grid',
                        placeItems: 'center',
                        border: `1px dashed ${alpha(C.textMuted, 0.25)}`,
                        borderRadius: '8px',
                        color: C.textMuted,
                        bgcolor: alpha('#ffffff', 0.025),
                      }}>
                        <Typography variant="body2" fontWeight="700">Dia cerrado</Typography>
                      </Box>
                    ) : dia.slots.map((slot) => {
                      const occupied = !slot.disponible;
                      const title = slot.citas.length
                        ? slot.citas.map(c => `${c.hora || ''}${c.placa} ${c.cliente}`.trim()).join('\n')
                        : (slot.motivo || 'Horario libre');
                      return (
                        <Tooltip key={slot.inicio} title={<span style={{ whiteSpace: 'pre-line' }}>{title}</span>} arrow>
                          <span>
                            <Button
                              fullWidth
                              disabled={occupied || !puedeCrear}
                              onClick={() => openNewDialog(slot.inicio)}
                              sx={{
                                justifyContent: 'space-between',
                                minHeight: 42,
                                px: 1.2,
                                borderRadius: '8px',
                                textTransform: 'none',
                                color: occupied ? C.textMuted : '#dffdf0',
                                border: `1px solid ${occupied ? alpha('#f87171', 0.22) : alpha('#34d399', 0.36)}`,
                                bgcolor: occupied ? alpha('#7f1d1d', 0.18) : alpha('#065f46', 0.28),
                                '&:hover': {
                                  bgcolor: occupied ? alpha('#7f1d1d', 0.18) : alpha('#047857', 0.34),
                                },
                                '&.Mui-disabled': {
                                  color: occupied ? alpha(C.textMuted, 0.9) : alpha('#dffdf0', 0.5),
                                },
                              }}
                            >
                              <span>{slot.hora}</span>
                              <Chip
                                size="small"
                                label={slot.disponible ? 'Libre' : (slot.bloqueado ? 'Bloqueado' : `${slot.ocupadas}/${slot.capacidad}`)}
                                color={slot.disponible ? 'success' : 'error'}
                                variant={slot.disponible ? 'filled' : 'outlined'}
                              />
                            </Button>
                          </span>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {viewMode === 'lista' && (
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nro</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Vehiculo</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No hay citas registradas.</TableCell></TableRow>
              ) : rows.map((cita) => (
                <TableRow key={cita.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#bae6fd' }}>CT-{cita.numero}</TableCell>
                  <TableCell>{new Date(cita.fecha_inicio).toLocaleString()}</TableCell>
                  <TableCell>{`${cita.cliente_detalle?.nombres || ''} ${cita.cliente_detalle?.apellidos || ''}`.trim()}</TableCell>
                  <TableCell><Chip label={cita.vehiculo_detalle?.placa || '-'} size="small" variant="outlined" /></TableCell>
                  <TableCell>{cita.tipo_servicio_detalle?.nombre || '-'}</TableCell>
                  <TableCell>{cita.sucursal_detalle?.nombre || '-'}</TableCell>
                  <TableCell><Chip label={(cita.estado_display || cita.estado).replace('_', ' ')} color={estadoColor[cita.estado] || 'default'} size="small" /></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
                      {puedeEditar && cita.estado !== 'RECEPCIONADA' && (
                        <Tooltip title="Editar / reprogramar"><IconButton color="primary" onClick={() => openEditDialog(cita)}><Edit size={18} /></IconButton></Tooltip>
                      )}
                      {puedeCambiarEstado && !['CONFIRMADA', 'RECEPCIONADA', 'CANCELADA'].includes(cita.estado) && (
                        <Tooltip title="Confirmar"><IconButton color="success" onClick={() => runAction('Confirmar cita', () => tallerService.confirmarCita(cita.id))}><Check size={18} /></IconButton></Tooltip>
                      )}
                      {puedeRecepcionar && !['RECEPCIONADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado) && (
                        <Tooltip title="Recepcionar"><IconButton color="success" onClick={() => recepcionar(cita)}><LogIn size={18} /></IconButton></Tooltip>
                      )}
                      {puedeCambiarEstado && !['RECEPCIONADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado) && (
                        <Tooltip title="No asistio"><IconButton color="warning" onClick={() => runAction('Marcar como no asistio', () => tallerService.marcarNoAsistio(cita.id))}><UserX size={18} /></IconButton></Tooltip>
                      )}
                      {puedeCambiarEstado && !['RECEPCIONADA', 'CANCELADA'].includes(cita.estado) && (
                        <Tooltip title="Cancelar"><IconButton color="error" onClick={() => cancelarCita(cita)}><X size={18} /></IconButton></Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por pagina:"
        />
      </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, pt: 1 }}>
            {/* Cliente con botón de registro rápido */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={clientes}
                  value={form.cliente}
                  onOpen={() => clientes.length === 0 && fetchClientes('')}
                  onInputChange={(e, value, reason) => {
                    if (reason === 'input' || reason === 'clear') fetchClientes(value);
                  }}
                  getOptionLabel={(option) => `${option.dni} - ${option.nombres} ${option.apellidos || ''}`.trim()}
                  onChange={(e, value) => setForm(prev => ({ ...prev, cliente: value }))}
                  renderInput={(params) => <TextField {...params} label="Cliente *" error={!!errors.cliente} helperText={errors.cliente} />}
                />
              </Box>
              <Tooltip title="Registrar nuevo cliente">
                <Button
                  variant="contained"
                  onClick={() => setClientModalOpen(true)}
                  sx={{
                    minWidth: 44, px: 0, height: 56,
                    borderRadius: '8px',
                    bgcolor: alpha('#e11d48', 0.85),
                    '&:hover': { bgcolor: '#e11d48' },
                    boxShadow: 'none',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={22} />
                </Button>
              </Tooltip>
            </Box>

            {/* Vehículo con botón de registro rápido */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={vehiculos}
                  value={form.vehiculo}
                  onOpen={() => vehiculos.length === 0 && fetchVehiculos('')}
                  onInputChange={(e, value, reason) => {
                    if (reason === 'input' || reason === 'clear') fetchVehiculos(value);
                  }}
                  getOptionLabel={(option) => `${option.placa} - ${option.marca} ${option.modelo}`}
                  onChange={(e, value) => setForm(prev => ({ ...prev, vehiculo: value, kilometraje_estimado: value?.kilometraje_actual || prev.kilometraje_estimado }))}
                  renderInput={(params) => <TextField {...params} label="Vehiculo *" error={!!errors.vehiculo} helperText={errors.vehiculo} />}
                />
              </Box>
              <Tooltip title="Registrar nuevo vehículo">
                <Button
                  variant="contained"
                  onClick={() => setVehicleModalOpen(true)}
                  sx={{
                    minWidth: 44, px: 0, height: 56,
                    borderRadius: '8px',
                    bgcolor: alpha('#e11d48', 0.85),
                    '&:hover': { bgcolor: '#e11d48' },
                    boxShadow: 'none',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={22} />
                </Button>
              </Tooltip>
            </Box>
            <TextField select label="Sucursal *" value={form.sucursal} onChange={(e) => setForm(prev => ({ ...prev, sucursal: e.target.value }))} error={!!errors.sucursal} helperText={errors.sucursal}>
              {sucursales.map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
            </TextField>
            <Autocomplete
              options={tiposServicio}
              value={form.tipo_servicio}
              getOptionLabel={(option) => option.nombre}
              onChange={(e, value) => setForm(prev => ({ ...prev, tipo_servicio: value }))}
              renderInput={(params) => <TextField {...params} label="Tipo de servicio" />}
            />
            <TextField type="datetime-local" label="Fecha y hora *" InputLabelProps={{ shrink: true }} value={form.fecha_inicio} onChange={(e) => setForm(prev => ({ ...prev, fecha_inicio: e.target.value, estado: editing ? 'REPROGRAMADA' : prev.estado }))} error={!!errors.fecha_inicio} helperText={errors.fecha_inicio} />
            <TextField type="number" label="Duracion (min)" value={form.duracion_minutos} onChange={(e) => setForm(prev => ({ ...prev, duracion_minutos: e.target.value }))} error={!!errors.duracion_minutos} helperText={errors.duracion_minutos} />
            <TextField select label="Origen" value={form.origen} onChange={(e) => setForm(prev => ({ ...prev, origen: e.target.value }))}>
              {ORIGENES.map((origen) => <MenuItem key={origen} value={origen}>{origen}</MenuItem>)}
            </TextField>
            <Autocomplete
              options={mecanicos}
              value={form.mecanico_preferido}
              getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
              onChange={(e, value) => setForm(prev => ({ ...prev, mecanico_preferido: value }))}
              renderInput={(params) => <TextField {...params} label="Mecanico sugerido" />}
            />
            <TextField type="number" label="Kilometraje estimado" value={form.kilometraje_estimado} onChange={(e) => setForm(prev => ({ ...prev, kilometraje_estimado: e.target.value }))} />
            <TextField select label="Estado" value={form.estado} onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value }))} disabled={!editing}>
              {ESTADOS.map((estado) => <MenuItem key={estado} value={estado}>{estado.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField multiline minRows={2} label="Motivo" value={form.motivo} onChange={(e) => setForm(prev => ({ ...prev, motivo: e.target.value }))} sx={{ gridColumn: { xs: 'auto', md: '1 / span 2' } }} />
            <TextField multiline minRows={2} label="Observaciones del cliente" value={form.observaciones_cliente} onChange={(e) => setForm(prev => ({ ...prev, observaciones_cliente: e.target.value }))} />
            <TextField multiline minRows={2} label="Observaciones internas" value={form.observaciones_internas} onChange={(e) => setForm(prev => ({ ...prev, observaciones_internas: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress color="inherit" size={18} /> : <Plus size={18} />} onClick={handleSave} disabled={saving || (editing ? !puedeEditar : !puedeCrear)}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configurar agenda por sucursal</DialogTitle>
        <DialogContent dividers>
          {configLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
              <CircularProgress size={30} />
            </Box>
          ) : agendaConfig ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Paper sx={{ p: 2, border: `1px solid ${C.border}`, bgcolor: alpha('#ffffff', 0.025), boxShadow: 'none' }}>
                <Typography fontWeight="800" sx={{ mb: 0.5 }}>
                  {agendaConfig.sucursal_detalle?.nombre || 'Sucursal seleccionada'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Define capacidad, intervalo de la grilla y horarios reales de atencion. Los dias cerrados no permiten reservas.
                </Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  type="number"
                  label="Intervalo de agenda (min)"
                  value={agendaConfig.intervalo_minutos}
                  onChange={(e) => setAgendaConfig(prev => ({ ...prev, intervalo_minutos: e.target.value }))}
                  inputProps={{ min: 5 }}
                />
                <TextField
                  type="number"
                  label="Capacidad simultanea"
                  value={agendaConfig.capacidad_simultanea}
                  onChange={(e) => setAgendaConfig(prev => ({ ...prev, capacidad_simultanea: e.target.value }))}
                  inputProps={{ min: 1 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(agendaConfig.activo)}
                      onChange={(e) => setAgendaConfig(prev => ({ ...prev, activo: e.target.checked }))}
                    />
                  }
                  label="Agenda activa"
                />
              </Box>

              <Box>
                <Typography fontWeight="800" sx={{ mb: 1 }}>Horario semanal</Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {agendaConfig.horarios.map((horario) => (
                    <Paper
                      key={horario.dia_semana}
                      sx={{
                        p: 1.25,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '150px 1fr 1fr 140px' },
                        gap: 1.5,
                        alignItems: 'center',
                        border: `1px solid ${C.border}`,
                        bgcolor: horario.cerrado ? alpha('#7f1d1d', 0.12) : alpha('#064e3b', 0.12),
                        boxShadow: 'none',
                      }}
                    >
                      <Typography fontWeight="800">{horario.dia_semana_display}</Typography>
                      <TextField
                        type="time"
                        size="small"
                        label="Inicio"
                        InputLabelProps={{ shrink: true }}
                        value={horario.hora_inicio}
                        disabled={horario.cerrado}
                        onChange={(e) => updateAgendaHorario(horario.dia_semana, { hora_inicio: e.target.value })}
                      />
                      <TextField
                        type="time"
                        size="small"
                        label="Fin"
                        InputLabelProps={{ shrink: true }}
                        value={horario.hora_fin}
                        disabled={horario.cerrado}
                        onChange={(e) => updateAgendaHorario(horario.dia_semana, { hora_fin: e.target.value })}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(horario.cerrado)}
                            onChange={(e) => updateAgendaHorario(horario.dia_semana, { cerrado: e.target.checked })}
                          />
                        }
                        label="Cerrado"
                      />
                    </Paper>
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography fontWeight="800" sx={{ mb: 1 }}>Bloqueos temporales</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Usa bloqueos para feriados, reuniones internas, mantenimiento o cualquier espacio donde no se debe aceptar citas.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.4fr auto' }, gap: 1.5, alignItems: 'center', mb: 2 }}>
                  <TextField
                    type="datetime-local"
                    size="small"
                    label="Inicio"
                    InputLabelProps={{ shrink: true }}
                    value={bloqueoForm.fecha_inicio}
                    onChange={(e) => setBloqueoForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  />
                  <TextField
                    type="datetime-local"
                    size="small"
                    label="Fin"
                    InputLabelProps={{ shrink: true }}
                    value={bloqueoForm.fecha_fin}
                    onChange={(e) => setBloqueoForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  />
                  <TextField
                    size="small"
                    label="Motivo"
                    value={bloqueoForm.motivo}
                    onChange={(e) => setBloqueoForm(prev => ({ ...prev, motivo: e.target.value }))}
                  />
                  <Button variant="outlined" startIcon={<Plus size={16} />} onClick={crearBloqueoAgenda} disabled={configSaving}>
                    Agregar
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gap: 1 }}>
                  {bloqueosAgenda.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No hay bloqueos activos en el rango visible.</Typography>
                  ) : bloqueosAgenda.map((bloqueo) => (
                    <Paper
                      key={bloqueo.id}
                      sx={{
                        p: 1.25,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        alignItems: 'center',
                        border: `1px solid ${C.border}`,
                        bgcolor: alpha('#ffffff', 0.025),
                        boxShadow: 'none',
                      }}
                    >
                      <Box>
                        <Typography fontWeight="800">{bloqueo.motivo}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(bloqueo.fecha_inicio).toLocaleString()} - {new Date(bloqueo.fecha_fin).toLocaleString()}
                        </Typography>
                      </Box>
                      <Button size="small" color="error" onClick={() => desactivarBloqueoAgenda(bloqueo)}>
                        Quitar
                      </Button>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">No se pudo cargar la configuracion.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfigOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={configSaving ? <CircularProgress color="inherit" size={18} /> : <Save size={18} />}
            onClick={saveAgendaConfig}
            disabled={configSaving || configLoading || !agendaConfig}
          >
            {configSaving ? 'Guardando...' : 'Guardar configuracion'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Modal de registro rápido de cliente */}
      {clientModalOpen && (
        <ClientesForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSuccess={(createdClient) => {
            if (!createdClient?.id) return;
            setClientes(prev => prev.some(c => c.id === createdClient.id) ? prev : [createdClient, ...prev]);
            setForm(prev => ({ ...prev, cliente: createdClient }));
            setClientModalOpen(false);
          }}
        />
      )}



      {/* Modal de registro rápido de vehículo */}
      {vehicleModalOpen && (
        <VehiculosForm
          open={vehicleModalOpen}
          onClose={() => setVehicleModalOpen(false)}
          onSuccess={(createdVehicle) => {
            if (!createdVehicle?.id) return;
            setVehiculos(prev => prev.some(v => v.id === createdVehicle.id) ? prev : [createdVehicle, ...prev]);
            setForm(prev => ({
              ...prev,
              vehiculo: createdVehicle,
              kilometraje_estimado: createdVehicle.kilometraje_actual || prev.kilometraje_estimado,
            }));
            setVehicleModalOpen(false);
          }}
        />
      )}
    </Box>
  );
}


