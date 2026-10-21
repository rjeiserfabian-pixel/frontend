import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Grid,
  FormControlLabel, Checkbox, Divider, Autocomplete, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Save, Plus, X, Camera, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';
import VehiculosForm from '../../vehiculos/components/VehiculosForm';
import ClientesForm from '../../clientes/components/ClientesForm';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import { compressImage } from '../../../utils/imageCompressor';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('ORDENES_TRABAJO.CREAR');
  const puedeCrearTipoServicio = tienePermiso('TIPOS_SERVICIO.CREAR');
  const [loading, setLoading] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillasCorrectivas, setPlantillasCorrectivas] = useState([]);
  const [tiposServicio, setTiposServicio] = useState([]);

  const [formData, setFormData] = useState({
    cliente_id: null,
    vehiculo_id: null,
    tipo_servicio_id: null,
    kilometraje: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [modalError, setModalError] = useState('');

  const [preventivo, setPreventivo] = useState({});
  const [correctivo, setCorrectivo] = useState({});
  const [observaciones, setObservaciones] = useState('');

  // Evidencias / Fotos de Recepción del Vehículo
  const [fotos, setFotos] = useState([]);
  const [comprimiendoFotos, setComprimiendoFotos] = useState(false);

  // Quick Registration Modals
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [tipoServicioModalOpen, setTipoServicioModalOpen] = useState(false);
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('');

  useEffect(() => {
    fetchClientes();
    fetchPlantillas();
    fetchPlantillasCorrectivas();
    fetchTiposServicio();
  }, []);

  const fetchPlantillas = async () => {
    try {
      // Filtrar solo las activas
      const res = await tallerService.getPlantillas({ activo: true });
      setPlantillas(res.results || res);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    }
  };

  const fetchPlantillasCorrectivas = async () => {
    try {
      const res = await tallerService.getPlantillasCorrectivas({ activo: true });
      setPlantillasCorrectivas(res.results || res);
    } catch (err) {
      console.error('Error cargando plantillas correctivas:', err);
    }
  };

  const fetchTiposServicio = async () => {
    try {
      const res = await tallerService.getTiposServicio({ estado: true });
      const data = res.results || res;
      setTiposServicio(data);
    } catch (err) {
      console.error('Error cargando tipos de servicio:', err);
    }
  };

  const handleSaveTipoServicio = async () => {
    if (!nuevoTipoNombre.trim()) {
      setModalError('El nombre es obligatorio');
      return;
    }
    setModalError('');
    try {
      setLoading(true);
      const nuevo = await tallerService.crearTipoServicio({ nombre: nuevoTipoNombre, estado: true });
      Swal.fire('Éxito', 'Tipo de Servicio registrado', 'success');
      setTipoServicioModalOpen(false);
      setNuevoTipoNombre('');
      // Se inyecta directo en la lista local y se selecciona; no depende de que el
      // tipo recién creado caiga dentro de la página que devuelva el listado (mismo
      // problema que afectaba a clientes y vehículos).
      if (nuevo?.id) {
        setTiposServicio(prev => prev.some(t => t.id === nuevo.id) ? prev : [nuevo, ...prev]);
        setFormData(prev => ({ ...prev, tipo_servicio_id: nuevo.id }));
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.nombre?.[0] || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const fetchClientes = async (query = '') => {
    if (query.length === 1) return;
    try {
      const res = await api.get('clientes/', { params: { search: query } });
      const data = res.data.results || res.data;
      setClientes(data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  const [vehiculoBusqueda, setVehiculoBusqueda] = useState('');
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const fetchVehiculos = async (query = '', clienteId = formData.cliente_id) => {
    if (query.length === 1) return;
    if (!clienteId) {
      setVehiculos([]);
      return;
    }
    try {
      setLoadingVehiculos(true);
      const params = {
        cliente_id: clienteId,
        sin_paginar: true,
      };
      if (query) params.search = query;
      const res = await api.get('vehiculos/', { params });
      const data = res.data.results || res.data;
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando vehículos del cliente:', err);
      setVehiculos([]);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
    const newErrors = {};
    if (!formData.cliente_id) newErrors.cliente = 'El cliente es obligatorio';
    if (!formData.vehiculo_id) newErrors.vehiculo = 'El vehículo es obligatorio';
    if (!formData.tipo_servicio_id) newErrors.tipo_servicio = 'El tipo de servicio es obligatorio';
    
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }
    setFormErrors({});

    try {
      setLoading(true);
      
      const payload = {
        cliente: formData.cliente_id,
        vehiculo: formData.vehiculo_id,
        tipo_servicio: formData.tipo_servicio_id,
        kilometraje_ingreso: formData.kilometraje ? parseInt(formData.kilometraje) : null,
        motivo_ingreso: observaciones.trim() || null
      };

      const newOrden = await tallerService.crearOrden(payload);

      // Vincula cliente y vehículo si aún no lo estaban (aditivo: el endpoint
      // solo agrega, nunca desvincula a otros dueños ya asociados).
      const vehiculoSel = vehiculos.find(v => v.id === formData.vehiculo_id);
      const yaVinculado = vehiculoSel?.clientes?.some(c => (c.id || c) === formData.cliente_id);
      if (!yaVinculado) {
        try {
          await api.post(`vehiculos/${formData.vehiculo_id}/vincular-cliente/`, {
            cliente_id: formData.cliente_id,
          });
        } catch (linkErr) {
          console.error('Error vinculando cliente y vehículo:', linkErr);
        }
      }

      // Crear servicios preventivos dinámicos seleccionados
      for (const plantilla of plantillas) {
        if (preventivo[plantilla.id]) {
          await tallerService.crearServicio({ 
            orden: newOrden.id, 
            descripcion: plantilla.nombre,
            precio_estimado: plantilla.precio_base || 0
          });
        }
      }

      // Crear servicios correctivos dinámicos seleccionados
      for (const plantilla of plantillasCorrectivas) {
        if (correctivo[plantilla.id]) {
          await tallerService.crearServicio({ 
            orden: newOrden.id, 
            descripcion: plantilla.nombre,
            precio_estimado: plantilla.precio_base || 0
          });
        }
      }

      // Subir evidencias fotográficas de ingreso si se adjuntaron
      if (fotos.length > 0) {
        try {
          const formDataFotos = new FormData();
          fotos.forEach(foto => {
            formDataFotos.append('imagenes', foto.file);
          });
          formDataFotos.append('descripciones', JSON.stringify(fotos.map(f => f.descripcion.trim())));
          await tallerService.subirEvidenciasOrden(newOrden.id, formDataFotos);
        } catch (fotoErr) {
          console.error('Error subiendo fotos de recepción:', fotoErr);
        }
      }

      navigate(`/taller/ordenes/${newOrden.id}`);
    } catch (error) {
      console.error('Error creando orden:', error);
      alert('Error al crear la orden. Revise los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleFotosSeleccionadas = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setComprimiendoFotos(true);
    try {
      const nuevasFotos = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.82 });
        nuevasFotos.push({
          id: Math.random().toString(36).substring(2, 9),
          file: compressed,
          preview: URL.createObjectURL(compressed),
          descripcion: ''
        });
      }
      setFotos(prev => [...prev, ...nuevasFotos]);
    } catch (err) {
      console.error('Error al procesar fotos:', err);
    } finally {
      setComprimiendoFotos(false);
      event.target.value = '';
    }
  };

  const handleEliminarFoto = (id) => {
    setFotos(prev => prev.filter(f => f.id !== id));
  };

  const handleDescripcionFotoChange = (id, descripcion) => {
    setFotos(prev => prev.map(f => f.id === id ? { ...f, descripcion } : f));
  };

  const selectedTipo = tiposServicio.find(t => t.id === formData.tipo_servicio_id);
  const nombreTipo = selectedTipo?.nombre?.toLowerCase() || '';
  const isPreventivo = nombreTipo.includes('preventivo');
  const isCorrectivo = nombreTipo.includes('correctivo');
  
  // Si no se selecciona nada o es un servicio general, no mostramos las plantillas.
  const showPreventiva = !!formData.tipo_servicio_id && isPreventivo;
  const showCorrectiva = !!formData.tipo_servicio_id && isCorrectivo;

  const secNumPrev = 2;
  const secNumCorr = showPreventiva ? 3 : 2;
  const secNumObs = (showPreventiva ? 1 : 0) + (showCorrectiva ? 1 : 0) + 2;
  const secNumFotos = secNumObs + 1;


  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/taller/ordenes')} 
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white focus:outline-none"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Recepción de Vehículo</h1>
          <p className="text-sm text-slate-300 font-medium">Registra el ingreso y los servicios requeridos.</p>
        </div>
      </div>

      <div className="rounded-lg border p-6 md:p-8" style={{ background: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%), ${C.surface}`, borderColor: C.border, boxShadow: S.card }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* SECCION 1: Datos del vehiculo */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">1</div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Datos del Cliente y Vehículo</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Autocomplete
                    options={clientes}
                    value={clientes.find(c => c.id === formData.cliente_id) || null}
                    inputValue={clienteBusqueda}
                    onOpen={() => {
                      if (clientes.length === 0) fetchClientes('');
                    }}
                    onInputChange={(e, newInputValue, reason) => {
                      setClienteBusqueda(newInputValue);
                      if (reason === 'input' || reason === 'clear') {
                        fetchClientes(newInputValue);
                      }
                    }}
                    getOptionLabel={(option) => `${option.dni} - ${option.nombres} ${option.apellidos || ''}`.trim()}
                    onChange={(e, val) => {
                      const nuevoClienteId = val?.id || null;
                      setFormData(prev => ({
                        ...prev,
                        cliente_id: nuevoClienteId,
                        vehiculo_id: null,
                        kilometraje: '',
                      }));
                      setVehiculoBusqueda('');
                      if (nuevoClienteId) {
                        fetchVehiculos('', nuevoClienteId);
                      } else {
                        setVehiculos([]);
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Buscar Cliente *" error={!!formErrors.cliente} helperText={formErrors.cliente} InputProps={{...params.InputProps, sx: { borderRadius: '12px' }}} />}
                  />
                </div>
                <Button 
                  variant="contained" 
                  onClick={() => setClientModalOpen(true)}
                  sx={{ minWidth: '56px', px: 0, borderRadius: '12px', bgcolor: 'slate.900', '&:hover': { bgcolor: 'slate.800' }, boxShadow: 'none' }}
                >
                  <Plus size={24} />
                </Button>
              </div>

              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Autocomplete
                    options={vehiculos}
                    disabled={!formData.cliente_id}
                    loading={loadingVehiculos}
                    noOptionsText={
                      !formData.cliente_id 
                        ? 'Primero seleccione un cliente' 
                        : 'El cliente no tiene vehículos registrados'
                    }
                    value={vehiculos.find(v => v.id === formData.vehiculo_id) || null}
                    inputValue={vehiculoBusqueda}
                    onOpen={() => {
                      if (formData.cliente_id && vehiculos.length === 0) {
                        fetchVehiculos('', formData.cliente_id);
                      }
                    }}
                    onInputChange={(e, newInputValue, reason) => {
                      setVehiculoBusqueda(newInputValue);
                      if ((reason === 'input' || reason === 'clear') && formData.cliente_id) {
                        fetchVehiculos(newInputValue, formData.cliente_id);
                      }
                    }}
                    getOptionLabel={(option) => `${option.placa} - ${option.marca} ${option.modelo}`}
                    onChange={(e, val) => {
                      setFormData(prev => ({
                        ...prev,
                        vehiculo_id: val?.id || null,
                        kilometraje: val?.kilometraje_actual || '',
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label={formData.cliente_id ? "Buscar Vehículo por Placa *" : "Seleccione primero un Cliente *"} 
                        error={!!formErrors.vehiculo} 
                        helperText={
                          formErrors.vehiculo || 
                          (!formData.cliente_id 
                            ? 'Seleccione el cliente por su DNI o nombres para ver sus vehículos' 
                            : (vehiculos.length === 0 ? 'Sin vehículos. Puede registrar uno con el botón (+)' : '')
                          )
                        } 
                        InputProps={{
                          ...(params.InputProps || {}), 
                          sx: { borderRadius: '12px' }
                        }} 
                      />
                    )}
                  />
                </div>
                <Button 
                  variant="contained" 
                  onClick={() => setVehicleModalOpen(true)}
                  title="Registrar nuevo vehículo"
                  sx={{ minWidth: '56px', px: 0, borderRadius: '12px', bgcolor: 'slate.900', '&:hover': { bgcolor: 'slate.800' }, boxShadow: 'none' }}
                >
                  <Plus size={24} />
                </Button>
              </div>

              <div>
                <TextField
                  fullWidth
                  label="Kilometraje Actual"
                  type="number"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                />
              </div>

              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Autocomplete
                    options={tiposServicio}
                    value={tiposServicio.find(t => t.id === formData.tipo_servicio_id) || null}
                    getOptionLabel={(option) => option.nombre}
                    onChange={(e, val) => setFormData(prev => ({ 
                      ...prev, 
                      tipo_servicio_id: val?.id || null 
                    }))}
                    renderInput={(params) => <TextField {...params} label="Tipo de Servicio *" error={!!formErrors.tipo_servicio} helperText={formErrors.tipo_servicio} InputProps={{...params.InputProps, sx: { borderRadius: '12px' }}} />}
                  />
                </div>
                {puedeCrearTipoServicio && (
                  <Button
                    variant="contained"
                    onClick={() => setTipoServicioModalOpen(true)}
                    title="Nuevo tipo de servicio"
                    sx={{ minWidth: '56px', px: 0, borderRadius: '12px', bgcolor: 'slate.900', '&:hover': { bgcolor: 'slate.800' }, boxShadow: 'none' }}
                  >
                    <Plus size={24} />
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* SECCION 2: Plantilla Preventiva */}
          {showPreventiva && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">{secNumPrev}</div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Plantilla Preventiva (Checklist)</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-slate-900/60 rounded-lg border border-slate-700 mt-2">
                {plantillas.length === 0 ? (
                  <p className="text-sm text-slate-300 font-medium">No hay plantillas configuradas.</p>
                ) : (
                  plantillas.map((plantilla) => (
                    <FormControlLabel
                      key={plantilla.id}
                      control={
                        <Checkbox
                          checked={preventivo[plantilla.id] || false}
                          onChange={(e) => setPreventivo({ ...preventivo, [plantilla.id]: e.target.checked })}
                          sx={{ color: 'slate.300', '&.Mui-checked': { color: 'slate.900' } }}
                        />
                      }
                      label={
                        <span className="text-sm font-medium text-slate-100">
                          {plantilla.nombre} 
                          {plantilla.precio_base ? <span className="text-slate-300"> (S/ {plantilla.precio_base})</span> : ''}
                          {plantilla.tiempo_estimado_minutos ? <span className="text-slate-300"> [{plantilla.tiempo_estimado_minutos} min]</span> : ''}
                        </span>
                      }
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* SECCION 3: Correctivo */}
          {showCorrectiva && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">{secNumCorr}</div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Plantillas Correctivas (Checklist)</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-slate-900/60 rounded-lg border border-slate-700 mt-2">
                {plantillasCorrectivas.length === 0 ? (
                  <p className="text-sm text-slate-300 font-medium">No hay plantillas correctivas configuradas.</p>
                ) : (
                  plantillasCorrectivas.map((plantilla) => (
                    <FormControlLabel
                      key={plantilla.id}
                      control={
                        <Checkbox
                          checked={correctivo[plantilla.id] || false}
                          onChange={(e) => setCorrectivo({ ...correctivo, [plantilla.id]: e.target.checked })}
                          sx={{ color: 'slate.300', '&.Mui-checked': { color: 'slate.900' } }}
                        />
                      }
                      label={
                        <span className="text-sm font-medium text-slate-100">
                          {plantilla.nombre} 
                          {plantilla.precio_base ? <span className="text-slate-300"> (S/ {plantilla.precio_base})</span> : ''}
                          {plantilla.tiempo_estimado_minutos ? <span className="text-slate-300"> [{plantilla.tiempo_estimado_minutos} min]</span> : ''}
                        </span>
                      }
                    />
                  ))
                )}
              </div>
            </section>
          )}

          {/* SECCION 4: Observaciones */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">{secNumObs}</div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Observaciones</h2>
            </div>
            
            <div className="flex flex-col gap-4 mt-2">
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                placeholder="Ej. Revisión de suspensión, ruido al frenar, aire acondicionado no enfría..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                InputProps={{ sx: { borderRadius: '12px' } }}
              />
            </div>
          </section>

          {/* SECCION 5: Fotos de Ingreso / Estado del Vehículo */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">{secNumFotos}</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white tracking-tight">Fotos de Ingreso / Estado del Vehículo</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Documenta rayones, golpes, odómetro y estado visual en que ingresa el vehículo al taller.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-900/60 rounded-xl border border-slate-700 flex flex-col gap-4">
              {/* Botones de acción para cámara y archivo */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="contained"
                  component="label"
                  disabled={comprimiendoFotos}
                  startIcon={<Camera size={20} />}
                  sx={{
                    borderRadius: '10px',
                    bgcolor: '#e11d48',
                    color: '#ffffff',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    '&:hover': { bgcolor: '#be123c' }
                  }}
                >
                  Tomar Foto con Cámara
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotosSeleccionadas}
                  />
                </Button>

                <Button
                  variant="outlined"
                  component="label"
                  disabled={comprimiendoFotos}
                  startIcon={<UploadCloud size={20} />}
                  sx={{
                    borderRadius: '10px',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2.5,
                    py: 1,
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.4)', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                  }}
                >
                  Subir desde Galería
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleFotosSeleccionadas}
                  />
                </Button>

                {comprimiendoFotos && (
                  <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
                    <CircularProgress size={18} color="inherit" />
                    <span>Optimizando fotografías...</span>
                  </div>
                )}
              </div>

              {/* Lista / Grid de Fotos tomadas */}
              {fotos.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-700/80 rounded-lg bg-slate-950/30 flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={36} className="text-slate-500 opacity-60" />
                  <p className="text-sm font-medium text-slate-300">No se han adjuntado fotos de ingreso todavía.</p>
                  <p className="text-xs text-slate-500">Puedes tomar fotos desde una tablet o smartphone, o seleccionar imágenes de tu computadora.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-1">
                  {fotos.map((foto, index) => (
                    <div
                      key={foto.id}
                      className="group relative flex flex-col bg-slate-950/70 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-500"
                    >
                      <div className="relative aspect-[4/3] bg-black overflow-hidden">
                        <img
                          src={foto.preview}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarFoto(foto.id)}
                          className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none"
                          title="Eliminar foto"
                        >
                          <Trash2 size={15} />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[11px] font-semibold text-white px-2 py-0.5 rounded">
                          Foto #{index + 1}
                        </span>
                      </div>

                      <div className="p-2.5 flex flex-col gap-1.5">
                        <input
                          type="text"
                          placeholder="Descripción (ej. Frontal, Rayón...)"
                          value={foto.descripcion}
                          onChange={(e) => handleDescripcionFotoChange(foto.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex gap-1 flex-wrap">
                          {['Frontal', 'Posterior', 'Lat. Izq.', 'Lat. Der.', 'Odómetro'].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleDescripcionFotoChange(foto.id, tag)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Footer Actions */}
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-700">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !puedeCrear}
              title={!puedeCrear ? 'No tienes permiso para crear órdenes de trabajo' : undefined}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
              sx={{ borderRadius: '12px', bgcolor: 'slate.900', px: 4, py: 1.5, boxShadow: 'none', textTransform: 'none', fontSize: '1rem', '&:hover': { bgcolor: 'slate.800', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' } }}
            >
              Registrar Orden
            </Button>
          </div>
        </form>
      </div>

      {/* Modal para registro rápido de vehículo completo */}
      {vehicleModalOpen && (
        <VehiculosForm
          open={vehicleModalOpen}
          onClose={() => setVehicleModalOpen(false)}
          clienteInicial={clientes.find(c => c.id === formData.cliente_id) || null}
          onSuccess={(createdVehicle) => {
            if (!createdVehicle?.id) return;
            // Si no había cliente seleccionado en la orden pero el vehículo fue asociado a uno
            if (!formData.cliente_id && createdVehicle.clientes_detalle && createdVehicle.clientes_detalle.length > 0) {
              const c = createdVehicle.clientes_detalle[0];
              setClientes(prev => prev.some(cli => cli.id === c.id) ? prev : [c, ...prev]);
              setFormData(prev => ({ ...prev, cliente_id: c.id }));
              setClienteBusqueda(`${c.dni} - ${c.nombres} ${c.apellidos || ''}`.trim());
            }
            setVehiculos(prev => prev.some(v => v.id === createdVehicle.id) ? prev : [createdVehicle, ...prev]);
            setFormData(prev => ({
              ...prev,
              vehiculo_id: createdVehicle.id,
              kilometraje: createdVehicle.kilometraje_actual || prev.kilometraje,
            }));
            setVehiculoBusqueda(`${createdVehicle.placa} - ${createdVehicle.marca} ${createdVehicle.modelo}`);
          }}
        />
      )}

      {/* Modal para registro rápido de cliente */}
      {clientModalOpen && (
        <ClientesForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSuccess={(createdClient) => {
            if (!createdClient?.id) return;
            // Igual que con vehículos: se agrega directo a la lista local y se
            // selecciona, sin depender del paginado del listado de clientes.
            setClientes(prev => prev.some(c => c.id === createdClient.id) ? prev : [createdClient, ...prev]);
            setFormData(prev => ({ ...prev, cliente_id: createdClient.id }));
            setClienteBusqueda(`${createdClient.dni} - ${createdClient.nombres} ${createdClient.apellidos || ''}`.trim());
          }}
        />
      )}

      {/* Modal para registro rápido de Tipo de Servicio */}
      <Dialog open={tipoServicioModalOpen} onClose={() => setTipoServicioModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo Tipo de Servicio</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={nuevoTipoNombre}
            onChange={(e) => {
              setNuevoTipoNombre(e.target.value);
              if (modalError) setModalError('');
            }}
            error={!!modalError}
            helperText={modalError}
            InputProps={{ sx: { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTipoServicioModalOpen(false)} sx={{ color: 'slate.500' }}>Cancelar</Button>
          <Button 
            onClick={handleSaveTipoServicio} 
            variant="contained" 
            disabled={loading}
            sx={{ bgcolor: 'slate.900', '&:hover': { bgcolor: 'slate.800' } }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
