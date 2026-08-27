import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemButton,
  Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export const UbigeoPage = () => {
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [selectedDepto, setSelectedDepto] = useState(null);
  const [selectedProv, setSelectedProv] = useState(null);

  const [loadingDep, setLoadingDep] = useState(false);
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: '', data: null }); // type: 'dep', 'prov', 'dist'
  const [formData, setFormData] = useState({ nombre: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      setLoadingDep(true);
      const res = await api.get('/seguridad/departamentos/');
      setDepartamentos(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los departamentos', 'error');
    } finally {
      setLoadingDep(false);
    }
  };

  const fetchProvincias = async (depId) => {
    try {
      setLoadingProv(true);
      const res = await api.get(`/seguridad/provincias/?departamento=${depId}`);
      setProvincias(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProv(false);
    }
  };

  const fetchDistritos = async (provId) => {
    try {
      setLoadingDist(true);
      const res = await api.get(`/seguridad/distritos/?provincia=${provId}`);
      setDistritos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDist(false);
    }
  };

  const handleSelectDepto = (dep) => {
    setSelectedDepto(dep);
    setSelectedProv(null);
    setDistritos([]);
    fetchProvincias(dep.id);
  };

  const handleSelectProv = (prov) => {
    setSelectedProv(prov);
    fetchDistritos(prov.id);
  };

  const openModal = (type, data = null) => {
    setModalConfig({ type, data });
    setFormData({ nombre: data ? data.nombre : '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) return;
    setSaving(true);
    try {
      const { type, data } = modalConfig;
      let endpoint = '';
      let payload = { nombre: formData.nombre };

      if (type === 'dep') {
        endpoint = '/seguridad/departamentos/';
      } else if (type === 'prov') {
        endpoint = '/seguridad/provincias/';
        payload.departamento = selectedDepto.id;
      } else if (type === 'dist') {
        endpoint = '/seguridad/distritos/';
        payload.provincia = selectedProv.id;
      }

      if (data) {
        // Edit
        await api.put(`${endpoint}${data.id}/`, payload);
      } else {
        // Create
        await api.post(endpoint, payload);
      }

      setModalOpen(false);
      
      // Refresh
      if (type === 'dep') fetchDepartamentos();
      if (type === 'prov') fetchProvincias(selectedDepto.id);
      if (type === 'dist') fetchDistritos(selectedProv.id);

      Swal.fire('Éxito', 'Guardado correctamente', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        let endpoint = '';
        if (type === 'dep') endpoint = '/seguridad/departamentos/';
        if (type === 'prov') endpoint = '/seguridad/provincias/';
        if (type === 'dist') endpoint = '/seguridad/distritos/';

        await api.delete(`${endpoint}${id}/`);
        Swal.fire('Eliminado', 'El registro ha sido eliminado', 'success');
        
        // Refresh
        if (type === 'dep') {
          fetchDepartamentos();
          if (selectedDepto?.id === id) {
            setSelectedDepto(null);
            setSelectedProv(null);
            setProvincias([]);
            setDistritos([]);
          }
        }
        if (type === 'prov') {
          fetchProvincias(selectedDepto.id);
          if (selectedProv?.id === id) {
            setSelectedProv(null);
            setDistritos([]);
          }
        }
        if (type === 'dist') fetchDistritos(selectedProv.id);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se puede eliminar (probablemente está en uso)', 'error');
      }
    }
  };

  const renderList = (title, items, loading, type, selected, onSelect, parentSelected) => (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <Typography variant="h6" fontWeight="bold">{title}</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Plus size={16} />}
          onClick={() => openModal(type)}
          disabled={type !== 'dep' && !parentSelected}
        >
          Nuevo
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={30} /></Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No hay registros.
          </Typography>
        ) : (
          <List dense>
            {items.map(item => (
              <ListItem 
                key={item.id} 
                disablePadding
                secondaryAction={
                  <Box>
                    <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); openModal(type, item); }}>
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton edge="end" size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(type, item.id); }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemButton 
                  selected={selected?.id === item.id}
                  onClick={() => onSelect && onSelect(item)}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemText primary={item.nombre} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <MapPin size={28} color="#3b82f6" />
        <Typography variant="h5" fontWeight="bold">Gestión de Ubigeo</Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ height: 'calc(100% - 60px)' }}>
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          {renderList('Departamentos', departamentos, loadingDep, 'dep', selectedDepto, handleSelectDepto, true)}
        </Grid>
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          {renderList('Provincias', provincias, loadingProv, 'prov', selectedProv, handleSelectProv, selectedDepto)}
        </Grid>
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          {renderList('Distritos', distritos, loadingDist, 'dist', null, null, selectedProv)}
        </Grid>
      </Grid>

      {/* Modal para Crear/Editar */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modalConfig.data ? 'Editar ' : 'Nuevo '} 
          {modalConfig.type === 'dep' ? 'Departamento' : modalConfig.type === 'prov' ? 'Provincia' : 'Distrito'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={(e) => setFormData({ nombre: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UbigeoPage;
