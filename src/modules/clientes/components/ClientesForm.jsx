import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, CircularProgress, IconButton, Grid, InputAdornment, Box
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClientes } from '../hooks/useClientes';

// Regla 4.3: Validación doble con Zod
const schema = z.object({
  dni: z.string().min(8, 'DNI debe tener al menos 8 caracteres'),
  nombres: z.string().min(2, 'Obligatorio'),
  apellidos: z.string().min(2, 'Obligatorio'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')),
});

const ClientesForm = ({ open, onClose, onSuccess, clienteEdit }) => {
  const { guardarCliente, consultarDni } = useClientes();
  const [isSearchingDni, setIsSearchingDni] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dni: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: ''
    }
  });

  useEffect(() => {
    if (clienteEdit) {
      reset(clienteEdit);
    } else {
      reset({ dni: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: '' });
    }
  }, [clienteEdit, open, reset]);

  // Regla 1.4: AbortController para búsquedas si se desmonta o cierra
  const handleConsultarDni = async () => {
    const dniActual = getValues('dni');
    if (!dniActual || dniActual.length < 8) return;

    setIsSearchingDni(true);
    const abortController = new AbortController();
    
    const data = await consultarDni(dniActual, abortController.signal);
    if (data) {
      setValue('nombres', data.nombres || '');
      setValue('apellidos', (data.apellido_paterno + ' ' + (data.apellido_materno || '')).trim() || '');
      if (data.direccion) setValue('direccion', data.direccion);
    }
    
    setIsSearchingDni(false);
  };

  const onSubmit = async (data) => {
    // Regla 3.3: Botón deshabilitado al enviar (controlado por isSubmitting)
    const exito = await guardarCliente(data, clienteEdit?.id);
    if (exito) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {clienteEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="dni"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="DNI"
                      fullWidth
                      error={!!errors.dni}
                      helperText={errors.dni?.message}
                    />
                  )}
                />
                <Button 
                  variant="contained"
                  onClick={handleConsultarDni} 
                  disabled={isSearchingDni || isSubmitting || clienteEdit != null}
                  sx={{ minWidth: '120px' }}
                >
                  {isSearchingDni ? <CircularProgress size={24} color="inherit" /> : 'Consultar'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="nombres"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Nombres" fullWidth error={!!errors.nombres} helperText={errors.nombres?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="apellidos"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Apellidos" fullWidth error={!!errors.apellidos} helperText={errors.apellidos?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Teléfono" fullWidth error={!!errors.telefono} helperText={errors.telefono?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Dirección" fullWidth error={!!errors.direccion} helperText={errors.direccion?.message} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
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
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Regla 2.1: Evitar re-renders innecesarios
export default React.memo(ClientesForm);
