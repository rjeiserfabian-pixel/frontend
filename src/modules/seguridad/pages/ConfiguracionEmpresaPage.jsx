import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress, 
  Select, MenuItem, FormControl, InputLabel, Divider 
} from '@mui/material';
import { Save, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export const ConfiguracionEmpresaPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Opciones desde la API
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [formData, setFormData] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    departamento: '',
    provincia: '',
    distrito: '',
    telefono: '',
    logo: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [empresaRes, deptosRes] = await Promise.all([
          api.get('/seguridad/empresa/'),
          api.get('/seguridad/departamentos/')
        ]);
        
        const data = empresaRes.data.data;
        const deptos = deptosRes.data;
        
        setDepartamentos(deptos);
        
        setFormData({
          razon_social: data.razon_social || '',
          ruc: data.ruc || '',
          direccion: data.direccion || '',
          departamento: data.departamento || '',
          provincia: data.provincia || '',
          distrito: data.distrito || '',
          telefono: data.telefono || '',
          logo: null 
        });
        
        if (data.logo) {
          setPreviewUrl(data.logo.startsWith('http') ? data.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${data.logo}`);
        }

        // Cargar provincias y distritos iniciales si existen guardados
        if (data.departamento) {
          const deptoObj = deptos.find(d => d.nombre === data.departamento);
          if (deptoObj) {
            const provsRes = await api.get(`/seguridad/provincias/?departamento=${deptoObj.id}`);
            setProvincias(provsRes.data);
            
            if (data.provincia) {
              const provObj = provsRes.data.find(p => p.nombre === data.provincia);
              if (provObj) {
                const distsRes = await api.get(`/seguridad/distritos/?provincia=${provObj.id}`);
                setDistritos(distsRes.data);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar datos", error);
        Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'departamento') {
      // Limpiar cascada
      setFormData(prev => ({ ...prev, departamento: value, provincia: '', distrito: '' }));
      setProvincias([]);
      setDistritos([]);
      
      const deptoObj = departamentos.find(d => d.nombre === value);
      if (deptoObj) {
        try {
          const res = await api.get(`/seguridad/provincias/?departamento=${deptoObj.id}`);
          setProvincias(res.data);
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (name === 'provincia') {
      setFormData(prev => ({ ...prev, provincia: value, distrito: '' }));
      setDistritos([]);

      const provObj = provincias.find(p => p.nombre === value);
      if (provObj) {
        try {
          const res = await api.get(`/seguridad/distritos/?provincia=${provObj.id}`);
          setDistritos(res.data);
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, logo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('razon_social', formData.razon_social);
      payload.append('ruc', formData.ruc);
      payload.append('direccion', formData.direccion);
      payload.append('departamento', formData.departamento);
      payload.append('provincia', formData.provincia);
      payload.append('distrito', formData.distrito);
      payload.append('telefono', formData.telefono);
      if (formData.logo) {
        payload.append('logo', formData.logo);
      }

      await api.put('/seguridad/empresa/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      Swal.fire('Éxito', 'Configuración de la empresa actualizada.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 'lg', margin: '0 auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>Configuración de Empresa</Typography>
      
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" color="primary" gutterBottom>Datos Generales</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField 
                label="Razón Social" 
                name="razon_social"
                fullWidth 
                value={formData.razon_social} 
                onChange={handleChange} 
                required 
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                label="RUC" 
                name="ruc"
                fullWidth 
                value={formData.ruc} 
                onChange={handleChange} 
                required 
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>Ubicación y Contacto</Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  name="departamento"
                  value={formData.departamento}
                  label="Departamento"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Seleccione...</em></MenuItem>
                  {departamentos.map(dep => <MenuItem key={dep.id} value={dep.nombre}>{dep.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={!formData.departamento}>
                <InputLabel>Provincia</InputLabel>
                <Select
                  name="provincia"
                  value={formData.provincia}
                  label="Provincia"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Seleccione...</em></MenuItem>
                  {provincias.map(prov => <MenuItem key={prov.id} value={prov.nombre}>{prov.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={!formData.provincia}>
                <InputLabel>Distrito</InputLabel>
                <Select
                  name="distrito"
                  value={formData.distrito}
                  label="Distrito"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Seleccione...</em></MenuItem>
                  {distritos.map(dist => <MenuItem key={dist.id} value={dist.nombre}>{dist.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField 
                label="Dirección Específica (Ej: Jirón Alegría 123)" 
                name="direccion"
                fullWidth 
                value={formData.direccion} 
                onChange={handleChange} 
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                label="Teléfono" 
                name="telefono"
                fullWidth 
                value={formData.telefono} 
                onChange={handleChange} 
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>Logo de la Empresa</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box 
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    border: '1px dashed #ccc', 
                    borderRadius: 2, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9',
                    overflow: 'hidden'
                  }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Logo Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Typography variant="body2" color="textSecondary">Sin Logo</Typography>
                  )}
                </Box>
                <Button 
                  variant="outlined" 
                  component="label" 
                  startIcon={<Upload size={20} />}
                >
                  Subir Logo
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
              </Box>
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
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ConfiguracionEmpresaPage;
