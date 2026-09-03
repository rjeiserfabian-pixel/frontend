import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Grid, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Stepper, Step, StepLabel, Autocomplete, Checkbox, FormControlLabel, FormGroup
} from '@mui/material';
import { ArrowLeft, Plus, Printer, MessageSquare, Wrench, Settings, ClipboardList, Package, User, CheckCircle, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';

const PASOS_ORDEN = [
  'RECEPCIONADO',
  'INSPECCION',
  'ESPERANDO_APROBACION',
  'APROBADO',
  'FINALIZADO'
];

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [nuevoServicio, setNuevoServicio] = useState({ descripcion: '', precio: 0 });
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

  const handleAddHallazgo = async () => {
    try {
      await tallerService.crearHallazgo({ orden: id, descripcion: nuevoHallazgo });
      setHallazgoModal(false);
      setNuevoHallazgo('');
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServicio = async () => {
    try {
      await tallerService.crearServicio({ 
        orden: id, 
        descripcion: nuevoServicio.descripcion, 
        precio_estimado: nuevoServicio.precio 
      });
      setServicioModal(false);
      setNuevoServicio({ descripcion: '', precio: 0 });
      fetchOrden();
    } catch (err) {
      console.error(err);
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
    }
  };

  const handleImprimirPDF = async () => {
    try {
      const res = await api.get(`taller/ordenes/${id}/generar_pdf/`, { responseType: 'blob' });
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
      const data = await tallerService.enviarAPos(id);
      // Redirigir al POS (Punto de Venta) con el ticket generado
      navigate(`/ventas/pos`, { state: { autoOpenVentaId: data.venta_id } });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error al enviar al Punto de Venta");
    }
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

  const activeStep = PASOS_ORDEN.indexOf(orden.estado);
  const esEditable = orden.estado === 'RECEPCIONADO' || orden.estado === 'INSPECCION';
  const isExpirada = orden.fecha_vencimiento_cotizacion && new Date() > new Date(orden.fecha_vencimiento_cotizacion);

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
            <Button variant="contained" color="success" startIcon={<MessageSquare size={18} />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}>
              WhatsApp
            </Button>
          </Box>
        </Box>

        <Box sx={{ width: '100%', px: 2 }}>
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
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {/* Top Row: Info Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          
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
                <Typography variant="h6" fontWeight="700" color={isExpirada ? "#991b1b" : "#166534"} mb={0.5}>
                  {isExpirada ? "Cotización Expirada" : "Esperando Aprobación del Cliente"}
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
                <Typography variant="h6" fontWeight="800" color="primary.main" display="flex" alignItems="center" gap={1}>
                  <CheckCircle size={24} /> Panel de Ejecución
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
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'slate.50', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="700" mb={2} display="flex" justifyContent="space-between">
                      Servicios Aprobados
                      <Chip label={`${orden.servicios.filter(s => s.aprobado_cliente && s.completado).length}/${orden.servicios.filter(s => s.aprobado_cliente).length}`} size="small" />
                    </Typography>
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
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'slate.50', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="700" mb={2} display="flex" justifyContent="space-between">
                      Repuestos Aprobados
                      <Chip label={`${orden.repuestos.filter(r => r.aprobado_cliente && r.instalado).length}/${orden.repuestos.filter(r => r.aprobado_cliente).length}`} size="small" />
                    </Typography>
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
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<Plus size={16} />} 
                  onClick={() => setHallazgoModal(true)}
                  disabled={!esEditable}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Nuevo Hallazgo
                </Button>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {orden.hallazgos.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary">No se han registrado hallazgos durante la inspección.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {orden.hallazgos.map((h, i) => (
                      <Grid item xs={12} sm={6} key={h.id}>
                        <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: '12px', bgcolor: 'slate.50' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" display="block" mb={0.5}>Hallazgo #{i+1}</Typography>
                          <Typography variant="body2" fontWeight="500">{h.descripcion}</Typography>
                        </Box>
                      </Grid>
                    ))}
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
                  onClick={() => setServicioModal(true)}
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orden.servicios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orden.repuestos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
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
        <DialogTitle><Typography variant="h6" fontWeight="700">Registrar Hallazgo</Typography></DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus margin="dense" label="Descripción detallada" fullWidth multiline rows={3}
            value={nuevoHallazgo} onChange={e => setNuevoHallazgo(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setHallazgoModal(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleAddHallazgo} variant="contained" disabled={!nuevoHallazgo} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>Guardar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal Servicio */}
      <Dialog open={servicioModal} onClose={() => setServicioModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle><Typography variant="h6" fontWeight="700">Agregar Servicio a Cotizar</Typography></DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
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
          <Button onClick={handleAddServicio} variant="contained" disabled={!nuevoServicio.descripcion} sx={{ borderRadius: '10px', fontWeight: 600, boxShadow: 'none' }}>Agregar</Button>
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
