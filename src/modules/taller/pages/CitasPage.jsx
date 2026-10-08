import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem,
  Paper, Popover, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CalendarDays, CalendarPlus, Bell, Check, ChevronLeft, ChevronRight, Clock, Copy, Edit, History, List, LogIn, MessageCircle, Plus, Save, Search, Settings, TrendingUp, UserCheck, UserX, X } from 'lucide-react';
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

const estadoEsperaColor = {
  PENDIENTE: 'warning',
  CONTACTADO: 'info',
  CONVERTIDO: 'success',
  DESCARTADO: 'default',
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

const getApiErrorMessage = (error, fallback) => {
  const response = error?.response?.data || {};
  const errores = response.errores || response;
  return errores?.non_field_errors?.[0]
    || errores?.detail
    || errores?.error
    || response.mensaje
    || fallback;
};

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
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialCita, setHistorialCita] = useState(null);
  const [historialItems, setHistorialItems] = useState([]);
  const [listaEspera, setListaEspera] = useState([]);
  const [listaEsperaLoading, setListaEsperaLoading] = useState(false);

  // Notificación rápida
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifData, setNotifData] = useState(null);
  const [notifCita, setNotifCita] = useState(null);
  const [copied, setCopied] = useState(false);

  // Popover de slot ocupado en agenda
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverSlot, setPopoverSlot] = useState(null);

  const agendaSucursal = filtroSucursal || activeSucursalId || sucursales[0]?.id || '';
  const agendaEndDate = addDaysInput(agendaStartDate, 6);

  useEffect(() => {
    setFiltroSucursal(activeSucursalId || '');
  }, [activeSucursalId]);

  useEffect(() => {
    Promise.all([
      api.get('inventario/sucursales/', { params: { page_size: 100 } }),
      tallerService.getTiposServicio({ estado: true, page_size: 100 }),
      api.get(`seguridad/usuarios/?rol=${encodeURIComponent('TÉCNICO_AUTOMOTRIZ')}`),
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

  useEffect(() => {
    if (viewMode !== 'espera') return;
    fetchListaEspera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, agendaSucursal]);

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

  const fetchListaEspera = async () => {
    try {
      setListaEsperaLoading(true);
      const data = await tallerService.getListaEsperaCitas({
        page_size: 100,
        ...(agendaSucursal ? { sucursal: agendaSucursal } : {}),
      });
      const lista = data?.results || data || [];
      setListaEspera(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error('Error cargando lista de espera:', err);
      Swal.fire('Error', 'No se pudo cargar la lista de espera.', 'error');
    } finally {
      setListaEsperaLoading(false);
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
      await Swal.fire('Listo', 'Configuracion de agenda actualizada.', 'success');
      setConfigOpen(false);
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

  const openHistorialCita = async (cita) => {
    try {
      setHistorialCita(cita);
      setHistorialOpen(true);
      setHistorialLoading(true);
      const data = await tallerService.getHistorialCita(cita.id);
      setHistorialItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando historial de cita:', err);
      Swal.fire('Error', 'No se pudo cargar el historial de la cita.', 'error');
      setHistorialOpen(false);
    } finally {
      setHistorialLoading(false);
    }
  };

  const abrirNotificacion = async (cita) => {
    try {
      setNotifCita(cita);
      setNotifData(null);
      setNotifOpen(true);
      setNotifLoading(true);
      setCopied(false);
      const data = await tallerService.notificarCita(cita.id);
      setNotifData(data);
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo generar el recordatorio.';
      Swal.fire('Error', msg, 'error');
      setNotifOpen(false);
    } finally {
      setNotifLoading(false);
    }
  };

  const copiarMensaje = () => {
    if (!notifData?.mensaje) return;
    navigator.clipboard.writeText(notifData.mensaje).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
    const proximoSlot = disponibilidad?.dias
      ?.flatMap((dia) => dia.slots || [])
      .find((slot) => slot.disponible);
    setEditing(null);
    setErrors({});
    setForm({
      ...emptyForm,
      sucursal: agendaSucursal || activeSucursalId || sucursales[0]?.id || '',
      fecha_inicio: slotInicio ? toInputDateTime(slotInicio) : (proximoSlot ? toInputDateTime(proximoSlot.inicio) : ''),
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
      const detail = getApiErrorMessage(err, 'No se pudo guardar la cita.');
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

  const actualizarEstadoEspera = async (item, estado) => {
    const etiquetas = {
      CONTACTADO: 'Marcar como contactado',
      DESCARTADO: 'Descartar solicitud',
    };
    const result = await Swal.fire({
      title: etiquetas[estado] || 'Actualizar solicitud',
      input: 'textarea',
      inputLabel: 'Observación interna (opcional)',
      inputPlaceholder: 'Ej.: cliente contactado por teléfono',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await tallerService.actualizarListaEsperaCita(item.id, {
        estado,
        observaciones_internas: result.value || item.observaciones_internas || '',
      });
      await fetchListaEspera();
      Swal.fire('Listo', 'Solicitud actualizada.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.detail || 'No se pudo actualizar la solicitud.', 'error');
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

  // KPIs calculados desde la lista de citas cargada
  const kpiStats = useMemo(() => {
    const total = citas.length;
    const confirmadas = citas.filter(c => c.estado === 'CONFIRMADA').length;
    const pendientes = citas.filter(c => ['SOLICITADA', 'REPROGRAMADA'].includes(c.estado)).length;
    const noAsistio = citas.filter(c => c.estado === 'NO_ASISTIO').length;
    const recepcionadas = citas.filter(c => c.estado === 'RECEPCIONADA').length;
    const canceladas = citas.filter(c => c.estado === 'CANCELADA').length;
    const finalizadas = recepcionadas + noAsistio + canceladas;
    const tasaAsistencia = finalizadas > 0 ? Math.round((recepcionadas / finalizadas) * 100) : null;
    return { total, confirmadas, pendientes, noAsistio, recepcionadas, tasaAsistencia };
  }, [citas]);

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
            <ToggleButton value="espera"><Clock size={16} style={{ marginRight: 6 }} />Espera</ToggleButton>
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

      {/* KPIs de resumen */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          {
            label: 'Total citas',
            value: loading ? '...' : totalCount,
            sub: filtroDesde && filtroHasta ? `${filtroDesde} → ${filtroHasta}` : 'Rango seleccionado',
            color: C.brand,
            icon: <CalendarDays size={20} />,
          },
          {
            label: 'Confirmadas',
            value: loading ? '...' : kpiStats.confirmadas,
            sub: 'Listas para atender',
            color: '#3b82f6',
            icon: <UserCheck size={20} />,
          },
          {
            label: 'Pendientes',
            value: loading ? '...' : kpiStats.pendientes,
            sub: 'Solicitadas / Reprogramadas',
            color: '#f59e0b',
            icon: <CalendarPlus size={20} />,
          },
          {
            label: 'Tasa asistencia',
            value: loading ? '...' : (kpiStats.tasaAsistencia !== null ? `${kpiStats.tasaAsistencia}%` : 'N/A'),
            sub: `${kpiStats.recepcionadas} recepcionadas / ${kpiStats.noAsistio} no asistieron`,
            color: kpiStats.tasaAsistencia >= 70 ? '#22c55e' : '#f87171',
            icon: <TrendingUp size={20} />,
          },
        ].map((kpi) => (
          <Paper
            key={kpi.label}
            sx={{
              p: 2,
              border: `1px solid ${alpha(kpi.color, 0.25)}`,
              borderRadius: '10px',
              bgcolor: alpha(kpi.color, 0.07),
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: kpi.color }}>
              {kpi.icon}
              <Typography variant="caption" fontWeight="700" sx={{ color: kpi.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {kpi.label}
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>
          </Paper>
        ))}
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
                      // Slot libre: abre el form de nueva cita
                      if (!occupied) {
                        return (
                          <Tooltip key={slot.inicio} title="Horario libre" arrow>
                            <span>
                              <Button
                                fullWidth
                                disabled={!puedeCrear}
                                onClick={() => openNewDialog(slot.inicio)}
                                sx={{
                                  justifyContent: 'space-between',
                                  minHeight: 42, px: 1.2, borderRadius: '8px',
                                  textTransform: 'none', color: '#dffdf0',
                                  border: `1px solid ${alpha('#34d399', 0.36)}`,
                                  bgcolor: alpha('#065f46', 0.28),
                                  '&:hover': { bgcolor: alpha('#047857', 0.34) },
                                }}
                              >
                                <span>{slot.hora}</span>
                                <Chip size="small" label="Libre" color="success" variant="filled" />
                              </Button>
                            </span>
                          </Tooltip>
                        );
                      }
                      // Slot ocupado o bloqueado: clic abre popover con detalle
                      return (
                        <span key={slot.inicio}>
                          <Button
                            fullWidth
                            onClick={(e) => {
                              setPopoverAnchor(e.currentTarget);
                              setPopoverSlot(slot);
                            }}
                            sx={{
                              justifyContent: 'space-between',
                              minHeight: 42, px: 1.2, borderRadius: '8px',
                              textTransform: 'none', color: C.textMuted,
                              border: `1px solid ${alpha('#f87171', 0.22)}`,
                              bgcolor: slot.bloqueado ? alpha('#78350f', 0.22) : alpha('#7f1d1d', 0.18),
                              '&:hover': { bgcolor: slot.bloqueado ? alpha('#78350f', 0.32) : alpha('#7f1d1d', 0.28) },
                            }}
                          >
                            <span>{slot.hora}</span>
                            <Chip
                              size="small"
                              label={slot.bloqueado ? 'Bloqueado' : `${slot.ocupadas}/${slot.capacidad}`}
                              color="error"
                              variant="outlined"
                            />
                          </Button>
                        </span>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Popover de detalle de slot ocupado */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={() => { setPopoverAnchor(null); setPopoverSlot(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            p: 0, minWidth: 280, maxWidth: 340,
            border: `1px solid ${alpha('#f87171', 0.3)}`,
            bgcolor: C.surface,
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }
        }}
      >
        {popoverSlot && (
          <Box>
            {/* Header */}
            <Box sx={{
              px: 2, py: 1.5,
              borderBottom: `1px solid ${alpha('#ffffff', 0.07)}`,
              bgcolor: popoverSlot.bloqueado ? alpha('#78350f', 0.3) : alpha('#7f1d1d', 0.3),
              borderRadius: '10px 10px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography fontWeight="800" variant="body2">
                {popoverSlot.hora} — {popoverSlot.bloqueado ? '🔒 Bloqueado' : `${popoverSlot.ocupadas}/${popoverSlot.capacidad} ocupado`}
              </Typography>
              <IconButton size="small" onClick={() => { setPopoverAnchor(null); setPopoverSlot(null); }}>
                <X size={14} />
              </IconButton>
            </Box>

            <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
              {/* Bloqueo */}
              {popoverSlot.bloqueado && popoverSlot.bloqueos?.map((b) => (
                <Paper key={b.id} sx={{ p: 1, bgcolor: alpha('#78350f', 0.18), border: `1px solid ${alpha('#f59e0b', 0.2)}`, boxShadow: 'none', borderRadius: '6px' }}>
                  <Typography variant="caption" color="#fbbf24" fontWeight="700">Motivo de bloqueo</Typography>
                  <Typography variant="body2">{b.motivo}</Typography>
                </Paper>
              ))}

              {/* Citas en ese slot */}
              {popoverSlot.citas?.length > 0 && popoverSlot.citas.map((c) => (
                <Paper key={c.id} sx={{ p: 1.25, bgcolor: alpha('#ffffff', 0.04), border: `1px solid ${C.border}`, boxShadow: 'none', borderRadius: '6px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="800">{c.cliente}</Typography>
                    <Chip size="small" label={c.estado || 'CONFIRMADA'} color={estadoColor[c.estado] || 'primary'} sx={{ height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    🚗 {c.placa} {c.tipo_servicio ? `• ${c.tipo_servicio}` : ''}
                  </Typography>
                </Paper>
              ))}

              {/* Acción: nueva cita si aún hay capacidad */}
              {!popoverSlot.bloqueado && popoverSlot.ocupadas < popoverSlot.capacidad && puedeCrear && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<CalendarPlus size={14} />}
                  onClick={() => {
                    setPopoverAnchor(null);
                    setPopoverSlot(null);
                    openNewDialog(popoverSlot.inicio);
                  }}
                  sx={{ borderColor: alpha('#34d399', 0.5), color: '#34d399', '&:hover': { borderColor: '#34d399', bgcolor: alpha('#34d399', 0.08) } }}
                >
                  Agregar cita en este slot
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Popover>

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
                      <Tooltip title="Ver historial"><IconButton color="info" onClick={() => openHistorialCita(cita)}><History size={18} /></IconButton></Tooltip>
                      {!['RECEPCIONADA', 'CANCELADA', 'NO_ASISTIO'].includes(cita.estado) && (
                        <Tooltip title="Enviar recordatorio WhatsApp">
                          <IconButton
                            sx={{ color: '#25D366' }}
                            onClick={() => abrirNotificacion(cita)}
                          >
                            <Bell size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
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

      {viewMode === 'espera' && (
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography fontWeight="800">Lista de espera</Typography>
              <Typography variant="body2" color="text.secondary">Solicitudes sin un horario disponible. Gestiona el contacto con el cliente desde aquí.</Typography>
            </Box>
            <Chip label={`${listaEspera.length} solicitudes`} size="small" color="warning" variant="outlined" />
          </Box>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Preferencia</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Sucursal</TableCell>
                  <TableCell>Origen</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listaEsperaLoading ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : listaEspera.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No hay solicitudes en lista de espera para esta sucursal.</TableCell></TableRow>
                ) : listaEspera.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700">{new Date(`${item.fecha_preferida}T00:00:00`).toLocaleDateString('es-PE')}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.hora_preferida?.slice(0, 5) || 'Sin hora'} · {item.duracion_minutos} min</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700">{`${item.nombres || ''} ${item.apellidos || ''}`.trim()}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.telefono} · {item.documento}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.placa || '-'} size="small" variant="outlined" />
                      {(item.marca || item.modelo) && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{[item.marca, item.modelo].filter(Boolean).join(' ')}</Typography>}
                    </TableCell>
                    <TableCell>{item.tipo_servicio_detalle?.nombre || 'Por definir'}</TableCell>
                    <TableCell>{item.sucursal_detalle?.nombre || '-'}</TableCell>
                    <TableCell><Chip label={item.creado_desde_portal ? 'Portal' : 'Interna'} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={item.estado_display || item.estado} color={estadoEsperaColor[item.estado] || 'default'} size="small" /></TableCell>
                    <TableCell align="center">
                      {puedeEditar && ['PENDIENTE', 'CONTACTADO'].includes(item.estado) ? (
                        <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
                          {item.estado === 'PENDIENTE' && (
                            <Tooltip title="Marcar como contactado"><IconButton color="info" onClick={() => actualizarEstadoEspera(item, 'CONTACTADO')}><MessageCircle size={18} /></IconButton></Tooltip>
                          )}
                          <Tooltip title="Descartar solicitud"><IconButton color="error" onClick={() => actualizarEstadoEspera(item, 'DESCARTADO')}><X size={18} /></IconButton></Tooltip>
                        </Box>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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



      <Dialog open={historialOpen} onClose={() => setHistorialOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Historial de cita {historialCita?.numero ? `CT-${historialCita.numero}` : ''}</DialogTitle>
        <DialogContent dividers>
          {historialLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
              <CircularProgress size={28} />
            </Box>
          ) : historialItems.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center', color: C.textMuted }}>
              Aun no hay movimientos registrados para esta cita.
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {historialItems.map((item) => (
                <Paper
                  key={item.id}
                  sx={{
                    p: 1.5,
                    border: `1px solid ${C.border}`,
                    bgcolor: alpha('#ffffff', 0.025),
                    boxShadow: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', mb: 0.75 }}>
                    <Box>
                      <Typography fontWeight="800">{item.accion_display || item.accion}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.usuario_nombre || 'Sistema'} | {new Date(item.fecha).toLocaleString()}
                      </Typography>
                    </Box>
                    {item.estado_nuevo && (
                      <Chip
                        size="small"
                        label={(item.estado_nuevo_display || item.estado_nuevo).replace('_', ' ')}
                        color={estadoColor[item.estado_nuevo] || 'default'}
                      />
                    )}
                  </Box>
                  {(item.estado_anterior || item.estado_nuevo) && (
                    <Typography variant="body2" color="text.secondary">
                      Estado: {item.estado_anterior_display || item.estado_anterior || '-'} ? {item.estado_nuevo_display || item.estado_nuevo || '-'}
                    </Typography>
                  )}
                  {(item.fecha_inicio_anterior || item.fecha_inicio_nueva) && (
                    <Typography variant="body2" color="text.secondary">
                      Fecha: {item.fecha_inicio_anterior ? new Date(item.fecha_inicio_anterior).toLocaleString() : '-'} ? {item.fecha_inicio_nueva ? new Date(item.fecha_inicio_nueva).toLocaleString() : '-'}
                    </Typography>
                  )}
                  {item.observacion && (
                    <Typography variant="body2" sx={{ mt: 0.75 }}>{item.observacion}</Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistorialOpen(false)}>Cerrar</Button>
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

      {/* Modal de recordatorio WhatsApp */}
      <Dialog open={notifOpen} onClose={() => setNotifOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MessageCircle size={22} color="#25D366" />
          Recordatorio de cita
          {notifCita && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              CT-{notifCita.numero}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {notifLoading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 160 }}>
              <CircularProgress size={28} />
            </Box>
          ) : notifData ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {/* Teléfono */}
              <Paper sx={{ p: 1.5, border: `1px solid ${C.border}`, bgcolor: alpha('#ffffff', 0.03), boxShadow: 'none' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Teléfono del cliente</Typography>
                {notifData.tiene_telefono ? (
                  <Typography fontWeight="700" sx={{ color: '#25D366' }}>{notifData.telefono_wa}</Typography>
                ) : (
                  <Typography color="error" variant="body2">Sin teléfono registrado. Registra el número del cliente primero.</Typography>
                )}
              </Paper>

              {/* Mensaje preview */}
              <Paper sx={{ p: 1.5, border: `1px solid ${C.border}`, bgcolor: alpha('#25D366', 0.06), boxShadow: 'none' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Vista previa del mensaje</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: C.text,
                    lineHeight: 1.6,
                  }}
                >
                  {notifData.mensaje}
                </Typography>
              </Paper>

              {/* Aviso */}
              <Typography variant="caption" color="text.secondary">
                Haz clic en "Abrir WhatsApp" para que se abra la conversación con el mensaje ya escrito. Tú decides si enviarlo.
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setNotifOpen(false)} color="inherit">Cerrar</Button>
          <Button
            variant="outlined"
            startIcon={<Copy size={16} />}
            onClick={copiarMensaje}
            disabled={!notifData?.mensaje}
          >
            {copied ? '¡Copiado!' : 'Copiar mensaje'}
          </Button>
          <Button
            variant="contained"
            startIcon={<MessageCircle size={18} />}
            disabled={!notifData?.whatsapp_link}
            onClick={() => window.open(notifData.whatsapp_link, '_blank', 'noopener,noreferrer')}
            sx={{
              bgcolor: '#25D366',
              '&:hover': { bgcolor: '#1da851' },
              '&.Mui-disabled': { bgcolor: alpha('#25D366', 0.3) },
            }}
          >
            Abrir WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



