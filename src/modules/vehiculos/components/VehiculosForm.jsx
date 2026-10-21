import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, CircularProgress, IconButton, Grid, Box, MenuItem,
  Autocomplete
} from '@mui/material';
import api from '../../../core/api/axios';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { Plus, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';
import ClientesForm from '../../clientes/components/ClientesForm';
import { compressImage } from '../../../utils/imageCompressor';
import { getMediaUrl } from '../../../core/utils/mediaUrl';

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

  // Estados de Imagen del Vehículo
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenEliminada, setImagenEliminada] = useState(false);
  const [comprimiendoImagen, setComprimiendoImagen] = useState(false);

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
    setImagenFile(null);
    setImagenEliminada(false);
    if (vehiculoEdit) {
      setImagenPreview(vehiculoEdit.imagen ? getMediaUrl(vehiculoEdit.imagen) : null);
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
      setImagenPreview(null);
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

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('Formato no válido', 'Por favor selecciona un archivo de imagen (JPG, PNG, WEBP).', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('Imagen muy pesada', 'La imagen no debe superar los 10MB.', 'warning');
      return;
    }

    try {
      setComprimiendoImagen(true);
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 960, quality: 0.85 });
      setImagenFile(compressed);
      setImagenPreview(URL.createObjectURL(compressed));
      setImagenEliminada(false);
    } catch (err) {
      console.error('Error al procesar imagen de vehículo:', err);
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
      setImagenEliminada(false);
    } finally {
      setComprimiendoImagen(false);
    }
  };

  const handleRemoveImage = () => {
    setImagenFile(null);
    setImagenPreview(null);
    setImagenEliminada(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        cliente_id: clienteSeleccionado?.id || null,
      };

      // Si hay archivo de imagen o se eliminó la existente, armamos FormData
      let requestData;
      if (imagenFile || imagenEliminada) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
            formData.append(key, payload[key]);
          }
        });
        if (imagenFile) {
          formData.append('imagen', imagenFile);
        } else if (imagenEliminada) {
          formData.append('imagen', '');
        }
        requestData = formData;
      } else {
        requestData = payload;
      }

      // Regla 3.3: Botones deshabilitados (controlado por isSubmitting)
      if (vehiculoEdit) {
        const res = await vehiculoService.updateVehiculo(vehiculoEdit.id, requestData);
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
        const res = await vehiculoService.createVehiculo(requestData);
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

            {/* Fotografía del Vehículo */}
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  mt: 0.5,
                  border: '1px dashed rgba(255, 255, 255, 0.18)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  flexWrap: 'wrap'
                }}
              >
                {imagenPreview ? (
                  <Box sx={{ position: 'relative', width: 90, height: 75 }}>
                    <Box
                      component="img"
                      src={imagenPreview}
                      alt="Vehículo"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        '&:hover': { backgroundColor: '#dc2626' },
                        width: 22,
                        height: 22
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 90,
                      height: 75,
                      borderRadius: '8px',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: 'text.secondary'
                    }}
                  >
                    <ImageIcon size={28} opacity={0.35} />
                  </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadCloud size={16} />}
                    disabled={comprimiendoImagen}
                    sx={{ mb: 0.8, borderRadius: '8px' }}
                  >
                    {imagenPreview ? 'Cambiar Foto' : 'Subir Foto del Vehículo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {comprimiendoImagen && (
                    <Box sx={{ color: 'primary.main', fontSize: '0.75rem', fontWeight: 600 }}>
                      Optimizando imagen...
                    </Box>
                  )}
                  <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    Foto frontal o lateral del vehículo (JPG, PNG, WEBP). Se comprime automáticamente.
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting || comprimiendoImagen}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting || comprimiendoImagen}
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
