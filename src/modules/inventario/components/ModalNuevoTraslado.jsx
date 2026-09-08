import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Grid, TextField, Autocomplete, Table, TableBody, TableCell, 
  TableHead, TableRow, IconButton, Typography, CircularProgress,
  Box, Paper, Divider, Select, MenuItem, InputAdornment
} from '@mui/material';
import { Trash2, Plus, X, Search, Package, Info, Calendar } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function ModalNuevoTraslado({ open, onClose, onSuccess }) {
  const [almacenes, setAlmacenes] = useState([]);
  const [almacenOrigen, setAlmacenOrigen] = useState(null);
  const [almacenDestino, setAlmacenDestino] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [fechaTraslado, setFechaTraslado] = useState(new Date().toISOString().split('T')[0]);
  
  const [repuestosOrigen, setRepuestosOrigen] = useState([]);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);
  
  const [detalles, setDetalles] = useState([]);
  const [ubicacionesDestino, setUbicacionesDestino] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAlmacenes();
    }
  }, [open]);

  const fetchAlmacenes = async () => {
    try {
      const res = await api.get('/inventario/almacenes/');
      setAlmacenes(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los almacenes', 'error');
    }
  };

  useEffect(() => {
    if (almacenOrigen) {
      if (almacenDestino?.id === almacenOrigen.id) {
        setAlmacenDestino(null);
      }
      fetchRepuestosEnOrigen(almacenOrigen.id);
    } else {
      setRepuestosOrigen([]);
      setRepuestoSeleccionado(null);
      setDetalles([]);
    }
  }, [almacenOrigen]);

  const fetchRepuestosEnOrigen = async (almacenId) => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/stock/', { params: { almacen: almacenId } });
      const data = res.data.results || res.data || [];
      setRepuestosOrigen(data.filter(s => s.stock_disponible > 0));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (almacenDestino) {
      fetchUbicacionesDestino(almacenDestino.id);
    } else {
      setUbicacionesDestino([]);
      setDetalles(det => det.map(d => ({ ...d, ubicacion_destino_id: '' })));
    }
  }, [almacenDestino]);

  const fetchUbicacionesDestino = async (almacenId) => {
    try {
      const res = await api.get('/inventario/ubicaciones/', { params: { almacen: almacenId } });
      setUbicacionesDestino(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddDetalle = () => {
    if (!repuestoSeleccionado) {
      Swal.fire('Atención', 'Seleccione un repuesto de la lista', 'warning');
      return;
    }

    const exists = detalles.find(d => d.stock_origen_id === repuestoSeleccionado.id);
    if (exists) {
      Swal.fire('Atención', 'Este repuesto ya está en la lista', 'warning');
      return;
    }

    const nuevoDetalle = {
      id: Date.now(),
      stock_origen_id: repuestoSeleccionado.id,
      repuesto_id: repuestoSeleccionado.repuesto,
      repuesto_codigo: repuestoSeleccionado.repuesto_codigo,
      repuesto_nombre: repuestoSeleccionado.repuesto_nombre,
      ubicacion_origen_id: repuestoSeleccionado.ubicacion,
      ubicacion_origen_nombre: repuestoSeleccionado.ubicacion_codigo,
      stock_disponible: repuestoSeleccionado.stock_disponible,
      ubicacion_destino_id: '',
      cantidad: 1,
      observacion: ''
    };

    setDetalles([nuevoDetalle, ...detalles]);
    setRepuestoSeleccionado(null);
  };

  const handleRemoveDetalle = (id) => {
    setDetalles(detalles.filter(d => d.id !== id));
  };

  const handleDetalleChange = (id, field, value) => {
    setDetalles(detalles.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleSubmit = async () => {
    if (!almacenOrigen || !almacenDestino) {
      Swal.fire('Atención', 'Debe seleccionar los almacenes origen y destino', 'warning');
      return;
    }
    if (almacenOrigen.id === almacenDestino.id) {
      Swal.fire('Atención', 'El almacén de origen y destino deben ser diferentes', 'warning');
      return;
    }
    if (detalles.length === 0) {
      Swal.fire('Atención', 'Debe agregar al menos un repuesto a la lista', 'warning');
      return;
    }

    for (const d of detalles) {
      if (!d.ubicacion_destino_id) {
        Swal.fire('Atención', `Seleccione la ubicación de destino para el producto: ${d.repuesto_nombre}`, 'warning');
        return;
      }
      if (d.cantidad <= 0 || isNaN(d.cantidad)) {
        Swal.fire('Atención', `La cantidad debe ser mayor a 0 para el producto: ${d.repuesto_nombre}`, 'warning');
        return;
      }
      if (d.cantidad > d.stock_disponible) {
        Swal.fire('Atención', `No hay suficiente stock en origen para: ${d.repuesto_nombre}`, 'warning');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        almacen_origen: almacenOrigen.id,
        almacen_destino: almacenDestino.id,
        observaciones,
        detalles_datos: detalles.map(d => ({
          repuesto: d.repuesto_id,
          ubicacion_origen: d.ubicacion_origen_id,
          ubicacion_destino: d.ubicacion_destino_id,
          cantidad: parseFloat(d.cantidad)
        }))
      };

      await api.post('/inventario/traslados/', payload);
      Swal.fire('Éxito', 'Traslado registrado correctamente', 'success');
      onSuccess();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Error al guardar el traslado';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: '80%',
          height: '90vh',
          maxHeight: '90vh',
          borderRadius: 2,
          bgcolor: '#f4f7f9',
          overflow: 'hidden'
        }
      }}
    >
      <Box sx={{ 
        bgcolor: '#1a365d', 
        color: 'white', 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            bgcolor: '#3b82f6', 
            p: 1.5, 
            borderRadius: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Package size={28} color="white" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, m: 0, lineHeight: 1.2 }}>
              Nuevo Movimiento de Almacén
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Registra un nuevo movimiento de productos entre almacenes
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={24} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, m: 0, overflowY: 'auto' }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ 
              width: 28, height: 28, borderRadius: '50%', 
              bgcolor: '#3b82f6', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '14px'
            }}>
              1
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Información General
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            {/* Almacén Origen */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Package size={16} color="#3b82f6" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Almacén Origen *</Typography>
              </Box>
              <Autocomplete
                fullWidth
                options={almacenes}
                getOptionLabel={(option) => option.nombre}
                value={almacenOrigen}
                onChange={(e, v) => setAlmacenOrigen(v)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    placeholder="Seleccionar almacén..." 
                    sx={{ '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1 } }}
                  />
                )}
              />
            </Box>

            {/* Almacén Destino */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Package size={16} color="#3b82f6" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Almacén Destino *</Typography>
              </Box>
              <Autocomplete
                fullWidth
                options={almacenes.filter(a => a.id !== almacenOrigen?.id)}
                getOptionLabel={(option) => option.nombre}
                value={almacenDestino}
                onChange={(e, v) => setAlmacenDestino(v)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth
                    placeholder="Seleccionar almacén..." 
                    sx={{ '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1 } }}
                  />
                )}
              />
            </Box>

            {/* Tipo de Movimiento */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Tipo de Movimiento *</Typography>
              </Box>
              <TextField 
                select
                fullWidth
                value="transferencia"
              >
                <MenuItem value="transferencia">Transferencia</MenuItem>
              </TextField>
            </Box>

            {/* Fecha de Movimiento */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Calendar size={16} color="#3b82f6" />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Fecha de Movimiento *</Typography>
              </Box>
              <TextField 
                fullWidth
                type="date"
                value={fechaTraslado}
                onChange={(e) => setFechaTraslado(e.target.value)}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>Observaciones adicionales del traslado</Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="Ingrese una observación detallada (opcional)..."
              multiline
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{ '& .MuiInputBase-input::placeholder': { color: '#94a3b8', opacity: 1 }, bgcolor: 'white' }}
              helperText={`${observaciones.length}/500`}
              FormHelperTextProps={{ sx: { textAlign: 'right', margin: 0, mt: 0.5 } }}
            />
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ 
              width: 28, height: 28, borderRadius: '50%', 
              bgcolor: '#3b82f6', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '14px'
            }}>
              2
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
              Productos a Transferir
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Autocomplete
              sx={{ flexGrow: 1 }}
              options={repuestosOrigen}
              getOptionLabel={(opt) => `${opt.repuesto_codigo} - ${opt.repuesto_nombre} | Ubicación: ${opt.ubicacion_codigo} | Stock Disp: ${opt.stock_disponible}`}
              value={repuestoSeleccionado}
              onChange={(e, v) => setRepuestoSeleccionado(v)}
              disabled={!almacenOrigen || loading}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Buscar producto por código o nombre..." 
                  sx={{
                    '& .MuiInputBase-input::placeholder': { opacity: 1, color: '#94a3b8' }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment>,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Plus size={18} />}
              onClick={handleAddDetalle}
              sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}
              disabled={!repuestoSeleccionado}
            >
              Agregar Producto
            </Button>
          </Box>

          <Table size="small" sx={{ mb: 3 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 600, py: 1.5 } }}>
                <TableCell>Código</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="center">Ubi. Origen</TableCell>
                <TableCell align="center">Stock Origen</TableCell>
                <TableCell align="center">Ubi. Destino</TableCell>
                <TableCell align="center" width="120">Cantidad</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    Agregue productos para transferir seleccionándolos arriba
                  </TableCell>
                </TableRow>
              ) : (
                detalles.map((row) => (
                  <TableRow key={row.id} sx={{ '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5 } }}>
                    <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{row.repuesto_codigo}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a' }}>
                        {row.repuesto_nombre}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {row.ubicacion_origen_nombre}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {row.stock_disponible}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Select
                        size="small"
                        displayEmpty
                        value={row.ubicacion_destino_id}
                        onChange={(e) => handleDetalleChange(row.id, 'ubicacion_destino_id', e.target.value)}
                        sx={{ minWidth: 140, bgcolor: 'white' }}
                        disabled={!almacenDestino}
                      >
                        <MenuItem value="" disabled>Seleccione destino...</MenuItem>
                        {ubicacionesDestino.map(ubi => (
                          <MenuItem key={ubi.id} value={ubi.id}>{ubi.codigo}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={row.cantidad}
                        onChange={(e) => handleDetalleChange(row.id, 'cantidad', e.target.value)}
                        inputProps={{ min: 1, max: row.stock_disponible }}
                        sx={{ bgcolor: 'white' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ bgcolor: '#fee2e2', borderRadius: 1, display: 'inline-flex' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveDetalle(row.id)}
                          sx={{ color: '#ef4444' }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Box sx={{ 
            bgcolor: '#eff6ff', 
            borderRadius: 1, 
            p: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            border: '1px solid #bfdbfe' 
          }}>
            <Info size={20} color="#3b82f6" />
            <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 500 }}>
              El stock se actualizará automáticamente en los almacenes seleccionados y se registrarán los movimientos en el Kardex.
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <Box sx={{ 
        p: 3, 
        borderTop: '1px solid #e2e8f0', 
        bgcolor: 'white',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 2
      }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ 
            color: '#475569', 
            borderColor: '#cbd5e1',
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit} 
          disabled={submitting || detalles.length === 0}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            boxShadow: 'none'
          }}
        >
          {submitting ? 'Procesando...' : 'Guardar Movimiento'}
        </Button>
      </Box>
    </Dialog>
  );
}
