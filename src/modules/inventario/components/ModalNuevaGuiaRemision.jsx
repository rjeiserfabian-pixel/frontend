import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, IconButton, 
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Trash2, X } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import { useSucursal } from '../../../shared/contexts/SucursalContext';

export default function ModalNuevaGuiaRemision({ open, onClose, onSuccess }) {
  const { activeSucursalId } = useSucursal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    serie: '',
    fecha_traslado: (() => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; })(),
    cliente: '',
    motivo_traslado: '',
    ubigeo_partida: '',
    punto_partida: '',
    ubigeo_llegada: '',
    punto_llegada: '',
    observaciones: ''
  });

  const [detalles, setDetalles] = useState([]);
  const [series, setSeries] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [distritos, setDistritos] = useState([]);
  
  // Para la búsqueda de repuestos
  const [repuestos, setRepuestos] = useState([]);
  const [repuestoBusqueda, setRepuestoBusqueda] = useState('');

  useEffect(() => {
    if (open && activeSucursalId) {
      fetchDatosGenerales();
    }
  }, [open, activeSucursalId]);

  const fetchDatosGenerales = async () => {
    try {
      setLoading(true);
      const [seriesRes, distritosRes] = await Promise.all([
        api.get('/ventas/series-internas/', { params: { page_size: 100 } }),
        api.get('/seguridad/distritos/', { params: { page_size: 2000 } })
      ]);
      
      const seriesData = seriesRes.data.results || seriesRes.data || [];
      const guiasSeries = seriesData.filter(s => s.tipo_documento === 'GUIA_REMISION' && String(s.sucursal) === String(activeSucursalId));
      setSeries(guiasSeries);
      if(guiasSeries.length > 0) setFormData(prev => ({ ...prev, serie: guiasSeries[0].id }));

      setDistritos(distritosRes.data.results || distritosRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const buscarClientes = async (query = '') => {
    if (query.length === 1) return;
    try {
      const res = await api.get('/clientes/', { params: { search: query } });
      setClientes(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // useEffect(() => {
  //   // API corrected in Promise.all above
  // }, []);

  const buscarRepuestos = async (query = '') => {
    // Híbrido: Si escribe solo 1 letra, esperamos a que escriba 2 para no sobrecargar. 
    // Si está vacío (al abrir), traemos los últimos agregados rápido.
    if (query.length === 1) return;
    
    try {
      const res = await api.get('/inventario/repuestos/', { params: { search: query, sucursal: activeSucursalId } });
      setRepuestos(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddDetalle = (repuesto) => {
    if (detalles.find(d => d.repuesto_id === repuesto.id)) {
      Swal.fire('Atención', 'El repuesto ya está en la lista', 'warning');
      return;
    }
    setDetalles([...detalles, { 
      repuesto_id: repuesto.id, 
      codigo: repuesto.codigo, 
      nombre: repuesto.nombre, 
      cantidad: 1,
      precio: repuesto.precio_lista || 0
    }]);
    setRepuestoBusqueda('');
    setRepuestos([]);
  };

  const handleRemoveDetalle = (index) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  const handleUpdateDetalle = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;
    setDetalles(newDetalles);
  };

  const handleSubmit = async () => {
    if (!formData.serie) return Swal.fire('Error', 'Seleccione una serie', 'error');
    if (!formData.cliente) return Swal.fire('Error', 'Seleccione un cliente', 'error');
    if (!formData.ubigeo_partida || !formData.ubigeo_llegada) return Swal.fire('Error', 'Seleccione distritos de partida y llegada', 'error');
    if (!formData.punto_partida || !formData.punto_llegada) return Swal.fire('Error', 'Ingrese las direcciones', 'error');
    if (detalles.length === 0) return Swal.fire('Error', 'Debe agregar al menos un producto', 'error');

    for (let det of detalles) {
      if (!det.cantidad || det.cantidad <= 0) {
        return Swal.fire('Error', 'Todas las cantidades deben ser mayores a 0', 'error');
      }
    }

    try {
      setSaving(true);
      const payload = {
        sucursal: activeSucursalId,
        serie: formData.serie,
        fecha_traslado: formData.fecha_traslado,
        cliente: formData.cliente,
        ubigeo_partida: formData.ubigeo_partida,
        punto_partida: formData.punto_partida,
        ubigeo_llegada: formData.ubigeo_llegada,
        punto_llegada: formData.punto_llegada,
        motivo_traslado: formData.motivo_traslado,
        observaciones: formData.observaciones,
        detalles_datos: detalles
      };

      await api.post('/inventario/guias-remision/', payload);
      Swal.fire('Éxito', 'Guía de remisión creada', 'success');
      onSuccess();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', error.response?.data?.detail || 'Error al crear la guía', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedSerieObj = series.find(s => s.id === formData.serie);
  const nextCorrelativo = selectedSerieObj 
    ? `${selectedSerieObj.prefijo}-${String(selectedSerieObj.correlativo_actual + 1).padStart(selectedSerieObj.longitud_correlativo, '0')}`
    : '---';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1e3a5f', color: 'white', py: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Nueva Guía de Remisión</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Serie Guía *</InputLabel>
                <Select
                  value={formData.serie}
                  label="Serie Guía *"
                  onChange={e => setFormData({...formData, serie: e.target.value})}
                >
                  {series.length === 0 
                    ? <MenuItem disabled value=""><em>Sin series configuradas</em></MenuItem>
                    : series.map(s => <MenuItem key={s.id} value={s.id}>{s.prefijo}</MenuItem>)
                  }
                </Select>
              </FormControl>

              <TextField 
                label="Nº Correlativo" 
                size="small" 
                value={nextCorrelativo}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc', input: { textAlign: 'center', fontWeight: 'bold', color: '#0ea5e9' } }}
              />

              <TextField 
                label="Fecha Traslado *" 
                type="date"
                size="small" 
                value={formData.fecha_traslado}
                onChange={e => setFormData({...formData, fecha_traslado: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Autocomplete
                fullWidth
                size="small"
                options={clientes}
                getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                value={clientes.find(c => c.id === formData.cliente) || null}
                inputValue={clienteBusqueda}
                onOpen={() => {
                  if (clientes.length === 0) buscarClientes('');
                }}
                onInputChange={(e, newInputValue) => {
                  setClienteBusqueda(newInputValue);
                  buscarClientes(newInputValue);
                }}
                onChange={(e, newValue) => {
                  setFormData({...formData, cliente: newValue ? newValue.id : ''});
                }}
                renderInput={(params) => <TextField {...params} label="Cliente *" />}
              />
              <TextField 
                label="Motivo del Traslado" 
                size="small" 
                value={formData.motivo_traslado}
                onChange={e => setFormData({...formData, motivo_traslado: e.target.value})}
              />
            </Box>

            <TextField 
              label="Observaciones (Opcional)" 
              size="small" 
              fullWidth
              multiline
              rows={2}
              value={formData.observaciones}
              onChange={e => setFormData({...formData, observaciones: e.target.value})}
            />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3a5f', mt: 1 }}>
              Punto de Partida
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
              <Autocomplete
                options={distritos}
                getOptionLabel={(option) => option.nombre || ''}
                value={distritos.find(d => d.id === formData.ubigeo_partida) || null}
                onChange={(e, val) => setFormData({...formData, ubigeo_partida: val ? val.id : ''})}
                renderInput={(params) => <TextField {...params} label="Ubigeo Partida *" size="small" />}
              />
              <TextField 
                label="Dirección de Partida *" 
                size="small" 
                value={formData.punto_partida}
                onChange={e => setFormData({...formData, punto_partida: e.target.value})}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3a5f', mt: 1 }}>
              Punto de Llegada
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
              <Autocomplete
                options={distritos}
                getOptionLabel={(option) => option.nombre || ''}
                value={distritos.find(d => d.id === formData.ubigeo_llegada) || null}
                onChange={(e, val) => setFormData({...formData, ubigeo_llegada: val ? val.id : ''})}
                renderInput={(params) => <TextField {...params} label="Ubigeo Llegada *" size="small" />}
              />
              <TextField 
                label="Dirección de Llegada *" 
                size="small" 
                value={formData.punto_llegada}
                onChange={e => setFormData({...formData, punto_llegada: e.target.value})}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e3a5f', mt: 1 }}>
              Productos a Trasladar
            </Typography>
            <Autocomplete
              options={repuestos}
              getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
              filterOptions={(x) => x}
              inputValue={repuestoBusqueda}
              onOpen={() => {
                if (repuestos.length === 0) buscarRepuestos(repuestoBusqueda);
              }}
              onInputChange={(e, newInputValue) => {
                setRepuestoBusqueda(newInputValue);
                buscarRepuestos(newInputValue);
              }}
              onChange={(e, value) => {
                if (value) handleAddDetalle(value);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Buscar producto por código o nombre..." size="small" />
              )}
            />

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell><b>Código</b></TableCell>
                    <TableCell><b>Producto</b></TableCell>
                    <TableCell align="right" width="100px"><b>Precio</b></TableCell>
                    <TableCell align="center" width="120px"><b>Cant.</b></TableCell>
                    <TableCell align="center" width="50px"><b></b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 2, color: 'text.secondary' }}>
                        No hay productos agregados. Búscalos arriba.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((det, index) => (
                      <TableRow key={index}>
                        <TableCell>{det.codigo}</TableCell>
                        <TableCell>{det.nombre}</TableCell>
                        <TableCell align="right">S/ {Number(det.precio).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <TextField 
                            type="number" 
                            size="small" 
                            value={det.cantidad}
                            onChange={(e) => handleUpdateDetalle(index, 'cantidad', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small" onClick={() => handleRemoveDetalle(index)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} color="inherit" variant="outlined">
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit} 
          disabled={saving || loading}
          sx={{ backgroundColor: '#1e3a5f' }}
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Crear Guía'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

