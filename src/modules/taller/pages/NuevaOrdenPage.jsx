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

export default function NuevaOrdenPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);

  const [formData, setFormData] = useState({
    vehiculo_id: null,
    kilometraje: '',
  });

  const [preventivo, setPreventivo] = useState({});
  const [motivosList, setMotivosList] = useState(['']); // Start with one empty item

  // Quick Vehicle Registration
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    fetchVehiculos();
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

  const fetchVehiculos = async (selectId = null) => {
    try {
      const res = await api.get('vehiculos/');
      const data = res.data.results || res.data;
      setVehiculos(data);
      if (selectId) {
        const newlyCreated = data.find(v => v.id === selectId);
        if (newlyCreated) {
          setFormData({
            ...formData,
            vehiculo_id: newlyCreated.id,
            kilometraje: newlyCreated.kilometraje_actual || ''
          });
        }
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehiculo_id) {
      alert('Seleccione un vehículo');
      return;
    }

    try {
      setLoading(true);
      
      const motivosLlenos = motivosList.filter(m => m.trim() !== '');
      const motivosString = motivosLlenos.map(m => `- ${m.trim()}`).join('\n');
      
      const ordenData = {
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/taller/ordenes')} sx={{ mr: 2 }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h5" fontWeight="600">Recepción de Vehículo</Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: '12px', maxWidth: 800 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>

            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                1. Datos del Vehículo
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={vehiculos}
                  value={vehiculos.find(v => v.id === formData.vehiculo_id) || null}
                  getOptionLabel={(option) => `${option.placa} - ${option.marca} ${option.modelo}`}
                  onChange={(e, val) => setFormData({ 
                    ...formData, 
                    vehiculo_id: val?.id || null,
                    kilometraje: val?.kilometraje_actual || ''
                  })}
                  renderInput={(params) => <TextField {...params} label="Buscar por Placa" required />}
                />
                <Button 
                  variant="contained" 
                  color="success" 
                  sx={{ minWidth: '56px', px: 0 }}
                  onClick={() => setVehicleModalOpen(true)}
                >
                  <Plus size={24} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kilometraje Actual"
                type="number"
                value={formData.kilometraje}
                onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                2. Plantilla Preventiva (Checklist)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {plantillas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay plantillas configuradas.</Typography>
                ) : (
                  plantillas.map((plantilla) => (
                    <FormControlLabel
                      key={plantilla.id}
                      control={
                        <Checkbox
                          checked={preventivo[plantilla.id] || false}
                          onChange={(e) => setPreventivo({ ...preventivo, [plantilla.id]: e.target.checked })}
                        />
                      }
                      label={`${plantilla.nombre} ${plantilla.precio_base ? `(S/ ${plantilla.precio_base})` : ''} ${plantilla.tiempo_estimado_minutos ? `[${plantilla.tiempo_estimado_minutos} min]` : ''}`}
                    />
                  ))
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight="600" mb={2}>
                3. Correctivo / Motivo de Ingreso Adicional
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {motivosList.map((motivo, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
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
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => {
                        const newList = [...motivosList];
                        newList.splice(index, 1);
                        setMotivosList(newList.length ? newList : ['']);
                      }}
                      sx={{ mt: 0.25 }}
                    >
                      <X size={20} />
                    </IconButton>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  startIcon={<Plus size={18} />}
                  onClick={() => setMotivosList([...motivosList, ''])}
                  sx={{ alignSelf: 'flex-start', mt: 1 }}
                >
                  Agregar Motivo
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
              >
                Registrar Orden
              </Button>
            </Grid>

          </Grid>
        </form>
      </Paper>

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
    </Box>
  );
}
