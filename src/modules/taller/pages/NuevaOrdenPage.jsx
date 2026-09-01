import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Grid,
  FormControlLabel, Checkbox, Divider, Autocomplete, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { tallerService } from '../services/tallerService';
import api from '../../../core/api/axios';
import VehiculosForm from '../../vehiculos/components/VehiculosForm';
import ClientesForm from '../../clientes/components/ClientesForm';

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);

  const [formData, setFormData] = useState({
    cliente_id: null,
    vehiculo_id: null,
    kilometraje: '',
  });

  const [preventivo, setPreventivo] = useState({});
  const [motivosList, setMotivosList] = useState(['']); // Start with one empty item

  // Quick Registration Modals
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  useEffect(() => {
    fetchVehiculos();
    fetchClientes();
    fetchPlantillas();
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

  const fetchClientes = async (selectId = null) => {
    try {
      const res = await api.get('clientes/');
      const data = res.data.results || res.data;
      setClientes(data);
      if (selectId) {
        setFormData(prev => ({ ...prev, cliente_id: selectId }));
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  const fetchVehiculos = async (selectId = null) => {
    try {
      const res = await api.get('vehiculos/');
      const data = res.data.results || res.data;
      setVehiculos(data);
      if (selectId) {
        const newlyCreated = data.find(v => v.id === selectId);
        if (newlyCreated) {
          setFormData(prev => ({
            ...prev,
            vehiculo_id: newlyCreated.id,
            kilometraje: newlyCreated.kilometraje_actual || ''
          }));
        }
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      alert('Seleccione el cliente que trae el vehículo');
      return;
    }
    if (!formData.vehiculo_id) {
      alert('Seleccione un vehículo');
      return;
    }

    try {
      setLoading(true);
      
      const motivosLlenos = motivosList.filter(m => m.trim() !== '');
      const motivosString = motivosLlenos.map(m => `- ${m.trim()}`).join('\n');
      
      const ordenData = {
        cliente: formData.cliente_id,
        vehiculo: formData.vehiculo_id,
        kilometraje_ingreso: formData.kilometraje || null,
        tipo_servicio: motivosLlenos.length > 0 ? 'AMBOS' : 'PREVENTIVO',
        motivo_ingreso: motivosString,
      };

      const newOrden = await tallerService.crearOrden(ordenData);

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

      navigate(`/taller/ordenes/${newOrden.id}`);
    } catch (error) {
      console.error('Error creando orden:', error);
      alert('Error al crear la orden. Revise los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/taller/ordenes')} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900 focus:outline-none"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Recepción de Vehículo</h1>
          <p className="text-sm text-slate-500 font-medium">Registra el ingreso y los servicios requeridos.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* SECCION 1: Datos del vehiculo */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">1</div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Datos del Cliente y Vehículo</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Autocomplete
                    options={clientes}
                    value={clientes.find(c => c.id === formData.cliente_id) || null}
                    getOptionLabel={(option) => `${option.dni} - ${option.nombres} ${option.apellidos || ''}`.trim()}
                    onChange={(e, val) => setFormData(prev => ({ 
                      ...prev, 
                      cliente_id: val?.id || null 
                    }))}
                    renderInput={(params) => <TextField {...params} label="Buscar Cliente" required InputProps={{...params.InputProps, sx: { borderRadius: '12px' }}} />}
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
                    value={vehiculos.find(v => v.id === formData.vehiculo_id) || null}
                    getOptionLabel={(option) => `${option.placa} - ${option.marca} ${option.modelo}`}
                    onChange={(e, val) => {
                      // Attempt to auto-fill client if vehicle has a known client history and no client is selected yet
                      let suggestedClientId = formData.cliente_id;
                      if (val && val.clientes && val.clientes.length > 0 && !formData.cliente_id) {
                        suggestedClientId = val.clientes[0].id || val.clientes[0]; // depends on how API returns M:N
                      }
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        vehiculo_id: val?.id || null,
                        kilometraje: val?.kilometraje_actual || '',
                        cliente_id: suggestedClientId
                      }));
                    }}
                    renderInput={(params) => <TextField {...params} label="Buscar Vehículo por Placa" required InputProps={{...params.InputProps, sx: { borderRadius: '12px' }}} />}
                  />
                </div>
                <Button 
                  variant="contained" 
                  onClick={() => setVehicleModalOpen(true)}
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
            </div>
          </section>

          {/* SECCION 2: Plantilla Preventiva */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">2</div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Plantilla Preventiva (Checklist)</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 mt-2">
              {plantillas.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium">No hay plantillas configuradas.</p>
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
                      <span className="text-sm font-medium text-slate-700">
                        {plantilla.nombre} 
                        {plantilla.precio_base ? <span className="text-slate-400"> (S/ {plantilla.precio_base})</span> : ''} 
                        {plantilla.tiempo_estimado_minutos ? <span className="text-slate-400"> [{plantilla.tiempo_estimado_minutos} min]</span> : ''}
                      </span>
                    }
                  />
                ))
              )}
            </div>
          </section>

          {/* SECCION 3: Correctivo */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold shadow-sm">3</div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Motivo de Ingreso Adicional / Correctivo</h2>
            </div>
            
            <div className="flex flex-col gap-4 mt-2">
              {motivosList.map((motivo, index) => (
                <div key={index} className="flex gap-3 items-start group">
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    placeholder="Ej. Revisión de suspensión, ruido al frenar..."
                    value={motivo}
                    onChange={(e) => {
                      const newList = [...motivosList];
                      newList[index] = e.target.value;
                      setMotivosList(newList);
                    }}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                  <IconButton 
                    onClick={() => {
                      const newList = [...motivosList];
                      newList.splice(index, 1);
                      setMotivosList(newList.length ? newList : ['']);
                    }}
                    sx={{ mt: 0.5, color: '#ef4444', '&:hover': { bgcolor: '#fef2f2', color: '#dc2626' } }}
                  >
                    <X size={20} />
                  </IconButton>
                </div>
              ))}
              <Button 
                variant="outlined" 
                startIcon={<Plus size={18} />}
                onClick={() => setMotivosList([...motivosList, ''])}
                sx={{ alignSelf: 'flex-start', mt: 1, borderRadius: '10px', borderColor: '#e2e8f0', color: '#334155', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' } }}
              >
                Agregar Motivo
              </Button>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
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
          onSuccess={(createdVehicle) => {
            fetchVehiculos(createdVehicle?.id);
          }}
        />
      )}

      {/* Modal para registro rápido de cliente */}
      {clientModalOpen && (
        <ClientesForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSuccess={(createdClient) => {
            fetchClientes(createdClient?.id);
          }}
        />
      )}
    </div>
  );
}
