import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem, CircularProgress,
  Box, Tooltip
} from '@mui/material';
import { Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { proveedorService } from '../../clientes/services/proveedorService';

const ModalNuevoProveedor = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: 'RUC',
    numero_documento: '',
    nombre_o_razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-detección DNI/RUC
    if (name === 'numero_documento') {
      const cleanValue = value.replace(/\D/g, ''); // Solo números
      let newTipo = formData.tipo_documento;
      if (cleanValue.length === 8) newTipo = 'DNI';
      if (cleanValue.length === 11) newTipo = 'RUC';
      
      setFormData({ 
        ...formData, 
        numero_documento: cleanValue,
        tipo_documento: newTipo
      });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleBuscar = async () => {
    if (!formData.numero_documento) {
      Swal.fire('Atención', 'Ingrese el número de documento a buscar.', 'warning');
      return;
    }
    
    if (formData.tipo_documento === 'DNI' && formData.numero_documento.length !== 8) {
       Swal.fire('Atención', 'El DNI debe tener 8 dígitos.', 'warning');
       return;
    }
    
    if (formData.tipo_documento === 'RUC' && formData.numero_documento.length !== 11) {
       Swal.fire('Atención', 'El RUC debe tener 11 dígitos.', 'warning');
       return;
    }

    try {
      setSearching(true);
      const data = await proveedorService.consultarDocumento(formData.tipo_documento, formData.numero_documento);
      
      if (data && data.data) {
        const payload = data.data;
        setFormData({
          ...formData,
          nombre_o_razon_social: payload.nombre_o_razon_social || payload.nombre || payload.razon_social || '',
          direccion: payload.direccion || ''
        });
        Swal.fire({
          icon: 'success',
          title: 'Datos encontrados',
          toast: true,
          position: 'top-end',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire('Atención', data?.message || 'No se encontraron datos.', 'warning');
      }
    } catch (error) {
      console.error('Error buscando documento:', error);
      Swal.fire('Error', 'Ocurrió un problema al consultar el documento. Verifique su conexión o intente más tarde.', 'error');
    } finally {
      setSearching(false);
    }
  };


  const handleSubmit = async () => {
    if (!formData.numero_documento || !formData.nombre_o_razon_social) {
      Swal.fire('Error', 'El número de documento y la razón social son obligatorios.', 'error');
      return;
    }

    try {
      setLoading(true);
      // Aquí usamos proveedorService.crear directamente
      const nuevoProveedor = await proveedorService.crear(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Proveedor Registrado',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });
      
      onSuccess(nuevoProveedor);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo registrar el proveedor. Puede que el documento ya exista.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Nuevo Proveedor Rápido</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
             <TextField
               fullWidth select label="Documento" name="tipo_documento"
               value={formData.tipo_documento} onChange={handleChange}
             >
               <MenuItem value="RUC">RUC</MenuItem>
               <MenuItem value="DNI">DNI</MenuItem>
             </TextField>
          </Grid>
          <Grid item xs={12} sm={8}>
             <Box sx={{ display: 'flex', gap: 1 }}>
               <TextField
                 fullWidth label="Número de Documento" name="numero_documento" required
                 value={formData.numero_documento} onChange={handleChange}
                 inputProps={{ maxLength: 11 }}
               />
               <Button
                 variant="contained"
                 color="primary"
                 onClick={handleBuscar}
                 disabled={searching}
                 sx={{ minWidth: '56px', borderRadius: '4px' }}
               >
                 {searching ? <CircularProgress size={20} color="inherit" /> : <Search size={20} />}
               </Button>
             </Box>
          </Grid>
          <Grid item xs={12}>
             <TextField
               fullWidth label="Nombre o Razón Social" name="nombre_o_razon_social" required
               value={formData.nombre_o_razon_social} onChange={handleChange}
             />
          </Grid>
          <Grid item xs={12}>
             <TextField
               fullWidth label="Dirección" name="direccion"
               value={formData.direccion} onChange={handleChange}
             />
          </Grid>
          <Grid item xs={12} sm={6}>
             <TextField
               fullWidth label="Teléfono" name="telefono"
               value={formData.telefono} onChange={handleChange}
             />
          </Grid>
          <Grid item xs={12} sm={6}>
             <TextField
               fullWidth label="Email" name="email" type="email"
               value={formData.email} onChange={handleChange}
             />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Guardar Proveedor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNuevoProveedor;
