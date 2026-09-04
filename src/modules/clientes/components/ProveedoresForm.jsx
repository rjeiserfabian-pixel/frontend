import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, CircularProgress, IconButton, Grid, Box,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProveedores } from '../hooks/useProveedores';

// Regla 4.3: Validación doble con Zod
const schema = z.object({
  tipo_documento: z.enum(['DNI', 'RUC']),
  numero_documento: z.string().min(8, 'Debe tener al menos 8 caracteres'),
  nombre_o_razon_social: z.string().min(2, 'Obligatorio'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
});

const ProveedoresForm = ({ open, onClose, onSuccess, proveedorEdit }) => {
  const { guardarProveedor, consultarDocumento } = useProveedores();
  const [isSearchingDni, setIsSearchingDni] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_documento: 'RUC', numero_documento: '', nombre_o_razon_social: '', telefono: '', direccion: '', email: ''
    }
  });

  const numDocWatch = watch('numero_documento');
  const tipoDocWatch = watch('tipo_documento');

  // Auto-corrección en tiempo real mientras el usuario escribe
  useEffect(() => {
    if (numDocWatch) {
      // Remover todo lo que no sea número para contar
      const numLength = numDocWatch.replace(/\D/g, '').length;
      if (numLength === 8 && tipoDocWatch !== 'DNI') {
        setValue('tipo_documento', 'DNI');
      } else if (numLength === 11 && tipoDocWatch !== 'RUC') {
        setValue('tipo_documento', 'RUC');
      }
    }
  }, [numDocWatch, tipoDocWatch, setValue]);

  useEffect(() => {
    if (proveedorEdit) {
      reset({
         ...proveedorEdit,
         email: proveedorEdit.email || ''
      });
    } else {
      reset({ tipo_documento: 'RUC', numero_documento: '', nombre_o_razon_social: '', telefono: '', direccion: '', email: '' });
    }
  }, [proveedorEdit, open, reset]);

  const handleConsultarDocumento = async () => {
    let tipo = getValues('tipo_documento');
    const docActual = getValues('numero_documento');
    
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
    
    const data = await consultarDocumento(tipo, docActual, abortController.signal);
    if (data) {
      if (data.nombre_o_razon_social) setValue('nombre_o_razon_social', data.nombre_o_razon_social);
      if (data.direccion) setValue('direccion', data.direccion);
    }
    
    setIsSearchingDni(false);
  };

  const onSubmit = async (data) => {
    const exito = await guardarProveedor(data, proveedorEdit?.id);
    if (exito) {
      if (onSuccess) onSuccess(exito);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {proveedorEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            
            <Grid item xs={12} sm={4}>
               <FormControl fullWidth size="small" error={!!errors.tipo_documento}>
                <InputLabel>Tipo</InputLabel>
                <Controller
                  name="tipo_documento"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Tipo">
                      <MenuItem value="RUC">RUC</MenuItem>
                      <MenuItem value="DNI">DNI</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Controller
                  name="numero_documento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="N° Documento"
                      fullWidth
                      size="small"
                      error={!!errors.numero_documento}
                      helperText={errors.numero_documento?.message}
                    />
                  )}
                />
                <Button 
                  variant="contained"
                  onClick={handleConsultarDocumento} 
                  disabled={isSearchingDni || isSubmitting || proveedorEdit != null}
                  sx={{ minWidth: '120px' }}
                >
                  {isSearchingDni ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="nombre_o_razon_social"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre o Razón Social"
                    fullWidth
                    size="small"
                    error={!!errors.nombre_o_razon_social}
                    helperText={errors.nombre_o_razon_social?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Teléfono (Opcional)"
                    fullWidth
                    size="small"
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="email"
                    label="Email (Opcional)"
                    fullWidth
                    size="small"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dirección (Opcional)"
                    fullWidth
                    size="small"
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message}
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

// Regla 2.1: Evitar re-renders innecesarios
export default React.memo(ProveedoresForm);
