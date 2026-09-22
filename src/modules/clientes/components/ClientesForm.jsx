import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, CircularProgress, IconButton, Grid, InputAdornment, Box,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClientes } from '../hooks/useClientes';

// Regla 4.3: Validación doble con Zod
// apellidos es opcional porque en clientes con RUC (empresas) no aplica.
const schema = z.object({
  tipo_documento: z.enum(['DNI', 'RUC']),
  dni: z.string().min(8, 'Debe tener al menos 8 caracteres'),
  nombres: z.string().min(2, 'Obligatorio'),
  apellidos: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')),
});

const ClientesForm = ({ open, onClose, onSuccess, clienteEdit }) => {
  const { guardarCliente, consultarDni, consultarRuc } = useClientes();
  const [isSearchingDni, setIsSearchingDni] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_documento: 'DNI', dni: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: ''
    }
  });

  const dniWatch = watch('dni');
  const tipoDocWatch = watch('tipo_documento');

  // Auto-corrección en tiempo real mientras el usuario escribe (8 dígitos = DNI, 11 = RUC)
  useEffect(() => {
    if (dniWatch) {
      const numLength = dniWatch.replace(/\D/g, '').length;
      if (numLength === 8 && tipoDocWatch !== 'DNI') {
        setValue('tipo_documento', 'DNI');
      } else if (numLength === 11 && tipoDocWatch !== 'RUC') {
        setValue('tipo_documento', 'RUC');
      }
    }
  }, [dniWatch, tipoDocWatch, setValue]);

  // Una empresa (RUC) no tiene apellidos: se limpia el campo al cambiar de tipo.
  useEffect(() => {
    if (tipoDocWatch === 'RUC') {
      setValue('apellidos', '');
    }
  }, [tipoDocWatch, setValue]);

  useEffect(() => {
    if (clienteEdit) {
      reset({ ...clienteEdit, tipo_documento: clienteEdit.tipo_documento || 'DNI' });
    } else {
      reset({ tipo_documento: 'DNI', dni: '', nombres: '', apellidos: '', telefono: '', direccion: '', email: '' });
    }
  }, [clienteEdit, open, reset]);

  // Regla 1.4: AbortController para búsquedas si se desmonta o cierra
  const handleConsultarDocumento = async () => {
    let tipo = getValues('tipo_documento');
    const docActual = getValues('dni');
    if (!docActual || docActual.length < 8) return;

    // Auto-corrección inteligente basada en la longitud
    if (docActual.length === 8 && tipo !== 'DNI') {
      tipo = 'DNI';
      setValue('tipo_documento', 'DNI');
    } else if (docActual.length === 11 && tipo !== 'RUC') {
      tipo = 'RUC';
      setValue('tipo_documento', 'RUC');
    }

    setIsSearchingDni(true);
    const abortController = new AbortController();

    const data = tipo === 'RUC'
      ? await consultarRuc(docActual, abortController.signal)
      : await consultarDni(docActual, abortController.signal);

    if (data) {
      setValue('nombres', data.nombres || '');
      // Un match local ya trae 'apellidos' completo; la API externa de DNI
      // trae apellido_paterno/apellido_materno separados y hay que unirlos.
      const apellidos = data.apellidos !== undefined
        ? data.apellidos
        : `${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim();
      setValue('apellidos', tipo === 'RUC' ? '' : apellidos);
      if (data.direccion) setValue('direccion', data.direccion);
    }

    setIsSearchingDni(false);
  };

  const onSubmit = async (data) => {
    // Regla 3.3: Botón deshabilitado al enviar (controlado por isSubmitting)
    const exito = await guardarCliente(data, clienteEdit?.id);
    if (exito) {
      if (onSuccess) onSuccess(exito);
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={!!errors.tipo_documento}>
                <InputLabel>Tipo</InputLabel>
                <Controller
                  name="tipo_documento"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo" disabled={clienteEdit != null}>
                      <MenuItem value="DNI">DNI</MenuItem>
                      <MenuItem value="RUC">RUC</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="dni"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={tipoDocWatch === 'RUC' ? 'RUC' : 'DNI'}
                      fullWidth
                      error={!!errors.dni}
                      helperText={errors.dni?.message}
                    />
                  )}
                />
                <Button
                  variant="contained"
                  onClick={handleConsultarDocumento}
                  disabled={isSearchingDni || isSubmitting || clienteEdit != null}
                  sx={{ minWidth: '120px' }}
                >
                  {isSearchingDni ? <CircularProgress size={24} color="inherit" /> : 'Consultar'}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={tipoDocWatch === 'RUC' ? 12 : 6}>
              <Controller
                name="nombres"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={tipoDocWatch === 'RUC' ? 'Razón Social' : 'Nombres'}
                    fullWidth
                    error={!!errors.nombres}
                    helperText={errors.nombres?.message}
                  />
                )}
              />
            </Grid>
            {tipoDocWatch !== 'RUC' && (
              <Grid item xs={12} sm={6}>
                <Controller
                  name="apellidos"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Apellidos" fullWidth error={!!errors.apellidos} helperText={errors.apellidos?.message} />
                  )}
                />
              </Grid>
            )}
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
