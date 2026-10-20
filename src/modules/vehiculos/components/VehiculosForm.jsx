import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, CircularProgress, IconButton, Grid, Box, MenuItem,
  Autocomplete
} from '@mui/material';
import api from '../../../core/api/axios';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { Plus } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';
import ClientesForm from '../../clientes/components/ClientesForm';

// Regla 4.3: Validación con Zod
const schema = z.object({
  placa: z.string().min(6, 'La placa es obligatoria').max(15),
  marca: z.string().min(1, 'Obligatorio'),
  modelo: z.string().min(1, 'Obligatorio'),
  numero_motor: z.string().optional(),
  numero_serie: z.string().optional(),
  color: z.string().optional(),
  clase: z.string().optional(),
  tipo: z.string().optional(),
  uso: z.string().optional(),
  tipo_combustible: z.string().optional(),
  anio_fabricacion: z.union([z.string(), z.number()]).optional(),
  numero_asientos: z.union([z.string(), z.number()]).optional(),
  kilometraje_actual: z.union([z.string(), z.number()]).optional(),
});

const VehiculosForm = ({ open, onClose, onSuccess, vehiculoEdit, clienteInicial }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      placa: '', marca: '', modelo: '', numero_motor: '', numero_serie: '',
      color: '', clase: '', tipo: '', uso: '', tipo_combustible: '', anio_fabricacion: '', numero_asientos: '', kilometraje_actual: ''
    }
  });

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

  useEffect(() => {
    if (clienteSeleccionado?.id) {
      setClientes(prev => prev.some(c => c.id === clienteSeleccionado.id) ? prev : [clienteSeleccionado, ...prev]);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (vehiculoEdit) {
      reset({
        placa: vehiculoEdit.placa || '',
        marca: vehiculoEdit.marca || '',
        modelo: vehiculoEdit.modelo || '',
        numero_motor: vehiculoEdit.numero_motor || '',
        numero_serie: vehiculoEdit.numero_serie || '',
        color: vehiculoEdit.color || '',
        clase: vehiculoEdit.clase || '',
        tipo: vehiculoEdit.tipo || '',
        uso: vehiculoEdit.uso || '',
        tipo_combustible: vehiculoEdit.tipo_combustible || '',
        anio_fabricacion: vehiculoEdit.anio_fabricacion || '',
        numero_asientos: vehiculoEdit.numero_asientos || '',
        kilometraje_actual: vehiculoEdit.kilometraje_actual || '',
      });
      if (vehiculoEdit.clientes_detalle && vehiculoEdit.clientes_detalle.length > 0) {
        setClienteSeleccionado(vehiculoEdit.clientes_detalle[0]);
      } else {
        setClienteSeleccionado(null);
      }
    } else {
      reset({
        placa: '', marca: '', modelo: '', numero_motor: '', numero_serie: '',
        color: '', clase: '', tipo: '', uso: '', tipo_combustible: '', anio_fabricacion: '', numero_asientos: '', kilometraje_actual: ''
      });
      setClienteSeleccionado(clienteInicial || null);
    }
  }, [vehiculoEdit, open, reset, clienteInicial]);

  // Regla 1.4: Cancelación de peticiones HTTP en caso de desmontaje
  const handleBuscarPlaca = async () => {
    const placaActual = getValues('placa');
    if (!placaActual || placaActual.length < 6) return;

    setIsSearching(true);
    const abortController = new AbortController();
    
    try {
      const result = await vehiculoService.buscarPorPlaca(placaActual, abortController.signal);
      if (result && result.data) {
        const data = result.data;
        setValue('marca', data.marca || '');
        setValue('modelo', data.modelo || '');
        setValue('numero_motor', data.numero_motor || '');
        setValue('numero_serie', data.numero_serie || '');
        setValue('color', data.color || '');
        setValue('clase', data.clase || '');
        setValue('tipo', data.tipo || '');
        setValue('uso', data.uso || '');
        setValue('anio_fabricacion', data.anio_fabricacion || '');
        setValue('numero_asientos', data.numero_asientos || '');
        
        if (result.origen === 'api') {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Datos obtenidos de Yupay',
            didOpen: () => {
              const container = document.querySelector('.swal2-container');
              if (container) container.style.zIndex = '9999';
            }
          });
        }
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error(error);
        const msg = error.response?.data?.error || 'No se encontraron datos para la placa';
        Swal.fire({
          icon: 'info',
          title: 'Aviso',
          text: msg,
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        cliente_id: clienteSeleccionado?.id || null,
      };

      // Regla 3.3: Botones deshabilitados (controlado por isSubmitting)
      if (vehiculoEdit) {
        const res = await vehiculoService.updateVehiculo(vehiculoEdit.id, payload);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Vehículo actualizado correctamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
        onSuccess(res.data || res);
        onClose();
        return;
      } else {
        const res = await vehiculoService.createVehiculo(payload);
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Vehículo registrado correctamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
        onSuccess(res.data || res);
        onClose();
        return; // Early return to avoid double onSuccess call below
      }
    } catch (error) {
      console.error(error);
      let errorMessage = 'Hubo un error al guardar';
      
      if (error.response && error.response.data) {
        const errData = error.response.data.errores || error.response.data;
        if (errData.placa) {
          errorMessage = 'Ya existe un vehículo registrado con esta placa.';
        } else if (errData.error) {
          errorMessage = errData.error;
        } else if (typeof errData === 'object') {
          const firstKey = Object.keys(errData)[0];
          if (firstKey && Array.isArray(errData[firstKey])) {
            errorMessage = errData[firstKey][0];
          }
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {vehiculoEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Autocomplete
                    options={clientes}
                    value={clienteSeleccionado}
                    onOpen={() => {
                      if (clientes.length === 0) fetchClientes('');
                    }}
                    onInputChange={(e, newInputValue, reason) => {
                      if (reason === 'input' || reason === 'clear') {
                        fetchClientes(newInputValue);
                      }
                    }}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return `${option.dni || ''} - ${option.nombres || ''} ${option.apellidos || ''}`.trim();
                    }}
                    isOptionEqualToValue={(option, val) => option?.id === val?.id}
                    onChange={(e, val) => setClienteSeleccionado(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Asociar Cliente / Propietario"
                        placeholder="Buscar por DNI o nombres..."
                        helperText="Selecciona el cliente al que pertenece este vehículo (opcional)"
                        InputProps={{
                          ...(params.InputProps || {}),
                          sx: { borderRadius: '12px' }
                        }}
                      />
                    )}
                  />
                </Box>
                <Button 
                  variant="contained" 
                  onClick={() => setClienteModalOpen(true)}
                  title="Registrar nuevo cliente"
                  sx={{ 
                    minWidth: '56px', 
                    height: '56px', 
                    borderRadius: '12px',
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    boxShadow: 'none'
                  }}
                >
                  <Plus size={24} />
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="placa"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Placa"
                      fullWidth
                      error={!!errors.placa}
                      helperText={errors.placa?.message}
                    />
                  )}
                />
                <Button 
                  variant="contained"
                  onClick={handleBuscarPlaca} 
                  disabled={isSearching || isSubmitting || vehiculoEdit != null}
                  sx={{ minWidth: '120px' }}
                >
                  {isSearching ? <CircularProgress size={24} color="inherit" /> : 'Consultar'}
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="marca" control={control} render={({ field }) => (
                <TextField {...field} label="Marca" fullWidth error={!!errors.marca} helperText={errors.marca?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="modelo" control={control} render={({ field }) => (
                <TextField {...field} label="Modelo" fullWidth error={!!errors.modelo} helperText={errors.modelo?.message} />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="color" control={control} render={({ field }) => (
                <TextField {...field} label="Color" fullWidth />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="numero_motor" control={control} render={({ field }) => (
                <TextField {...field} label="N° Motor" fullWidth />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="numero_serie" control={control} render={({ field }) => (
                <TextField {...field} label="N° Serie" fullWidth />
              )}/>
            </Grid>
            
            {/* Campos de Yupay */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="clase" control={control} render={({ field }) => (
                <TextField {...field} label="Clase" fullWidth />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="tipo" control={control} render={({ field }) => (
                <TextField {...field} label="Tipo" fullWidth />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="uso" control={control} render={({ field }) => (
                <TextField {...field} label="Uso" fullWidth />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="tipo_combustible" control={control} render={({ field }) => (
                <TextField {...field} select label="Combustible" fullWidth>
                  <MenuItem value="">No especifica</MenuItem>
                  <MenuItem value="GASOLINA">Gasolinero</MenuItem>
                  <MenuItem value="PETROLEO">Petrolero</MenuItem>
                </TextField>
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="anio_fabricacion" control={control} render={({ field }) => (
                <TextField {...field} label="Año Fabricación" fullWidth type="number" />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="numero_asientos" control={control} render={({ field }) => (
                <TextField {...field} label="N° Asientos" fullWidth type="number" />
              )}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="kilometraje_actual" control={control} render={({ field }) => (
                <TextField {...field} label="Kilometraje Actual" fullWidth type="number" />
              )}/>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
      </Dialog>

      {/* Modal para registro rápido de cliente */}
      {clienteModalOpen && (
        <ClientesForm
          open={clienteModalOpen}
          onClose={() => setClienteModalOpen(false)}
          onSuccess={(createdClient) => {
            if (!createdClient?.id) return;
            setClientes(prev => prev.some(c => c.id === createdClient.id) ? prev : [createdClient, ...prev]);
            setClienteSeleccionado(createdClient);
          }}
        />
      )}
    </>
  );
};

export default React.memo(VehiculosForm);
