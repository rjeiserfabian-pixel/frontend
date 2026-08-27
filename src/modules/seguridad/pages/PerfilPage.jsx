import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, Divider, Avatar 
} from '@mui/material';
import { Save, User } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export const PerfilPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    documento: '',
    password: '',
    confirmPassword: ''
  });

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/seguridad/mi-perfil/');
        const data = res.data.data;
        setUsuario(data);
        setFormData({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          telefono: data.telefono || '',
          documento: data.documento || '',
          password: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error("Error al cargar perfil", error);
        Swal.fire('Error', 'No se pudo cargar la información del perfil.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'warning');
      return;
    }
    if (formData.password && formData.password.length < 8) {
      Swal.fire('Error', 'La contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        documento: formData.documento
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/seguridad/mi-perfil/', payload);
      
      // Update local storage user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.nombre = formData.nombres;
      userData.apellidos = formData.apellidos;
      userData.email = formData.email;
      localStorage.setItem('user', JSON.stringify(userData));

      Swal.fire('Éxito', 'Perfil actualizado correctamente.', 'success');
      
      // Clear passwords after save
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Reload page to reflect changes in header
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.mensaje || 'Hubo un problema al actualizar el perfil.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Mi Perfil</Typography>
      
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {formData.nombres?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6">{usuario?.username}</Typography>
            <Typography color="text.secondary">Rol: Usuario</Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" color="primary" gutterBottom>Datos Personales</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Nombres" 
                name="nombres"
                fullWidth 
                value={formData.nombres} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Apellidos" 
                name="apellidos"
                fullWidth 
                value={formData.apellidos} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Correo Electrónico" 
                name="email"
                type="email"
                fullWidth 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Teléfono" 
                name="telefono"
                fullWidth 
                value={formData.telefono} 
                onChange={handleChange} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Documento (DNI/CE)" 
                name="documento"
                fullWidth 
                value={formData.documento} 
                onChange={handleChange} 
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>Cambiar Contraseña</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Déjalo en blanco si no deseas cambiar la contraseña actual.
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                label="Nueva Contraseña" 
                name="password"
                type="password"
                fullWidth 
                value={formData.password} 
                onChange={handleChange} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Confirmar Nueva Contraseña" 
                name="confirmPassword"
                type="password"
                fullWidth 
                value={formData.confirmPassword} 
                onChange={handleChange} 
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default PerfilPage;
