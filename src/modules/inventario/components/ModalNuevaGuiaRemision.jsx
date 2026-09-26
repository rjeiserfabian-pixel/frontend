import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, IconButton, 
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper,
  Select, MenuItem, FormControl, InputLabel, CircularProgress, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Trash2, X, Plus } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import ClientesForm from '../../clientes/components/ClientesForm';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

export default function ModalNuevaGuiaRemision({ open, onClose, onSuccess }) {
  const { activeSucursalId } = useSucursal();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    serie: '',
    almacen_origen: '',
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
  const [almacenes, setAlmacenes] = useState([]);
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
      const [seriesRes, almacenesRes, distritosRes] = await Promise.all([
        api.get('/ventas/series-internas/', { params: { page_size: 100 } }),
        api.get('/inventario/almacenes/', { params: { sucursal: activeSucursalId, page_size: 100 } }),
        api.get('/seguridad/distritos/', { params: { page_size: 2000 } })
      ]);
      
      const seriesData = seriesRes.data.results || seriesRes.data || [];
      const guiasSeries = seriesData.filter(s => s.tipo_documento === 'GUIA_REMISION' && String(s.sucursal) === String(activeSucursalId));
      setSeries(guiasSeries);
      if(guiasSeries.length > 0) setFormData(prev => ({ ...prev, serie: guiasSeries[0].id }));

      const almacenesData = almacenesRes.data.results || almacenesRes.data || [];
      setAlmacenes(almacenesData);
      if (almacenesData.length > 0) setFormData(prev => ({ ...prev, almacen_origen: almacenesData[0].id }));

      setDistritos(distritosRes.data.results || distritosRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [clientModalOpen, setClientModalOpen] = useState(false);
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
    if (!formData.almacen_origen) return Swal.fire('Error', 'Seleccione un almacen de origen', 'error');
    if (!formData.cliente) return Swal.fire('Error', 'Seleccione un cliente', 'error');
    if (!formData.motivo_traslado?.trim()) return Swal.fire('Error', 'Ingrese el motivo del traslado', 'error');
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
        almacen_origen: formData.almacen_origen,
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
      const backendData = error.response?.data;
      const backendMsg = backendData?.detail
        || backendData?.motivo_traslado?.[0]
        || backendData?.non_field_errors?.[0]
        || 'Error al crear la guia';
      Swal.fire('Error', backendMsg, 'error');
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
      PaperProps={{ sx: { borderRadius: '8px', border: `1px solid ${C.border}` } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: C.bgElevated, color: 'white', py: 2, borderBottom: `1px solid ${C.border}`
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
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
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
                sx={{ backgroundColor: alpha('#ffffff', 0.04), input: { textAlign: 'center', fontWeight: 'bold', color: C.blue } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Almacen Origen *</InputLabel>
                <Select
                  value={formData.almacen_origen}
                  label="Almacen Origen *"
                  onChange={e => setFormData({...formData, almacen_origen: e.target.value})}
                >
                  {almacenes.length === 0
                    ? <MenuItem disabled value=""><em>Sin almacenes activos</em></MenuItem>
                    : almacenes.map(a => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)
                  }
                </Select>
              </FormControl>

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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  fullWidth
                  size="small"
                  options={clientes}
                  getOptionLabel={(option) => `${option.dni} - ${option.nombres} ${option.apellidos || ''}`.trim()}
                  value={clientes.find(c => c.id === formData.cliente) || null}
                  inputValue={clienteBusqueda}
                  onOpen={() => {
                    if (clientes.length === 0) buscarClientes('');
                  }}
                  onInputChange={(e, newInputValue, reason) => {
                    setClienteBusqueda(newInputValue);
                    if (reason === 'input' || reason === 'clear') {
                      buscarClientes(newInputValue);
                    }
                  }}
                  onChange={(e, newValue) => {
                    setFormData({...formData, cliente: newValue ? newValue.id : ''});
                  }}
                  renderInput={(params) => <TextField {...params} label="Cliente * (Nombre, RUC o DNI)" />}
                />
                <IconButton
                  onClick={() => setClientModalOpen(true)}
                  title="Registrar cliente rápido"
                  sx={{ bgcolor: alpha(C.brand, 0.14), border: `1px solid ${alpha(C.brandLight, 0.24)}`, color: C.brandLight, borderRadius: '8px', '&:hover': { bgcolor: alpha(C.brand, 0.22) } }}
                >
                  <Plus size={20} />
                </IconButton>
              </Box>
              <TextField
                label="Motivo del Traslado *"
                size="small"
                required
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
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: C.brandLight, mt: 1 }}>
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

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: C.brandLight, mt: 1 }}>
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

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: C.brandLight, mt: 1 }}>
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

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', borderColor: C.border }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
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
          sx={{ background: `linear-gradient(135deg, ${C.brandLight}, ${C.brand})` }}
        >
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Crear Guía'}
        </Button>
      </DialogActions>

      {clientModalOpen && (
        <ClientesForm
          open={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          onSuccess={(createdClient) => {
            if (!createdClient?.id) return;
            setClientes(prev => prev.some(c => c.id === createdClient.id) ? prev : [createdClient, ...prev]);
            setFormData(prev => ({ ...prev, cliente: createdClient.id }));
            setClienteBusqueda(`${createdClient.dni} - ${createdClient.nombres} ${createdClient.apellidos || ''}`.trim());
          }}
        />
      )}
    </Dialog>
  );
}
