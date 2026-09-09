import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, 
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function ModalSalidaGuia({ open, onClose, onSuccess, guia }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [transportistas, setTransportistas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  
  const [formData, setFormData] = useState({
    transportista_id: '',
    vehiculo_id: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({ transportista_id: '', vehiculo_id: '' });
      fetchDatos();
    }
  }, [open]);

  const fetchDatos = async () => {
    try {
      setLoading(true);
      const [tRes, vRes] = await Promise.all([
        api.get('/clientes/transportistas/'),
        api.get('/vehiculos/transporte/')
      ]);
      setTransportistas(tRes.data.results || tRes.data || []);
      setVehiculos(vRes.data.results || vRes.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar datos de transporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.transportista_id || !formData.vehiculo_id) {
      return Swal.fire('Atención', 'Debe seleccionar transportista y vehículo', 'warning');
    }

    try {
      setSaving(true);
      await api.post(`/inventario/guias-remision/${guia.id}/dar_salida/`, formData);
      Swal.fire('¡Éxito!', 'Salida registrada correctamente', 'success');
      onSuccess();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.detail || 'Error al dar salida', 'error');
    } finally {
      setSaving(false);
    }
  };

  const guiaLabel = guia
    ? `${guia.serie_prefijo}-${String(guia.correlativo).padStart(6, '0')}`
    : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
        🚚 Dar Salida a Guía de Remisión
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Asigne el transportista y el vehículo que realizará el traslado de la guía <b>{guiaLabel}</b>.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Transportista *</InputLabel>
              <Select
                value={formData.transportista_id}
                label="Transportista *"
                onChange={e => setFormData({...formData, transportista_id: e.target.value})}
              >
                {transportistas.length === 0
                  ? <MenuItem disabled value=""><em>No hay transportistas registrados</em></MenuItem>
                  : transportistas.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.nombre_o_razon_social}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Vehículo de Transporte *</InputLabel>
              <Select
                value={formData.vehiculo_id}
                label="Vehículo de Transporte *"
                onChange={e => setFormData({...formData, vehiculo_id: e.target.value})}
              >
                {vehiculos.length === 0
                  ? <MenuItem disabled value=""><em>No hay vehículos registrados</em></MenuItem>
                  : vehiculos.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSubmit} 
          disabled={saving || loading}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Salida'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
