import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Stepper, Step, StepLabel, Autocomplete, Checkbox, FormControlLabel, FormGroup, Alert,
  LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Plus, Printer, MessageSquare, Wrench, Settings, ClipboardList, Package, User, CheckCircle, Clock, Ban, Calendar, Coins, AlertTriangle, Pencil, X, Camera, UploadCloud, Trash2, Image as ImageIcon, ShieldCheck, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import { compressImage } from '../../../utils/imageCompressor';
import { getMediaUrl } from '../../../core/utils/mediaUrl';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const PASOS_ORDEN = [
  'RECEPCIONADO',
  'INSPECCION',
  'ESPERANDO_APROBACION',
  'APROBADO',
  'FINALIZADO'
];

const SEVERIDAD_CONFIG = {
  ALTA: { label: 'Alta', color: '#fda4af', textColor: '#500724', bg: '#35161c', border: '#7f1d2d' },
  MEDIA: { label: 'Media', color: '#fcd34d', textColor: '#451a03', bg: '#34270f', border: '#854d0e' },
  BAJA: { label: 'Baja', color: '#bae6fd', textColor: '#082f49', bg: '#10253a', border: '#155e75' },
};

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeSucursalId } = useSucursal();
  const { tienePermiso } = usePermisos();
  const puedeAprobar = tienePermiso('ORDENES_TRABAJO.APROBAR');
  const puedeFinalizar = tienePermiso('ORDENES_TRABAJO.FINALIZAR');
  const puedeCobrarPos = tienePermiso('VENTAS.POS.CREAR');
  const puedeCambiarEstado = tienePermiso('ORDENES_TRABAJO.CAMBIAR_ESTADO');
  const puedeEditar = tienePermiso('ORDENES_TRABAJO.EDITAR');
  const puedeCrear = tienePermiso('ORDENES_TRABAJO.CREAR');
  const puedeExtenderVencimiento = tienePermiso('ORDENES_TRABAJO.EXTENDER_VENCIMIENTO');
  const puedePrometerEntrega = tienePermiso('ORDENES_TRABAJO.PROMETER_ENTREGA');
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
  const [fotosHallazgo, setFotosHallazgo] = useState([]); // [{ file: File, preview: string }]
  const [fotosExistentesHallazgo, setFotosExistentesHallazgo] = useState([]); // [{ id, imagen }]
  const [subiendoHallazgo, setSubiendoHallazgo] = useState(false);
  const [comprimiendoFotoHallazgo, setComprimiendoFotoHallazgo] = useState(false);

  // Plantillas de Servicios
  const [plantillasPreventivas, setPlantillasPreventivas] = useState([]);
  const [plantillasCorrectivas, setPlantillasCorrectivas] = useState([]);
  const [plantillasDiagnostico, setPlantillasDiagnostico] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  const [origenServicio, setOrigenServicio] = useState('PLANTILLA'); // 'PLANTILLA' | 'MANUAL'
  const [tipoPlantillaServicio, setTipoPlantillaServicio] = useState('PREVENTIVO'); // 'PREVENTIVO' | 'CORRECTIVO' | 'DIAGNOSTICO'
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [guardandoServicio, setGuardandoServicio] = useState(false);

  const [nuevoServicio, setNuevoServicio] = useState({ descripcion: '', precio: 0 });
  const [hallazgoOrigenId, setHallazgoOrigenId] = useState(null);
  const [editingServicioId, setEditingServicioId] = useState(null);
  const [nuevoRepuesto, setNuevoRepuesto] = useState({ repuesto: null, cantidad: 1, precio_unitario: 0 });
  
  const [mecanicos, setMecanicos] = useState([]);
  const [selectedMecanico, setSelectedMecanico] = useState(null);
  const [savingMecanico, setSavingMecanico] = useState(false);
  
  const [repuestosInventario, setRepuestosInventario] = useState([]);

  // Evidencias / Fotos de Ingreso del Vehículo
  const [modalFotoGrande, setModalFotoGrande] = useState({ open: false, url: '', titulo: '' });
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

  // Accesorios y Pertenencias en Custodia
  const [accesoriosModalOpen, setAccesoriosModalOpen] = useState(false);
  const [accesoriosCatalogo, setAccesoriosCatalogo] = useState([]);
  const [accesoriosSeleccionados, setAccesoriosSeleccionados] = useState({});
  const [guardandoAccesorios, setGuardandoAccesorios] = useState(false);
  const [cargandoAccesoriosCatalogo, setCargandoAccesoriosCatalogo] = useState(false);

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
      const res = await api.get(`seguridad/usuarios/?rol=${encodeURIComponent('TÉCNICO_AUTOMOTRIZ')}`);
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

  const getStockDisponibleRepuesto = (repuesto) => parseFloat(repuesto?.stock_total_disponible || 0);

  const repuestosDisponiblesInventario = repuestosInventario;

  const cantidadNuevoRepuesto = parseFloat(nuevoRepuesto.cantidad || 0);
  const stockNuevoRepuesto = getStockDisponibleRepuesto(nuevoRepuesto.repuesto);
  const cantidadRepuestoInvalida = !nuevoRepuesto.repuesto || cantidadNuevoRepuesto <= 0;

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

  const fetchPlantillasServicio = async () => {
    if (plantillasPreventivas.length > 0 || plantillasCorrectivas.length > 0 || plantillasDiagnostico.length > 0) {
      return;
    }
    try {
      setCargandoPlantillas(true);
      const [prevRes, corrRes, diagRes] = await Promise.allSettled([
        tallerService.getPlantillas({ activo: true }),
        tallerService.getPlantillasCorrectivas({ activo: true }),
        tallerService.getPlantillasDiagnostico({ activo: true }),
      ]);
      const prev = prevRes.status === 'fulfilled' ? (prevRes.value?.results || prevRes.value || []) : [];
      const corr = corrRes.status === 'fulfilled' ? (corrRes.value?.results || corrRes.value || []) : [];
      const diag = diagRes.status === 'fulfilled' ? (diagRes.value?.results || diagRes.value || []) : [];
      setPlantillasPreventivas(Array.isArray(prev) ? prev : []);
      setPlantillasCorrectivas(Array.isArray(corr) ? corr : []);
      setPlantillasDiagnostico(Array.isArray(diag) ? diag : []);
    } catch (err) {
      console.error("Error al cargar plantillas de servicios:", err);
    } finally {
      setCargandoPlantillas(false);
    }
  };

  const handleOpenNuevoHallazgo = () => {
    setEditingHallazgoId(null);
    setNuevoHallazgo('');
    setNuevaSeveridad('MEDIA');
    fotosHallazgo.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFotosHallazgo([]);
    setFotosExistentesHallazgo([]);
    setHallazgoModal(true);
  };

  const handleOpenEditarHallazgo = (hallazgo) => {
    setEditingHallazgoId(hallazgo.id);
    setNuevoHallazgo(hallazgo.descripcion);
    setNuevaSeveridad(hallazgo.severidad || 'MEDIA');
    fotosHallazgo.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFotosHallazgo([]);
    setFotosExistentesHallazgo(hallazgo.fotos || []);
    setHallazgoModal(true);
  };

  const handleCloseHallazgoModal = () => {
    if (subiendoHallazgo) return;
    fotosHallazgo.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFotosHallazgo([]);
    setFotosExistentesHallazgo([]);
    setEditingHallazgoId(null);
    setNuevoHallazgo('');
    setHallazgoModal(false);
  };

  const handleSeleccionarFotosHallazgo = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const totalActual = fotosExistentesHallazgo.length + fotosHallazgo.length;
    const disponibles = 2 - totalActual;

    if (disponibles <= 0) {
      Swal.fire('Límite alcanzado', 'Solo puedes adjuntar un máximo de 2 fotos por hallazgo.', 'info');
      event.target.value = '';
      return;
    }

    const archivosAProcesar = files.slice(0, disponibles);
    if (files.length > disponibles) {
      Swal.fire('Aviso', `Solo se procesaron ${disponibles} fotografía(s) para no exceder el máximo de 2.`, 'info');
    }

    try {
      setComprimiendoFotoHallazgo(true);
      const nuevasFotos = [];
      for (const file of archivosAProcesar) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
        const preview = URL.createObjectURL(compressed);
        nuevasFotos.push({ file: compressed, preview });
      }
      setFotosHallazgo(prev => [...prev, ...nuevasFotos]);
    } catch (err) {
      console.error('Error al optimizar imagen de hallazgo:', err);
      Swal.fire('Error', 'No se pudo optimizar la fotografía seleccionada.', 'error');
    } finally {
      setComprimiendoFotoHallazgo(false);
      event.target.value = '';
    }
  };

  const handleQuitarFotoNueva = (index) => {
    const foto = fotosHallazgo[index];
    if (foto?.preview) URL.revokeObjectURL(foto.preview);
    setFotosHallazgo(prev => prev.filter((_, i) => i !== index));
  };

  const handleEliminarFotoExistente = async (fotoId) => {
    const result = await Swal.fire({
      title: '¿Eliminar fotografía?',
      text: 'Se eliminará esta fotografía del hallazgo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await tallerService.eliminarFotoHallazgo(editingHallazgoId, fotoId);
      setFotosExistentesHallazgo(prev => prev.filter(f => f.id !== fotoId));
      fetchOrden();
      Swal.fire({ icon: 'success', title: 'Foto eliminada', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error('Error eliminando foto de hallazgo:', err);
      Swal.fire('Error', 'No se pudo eliminar la fotografía.', 'error');
    }
  };

  const handleAddHallazgo = async () => {
    if (!nuevoHallazgo.trim()) return;
    try {
      setSubiendoHallazgo(true);
      if (fotosHallazgo.length > 0) {
        const formData = new FormData();
        formData.append('descripcion', nuevoHallazgo.trim());
        formData.append('severidad', nuevaSeveridad);
        if (!editingHallazgoId) {
          formData.append('orden', id);
        }
        fotosHallazgo.forEach(f => {
          formData.append('fotos', f.file);
        });

        if (editingHallazgoId) {
          await tallerService.actualizarHallazgo(editingHallazgoId, formData);
        } else {
          await tallerService.crearHallazgo(formData);
        }
      } else {
        if (editingHallazgoId) {
          await tallerService.actualizarHallazgo(editingHallazgoId, {
            descripcion: nuevoHallazgo.trim(),
            severidad: nuevaSeveridad
          });
        } else {
          await tallerService.crearHallazgo({
            orden: id,
            descripcion: nuevoHallazgo.trim(),
            severidad: nuevaSeveridad
          });
        }
      }
      handleCloseHallazgoModal();
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el hallazgo.', 'error');
    } finally {
      setSubiendoHallazgo(false);
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
    setEditingServicioId(null);
    setOrigenServicio('MANUAL');
    setPlantillaSeleccionada(null);
    setNuevoServicio({ descripcion: hallazgo.descripcion, precio: 0 });
    setServicioModal(true);
  };

  const handleOpenNuevoServicio = () => {
    setHallazgoOrigenId(null);
    setEditingServicioId(null);
    setOrigenServicio('PLANTILLA');
    setTipoPlantillaServicio('PREVENTIVO');
    setPlantillaSeleccionada(null);
    setNuevoServicio({ descripcion: '', precio: 0 });
    fetchPlantillasServicio();
    setServicioModal(true);
  };

  const handleOpenEditarServicio = (servicio) => {
    setHallazgoOrigenId(null);
    setEditingServicioId(servicio.id);
    setOrigenServicio('MANUAL');
    setPlantillaSeleccionada(null);
    setNuevoServicio({ descripcion: servicio.descripcion, precio: servicio.precio_estimado });
    setServicioModal(true);
  };

  const handleCloseServicioModal = () => {
    if (guardandoServicio) return;
    setServicioModal(false);
    setHallazgoOrigenId(null);
    setEditingServicioId(null);
    setPlantillaSeleccionada(null);
    setNuevoServicio({ descripcion: '', precio: 0 });
  };

  const handleSelectPlantilla = (plantilla) => {
    setPlantillaSeleccionada(plantilla);
    if (plantilla) {
      setNuevoServicio({
        descripcion: plantilla.nombre + (plantilla.descripcion ? ` - ${plantilla.descripcion}` : ''),
        precio: plantilla.precio_base ? parseFloat(plantilla.precio_base) : 0
      });
    }
  };

  const handleAddServicio = async () => {
    if (!nuevoServicio.descripcion?.trim()) return;
    try {
      setGuardandoServicio(true);
      if (editingServicioId) {
        await tallerService.actualizarServicio(editingServicioId, {
          descripcion: nuevoServicio.descripcion.trim(),
          precio_estimado: parseFloat(nuevoServicio.precio) || 0,
        });
      } else {
        await tallerService.crearServicio({
          orden: id,
          descripcion: nuevoServicio.descripcion.trim(),
          precio_estimado: parseFloat(nuevoServicio.precio) || 0,
          hallazgo_origen: hallazgoOrigenId
        });
      }
      handleCloseServicioModal();
      fetchOrden();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el servicio.', 'error');
    } finally {
      setGuardandoServicio(false);
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
    if (cantidadRepuestoInvalida) {
      Swal.fire(
        'Stock insuficiente',
        `Disponible: ${stockNuevoRepuesto}. Cantidad solicitada: ${nuevoRepuesto.cantidad || 0}.`,
        'warning'
      );
      return;
    }
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
      const mensaje = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.error
        || err.response?.data?.detail
        || 'No se pudo agregar el repuesto.';
      Swal.fire('No se pudo agregar el repuesto', mensaje, 'error');
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
      const msg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo actualizar la instalación.';
      Swal.fire({
        icon: 'warning',
        title: 'Stock no disponible',
        text: msg,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Entendido'
      });
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
  const puedeAgregarHallazgo = esEditable && hayMecanicoAsignado && puedeEditar;
  const puedeEditarSubrecursos = esEditable && puedeEditar;
  const puedeEliminarSubrecursos = esEditable && tienePermiso('ORDENES_TRABAJO.ELIMINAR');
  const puedeGestionarAccesorios = esEditable && (tienePermiso('ORDENES_TRABAJO.GESTIONAR_ACCESORIOS') || puedeCrear);
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

  const handleSubirMasFotos = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      setSubiendoEvidencia(true);
      const formDataFotos = new FormData();
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
        formDataFotos.append('imagenes', compressed);
      }
      formDataFotos.append('descripcion', 'Evidencia adjunta en taller');
      await tallerService.subirEvidenciasOrden(id, formDataFotos);
      Swal.fire({ icon: 'success', title: 'Fotos agregadas', timer: 1500, showConfirmButton: false });
      fetchOrden();
    } catch (err) {
      console.error('Error subiendo fotos:', err);
      Swal.fire('Error', 'No se pudieron subir las fotografías', 'error');
    } finally {
      setSubiendoEvidencia(false);
      event.target.value = '';
    }
  };

  const handleEliminarEvidencia = async (evidenciaId) => {
    const res = await Swal.fire({
      title: '¿Eliminar fotografía?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (res.isConfirmed) {
      try {
        await tallerService.eliminarEvidencia(evidenciaId);
        Swal.fire({ icon: 'success', title: 'Fotografía eliminada', timer: 1200, showConfirmButton: false });
        fetchOrden();
      } catch (err) {
        console.error('Error eliminando foto:', err);
        Swal.fire('Error', 'No se pudo eliminar la fotografía', 'error');
      }
    }
  };

  const fetchAccesoriosCatalogo = async () => {
    try {
      setCargandoAccesoriosCatalogo(true);
      const res = await tallerService.getAccesorios({ activo: true, sin_paginar: true });
      const data = res.results || (Array.isArray(res) ? res : []);
      setAccesoriosCatalogo(data);
    } catch (err) {
      console.error('Error cargando catálogo de accesorios:', err);
    } finally {
      setCargandoAccesoriosCatalogo(false);
    }
  };

  const handleOpenAccesoriosModal = () => {
    fetchAccesoriosCatalogo();
    const actual = {};
    (orden.accesorios_pertenencias || []).forEach(item => {
      const accId = item.accesorio || item.accesorio_id || (item.accesorio_detalle && item.accesorio_detalle.id);
      if (accId) {
        actual[accId] = {
          checked: true,
          cantidad: item.cantidad || 1,
          estado_conservacion: item.estado_conservacion || 'BUENO',
          observaciones: item.observaciones || ''
        };
      }
    });
    setAccesoriosSeleccionados(actual);
    setAccesoriosModalOpen(true);
  };

  const handleToggleAccesorioModal = (accesorioId) => {
    setAccesoriosSeleccionados(prev => {
      const actual = prev[accesorioId];
      if (actual && actual.checked) {
        const copy = { ...prev };
        delete copy[accesorioId];
        return copy;
      }
      return {
        ...prev,
        [accesorioId]: {
          checked: true,
          cantidad: 1,
          estado_conservacion: 'BUENO',
          observaciones: ''
        }
      };
    });
  };

  const handleAccesorioItemChange = (accesorioId, campo, valor) => {
    setAccesoriosSeleccionados(prev => ({
      ...prev,
      [accesorioId]: {
        ...(prev[accesorioId] || { checked: true, cantidad: 1, estado_conservacion: 'BUENO', observaciones: '' }),
        [campo]: valor
      }
    }));
  };

  const handleGuardarAccesorios = async () => {
    const payload = Object.entries(accesoriosSeleccionados)
      .filter(([_, item]) => item && item.checked)
      .map(([id, item]) => ({
        accesorio_id: parseInt(id, 10),
        cantidad: Math.max(1, parseInt(item.cantidad, 10) || 1),
        estado_conservacion: item.estado_conservacion || 'BUENO',
        observaciones: (item.observaciones || '').trim()
      }));

    try {
      setGuardandoAccesorios(true);
      await tallerService.guardarAccesoriosOrden(id, payload);
      setAccesoriosModalOpen(false);
      fetchOrden();
      Swal.fire({
        icon: 'success',
        title: 'Accesorios en custodia actualizados',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error al guardar accesorios:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'No se pudieron guardar los accesorios en custodia.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setGuardandoAccesorios(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', pb: 8 }}>
      
      {/* Header & Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, background: `linear-gradient(135deg, ${alpha(C.brand, 0.08)}, transparent 44%), ${C.surface}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/taller/ordenes')} sx={{ bgcolor: alpha('#ffffff', 0.05), border: `1px solid ${C.border}`, '&:hover': { bgcolor: alpha(C.blue, 0.1) } }}>
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Settings size={28} className="text-sky-300" />
                  OT-{orden.numero}
                </Typography>
                {orden.proforma_origen_numero && (
                  <Chip
                    icon={<FileText size={14} style={{ marginLeft: 6 }} />}
                    label={`Origen: ${orden.proforma_origen_numero}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: alpha(C.blue, 0.12),
                      color: C.blue,
                      border: `1px solid ${alpha(C.blue, 0.3)}`,
                      '& .MuiChip-icon': { color: 'inherit' }
                    }}
                  />
                )}
              </Box>
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
            {!estaCancelada && orden.estado !== 'FACTURADO' && puedeCambiarEstado && (
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
                <Box sx={{ p: 1, bgcolor: alpha(C.blue, 0.12), borderRadius: 2 }}><Wrench size={18} className="text-sky-300" /></Box>
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
                <Box sx={{ p: 1, bgcolor: alpha(C.blue, 0.12), borderRadius: 2 }}><User size={18} className="text-sky-300" /></Box>
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
          <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: `1px solid ${C.border}`, height: '100%', bgcolor: alpha('#ffffff', 0.025) }}>
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
                    {puedeEditar && (
                      <Button size="small" variant="text" onClick={handleOpenMecanicoModal} sx={{ minWidth: 0, p: 0.5, borderRadius: '8px' }} title="Cambiar Mecánico">
                        <Settings size={18} className="text-slate-500" />
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="error.main" fontWeight="600">Sin asignar</Typography>
                    {puedeEditar && (
                      <Button variant="outlined" size="small" onClick={handleOpenMecanicoModal} startIcon={<User size={16} />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start' }}>
                        Asignar ahora
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              {alertaSinAsignar && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: '8px', bgcolor: alpha(C.brand, 0.14), border: `1px solid ${alpha(C.brandLight, 0.38)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                <Box sx={{ p: 1, bgcolor: alpha(C.blue, 0.12), borderRadius: 2 }}><Coins size={18} className="text-sky-300" /></Box>
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
                {!estaCancelada && orden.estado !== 'FACTURADO' && puedePrometerEntrega && (
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
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '8px', bgcolor: alpha(C.brand, 0.13), border: `1px solid ${alpha(C.brandLight, 0.34)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color="#be123c" mb={0.5}>El vehículo está en recepción</Typography>
                <Typography variant="body2" color="#e11d48">Asigna un mecánico para iniciar la inspección técnica o genera la cotización directamente si ya hay servicios.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {(orden.servicios.length > 0 || orden.repuestos.length > 0) && puedeAprobar && (
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ color: '#fda4af', borderColor: alpha(C.brandLight, 0.5), '&:hover': { bgcolor: alpha(C.brand, 0.18), borderColor: C.brandLight }, borderRadius: '8px', fontWeight: 700, px: 3 }}
                    onClick={handleGenerarCotizacion}
                  >
                    Generar Cotización Directa
                  </Button>
                )}
                {puedeEditar && (
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ bgcolor: '#e11d48', '&:hover': { bgcolor: '#be123c' }, borderRadius: '12px', fontWeight: 600, px: 4 }}
                    onClick={handleOpenMecanicoModal}
                  >
                    Enviar a Inspección
                  </Button>
                )}
              </Box>
            </Paper>
          )}

          {orden.estado === 'ESPERANDO_APROBACION' && (
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '8px', bgcolor: isExpirada ? alpha(C.brand, 0.14) : alpha(C.emerald, 0.14), border: `1px solid ${isExpirada ? alpha(C.brandLight, 0.38) : alpha(C.emerald, 0.38)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color={isExpirada ? '#fda4af' : '#6ee7b7'} mb={0.5} display="flex" alignItems="center" gap={1.5}>
                  {isExpirada ? "Cotización Expirada" : "Esperando Aprobación del Cliente"}
                  <Chip label={`Total: S/ ${totalCotizado.toFixed(2)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha('#ffffff', 0.1), color: C.text, border: `1px solid ${C.border}` }} />
                </Typography>
                <Typography variant="body2" color={isExpirada ? '#fecdd3' : '#d1fae5'}>
                  {isExpirada
                    ? `La cotización expiró el ${new Date(orden.fecha_vencimiento_cotizacion).toLocaleDateString()}. Edite la fecha de vencimiento para poder aprobarla.`
                    : `La cotización ha sido generada (Vence: ${orden.fecha_vencimiento_cotizacion ? new Date(orden.fecha_vencimiento_cotizacion).toLocaleDateString() : 'N/A'}). Registra la confirmación del cliente para comenzar los trabajos.`}
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                {puedeExtenderVencimiento && (
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ color: C.text, borderColor: C.border, '&:hover': { bgcolor: alpha(C.blue, 0.1), borderColor: alpha(C.blue, 0.45) }, borderRadius: '8px', fontWeight: 700 }}
                    onClick={handleEditarFechaVencimiento}
                  >
                    Editar Fecha
                  </Button>
                )}
                {puedeAprobar && (
                  <Button
                    variant="contained"
                    size="large"
                    disabled={isExpirada}
                    sx={{ bgcolor: isExpirada ? '#94a3b8' : '#16a34a', '&:hover': { bgcolor: isExpirada ? '#94a3b8' : '#15803d' }, borderRadius: '12px', fontWeight: 600, px: 4, boxShadow: 'none' }}
                    onClick={handleOpenAprobacionModal}
                  >
                    Registrar Aprobación
                  </Button>
                )}
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

                {puedeFinalizar && (
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
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  {(() => {
                    const aprobados = orden.servicios.filter(s => s.aprobado_cliente);
                    const completados = aprobados.filter(s => s.completado).length;
                    const pct = aprobados.length ? (completados / aprobados.length) * 100 : 0;
                    const completo = aprobados.length > 0 && pct === 100;
                    return (
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: `1px solid ${completo ? alpha(C.emerald, 0.42) : C.border}`, borderLeft: '4px solid', borderLeftColor: completo ? C.emerald : C.amber, bgcolor: alpha('#ffffff', 0.025), height: '100%' }}>
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
                        <Paper key={s.id} elevation={0} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#ffffff', 0.035) }}>
                          <Typography variant="body2" fontWeight="600">{s.descripcion}</Typography>
                          <Button 
                            variant={s.completado ? "contained" : "outlined"}
                            color={s.completado ? "success" : "warning"}
                            size="small"
                            onClick={() => handleToggleCompletado(s.id)}
                            disabled={!puedeEditar}
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

                <Grid size={{ xs: 12, md: 6 }}>
                  {(() => {
                    const aprobados = orden.repuestos.filter(r => r.aprobado_cliente);
                    const instalados = aprobados.filter(r => r.instalado).length;
                    const pct = aprobados.length ? (instalados / aprobados.length) * 100 : 0;
                    const completo = aprobados.length > 0 && pct === 100;
                    return (
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: `1px solid ${completo ? alpha(C.emerald, 0.42) : C.border}`, borderLeft: '4px solid', borderLeftColor: completo ? C.emerald : C.amber, bgcolor: alpha('#ffffff', 0.025), height: '100%' }}>
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
                      {orden.repuestos.filter(r => r.aprobado_cliente).map(r => {
                        const tieneStock = r.instalado || r.tiene_stock_suficiente || (parseFloat(r.repuesto_detalle?.stock_total_disponible || 0) >= parseFloat(r.cantidad || 0));
                        return (
                          <Paper key={r.id} elevation={0} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#ffffff', 0.035) }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight="600">{r.repuesto_detalle?.nombre}</Typography>
                                {!r.instalado && !tieneStock && (
                                  <Chip label="⚠️ Requiere Compra" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">Cant: {parseFloat(r.cantidad)}</Typography>
                            </Box>
                            <Button 
                              variant={r.instalado ? "contained" : "outlined"}
                              color={r.instalado ? "success" : tieneStock ? "warning" : "warning"}
                              size="small"
                              onClick={() => handleToggleInstalado(r.id)}
                              disabled={!puedeEditar}
                              startIcon={r.instalado ? <CheckCircle size={16}/> : <Clock size={16}/>}
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                            >
                              {r.instalado ? 'Instalado' : (tieneStock ? 'Pendiente' : 'Sin Stock')}
                            </Button>
                          </Paper>
                        );
                      })}
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
            <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: '8px', bgcolor: alpha(C.blue, 0.14), border: `1px solid ${alpha(C.blue, 0.38)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="700" color="#1e3a8a" mb={0.5}>Orden de Trabajo Finalizada</Typography>
                <Typography variant="body2" color="#1e40af">Todos los servicios y repuestos han sido completados. Ya puedes proceder con el cobro en caja.</Typography>
              </Box>
              {puedeCobrarPos && (
                <Button
                  variant="contained"
                  size="large"
                  sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, borderRadius: '12px', fontWeight: 600, px: 4, boxShadow: 'none' }}
                  onClick={handleEnviarAPos}
                >
                  Cobrar en Punto de Venta
                </Button>
              )}
            </Paper>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
            {/* Inspección */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: alpha(C.blue, 0.1), borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <Grid size={{ xs: 12, sm: 6 }} key={h.id}>
                          <Box sx={{ p: 2, border: '1px solid', borderColor: sev.border, borderLeft: '4px solid', borderLeftColor: sev.color, borderRadius: '12px', bgcolor: sev.bg }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                                <Typography component="span" variant="caption" sx={{ color: C.text, fontWeight: 700, fontSize: '0.72rem' }}>
                                  Hallazgo #{i+1}
                                </Typography>
                                <Chip
                                  label={sev.label}
                                  size="small"
                                  sx={{ height: '22px', fontSize: '0.72rem', fontWeight: 800, bgcolor: sev.color, color: sev.textColor, border: `1px solid ${alpha(sev.color, 0.82)}`, '& .MuiChip-label': { px: 0.9 } }}
                                />
                                {yaCotizado && (
                                  <Chip label="Cotizado" size="small" color="success" variant="outlined" sx={{ height: '22px', fontSize: '0.72rem', fontWeight: 800, color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.6)', '& .MuiChip-label': { px: 0.9 } }} />
                                )}
                              </Box>
                              {(puedeEditarSubrecursos || puedeEliminarSubrecursos) && (
                                <Box sx={{ display: 'flex', gap: 0.25 }}>
                                  {puedeEditarSubrecursos && (
                                    <IconButton size="small" onClick={() => handleOpenEditarHallazgo(h)} title="Editar hallazgo">
                                      <Pencil size={14} />
                                    </IconButton>
                                  )}
                                  {puedeEliminarSubrecursos && (
                                    <IconButton size="small" onClick={() => handleDeleteHallazgo(h)} title="Eliminar hallazgo">
                                      <X size={14} className="text-red-500" />
                                    </IconButton>
                                  )}
                                </Box>
                              )}
                            </Box>
                            <Typography variant="body2" fontWeight="500" mb={h.fotos && h.fotos.length > 0 ? 1 : 1.5}>
                              {h.descripcion}
                            </Typography>

                            {/* Miniaturas de fotos del hallazgo */}
                            {h.fotos && h.fotos.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                {h.fotos.map((foto, fIdx) => (
                                  <Box
                                    key={foto.id}
                                    onClick={() => setModalFotoGrande({
                                      open: true,
                                      url: getMediaUrl(foto.imagen),
                                      titulo: `Hallazgo #${i+1} - Foto ${fIdx + 1}`
                                    })}
                                    sx={{
                                      width: 58,
                                      height: 58,
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      border: `1px solid ${alpha(sev.border, 0.7)}`,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: S.hover
                                      }
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={getMediaUrl(foto.imagen)}
                                      alt={`Foto hallazgo ${fIdx + 1}`}
                                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </Box>
                                ))}
                              </Box>
                            )}

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
              <Box sx={{ p: 3, bgcolor: alpha(C.blue, 0.1), borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                  <Wrench size={20} className="text-slate-500" />
                  2. Servicios y Mano de Obra a Cotizar
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Plus size={16} />} 
                  onClick={handleOpenNuevoServicio}
                  disabled={!puedeEditarSubrecursos}
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
                            <Chip label="Pendiente" size="small" sx={{ fontWeight: 700, borderRadius: '6px', bgcolor: alpha(C.amber, 0.14), color: '#fcd34d', border: `1px solid ${alpha(C.amber, 0.3)}` }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {(puedeEditarSubrecursos || puedeEliminarSubrecursos) && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                              {puedeEditarSubrecursos && (
                                <IconButton size="small" onClick={() => handleOpenEditarServicio(s)} title="Editar servicio">
                                  <Pencil size={14} />
                                </IconButton>
                              )}
                              {puedeEliminarSubrecursos && (
                                <IconButton size="small" onClick={() => handleDeleteServicio(s)} title="Eliminar servicio">
                                  <X size={14} className="text-red-500" />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {orden.servicios.length > 0 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: alpha(C.blue, 0.07) }}>
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
              <Box sx={{ p: 3, bgcolor: alpha(C.blue, 0.1), borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                  <Package size={20} className="text-slate-500" />
                  3. Repuestos y Materiales
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Plus size={16} />} 
                  onClick={handleOpenRepuestoModal}
                  disabled={!puedeEditarSubrecursos}
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
                    orden.repuestos.map(r => {
                      const tieneStock = r.instalado || r.tiene_stock_suficiente || (parseFloat(r.repuesto_detalle?.stock_total_disponible || 0) >= parseFloat(r.cantidad || 0));
                      return (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <span>{r.repuesto_detalle?.nombre || 'Repuesto'}</span>
                              {r.instalado ? (
                                <Chip label="Instalado" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                              ) : tieneStock ? (
                                <Chip label="En stock" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                              ) : (
                                <Chip label="⚠️ Sin stock (Por comprar)" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                              )}
                            </Box>
                            {r.repuesto_detalle?.codigo_fabricante && <Typography variant="caption" display="block" color="text.secondary">{r.repuesto_detalle.codigo_fabricante}</Typography>}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>{parseFloat(r.cantidad).toString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(r.precio_unitario).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            S/ {(parseFloat(r.cantidad) * parseFloat(r.precio_unitario)).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                          {(puedeEditarSubrecursos || puedeEliminarSubrecursos) && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
                              {puedeEditarSubrecursos && (
                                <IconButton size="small" onClick={() => handleEditarCantidadRepuesto(r)} title="Editar cantidad">
                                  <Pencil size={14} />
                                </IconButton>
                              )}
                              {puedeEliminarSubrecursos && (
                                <IconButton size="small" onClick={() => handleDeleteRepuesto(r)} title="Eliminar repuesto">
                                  <X size={14} className="text-red-500" />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                </TableBody>
                {orden.repuestos.length > 0 && (
                  <TableBody>
                    <TableRow sx={{ bgcolor: alpha(C.blue, 0.07) }}>
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

            {/* 4. Fotos y Evidencias de Ingreso */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: alpha(C.brand, 0.1), borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                    <Camera size={20} className="text-rose-400" />
                    4. Fotos y Evidencias de Ingreso
                    <Chip label={(orden.evidencias_ingreso || []).length} size="small" sx={{ fontWeight: 700, bgcolor: alpha('#ffffff', 0.1), color: C.text }} />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registro fotográfico del estado del vehículo al ingresar al taller.
                  </Typography>
                </Box>

                {puedeEditar && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      component="label"
                      disabled={subiendoEvidencia}
                      startIcon={<Camera size={16} />}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                    >
                      Tomar Foto
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        capture="environment"
                        onChange={handleSubirMasFotos}
                      />
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      component="label"
                      disabled={subiendoEvidencia}
                      startIcon={<UploadCloud size={16} />}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                    >
                      Subir Foto
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleSubirMasFotos}
                      />
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 3 }}>
                {subiendoEvidencia && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, color: C.brandLight }}>
                    <CircularProgress size={20} color="inherit" />
                    <Typography variant="body2">Optimizando y subiendo fotografías...</Typography>
                  </Box>
                )}

                {(!orden.evidencias_ingreso || orden.evidencias_ingreso.length === 0) ? (
                  <Box py={4} textAlign="center">
                    <ImageIcon size={36} className="text-slate-500 opacity-50" style={{ margin: '0 auto 8px auto' }} />
                    <Typography variant="body2" color="text.secondary">
                      No se registraron fotos durante la recepción de este vehículo.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {orden.evidencias_ingreso.map((ev, i) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ev.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            borderRadius: '12px',
                            border: `1px solid ${C.border}`,
                            overflow: 'hidden',
                            bgcolor: alpha('#ffffff', 0.02),
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: alpha(C.brand, 0.5), transform: 'translateY(-2px)' }
                          }}
                        >
                          <Box
                            sx={{
                              width: '100%',
                              aspectRatio: '4/3',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                            onClick={() => setModalFotoGrande({
                              open: true,
                              url: getMediaUrl(ev.imagen),
                              titulo: `OT-${orden.numero} - ${ev.descripcion || `Foto #${i + 1}`}`
                            })}
                          >
                            <Box
                              component="img"
                              src={getMediaUrl(ev.imagen)}
                              alt={ev.descripcion || `Evidencia ${i + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#ffffff'
                              }}
                            >
                              Foto #{i + 1}
                            </Box>
                          </Box>

                          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" fontWeight="600" noWrap title={ev.descripcion || 'Sin descripción'}>
                                {ev.descripcion || 'Foto de recepción'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {ev.fecha_registro ? new Date(ev.fecha_registro).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                              </Typography>
                            </Box>
                            {puedeEliminarSubrecursos && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEliminarEvidencia(ev.id)}
                                title="Eliminar foto"
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Paper>

            {/* 5. Accesorios y Pertenencias en Custodia */}
            <Paper elevation={0} sx={{ p: 0, borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: alpha(C.brand, 0.1), borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="700" display="flex" alignItems="center" gap={1.5}>
                    <ShieldCheck size={20} className="text-rose-400" />
                    5. Accesorios y Pertenencias en Custodia
                    <Chip 
                      label={(orden.accesorios_pertenencias || []).length} 
                      size="small" 
                      sx={{ fontWeight: 700, bgcolor: alpha('#ffffff', 0.1), color: C.text }} 
                    />
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Inventario de herramientas, extintor, repuesto y objetos del cliente recibidos al momento del ingreso.
                  </Typography>
                </Box>
                {puedeGestionarAccesorios && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={(orden.accesorios_pertenencias || []).length > 0 ? <Pencil size={15} /> : <Plus size={15} />}
                    onClick={handleOpenAccesoriosModal}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: '#f43f5e',
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      '&:hover': {
                        borderColor: '#f43f5e',
                        bgcolor: 'rgba(244, 63, 94, 0.08)'
                      }
                    }}
                  >
                    {(orden.accesorios_pertenencias || []).length > 0 ? 'Modificar Custodia' : 'Registrar Custodia'}
                  </Button>
                )}
              </Box>

              <Box sx={{ p: 3 }}>
                {(!orden.accesorios_pertenencias || orden.accesorios_pertenencias.length === 0) ? (
                  <Box py={4} textAlign="center">
                    <ShieldCheck size={36} className="text-slate-500 opacity-40" style={{ margin: '0 auto 8px auto' }} />
                    <Typography variant="body2" color="text.secondary">
                      No se registraron accesorios ni pertenencias en custodia para este vehículo.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {orden.accesorios_pertenencias.map((item) => {
                      const estConfig = {
                        BUENO: { label: 'Bueno', bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
                        REGULAR: { label: 'Regular', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
                        MALO: { label: 'Malo', bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
                      }[item.estado_conservacion] || { label: item.estado_conservacion_display || item.estado_conservacion, bg: 'rgba(255, 255, 255, 0.05)', text: '#cbd5e1', border: 'rgba(255, 255, 255, 0.1)' };

                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: '14px',
                              border: `1px solid ${C.border}`,
                              bgcolor: alpha('#ffffff', 0.02),
                              display: 'flex',
                              flexDirection: 'col',
                              gap: 1.5,
                              transition: 'all 0.2s ease',
                              '&:hover': { borderColor: alpha(C.brand, 0.4) }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight="700" color="text.primary">
                                {item.accesorio_nombre}
                              </Typography>
                              <Chip
                                label={`x${item.cantidad}`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  bgcolor: alpha('#ffffff', 0.08),
                                  color: C.text
                                }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Estado:
                              </Typography>
                              <Chip
                                label={estConfig.label}
                                size="small"
                                sx={{
                                  height: '22px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  bgcolor: estConfig.bg,
                                  color: estConfig.text,
                                  border: `1px solid ${estConfig.border}`
                                }}
                              />
                            </Box>

                            {item.observaciones && (
                              <Typography variant="caption" color="text.secondary" sx={{ bgcolor: alpha('#ffffff', 0.03), p: 1, borderRadius: '8px', fontStyle: 'italic' }}>
                                &ldquo;{item.observaciones}&rdquo;
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            </Paper>

            {/* Acciones Generales (Enviar Cotizacion) */}
            {orden.estado === 'INSPECCION' && puedeAprobar && (
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
      <Dialog open={hallazgoModal} onClose={handleCloseHallazgoModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
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

          {/* Fotografías del Hallazgo (Opcional - Máx. 2) */}
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" fontWeight="700" color="text.secondary" display="flex" alignItems="center" gap={1}>
                <Camera size={15} />
                Fotografías del Hallazgo (Opcional)
              </Typography>
              <Chip
                label={`${fotosExistentesHallazgo.length + fotosHallazgo.length}/2 fotos`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: (fotosExistentesHallazgo.length + fotosHallazgo.length) >= 2 ? alpha(C.amber, 0.2) : alpha(C.blue, 0.15),
                  color: (fotosExistentesHallazgo.length + fotosHallazgo.length) >= 2 ? C.amber : C.blue,
                }}
              />
            </Box>

            {/* Zona interactiva unificada para tomar o adjuntar */}
            {(fotosExistentesHallazgo.length + fotosHallazgo.length) < 2 && (
              <Box
                sx={{
                  border: '1.5px dashed',
                  borderColor: alpha(C.border, 0.8),
                  borderRadius: '12px',
                  p: 2,
                  textAlign: 'center',
                  bgcolor: alpha(C.surface, 0.4),
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Puedes adjuntar hasta 2 fotos para documentar la falla o daño visualmente.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    disabled={comprimiendoFotoHallazgo || subiendoHallazgo}
                    startIcon={<Camera size={16} />}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Tomar Foto
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      capture="environment"
                      onChange={handleSeleccionarFotosHallazgo}
                    />
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    disabled={comprimiendoFotoHallazgo || subiendoHallazgo}
                    startIcon={<UploadCloud size={16} />}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Subir de Galería
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleSeleccionarFotosHallazgo}
                    />
                  </Button>
                </Box>
              </Box>
            )}

            {comprimiendoFotoHallazgo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: C.brandLight }}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="caption">Optimizando imagen...</Typography>
              </Box>
            )}

            {/* Tira de fotos ya adjuntas / existentes */}
            {(fotosExistentesHallazgo.length > 0 || fotosHallazgo.length > 0) && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Fotos existentes en el servidor */}
                {fotosExistentesHallazgo.map((foto) => (
                  <Box
                    key={`existente-${foto.id}`}
                    sx={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: `1px solid ${C.border}`,
                      boxShadow: S.card
                    }}
                  >
                    <Box
                      component="img"
                      src={getMediaUrl(foto.imagen)}
                      alt="Foto hallazgo"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setModalFotoGrande({ open: true, url: getMediaUrl(foto.imagen), titulo: 'Foto de Hallazgo' })}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleEliminarFotoExistente(foto.id)}
                      disabled={subiendoHallazgo}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: '#f87171',
                        p: '3px',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                      }}
                      title="Eliminar foto"
                    >
                      <Trash2 size={13} />
                    </IconButton>
                  </Box>
                ))}

                {/* Nuevas fotos locales pendientes de guardar */}
                {fotosHallazgo.map((foto, idx) => (
                  <Box
                    key={`nueva-${idx}`}
                    sx={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: `2px solid ${C.brandLight}`,
                      boxShadow: S.card
                    }}
                  >
                    <Box
                      component="img"
                      src={foto.preview}
                      alt="Nueva foto"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleQuitarFotoNueva(idx)}
                      disabled={subiendoHallazgo}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: '#f87171',
                        p: '3px',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                      }}
                      title="Quitar foto"
                    >
                      <X size={13} />
                    </IconButton>
                    <Chip
                      label="Nueva"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        height: 16,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        bgcolor: alpha(C.brand, 0.85),
                        color: 'white'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseHallazgoModal} color="inherit" sx={{ fontWeight: 600 }} disabled={subiendoHallazgo}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddHallazgo}
            variant="contained"
            disabled={subiendoHallazgo || comprimiendoFotoHallazgo || !nuevoHallazgo.trim()}
            sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}
          >
            {subiendoHallazgo ? <CircularProgress size={20} color="inherit" /> : (editingHallazgoId ? 'Guardar Cambios' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Servicio */}
      <Dialog open={servicioModal} onClose={handleCloseServicioModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight="700">
            {editingServicioId ? 'Editar Servicio' : 'Agregar Servicio a Cotizar'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '22px !important' }}>
          {hallazgoOrigenId && (
            <Alert severity="info" sx={{ borderRadius: '10px' }}>
              Este servicio quedará vinculado al hallazgo de inspección.
            </Alert>
          )}

          {/* Si es nuevo y no viene de hallazgo, selector de origen (Plantilla vs Manual) */}
          {!editingServicioId && !hallazgoOrigenId && (
            <Box>
              <ToggleButtonGroup
                value={origenServicio}
                exclusive
                onChange={(e, val) => {
                  if (val) {
                    setOrigenServicio(val);
                    if (val === 'PLANTILLA') {
                      fetchPlantillasServicio();
                    }
                  }
                }}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="PLANTILLA" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px !important' }}>
                  Desde Plantilla de Taller
                </ToggleButton>
                <ToggleButton value="MANUAL" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px !important' }}>
                  Escribir Manualmente
                </ToggleButton>
              </ToggleButtonGroup>

              {origenServicio === 'PLANTILLA' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: alpha(C.surface, 0.5), borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <Typography variant="caption" fontWeight="700" color="text.secondary">
                    Categoría de Plantilla:
                  </Typography>
                  <ToggleButtonGroup
                    value={tipoPlantillaServicio}
                    exclusive
                    onChange={(e, val) => {
                      if (val) {
                        setTipoPlantillaServicio(val);
                        setPlantillaSeleccionada(null);
                      }
                    }}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="PREVENTIVO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                      Preventivos ({plantillasPreventivas.length})
                    </ToggleButton>
                    <ToggleButton value="CORRECTIVO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                      Correctivos ({plantillasCorrectivas.length})
                    </ToggleButton>
                    <ToggleButton value="DIAGNOSTICO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                      Diagnóstico ({plantillasDiagnostico.length})
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Autocomplete
                    loading={cargandoPlantillas}
                    options={
                      tipoPlantillaServicio === 'PREVENTIVO'
                        ? plantillasPreventivas
                        : tipoPlantillaServicio === 'CORRECTIVO'
                          ? plantillasCorrectivas
                          : plantillasDiagnostico
                    }
                    value={plantillaSeleccionada}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      const precio = option.precio_base ? ` | S/ ${parseFloat(option.precio_base).toFixed(2)}` : '';
                      return `${option.nombre}${precio}`;
                    }}
                    onChange={(e, val) => handleSelectPlantilla(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar o Buscar Servicio"
                        placeholder="Escribe para buscar..."
                        size="small"
                      />
                    )}
                    noOptionsText={cargandoPlantillas ? 'Cargando plantillas...' : 'No hay plantillas disponibles en esta categoría'}
                  />
                  {plantillaSeleccionada && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      * Se han precargado la descripción y el costo estimado sugerido. Puedes modificarlos abajo si es necesario.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          <TextField
            label="Descripción del Servicio"
            fullWidth
            multiline
            rows={2}
            value={nuevoServicio.descripcion}
            onChange={e => setNuevoServicio({ ...nuevoServicio, descripcion: e.target.value })}
            placeholder="Ej: Cambio de pastillas de freno delanteras..."
            required
            sx={{
              mt: 1,
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
                fontSize: '0.92rem',
                '&.Mui-focused': {
                  color: C.brandLight || 'primary.main',
                  fontWeight: 600,
                }
              }
            }}
          />
          <TextField
            label="Costo Estimado (S/)"
            type="number"
            fullWidth
            value={nuevoServicio.precio}
            onChange={e => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
            inputProps={{ min: 0, step: '0.50' }}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
                fontSize: '0.92rem',
                '&.Mui-focused': {
                  color: C.brandLight || 'primary.main',
                  fontWeight: 600,
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseServicioModal} color="inherit" sx={{ fontWeight: 600 }} disabled={guardandoServicio}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddServicio}
            variant="contained"
            disabled={guardandoServicio || !nuevoServicio.descripcion?.trim()}
            sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}
          >
            {guardandoServicio ? <CircularProgress size={20} color="inherit" /> : (editingServicioId ? 'Guardar Cambios' : 'Agregar')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal Repuesto */}
      <Dialog open={repuestoModal} onClose={() => setRepuestoModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle><Typography variant="h6" fontWeight="700">Agregar Repuesto a Cotizar</Typography></DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Autocomplete
            options={repuestosDisponiblesInventario}
            getOptionLabel={(option) => {
              const stock = getStockDisponibleRepuesto(option);
              const stockTxt = stock > 0 ? `Stock: ${stock}` : '⚠️ Sin stock (Requiere compra)';
              return `${option.nombre} ${option.codigo_fabricante ? `(${option.codigo_fabricante})` : ''} | ${stockTxt}`;
            }}
            onChange={(e, val) => setNuevoRepuesto({...nuevoRepuesto, repuesto: val, precio_unitario: val?.precio_lista || 0})}
            renderInput={(params) => <TextField {...params} label="Buscar Repuesto en Catálogo" fullWidth />}
            noOptionsText="No se encontraron repuestos en el catálogo"
          />
          {nuevoRepuesto.repuesto && (
            stockNuevoRepuesto > 0 ? (
              <Alert severity="info" sx={{ borderRadius: '10px' }}>
                Stock disponible en almacén: <strong>{stockNuevoRepuesto}</strong>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                ⚠️ <strong>Sin stock en almacén:</strong> Este repuesto se agregará a la cotización como <em>Pendiente de compra</em>. Deberá registrar su compra en el módulo de Compras antes de que el mecánico pueda instalarlo.
              </Alert>
            )
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Cantidad" type="number" fullWidth 
              value={nuevoRepuesto.cantidad} onChange={e => setNuevoRepuesto({...nuevoRepuesto, cantidad: e.target.value})}
              error={!!nuevoRepuesto.repuesto && cantidadRepuestoInvalida}
              helperText={nuevoRepuesto.repuesto && cantidadRepuestoInvalida ? 'La cantidad debe ser mayor a 0' : ''}
            />
            <TextField 
              label="Precio Unitario (S/)" type="number" fullWidth 
              value={nuevoRepuesto.precio_unitario} onChange={e => setNuevoRepuesto({...nuevoRepuesto, precio_unitario: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRepuestoModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAddRepuesto} variant="contained" disabled={cantidadRepuestoInvalida} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>Agregar</Button>
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

      {/* Modal para ver foto de evidencia en tamaño completo */}
      <Dialog
        open={modalFotoGrande.open}
        onClose={() => setModalFotoGrande({ open: false, url: '', titulo: '' })}
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: '#0f172a',
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {modalFotoGrande.titulo || 'Evidencia de Ingreso'}
          </Typography>
          <IconButton size="small" onClick={() => setModalFotoGrande({ open: false, url: '', titulo: '' })} sx={{ color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#020617' }}>
          {modalFotoGrande.url && (
            <Box
              component="img"
              src={getMediaUrl(modalFotoGrande.url)}
              alt="Evidencia"
              sx={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Accesorios y Pertenencias en Custodia */}
      <Dialog
        open={accesoriosModalOpen}
        onClose={() => !guardandoAccesorios && setAccesoriosModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: C.surface,
            border: `1px solid ${C.border}`
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: `1px solid ${C.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ShieldCheck size={24} className="text-rose-500" />
            <Box>
              <Typography variant="h6" fontWeight="700">
                Accesorios y Pertenencias en Custodia
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vehículo {orden.vehiculo_detalle?.placa || ''} — OT-{orden.numero}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, mt: 1 }}>
            Marque los accesorios y pertenencias que el cliente deja dentro del vehículo e indique su cantidad, estado de conservación y observaciones.
          </Typography>

          {cargandoAccesoriosCatalogo ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : accesoriosCatalogo.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '10px' }}>
              No hay accesorios configurados en el catálogo. Puedes configurarlos en Taller &gt; Accesorios y Pertenencias.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {accesoriosCatalogo.map((acc) => {
                const sel = accesoriosSeleccionados[acc.id];
                const isChecked = !!sel?.checked;

                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={acc.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: `1px solid ${isChecked ? 'rgba(244, 63, 94, 0.6)' : C.border}`,
                        bgcolor: isChecked ? 'rgba(244, 63, 94, 0.05)' : alpha(C.surface, 0.5),
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={() => handleToggleAccesorioModal(acc.id)}
                              sx={{
                                color: 'text.secondary',
                                '&.Mui-checked': { color: '#f43f5e' }
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle2" fontWeight="700" color={isChecked ? 'text.primary' : 'text.secondary'}>
                                {acc.nombre}
                              </Typography>
                              {acc.descripcion && (
                                <Typography variant="caption" color="text.secondary">
                                  {acc.descripcion}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ m: 0, flex: 1, alignItems: 'flex-start' }}
                        />
                        {isChecked && (
                          <Chip
                            label="En custodia"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(244, 63, 94, 0.15)',
                              color: '#f43f5e',
                              border: '1px solid rgba(244, 63, 94, 0.3)'
                            }}
                          />
                        )}
                      </Box>

                      {isChecked && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${alpha(C.border, 0.6)}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField
                              label="Cant."
                              type="number"
                              size="small"
                              value={sel.cantidad || 1}
                              onChange={(e) => handleAccesorioItemChange(acc.id, 'cantidad', e.target.value)}
                              inputProps={{ min: 1, max: 99 }}
                              sx={{ width: 80 }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" fontWeight="600" color="text.secondary" display="block" mb={0.5}>
                                Estado
                              </Typography>
                              <ToggleButtonGroup
                                value={sel.estado_conservacion || 'BUENO'}
                                exclusive
                                size="small"
                                onChange={(e, val) => val && handleAccesorioItemChange(acc.id, 'estado_conservacion', val)}
                                fullWidth
                              >
                                <ToggleButton
                                  value="BUENO"
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    py: 0.3,
                                    '&.Mui-selected': { bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }
                                  }}
                                >
                                  Bueno
                                </ToggleButton>
                                <ToggleButton
                                  value="REGULAR"
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    py: 0.3,
                                    '&.Mui-selected': { bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }
                                  }}
                                >
                                  Regular
                                </ToggleButton>
                                <ToggleButton
                                  value="MALO"
                                  sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    py: 0.3,
                                    '&.Mui-selected': { bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }
                                  }}
                                >
                                  Malo
                                </ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          </Box>
                          <TextField
                            label="Observaciones (opcional)"
                            size="small"
                            placeholder="Detalle o estado específico..."
                            value={sel.observaciones || ''}
                            onChange={(e) => handleAccesorioItemChange(acc.id, 'observaciones', e.target.value)}
                            fullWidth
                          />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${C.border}` }}>
          <Button
            onClick={() => setAccesoriosModalOpen(false)}
            color="inherit"
            disabled={guardandoAccesorios}
            sx={{ fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarAccesorios}
            disabled={guardandoAccesorios}
            sx={{
              borderRadius: '10px',
              fontWeight: 600,
              bgcolor: '#f43f5e',
              '&:hover': { bgcolor: '#e11d48' },
              boxShadow: 'none'
            }}
          >
            {guardandoAccesorios ? <CircularProgress size={20} color="inherit" /> : 'Guardar Pertenencias'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
