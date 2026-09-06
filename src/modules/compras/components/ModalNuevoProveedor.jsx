import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem, CircularProgress 
} from '@mui/material';
import Swal from 'sweetalert2';
import { proveedorService } from '../../clientes/services/proveedorService';

const ModalNuevoProveedor = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: 'RUC',
    numero_documento: '',
    nombre_o_razon_social: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.numero_documento || !formData.nombre_o_razon_social) {
      Swal.fire('Error', 'El número de documento y la razón social son obligatorios.', 'error');
      return;
    }

    try {
      setLoading(true);
      // Asumiendo que proveedorService.crearProveedor o similar existe
      // basado en la estructura de clientes
      const nuevoProveedor = await proveedorService.crearProveedor(formData);
      
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
             <TextField
               fullWidth label="Número de Documento" name="numero_documento" required
               value={formData.numero_documento} onChange={handleChange}
             />
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
