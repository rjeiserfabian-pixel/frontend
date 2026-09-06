import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Grid, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Autocomplete, CircularProgress, Divider, InputAdornment
} from '@mui/material';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { comprasService } from '../services/comprasApi';
import { proveedorService } from '../../clientes/services/proveedorService';
import { inventarioService } from '../../inventario/services/inventarioService';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import ModalNuevoProveedor from '../components/ModalNuevoProveedor';

const NuevaCompraPage = () => {
  const navigate = useNavigate();
  const { currentSucursal } = useSucursal();

  // Main form state
  const [formData, setFormData] = useState({
    proveedor: null,
    fecha_emision: new Date().toISOString().split('T')[0],
    tipo_comprobante: 'Factura',
    serie: '',
    numero_comprobante: '',
    tipo_pago: 'Contado',
    dias_credito: 30,
    observaciones: '',
    ubicacion_id: '' // Where is this stored? We need to select an Almacen/Ubicacion.
  });

  const [detalles, setDetalles] = useState([]);
  
  // Autocomplete states
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);

  useEffect(() => {
    fetchProveedores();
    fetchRepuestos();
    if (currentSucursal) {
      fetchUbicaciones(currentSucursal.id);
    }
  }, [currentSucursal]);

  const fetchProveedores = async () => {
    try {
      const data = await proveedorService.getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRepuestos = async () => {
    try {
      const data = await inventarioService.getRepuestos();
      setRepuestos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUbicaciones = async (sucursalId) => {
    // In a real scenario you would fetch locations by sucursal
    // For now we assume a getUbicaciones endpoint exists.
    try {
      const data = await inventarioService.getUbicaciones(null, sucursalId);
      setUbicaciones(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, ubicacion_id: data[0].id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRepuesto = (event, newValue) => {
    if (newValue) {
      // Check if already in details
      if (detalles.find(d => d.repuesto.id === newValue.id)) {
         Swal.fire('Atención', 'El repuesto ya está en la lista', 'warning');
         return;
      }
      
      setDetalles([...detalles, {
        repuesto: newValue,
        cantidad: 1,
        precio_unitario: newValue.precio_compra || 0,
        subtotal: newValue.precio_compra || 0
      }]);
    }
  };

  const updateDetalle = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;
    
    // Recalculate subtotal
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cant = parseFloat(newDetalles[index].cantidad) || 0;
      const prec = parseFloat(newDetalles[index].precio_unitario) || 0;
      newDetalles[index].subtotal = cant * prec;
    }
    
    setDetalles(newDetalles);
  };

  const removeDetalle = (index) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  // Calculate totals
  const subtotalTotal = detalles.reduce((acc, curr) => acc + curr.subtotal, 0);
  const igvTotal = formData.tipo_comprobante === 'Factura' ? subtotalTotal * 0.18 : 0;
  const totalGeneral = formData.tipo_comprobante === 'Factura' ? subtotalTotal + igvTotal : subtotalTotal;

  const handleSubmit = async () => {
    if (!formData.proveedor || !formData.serie || !formData.numero_comprobante) {
      Swal.fire('Error', 'Complete los campos obligatorios del comprobante', 'error');
      return;
    }
    if (detalles.length === 0) {
      Swal.fire('Error', 'Agregue al menos un repuesto a la compra', 'error');
      return;
    }
    if (!formData.ubicacion_id) {
       Swal.fire('Error', 'Debe seleccionar un almacén/ubicación de destino', 'error');
       return;
    }

    try {
      setLoading(true);
      const payload = {
        proveedor: formData.proveedor.id,
        fecha_emision: formData.fecha_emision,
        tipo_comprobante: formData.tipo_comprobante,
        serie: formData.serie,
        numero_comprobante: formData.numero_comprobante,
        tipo_pago: formData.tipo_pago,
        subtotal: subtotalTotal,
        igv: igvTotal,
        total: totalGeneral,
        observaciones: formData.observaciones,
        ubicacion_id: formData.ubicacion_id,
        dias_credito: formData.dias_credito,
        detalles: detalles.map(d => ({
          repuesto: d.repuesto.id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario
        }))
      };

      await comprasService.crearCompra(payload);
      
      Swal.fire({
        icon: 'success',
        title: '¡Compra registrada!',
        text: 'El inventario y costo promedio han sido actualizados.',
        timer: 2000,
        showConfirmButton: false
      });
      
      setTimeout(() => navigate('/compras'), 2000);

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al registrar la compra', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/compras')} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900 focus:outline-none"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Registrar Nueva Compra</h1>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 md:p-8 mb-6">
            <div className="pb-4 mb-5 border-b border-slate-100">
              <h2 className="text-xl font-serif text-slate-800 font-semibold">Datos del comprobante</h2>
              <p className="text-sm text-slate-500 mt-1">Información del proveedor y del documento de compra.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <Autocomplete
                    options={proveedores}
                    getOptionLabel={(option) => `${option.numero_documento} - ${option.nombre_o_razon_social}`}
                    value={formData.proveedor}
                    onChange={(e, val) => setFormData({ ...formData, proveedor: val })}
                    renderInput={(params) => <TextField {...params} label="Proveedor" required InputProps={{...params.InputProps, sx: { borderRadius: '12px' }}} />}
                  />
                </div>
                <Button 
                  variant="contained" 
                  onClick={() => setModalProveedorOpen(true)}
                  sx={{ minWidth: '56px', px: 0, borderRadius: '12px', bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none' }}
                >
                  <Plus size={24} />
                </Button>
              </div>

              <div>
                <TextField 
                  fullWidth select label="Tipo de comprobante" 
                  value={formData.tipo_comprobante}
                  onChange={(e) => setFormData({ ...formData, tipo_comprobante: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                >
                  <MenuItem value="Factura">Factura</MenuItem>
                  <MenuItem value="Boleta">Boleta</MenuItem>
                  <MenuItem value="Guia">Guía de Remisión</MenuItem>
                  <MenuItem value="Ticket">Ticket</MenuItem>
                </TextField>
              </div>
              
              <div>
                <TextField 
                  fullWidth label="Serie *" placeholder="F001"
                  value={formData.serie}
                  onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <div>
                <TextField 
                  fullWidth label="Número *" placeholder="00001234"
                  value={formData.numero_comprobante}
                  onChange={(e) => setFormData({ ...formData, numero_comprobante: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              
              <div>
                <TextField 
                  fullWidth type="date" label="Fecha emisión"
                  value={formData.fecha_emision}
                  onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                  InputLabelProps={{ shrink: true }}
                />
              </div>
              
              <div>
                <TextField 
                  fullWidth select label="Tipo de pago" 
                  value={formData.tipo_pago}
                  onChange={(e) => setFormData({ ...formData, tipo_pago: e.target.value })}
                  InputProps={{ sx: { borderRadius: '12px' } }}
                >
                  <MenuItem value="Contado">Al contado</MenuItem>
                  <MenuItem value="Credito">Al crédito</MenuItem>
                </TextField>
              </div>

              <div>
                 <TextField 
                    fullWidth select label="Ubicación de ingreso" 
                    value={formData.ubicacion_id}
                    onChange={(e) => setFormData({ ...formData, ubicacion_id: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  >
                    {ubicaciones.map(ub => (
                      <MenuItem key={ub.id} value={ub.id}>{ub.codigo} - {ub.almacen?.nombre}</MenuItem>
                    ))}
                    {ubicaciones.length === 0 && <MenuItem value="">Sin ubicaciones</MenuItem>}
                </TextField>
              </div>

              {formData.tipo_pago === 'Credito' && (
                <div className="md:col-span-3">
                  <TextField 
                    fullWidth type="number" label="Días de Crédito"
                    value={formData.dias_credito}
                    onChange={(e) => setFormData({ ...formData, dias_credito: e.target.value })}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Detalles */}
          <Paper sx={{ p: 3 }}>
             <Typography variant="h6" mb={2} fontWeight="bold">Detalle de Repuestos</Typography>
             <Box mb={2}>
               <Autocomplete
                  options={repuestos}
                  getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                  onChange={handleAddRepuesto}
                  value={null}
                  renderInput={(params) => <TextField {...params} label="Buscar repuesto para agregar..." />}
                />
             </Box>
             
             <TableContainer>
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell><b>Repuesto</b></TableCell>
                     <TableCell width="15%"><b>Cantidad</b></TableCell>
                     <TableCell width="20%"><b>Costo Unit.</b></TableCell>
                     <TableCell align="right"><b>Subtotal</b></TableCell>
                     <TableCell width="5%"></TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                    {detalles.map((det, index) => (
                      <TableRow key={index}>
                        <TableCell>{det.repuesto.codigo} - {det.repuesto.nombre}</TableCell>
                        <TableCell>
                          <TextField 
                            type="number" size="small" value={det.cantidad}
                            onChange={(e) => updateDetalle(index, 'cantidad', e.target.value)}
                            inputProps={{ min: 0.1, step: 0.1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField 
                            type="number" size="small" value={det.precio_unitario}
                            onChange={(e) => updateDetalle(index, 'precio_unitario', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">S/</InputAdornment>,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">S/ {det.subtotal.toFixed(2)}</TableCell>
                        <TableCell>
                           <IconButton color="error" size="small" onClick={() => removeDetalle(index)}>
                             <Trash2 size={18} />
                           </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {detalles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No hay repuestos en el detalle.
                        </TableCell>
                      </TableRow>
                    )}
                 </TableBody>
               </Table>
             </TableContainer>

              {/* Resumen de Compra */}
              <div className="flex justify-end mt-6">
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <Typography variant="subtitle1" mb={2} fontWeight="bold" color="text.primary">Resumen de Compra</Typography>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="medium">S/ {subtotalTotal.toFixed(2)}</Typography>
                  </Box>
                  {formData.tipo_comprobante === 'Factura' && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">IGV (18%):</Typography>
                      <Typography variant="body2" fontWeight="medium">S/ {igvTotal.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1.5 }} />
                  <Box display="flex" justifyContent="space-between" mb={3}>
                    <Typography variant="subtitle1" fontWeight="bold">Total General:</Typography>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      S/ {totalGeneral.toFixed(2)}
                    </Typography>
                  </Box>

                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    size="large"
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold' }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    Procesar Compra
                  </Button>
                </div>
              </div>
           </Paper>
        </div>
      
      <ModalNuevoProveedor 
        open={modalProveedorOpen}
        onClose={() => setModalProveedorOpen(false)}
        onSuccess={(nuevoProv) => {
          setProveedores([...proveedores, nuevoProv]);
          setFormData({ ...formData, proveedor: nuevoProv });
          setModalProveedorOpen(false);
        }}
      />
    </div>
  );
};

export default NuevaCompraPage;
