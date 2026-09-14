import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Stepper, Step, StepLabel, Autocomplete, Checkbox, FormControlLabel, FormGroup, Alert,
  LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import { ArrowLeft, Plus, Printer, MessageSquare, Wrench, Settings, ClipboardList, Package, User, CheckCircle, Clock, Ban, Calendar, Coins, AlertTriangle, Pencil, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';
import { useSucursal } from '../../../shared/contexts/SucursalContext';

const PASOS_ORDEN = [
  'RECEPCIONADO',
  'INSPECCION',
  'ESPERANDO_APROBACION',
  'APROBADO',
  'FINALIZADO'
];

const SEVERIDAD_CONFIG = {
  ALTA: { label: 'Alta', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  MEDIA: { label: 'Media', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  BAJA: { label: 'Baja', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeSucursalId } = useSucursal();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialogs state
  const [hallazgoModal, setHallazgoModal] = useState(false);
  const [servicioModal, setServicioModal] = useState(false);
  const [repuestoModal, setRepuestoModal] = useState(false);
  const [mecanicoModal, setMecanicoModal] = useState(false);
  const [aprobacionModal, setAprobacionModal] = useState(false);
  
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);
  
  const [nuevoHallazgo, setNuevoHallazgo] = useState('');
  const [nuevaSeveridad, setNuevaSeveridad] = useState('MEDIA');
  const [editingHallazgoId, setEditingHallazgoId] = useState(null);
  const [nuevoServicio, setNuevoServicio] = useState({ descripcion: '', precio: 0 });
  const [hallazgoOrigenId, setHallazgoOrigenId] = useState(null);
  const [editingServicioId, setEditingServicioId] = useState(null);
  const [nuevoRepuesto, setNuevoRepuesto] = useState({ repuesto: null, cantidad: 1, precio_unitario: 0 });
  
  const [mecanicos, setMecanicos] = useState([]);
  const [selectedMecanico, setSelectedMecanico] = useState(null);
  const [savingMecanico, setSavingMecanico] = useState(false);
  
  const [repuestosInventario, setRepuestosInventario] = useState([]);

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getOrden(id);
      setOrden(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMecanicos = async () => {
    try {
      const res = await api.get('seguridad/usuarios/?rol=MECANICO');
      let dataList = [];
      if (res.data && res.data.data) {
        dataList = res.data.data.results || res.data.data;
      } else {
        dataList = res.data.results || res.data;
      }
      setMecanicos(Array.isArray(dataList) ? dataList : []);
    } catch (err) {
      console.error("Error al cargar mecánicos:", err);
    }
  };
  
  const fetchRepuestos = async () => {
    try {
      const res = await api.get('inventario/repuestos/');
      setRepuestosInventario(res.data.results || res.data || []);
    } catch (err) {
      console.error("Error al cargar repuestos:", err);
    }
  };

  const handleOpenMecanicoModal = () => {
    fetchMecanicos();
    setMecanicoModal(true);
  };
  
  const handleOpenRepuestoModal = () => {
    fetchRepuestos();
    setRepuestoModal(true);
  };

  const handleAsignarMecanico = async () => {
    if (!selectedMecanico) return;
    try {
      setSavingMecanico(true);
      const payload = { mecanico_asignado: selectedMecanico.id_usuario };
      if (orden.estado === 'RECEPCIONADO') {
        payload.estado = 'INSPECCION';
      }
      await tallerService.actualizarOrden(id, payload);
      setMecanicoModal(false);
      fetchOrden();
    } catch (err) {
      console.error(err);
      alert("Error al asignar mecánico");
    } finally {
      setSavingMecanico(false);
    }
  };

  const handleOpenNuevoHallazgo = () => {
    setEditingHallazgoId(null);
    setNuevoHallazgo('');
    setNuevaSeveridad('MEDIA');
    setHallazgoModal(true);
  };

  const handleOpenEditarHallazgo = (hallazgo) => {
    setEditingHallazgoId(hallazgo.id);
    setNuevoHallazgo(hallazgo.descripcion);
    setNuevaSeveridad(hallazgo.severidad || 'MEDIA');
    setHallazgoModal(true);
  };

  const handleAddHallazgo = async () => {
    try {
      if (editingHallazgoId) {
        await tallerService.actualizarHallazgo(editingHallazgoId, { descripcion: nuevoHallazgo, severidad: nuevaSeveridad });
      } else {
        await tallerService.crearHallazgo({ orden: id, descripcion: nuevoHallazgo, severidad: nuevaSeveridad });
      }
      setHallazgoModal(false);
      setNuevoHallazgo('');
      setEditingHallazgoId(null);
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el hallazgo.', 'error');
    }
  };

  const handleDeleteHallazgo = async (hallazgo) => {
    const result = await Swal.fire({
      title: '¿Eliminar hallazgo?',
      text: hallazgo.descripcion,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await tallerService.eliminarHallazgo(hallazgo.id);
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo eliminar el hallazgo.', 'error');
    }
  };

  const handleConvertirAServicio = (hallazgo) => {
    setHallazgoOrigenId(hallazgo.id);
    setNuevoServicio({ descripcion: hallazgo.descripcion, precio: 0 });
    setServicioModal(true);
  };

  const handleOpenNuevoServicio = () => {
    setHallazgoOrigenId(null);
    setEditingServicioId(null);
    setNuevoServicio({ descripcion: '', precio: 0 });
    setServicioModal(true);
  };

  const handleOpenEditarServicio = (servicio) => {
    setHallazgoOrigenId(null);
    setEditingServicioId(servicio.id);
    setNuevoServicio({ descripcion: servicio.descripcion, precio: servicio.precio_estimado });
    setServicioModal(true);
  };

  const handleAddServicio = async () => {
    try {
      if (editingServicioId) {
        await tallerService.actualizarServicio(editingServicioId, {
          descripcion: nuevoServicio.descripcion,
          precio_estimado: nuevoServicio.precio,
        });
      } else {
        await tallerService.crearServicio({
          orden: id,
          descripcion: nuevoServicio.descripcion,
          precio_estimado: nuevoServicio.precio,
          hallazgo_origen: hallazgoOrigenId
        });
      }
      setServicioModal(false);
      setNuevoServicio({ descripcion: '', precio: 0 });
      setHallazgoOrigenId(null);
      setEditingServicioId(null);
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el servicio.', 'error');
    }
  };

  const handleDeleteServicio = async (servicio) => {
    const result = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: servicio.descripcion,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await tallerService.eliminarServicio(servicio.id);
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo eliminar el servicio.', 'error');
    }
  };

  const handleEditarCantidadRepuesto = async (repuesto) => {
    const { value: nuevaCantidad } = await Swal.fire({
      title: 'Editar Cantidad',
      html: `<p style="text-align:left;font-size:0.85rem;color:#64748b;margin-bottom:8px;">${repuesto.repuesto_detalle?.nombre || 'Repuesto'}</p>`,
      input: 'number',
      inputValue: parseFloat(repuesto.cantidad),
      inputAttributes: { min: 0.01, step: 'any' },
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) return 'Ingresa una cantidad válida.';
      }
    });
    if (!nuevaCantidad) return;
    try {
      await tallerService.actualizarRepuesto(repuesto.id, { cantidad: nuevaCantidad });
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo actualizar la cantidad.', 'error');
    }
  };

  const handleDeleteRepuesto = async (repuesto) => {
    const result = await Swal.fire({
      title: '¿Eliminar repuesto?',
      text: repuesto.repuesto_detalle?.nombre || 'Repuesto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await tallerService.eliminarRepuesto(repuesto.id);
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo eliminar el repuesto.', 'error');
    }
  };

  const handleAddRepuesto = async () => {
    if (!nuevoRepuesto.repuesto) return;
    try {
      await tallerService.crearRepuesto({
        orden: id,
        repuesto: nuevoRepuesto.repuesto.id,
        cantidad: nuevoRepuesto.cantidad,
        precio_unitario: nuevoRepuesto.precio_unitario
      });
      setRepuestoModal(false);
      setNuevoRepuesto({ repuesto: null, cantidad: 1, precio_unitario: 0 });
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerarCotizacion = async () => {
    try {
      await tallerService.actualizarOrden(id, { estado: 'ESPERANDO_APROBACION' });
      fetchOrden();
      handleImprimirPDF();
    } catch (err) {
      console.error("Error al generar cotización", err);
      const mensaje = err.response?.data?.detail || err.response?.data?.error || 'Error al generar la cotización.';
      Swal.fire('No se pudo generar la cotización', mensaje, 'error');
    }
  };

  const handleImprimirPDF = async () => {
    try {
      const res = await api.get(`taller/ordenes/${id}/generar_pdf/`, {
        responseType: 'blob',
        params: activeSucursalId ? { sucursal_id: activeSucursalId } : {}
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error al generar PDF", err);
      alert("Error al generar el PDF de la cotización.");
    }
  };

  const handleOpenAprobacionModal = () => {
    setServiciosSeleccionados(orden.servicios.map(s => s.id));
    setRepuestosSeleccionados(orden.repuestos.map(r => r.id));
    setAprobacionModal(true);
  };

  const handleAprobarCotizacion = async () => {
    try {
      await api.post(`taller/ordenes/${id}/aprobar_servicios/`, {
        servicios_aprobados: serviciosSeleccionados,
        repuestos_aprobados: repuestosSeleccionados
      });
      setAprobacionModal(false);
      fetchOrden();
    } catch (err) {
      console.error(err);
      alert("Error al aprobar cotización");
    }
  };

  const handleToggleCompletado = async (servicioId) => {
    try {
      await api.patch(`taller/servicios/${servicioId}/marcar_completado/`);
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizarOrden = async () => {
    try {
      await tallerService.finalizarOrden(id);
      fetchOrden();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al finalizar la orden");
    }
  };

  const handleEnviarAPos = async () => {
    try {
      const data = await tallerService.enviarAPos(id, activeSucursalId);
      // Redirigir al POS (Punto de Venta) con el ticket generado
      navigate(`/ventas/pos`, { state: { autoOpenVentaId: data.venta_id } });
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      const mensaje = data?.error || (Array.isArray(data?.errores) && data.errores[0]) || data?.mensaje || "Error al enviar al Punto de Venta";
      alert(mensaje);
    }
  };

  const handleAnularOrden = async () => {
    const opcionesHtml = CATEGORIAS_ANULACION.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Anular Orden de Trabajo',
      html: `
        <p style="text-align:left; font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
          Esta acción liberará las reservas de stock de los repuestos aprobados aún no instalados.
        </p>
        <select id="swal-categoria" class="swal2-select" style="width: 95%; display: block; margin: 0 auto 10px auto;">
          ${opcionesHtml}
        </select>
        <textarea id="swal-motivo" class="swal2-textarea" placeholder="Detalle del motivo de la anulación..." style="width: 95%; display: block; margin: 0 auto;"></textarea>
      `,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Anular Orden',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const categoria = document.getElementById('swal-categoria').value;
        const motivo = document.getElementById('swal-motivo').value.trim();
        if (!motivo) {
          Swal.showValidationMessage('Debes indicar el detalle del motivo.');
          return false;
        }
        return { categoria, motivo };
      }
    });

    if (!formValues) return;

    try {
      await tallerService.anularOrden(id, formValues.motivo, formValues.categoria);
      Swal.fire({ icon: 'success', title: 'Orden anulada', showConfirmButton: false, timer: 1500 });
      fetchOrden();
    } catch (err) {
      const data = err.response?.data;
      const mensaje = (Array.isArray(data?.errores) && data.errores[0]) || data?.error || data?.mensaje || 'No se pudo anular la orden.';
      Swal.fire('No se puede anular', mensaje, 'error');
    }
  };

  const handleEnviarWhatsapp = () => {
    const telefono = orden?.cliente_detalle?.telefono;
    if (!telefono) return;
    const numero = telefono.replace(/\D/g, '');
    const mensaje = `Hola ${orden.cliente_detalle?.nombres || ''}, te escribimos sobre tu Orden de Trabajo OT-${orden.numero}. Cualquier consulta, quedamos atentos.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };


  const handleToggleInstalado = async (repuestoId) => {
    try {
      await api.patch(`taller/repuestos/${repuestoId}/marcar_instalado/`);
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditarFechaVencimiento = async () => {
    const { value: newDateStr } = await Swal.fire({
      title: 'Extender Vencimiento',
      input: 'date',
      inputValue: orden.fecha_vencimiento_cotizacion ? new Date(orden.fecha_vencimiento_cotizacion).toISOString().split('T')[0] : '',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      customClass: {
        container: 'z-[9999]'
      }
    });

    if (newDateStr) {
      try {
        await tallerService.actualizarOrden(id, { fecha_vencimiento_cotizacion: newDateStr + 'T23:59:59Z' });
        fetchOrden();
        Swal.fire('Actualizado', 'La fecha de vencimiento ha sido actualizada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar la fecha.', 'error');
      }
    }
  };

  const handleEditarFechaEntrega = async () => {
    const { value: newDateStr } = await Swal.fire({
      title: orden.fecha_estimada_entrega ? 'Editar Fecha de Entrega' : 'Prometer Fecha de Entrega',
      html: 'Fecha en la que se le comunicará al cliente que el vehículo estará listo.',
      input: 'date',
      inputValue: orden.fecha_estimada_entrega ? new Date(orden.fecha_estimada_entrega).toISOString().split('T')[0] : '',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
    });

    if (newDateStr) {
      try {
        await tallerService.actualizarOrden(id, { fecha_estimada_entrega: newDateStr + 'T18:00:00Z' });
        fetchOrden();
        Swal.fire('Actualizado', 'La fecha de entrega prometida ha sido actualizada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar la fecha de entrega.', 'error');
      }
    }
  };

  const CATEGORIAS_ANULACION = [
    { value: 'RECHAZO_CLIENTE', label: 'Cliente rechazó la cotización' },
    { value: 'ERROR_REGISTRO', label: 'Error en el registro' },
    { value: 'DUPLICADO', label: 'Orden duplicada' },
    { value: 'OTRO', label: 'Otro motivo' },
  ];

  // Helper para mostrar motivos de ingreso estructurados
  const renderMotivos = (texto) => {
    if (!texto) return <Typography variant="body2" color="text.secondary">Sin motivo especificado</Typography>;
    const lineas = texto.split('\n').filter(l => l.trim() !== '');
    return (
      <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, color: 'text.secondary', fontSize: '0.9rem' } }}>
        {lineas.map((linea, idx) => (
          <li key={idx}>{linea.replace(/^-/, '').trim()}</li>
        ))}
      </Box>
    );
  };

  if (loading || !orden) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  );

  const estaCancelada = orden.estado === 'CANCELADO';
  const activeStep = orden.estado === 'FACTURADO' ? PASOS_ORDEN.length : PASOS_ORDEN.indexOf(orden.estado);
  const esEditable = orden.estado === 'RECEPCIONADO' || orden.estado === 'INSPECCION';
  const hayMecanicoAsignado = !!orden.mecanico_asignado;
  const puedeAgregarHallazgo = esEditable && hayMecanicoAsignado;
  const isExpirada = orden.fecha_vencimiento_cotizacion && new Date() > new Date(orden.fecha_vencimiento_cotizacion);
  const historialCancelacion = estaCancelada
    ? [...(orden.historial_estados || [])].reverse().find(h => h.estado === 'CANCELADO')
    : null;
  const motivoCancelacion = historialCancelacion?.observaciones;
  const categoriaCancelacionLabel = historialCancelacion?.motivo_categoria_display;

  // Totales de la cotización: se calculan en el cliente porque servicios/repuestos
  // ya vienen completos en el detalle de la orden (evita otro round-trip al backend).
  const totalCotizado = (orden.servicios || []).reduce((sum, s) => sum + parseFloat(s.precio_estimado || 0), 0)
    + (orden.repuestos || []).reduce((sum, r) => sum + (parseFloat(r.cantidad || 0) * parseFloat(r.precio_unitario || 0)), 0);
  const totalAprobado = (orden.servicios || []).filter(s => s.aprobado_cliente).reduce((sum, s) => sum + parseFloat(s.precio_estimado || 0), 0)
    + (orden.repuestos || []).filter(r => r.aprobado_cliente).reduce((sum, r) => sum + (parseFloat(r.cantidad || 0) * parseFloat(r.precio_unitario || 0)), 0);
  const hayAlgoCotizado = (orden.servicios?.length || 0) > 0 || (orden.repuestos?.length || 0) > 0;
  const hayAlgoAprobado = (orden.servicios || []).some(s => s.aprobado_cliente) || (orden.repuestos || []).some(r => r.aprobado_cliente);

  // Antigüedad de la orden: alerta si sigue en Recepción sin mecánico asignado
  // después de un tiempo razonable (2 horas) — evita que un vehículo "se pierda" en el mostrador.
  const horasEnTaller = orden.fecha_ingreso ? (Date.now() - new Date(orden.fecha_ingreso).getTime()) / (1000 * 60 * 60) : 0;
  const formatTiempoEnTaller = (horas) => {
    if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
    if (horas < 24) return `${Math.round(horas)} h`;
    return `${Math.round(horas / 24)} d`;
  };
  const LIMITE_HORAS_SIN_ASIGNAR = 2;
  const alertaSinAsignar = orden.estado === 'RECEPCIONADO' && !orden.mecanico_nombre && horasEnTaller >= LIMITE_HORAS_SIN_ASIGNAR;

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', pb: 8 }}>
      
      {/* Header & Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '20px', border: '1px solid', borderColor: 'divider', background: 'linear-gradient(to right bottom, #ffffff, #f8fafc)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/taller/ordenes')} sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' } }}>
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Settings size={28} className="text-slate-700" />
                OT-{orden.numero}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Creado el {orden.fecha_ingreso ? new Date(orden.fecha_ingreso).toLocaleDateString() : 'Fecha no registrada'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" color="inherit" onClick={handleImprimirPDF} startIcon={<Printer size={18} />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
              Imprimir
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<MessageSquare size={18} />}
              onClick={handleEnviarWhatsapp}
              disabled={!orden.cliente_detalle?.telefono}
              title={!orden.cliente_detalle?.telefono ? 'El cliente no tiene teléfono registrado' : 'Enviar por WhatsApp'}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              WhatsApp
            </Button>
            {!estaCancelada && orden.estado !== 'FACTURADO' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Ban size={18} />}
                onClick={handleAnularOrden}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Anular
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ width: '100%', px: 2 }}>
          {estaCancelada ? (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography fontWeight="700">Orden Cancelada</Typography>
                {categoriaCancelacionLabel && (
                  <Chip label={categoriaCancelacionLabel} size="small" color="error" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
              </Box>
              <Typography variant="body2">
                {motivoCancelacion || 'Sin motivo registrado.'}
              </Typography>
            </Alert>
          ) : (
          <Stepper activeStep={activeStep} alternativeLabel>
            {PASOS_ORDEN.map((label, index) => {
              let labelDate = null;
              
              // 1. Intentar buscar en el historial de estados
              const historyForStep = orden.historial_estados?.find(h => h.estado === label);
              
              if (historyForStep) {
                const dateObj = new Date(historyForStep.fecha_registro);
                if (!isNaN(dateObj)) {
                  labelDate = dateObj.toLocaleString('es-PE', { 
                    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true 
                  });
                }
              } 
              // 2. Fallback para órdenes antiguas: Mostrar fecha de ingreso si es el paso 1
              else if (index === 0 && orden.fecha_ingreso) {
                const dateObj = new Date(orden.fecha_ingreso);
                if (!isNaN(dateObj)) {
                  labelDate = dateObj.toLocaleString('es-PE', { 
                    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true 
                  });
                }
              }

              return (
                <Step key={label}>
                  <StepLabel 
                    optional={
                      labelDate ? (
                        <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 0.5 }}>
                          {labelDate}
                        </Typography>
                      ) : null
                    }
                    sx={{ '& .MuiStepLabel-label': { fontWeight: 600, mt: 1 } }}
                  >
                    {label.replace(/_/g, ' ')}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* Top Row: Info Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 3 }}>
          
          {/* Vehiculo Card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="700" mb={3} display="flex" alignItems="center" gap={1}>
                <Box sx={{ p: 1, bgcolor: 'slate.100', borderRadius: 2 }}><Wrench size={18} className="text-slate-700" /></Box>
                Datos del Vehículo
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Placa</Typography>
                  <Typography variant="h6" fontWeight="700">{orden.vehiculo_detalle?.placa}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Vehículo</Typography>
                  <Typography variant="body1" fontWeight="600">{orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Kilometraje</Typography>
                  <Typography variant="body1" fontWeight="600">{orden.kilometraje_ingreso ? `${orden.kilometraje_ingreso} km` : 'No registrado'}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" mb={1} display="block">
                Motivos de Ingreso
              </Typography>
              {renderMotivos(orden.motivo_ingreso)}
            </Paper>

          {/* Cliente Card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="700" mb={3} display="flex" alignItems="center" gap={1}>
                <Box sx={{ p: 1, bgcolor: 'slate.100', borderRadius: 2 }}><User size={18} className="text-slate-700" /></Box>
                Datos del Cliente
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Nombre Completo</Typography>
                  <Typography variant="body1" fontWeight="700" color="primary.main">
                    {orden.cliente_detalle ? `${orden.cliente_detalle.nombres} ${orden.cliente_detalle.apellidos || ''}`.trim() : 'Sin Cliente'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">DNI / RUC</Typography>
                  <Typography variant="body1" fontWeight="600">{orden.cliente_detalle?.dni || 'No registrado'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Teléfono</Typography>
                  <Typography variant="body1" fontWeight="600">{orden.cliente_detalle?.telefono || 'No registrado'}</Typography>
                </Box>
              </Box>
            </Paper>

          {/* Asignacion Card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'slate.50' }}>
              <Typography variant="subtitle1" fontWeight="700" mb={2}>Responsables</Typography>
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" fontWeight="600">Recepcionista</Typography>
                <Typography variant="body2" fontWeight="600">{orden.recepcionista_nombre}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">Mecánico Asignado</Typography>
                {orden.mecanico_nombre ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip label={orden.mecanico_nombre} color="primary" variant="outlined" sx={{ fontWeight: 600, flexGrow: 1, justifyContent: 'flex-start' }} />
                    <Button size="small" variant="text" onClick={handleOpenMecanicoModal} sx={{ minWidth: 0, p: 0.5, borderRadius: '8px' }} title="Cambiar Mecánico">
                      <Settings size={18} className="text-slate-500" />
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="error.main" fontWeight="600">Sin asignar</Typography>
                    <Button variant="outlined" size="small" onClick={handleOpenMecanicoModal} startIcon={<User size={16} />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}>
                      Asignar ahora
                    </Button>
                  </Box>
                )}
              </Box>

              {alertaSinAsignar && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: '10px', bgcolor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AlertTriangle size={16} className="text-red-600" style={{ flexShrink: 0 }} />
                  <Typography variant="caption" fontWeight="700" color="#b91c1c">
                    Sin mecánico asignado hace {formatTiempoEnTaller(horasEnTaller)}
                  </Typography>
                </Box>
              )}
            </Paper>

          {/* Resumen Económico y Tiempos */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="subtitle1" fontWeight="700" mb={3} display="flex" alignItems="center" gap={1}>
                <Box sx={{ p: 1, bgcolor: 'slate.100', borderRadius: 2 }}><Coins size={18} className="text-slate-700" /></Box>
                Resumen y Tiempos
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Total Cotizado</Typography>
                  <Typography variant="h6" fontWeight="700">
                    {hayAlgoCotizado ? `S/ ${totalCotizado.toFixed(2)}` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Total Aprobado</Typography>
                  <Typography variant="body1" fontWeight="700" color={hayAlgoAprobado ? 'success.main' : 'text.secondary'}>
                    {hayAlgoAprobado ? `S/ ${totalAprobado.toFixed(2)}` : 'Aún no hay aprobación'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase" display="flex" alignItems="center" gap={0.5}>
                    <Calendar size={12} /> Entrega Prometida
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {orden.fecha_estimada_entrega ? new Date(orden.fecha_estimada_entrega).toLocaleDateString('es-PE') : 'Sin definir'}
                  </Typography>
                </Box>
                {!estaCancelada && orden.estado !== 'FACTURADO' && (
                  <IconButton size="small" onClick={handleEditarFechaEntrega} title="Editar fecha de entrega prometida">
                    <Pencil size={16} />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">Tiempo en Taller</Typography>
                <Typography variant="body1" fontWeight="600">{formatTiempoEnTaller(horasEnTaller)}</Typography>
              </Box>
            </Paper>

        </Box>

        {/* Bottom Area: Workflow */}
        <Box sx={{ width: '100%' }}>
          
          {/* Actions Banner based on status */}
          {orden.estado === 'RECEPCIONADO' && (
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '20px', bgcolor: '#fff0f2', border: '1px solid', borderColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color="#be123c" mb={0.5}>El vehículo está en recepción</Typography>
                <Typography variant="body2" color="#e11d48">Asigna un mecánico para iniciar la inspección técnica o genera la cotización directamente si ya hay servicios.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {(orden.servicios.length > 0 || orden.repuestos.length > 0) && (
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ color: '#be123c', borderColor: '#be123c', '&:hover': { bgcolor: '#ffe4e6', borderColor: '#9f1239' }, borderRadius: '12px', fontWeight: 600, px: 3 }}
                    onClick={handleGenerarCotizacion}
                  >
                    Generar Cotización Directa
                  </Button>
                )}
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ bgcolor: '#e11d48', '&:hover': { bgcolor: '#be123c' }, borderRadius: '12px', fontWeight: 600, px: 4 }}
                  onClick={handleOpenMecanicoModal}
                >
                  Enviar a Inspección
                </Button>
              </Box>
            </Paper>
          )}

          {orden.estado === 'ESPERANDO_APROBACION' && (
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '20px', bgcolor: isExpirada ? '#fef2f2' : '#f0fdf4', border: '1px solid', borderColor: isExpirada ? '#fecaca' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color={isExpirada ? "#991b1b" : "#166534"} mb={0.5} display="flex" alignItems="center" gap={1.5}>
                  {isExpirada ? "Cotización Expirada" : "Esperando Aprobación del Cliente"}
                  <Chip label={`Total: S/ ${totalCotizado.toFixed(2)}`} size="small" sx={{ fontWeight: 700, bgcolor: 'white' }} />
                </Typography>
                <Typography variant="body2" color={isExpirada ? "#7f1d1d" : "#15803d"}>
                  {isExpirada
                    ? `La cotización expiró el ${new Date(orden.fecha_vencimiento_cotizacion).toLocaleDateString()}. Edite la fecha de vencimiento para poder aprobarla.`
                    : `La cotización ha sido generada (Vence: ${orden.fecha_vencimiento_cotizacion ? new Date(orden.fecha_vencimiento_cotizacion).toLocaleDateString() : 'N/A'}). Registra la confirmación del cliente para comenzar los trabajos.`}
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ color: '#0f172a', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f1f5f9' }, borderRadius: '12px', fontWeight: 600 }}
                  onClick={handleEditarFechaVencimiento}
                >
                  Editar Fecha
                </Button>
                <Button 
                  variant="contained" 
                  size="large"
                  disabled={isExpirada}
                  sx={{ bgcolor: isExpirada ? '#94a3b8' : '#16a34a', '&:hover': { bgcolor: isExpirada ? '#94a3b8' : '#15803d' }, borderRadius: '12px', fontWeight: 600, px: 4, boxShadow: 'none' }}
                  onClick={handleOpenAprobacionModal}
                >
                  Registrar Aprobación
                </Button>
              </Box>
            </Paper>
          )}

          {orden.estado === 'APROBADO' && (
            <Box mb={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="800" color="primary.main" display="flex" alignItems="center" gap={1.5}>
                  <CheckCircle size={24} /> Panel de Ejecución
                  <Chip label={`Total Aprobado: S/ ${totalAprobado.toFixed(2)}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleFinalizarOrden}
                  disabled={
                    !(orden.servicios.filter(s => s.aprobado_cliente).length > 0 || orden.repuestos.filter(r => r.aprobado_cliente).length > 0) ||
                    !orden.servicios.filter(s => s.aprobado_cliente).every(s => s.completado) ||
                    !orden.repuestos.filter(r => r.aprobado_cliente).every(r => r.instalado)
                  }
                  sx={{
                    bgcolor: 'slate.900', color: 'white', '&:hover': { bgcolor: 'slate.800' }, 
                    borderRadius: '10px', px: 4, py: 1.5, fontWeight: 600, boxShadow: 'none'
                  }}
                >
                  Finalizar Orden
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {(() => {
                    const aprobados = orden.servicios.filter(s => s.aprobado_cliente);
                    const completados = aprobados.filter(s => s.completado).length;
                    const pct = aprobados.length ? (completados / aprobados.length) * 100 : 0;
                    const completo = aprobados.length > 0 && pct === 100;
                    return (
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: completo ? '#86efac' : 'divider', borderLeft: '4px solid', borderLeftColor: completo ? '#22c55e' : '#f59e0b', bgcolor: 'slate.50', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="700" mb={1} display="flex" justifyContent="space-between">
                      Servicios Aprobados
                      <Chip label={`${completados}/${aprobados.length}`} size="small" color={completo ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                    </Typography>
                    {aprobados.length > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={completo ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 4, mb: 2, bgcolor: 'rgba(0,0,0,0.06)' }}
                      />
                    )}
                    <Box display="flex" flexDirection="column" gap={2}>
                      {orden.servicios.filter(s => s.aprobado_cliente).map(s => (
                        <Paper key={s.id} elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white' }}>
                          <Typography variant="body2" fontWeight="600">{s.descripcion}</Typography>
                          <Button 
                            variant={s.completado ? "contained" : "outlined"}
                            color={s.completado ? "success" : "warning"}
                            size="small"
                            onClick={() => handleToggleCompletado(s.id)}
                            startIcon={s.completado ? <CheckCircle size={16}/> : <Clock size={16}/>}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                          >
                            {s.completado ? 'Terminado' : 'Pendiente'}
                          </Button>
                        </Paper>
                      ))}
                      {orden.servicios.filter(s => s.aprobado_cliente).length === 0 && (
                        <Typography variant="body2" color="text.secondary">No hay servicios aprobados.</Typography>
                      )}
                    </Box>
                  </Paper>
                    );
                  })()}
                </Grid>

                <Grid item xs={12} md={6}>
                  {(() => {
                    const aprobados = orden.repuestos.filter(r => r.aprobado_cliente);
                    const instalados = aprobados.filter(r => r.instalado).length;
                    const pct = aprobados.length ? (instalados / aprobados.length) * 100 : 0;
                    const completo = aprobados.length > 0 && pct === 100;
                    return (
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: completo ? '#86efac' : 'divider', borderLeft: '4px solid', borderLeftColor: completo ? '#22c55e' : '#f59e0b', bgcolor: 'slate.50', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="700" mb={1} display="flex" justifyContent="space-between">
                      Repuestos Aprobados
                      <Chip label={`${instalados}/${aprobados.length}`} size="small" color={completo ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                    </Typography>
                    {aprobados.length > 0 && (
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={completo ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 4, mb: 2, bgcolor: 'rgba(0,0,0,0.06)' }}
                      />
                    )}
                    <Box display="flex" flexDirection="column" gap={2}>
                      {orden.repuestos.filter(r => r.aprobado_cliente).map(r => (
                        <Paper key={r.id} elevation={0} sx={{ p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="600">{r.repuesto_detalle?.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">Cant: {parseFloat(r.cantidad)}</Typography>
                          </Box>
                          <Button 
                            variant={r.instalado ? "contained" : "outlined"}
                            color={r.instalado ? "success" : "warning"}
                            size="small"
                            onClick={() => handleToggleInstalado(r.id)}
                            startIcon={r.instalado ? <CheckCircle size={16}/> : <Clock size={16}/>}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                          >
                            {r.instalado ? 'Instalado' : 'Pendiente'}
                          </Button>
                        </Paper>
                      ))}
                      {orden.repuestos.filter(r => r.aprobado_cliente).length === 0 && (
                        <Typography variant="body2" color="text.secondary">No hay repuestos aprobados.</Typography>
                      )}
                    </Box>
                  </Paper>
                    );
                  })()}
                </Grid>
              </Grid>
            </Box>
          )}

          {orden.estado === 'FINALIZADO' && (
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '20px', bgcolor: '#eff6ff', border: '1px solid', borderColor: '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color="#1e3a8a" mb={0.5}>Orden de Trabajo Finalizada</Typography>
                <Typography variant="body2" color="#1e40af">Todos los servicios y repuestos han sido completados. Ya puedes proceder con el cobro en caja.</Typography>
              </Box>
              <Button 
                variant="contained" 
                size="large"
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, borderRadius: '12px', fontWeight: 600, px: 4, boxShadow: 'none' }}
                onClick={handleEnviarAPos}
              >
                Cobrar en Punto de Venta
              </Button>
            </Paper>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            {/* Inspección */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: 'slate.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                  <ClipboardList size={20} className="text-slate-500" />
                  1. Inspección y Hallazgos
                </Typography>
                <Tooltip title={esEditable && !hayMecanicoAsignado ? 'Asigna un mecánico antes de registrar hallazgos' : ''}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={handleOpenNuevoHallazgo}
                      disabled={!puedeAgregarHallazgo}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                    >
                      Nuevo Hallazgo
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {esEditable && !hayMecanicoAsignado && (
                <Box sx={{ px: 3, pt: 2 }}>
                  <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                    Asigna un mecánico responsable antes de registrar hallazgos de inspección.
                  </Alert>
                </Box>
              )}

              <Box sx={{ p: 3 }}>
                {orden.hallazgos.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">No se han registrado hallazgos durante la inspección.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {orden.hallazgos.map((h, i) => {
                      const yaCotizado = (orden.servicios || []).some(s => s.hallazgo_origen === h.id);
                      const sev = SEVERIDAD_CONFIG[h.severidad] || SEVERIDAD_CONFIG.MEDIA;
                      return (
                        <Grid item xs={12} sm={6} key={h.id}>
                          <Box sx={{ p: 2, border: '1px solid', borderColor: sev.border, borderLeft: '4px solid', borderLeftColor: sev.color, borderRadius: '12px', bgcolor: sev.bg }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="600" display="flex" alignItems="center" gap={1}>
                                Hallazgo #{i+1}
                                <Chip
                                  label={sev.label}
                                  size="small"
                                  sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700, bgcolor: sev.color, color: 'white' }}
                                />
                                {yaCotizado && (
                                  <Chip label="Cotizado" size="small" color="success" variant="outlined" sx={{ height: '18px', fontSize: '0.65rem', fontWeight: 700 }} />
                                )}
                              </Typography>
                              {esEditable && (
                                <Box sx={{ display: 'flex', gap: 0.25 }}>
                                  <IconButton size="small" onClick={() => handleOpenEditarHallazgo(h)} title="Editar hallazgo">
                                    <Pencil size={14} />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteHallazgo(h)} title="Eliminar hallazgo">
                                    <X size={14} className="text-red-500" />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                            <Typography variant="body2" fontWeight="500" mb={1.5}>{h.descripcion}</Typography>
                            {esEditable && !yaCotizado && (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<Wrench size={14} />}
                                onClick={() => handleConvertirAServicio(h)}
                                sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0 }}
                              >
                                Convertir a Servicio
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            </Paper>

            {/* Servicios */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: 'slate.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                  <Wrench size={20} className="text-slate-500" />
                  2. Servicios y Mano de Obra a Cotizar
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Plus size={16} />} 
                  onClick={handleOpenNuevoServicio}
                  disabled={!esEditable}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Agregar Servicio
                </Button>
              </Box>

              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'transparent' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Descripción del Servicio</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Costo Estimado</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Estado Aprobación</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orden.servicios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No hay servicios agregados a la cotización.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orden.servicios.map(s => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{s.descripcion}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(s.precio_estimado).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          {s.aprobado_cliente ? (
                            <Chip label="Aprobado" color="success" size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} />
                          ) : (
                            <Chip label="Pendiente" size="small" sx={{ fontWeight: 600, borderRadius: '6px', bgcolor: 'slate.100', color: 'slate.600' }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {esEditable && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                              <IconButton size="small" onClick={() => handleOpenEditarServicio(s)} title="Editar servicio">
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteServicio(s)} title="Eliminar servicio">
                                <X size={14} className="text-red-500" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {orden.servicios.length > 0 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'slate.50' }}>
                      <TableCell sx={{ fontWeight: 700, borderBottom: 'none' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', borderBottom: 'none' }}>
                        S/ {orden.servicios.reduce((sum, s) => sum + parseFloat(s.precio_estimado || 0), 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: 'none' }} />
                      <TableCell sx={{ borderBottom: 'none' }} />
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </Paper>

            {/* Repuestos */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: 'slate.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                  <Package size={20} className="text-slate-500" />
                  3. Repuestos y Materiales
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Plus size={16} />} 
                  onClick={handleOpenRepuestoModal}
                  disabled={!esEditable}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Agregar Repuesto
                </Button>
              </Box>

              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'transparent' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Repuesto</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Cantidad</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Precio Unit.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orden.repuestos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No hay repuestos agregados a la cotización.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orden.repuestos.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {r.repuesto_detalle?.nombre || 'Repuesto'}
                          {r.repuesto_detalle?.codigo_fabricante && <Typography variant="caption" display="block" color="text.secondary">{r.repuesto_detalle.codigo_fabricante}</Typography>}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{parseFloat(r.cantidad).toString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(r.precio_unitario).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          S/ {(parseFloat(r.cantidad) * parseFloat(r.precio_unitario)).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          {esEditable && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                              <IconButton size="small" onClick={() => handleEditarCantidadRepuesto(r)} title="Editar cantidad">
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteRepuesto(r)} title="Eliminar repuesto">
                                <X size={14} className="text-red-500" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {orden.repuestos.length > 0 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'slate.50' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 700, borderBottom: 'none' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', borderBottom: 'none' }}>
                        S/ {orden.repuestos.reduce((sum, r) => sum + (parseFloat(r.cantidad || 0) * parseFloat(r.precio_unitario || 0)), 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ borderBottom: 'none' }} />
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </Paper>

            {/* Acciones Generales (Enviar Cotizacion) */}
            {orden.estado === 'INSPECCION' && (
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" sx={{ bgcolor: 'slate.900', color: 'white', '&:hover': { bgcolor: 'slate.800' }, borderRadius: '10px', px: 4, py: 1.5, fontWeight: 600 }} onClick={handleGenerarCotizacion}>
                  Enviar Cotización a Cliente (Simular PDF)
                </Button>
              </Box>
            )}

          </Box>
        </Box>
      </Box>

      {/* --- MODALS --- */}
      
      {/* Modal Asignar Mecanico */}
      <Dialog open={mecanicoModal} onClose={() => setMecanicoModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="700">Asignar Mecánico</Typography>
          <Typography variant="body2" color="text.secondary">Selecciona el mecánico responsable de la inspección.</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={mecanicos}
              getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
              onChange={(e, val) => setSelectedMecanico(val)}
              renderInput={(params) => <TextField {...params} label="Buscar Mecánico" fullWidth />}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setMecanicoModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button 
            onClick={handleAsignarMecanico} 
            variant="contained" 
            disabled={!selectedMecanico || savingMecanico}
            sx={{ borderRadius: '10px', fontWeight: 600, px: 3, boxShadow: 'none' }}
          >
            {savingMecanico ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Asignación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Hallazgo */}
      <Dialog open={hallazgoModal} onClose={() => setHallazgoModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle><Typography variant="h6" fontWeight="700">{editingHallazgoId ? 'Editar Hallazgo' : 'Registrar Hallazgo'}</Typography></DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" label="Descripción detallada" fullWidth multiline rows={3}
            value={nuevoHallazgo} onChange={e => setNuevoHallazgo(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="caption" fontWeight="600" color="text.secondary" display="block" mb={1}>
            Gravedad
          </Typography>
          <ToggleButtonGroup
            value={nuevaSeveridad}
            exclusive
            onChange={(e, val) => val && setNuevaSeveridad(val)}
            size="small"
            fullWidth
          >
            {Object.entries(SEVERIDAD_CONFIG).map(([key, cfg]) => (
              <ToggleButton
                key={key}
                value={key}
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: '8px !important',
                  '&.Mui-selected': { bgcolor: cfg.color, color: 'white', '&:hover': { bgcolor: cfg.color } },
                }}
              >
                {cfg.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setHallazgoModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAddHallazgo} variant="contained" disabled={!nuevoHallazgo} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>
            {editingHallazgoId ? 'Guardar Cambios' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Servicio */}
      <Dialog open={servicioModal} onClose={() => setServicioModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle><Typography variant="h6" fontWeight="700">{editingServicioId ? 'Editar Servicio' : 'Agregar Servicio a Cotizar'}</Typography></DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {hallazgoOrigenId && (
            <Alert severity="info" sx={{ borderRadius: '10px' }}>Este servicio quedará vinculado al hallazgo de inspección.</Alert>
          )}
          <TextField
            label="Descripción del Servicio" fullWidth
            value={nuevoServicio.descripcion} onChange={e => setNuevoServicio({...nuevoServicio, descripcion: e.target.value})}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Costo Estimado (S/)" type="number" fullWidth
            value={nuevoServicio.precio} onChange={e => setNuevoServicio({...nuevoServicio, precio: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setServicioModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAddServicio} variant="contained" disabled={!nuevoServicio.descripcion} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>
            {editingServicioId ? 'Guardar Cambios' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal Repuesto */}
      <Dialog open={repuestoModal} onClose={() => setRepuestoModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle><Typography variant="h6" fontWeight="700">Agregar Repuesto a Cotizar</Typography></DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Autocomplete
            options={repuestosInventario}
            getOptionLabel={(option) => `${option.nombre} ${option.codigo_fabricante ? `(${option.codigo_fabricante})` : ''}`}
            onChange={(e, val) => setNuevoRepuesto({...nuevoRepuesto, repuesto: val, precio_unitario: val?.precio_lista || 0})}
            renderInput={(params) => <TextField {...params} label="Buscar Repuesto en Inventario" fullWidth />}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Cantidad" type="number" fullWidth 
              value={nuevoRepuesto.cantidad} onChange={e => setNuevoRepuesto({...nuevoRepuesto, cantidad: e.target.value})}
            />
            <TextField 
              label="Precio Unitario (S/)" type="number" fullWidth 
              value={nuevoRepuesto.precio_unitario} onChange={e => setNuevoRepuesto({...nuevoRepuesto, precio_unitario: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRepuestoModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAddRepuesto} variant="contained" disabled={!nuevoRepuesto.repuesto} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>Agregar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal Aprobacion Cotizacion */}
      <Dialog open={aprobacionModal} onClose={() => setAprobacionModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="700">Aprobar Cotización</Typography>
          <Typography variant="body2" color="text.secondary">Selecciona los servicios y repuestos que el cliente ha aprobado realizar.</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" fontWeight="700" color="primary.main" mb={1}>Servicios</Typography>
          <FormGroup sx={{ mb: 3 }}>
            {orden?.servicios.map(s => (
              <FormControlLabel 
                key={s.id} 
                control={<Checkbox checked={serviciosSeleccionados.includes(s.id)} onChange={e => {
                  if (e.target.checked) setServiciosSeleccionados([...serviciosSeleccionados, s.id]);
                  else setServiciosSeleccionados(serviciosSeleccionados.filter(id => id !== s.id));
                }} />} 
                label={<Typography variant="body2">{s.descripcion} (S/ {parseFloat(s.precio_estimado).toFixed(2)})</Typography>} 
              />
            ))}
            {orden?.servicios.length === 0 && <Typography variant="body2" color="text.secondary">No hay servicios cotizados.</Typography>}
          </FormGroup>

          <Typography variant="subtitle2" fontWeight="700" color="primary.main" mb={1}>Repuestos</Typography>
          <FormGroup>
            {orden?.repuestos.map(r => (
              <FormControlLabel 
                key={r.id} 
                control={<Checkbox checked={repuestosSeleccionados.includes(r.id)} onChange={e => {
                  if (e.target.checked) setRepuestosSeleccionados([...repuestosSeleccionados, r.id]);
                  else setRepuestosSeleccionados(repuestosSeleccionados.filter(id => id !== r.id));
                }} />} 
                label={<Typography variant="body2">{r.repuesto_detalle?.nombre} x{parseFloat(r.cantidad)} (S/ {parseFloat(r.precio_unitario * r.cantidad).toFixed(2)})</Typography>} 
              />
            ))}
            {orden?.repuestos.length === 0 && <Typography variant="body2" color="text.secondary">No hay repuestos cotizados.</Typography>}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAprobacionModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAprobarCotizacion} variant="contained" color="success" sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>Confirmar Aprobación</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
