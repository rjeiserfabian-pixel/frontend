import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, CircularProgress, IconButton, Grid, Box
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVehiculosTransporte } from '../hooks/useVehiculosTransporte';

// Validación con Zod
const schema = z.object({
  placa: z.string().min(6, 'Debe tener al menos 6 caracteres').max(15, 'Máximo 15 caracteres'),
  marca: z.string().min(2, 'Obligatorio'),
  modelo: z.string().optional(),
  certificado_inscripcion: z.string().optional(),
  configuracion_vehicular: z.string().optional(),
  carga_util: z.string().optional().refine(val => !val || !isNaN(val), 'Debe ser un número válido'),
  peso_bruto: z.string().optional().refine(val => !val || !isNaN(val), 'Debe ser un número válido'),
});

const VehiculosTransporteForm = ({ open, onClose, onSuccess, vehiculoEdit }) => {
  const { guardarVehiculo, consultarPlaca } = useVehiculosTransporte();
  const [isSearchingPlaca, setIsSearchingPlaca] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      placa: '', marca: '', modelo: '', certificado_inscripcion: '', configuracion_vehicular: '', carga_util: '', peso_bruto: ''
    }
  });

  useEffect(() => {
    if (vehiculoEdit) {
      reset({
         ...vehiculoEdit,
         modelo: vehiculoEdit.modelo || '',
         certificado_inscripcion: vehiculoEdit.certificado_inscripcion || '',
         configuracion_vehicular: vehiculoEdit.configuracion_vehicular || '',
         carga_util: vehiculoEdit.carga_util ? String(vehiculoEdit.carga_util) : '',
         peso_bruto: vehiculoEdit.peso_bruto ? String(vehiculoEdit.peso_bruto) : ''
      });
    } else {
      reset({ placa: '', marca: '', modelo: '', certificado_inscripcion: '', configuracion_vehicular: '', carga_util: '', peso_bruto: '' });
    }
  }, [vehiculoEdit, open, reset]);

  const handleConsultarPlaca = async () => {
    const placaActual = getValues('placa');
    if (!placaActual || placaActual.length < 6) return;

    setIsSearchingPlaca(true);
    const abortController = new AbortController();
    
    const data = await consultarPlaca(placaActual, abortController.signal);
    if (data) {
      if (data.marca) setValue('marca', data.marca);
      if (data.modelo) setValue('modelo', data.modelo);
    }
    
    setIsSearchingPlaca(false);
  };

  const onSubmit = async (data) => {
    // Convert strings to numbers for decimal fields if they exist
    const payload = { ...data };
    if (payload.carga_util === '') payload.carga_util = null;
    if (payload.peso_bruto === '') payload.peso_bruto = null;

    const exito = await guardarVehiculo(payload, vehiculoEdit?.id);
    if (exito) {
      if (onSuccess) onSuccess(exito);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {vehiculoEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="placa"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Placa"
                      fullWidth
                      size="small"
                      error={!!errors.placa}
                      helperText={errors.placa?.message}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
                <Button 
                  variant="contained"
                  onClick={handleConsultarPlaca} 
                  disabled={isSearchingPlaca || isSubmitting || vehiculoEdit != null}
                  sx={{ minWidth: '120px' }}
                >
                  {isSearchingPlaca ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="marca"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marca"
                    fullWidth
                    size="small"
                    error={!!errors.marca}
                    helperText={errors.marca?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="modelo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Modelo (Opcional)"
                    fullWidth
                    size="small"
                    error={!!errors.modelo}
                    helperText={errors.modelo?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="certificado_inscripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Certificado MTC / Tarjeta de Circulación"
                    fullWidth
                    size="small"
                    error={!!errors.certificado_inscripcion}
                    helperText={errors.certificado_inscripcion?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="configuracion_vehicular"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Configuración Vehicular (Ej. T3S3, C2)"
                    fullWidth
                    size="small"
                    error={!!errors.configuracion_vehicular}
                    helperText={errors.configuracion_vehicular?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="carga_util"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Carga Útil (Kg o Ton)"
                    fullWidth
                    size="small"
                    error={!!errors.carga_util}
                    helperText={errors.carga_util?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="peso_bruto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Peso Bruto"
                    fullWidth
                    size="small"
                    error={!!errors.peso_bruto}
                    helperText={errors.peso_bruto?.message}
                  />
                )}
              />
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
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default React.memo(VehiculosTransporteForm);
