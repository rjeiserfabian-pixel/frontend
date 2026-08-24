import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Grid, TextField, MenuItem, Select, InputLabel, 
  FormControl, Divider, Tabs, Tab, Autocomplete, InputAdornment
} from '@mui/material';
import { 
  ArrowRight, Search, Check, X, ArrowLeft, Plus, Minus, Trash2,
  CreditCard, Banknote, Calendar, User, FileText, ShoppingCart
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ventasService } from './../../ventas/services/ventasApi';
import { inventarioService } from './../../inventario/services/inventarioService';
import { clienteService } from './../../clientes/services/clienteService';

// -------------------------------------------------------------
// VISTA 1: LISTA DE PEDIDOS (LIGHT THEME)
// -------------------------------------------------------------
const PosOrderList = ({ onSelectOrder, onNewDirectSale }) => {
  const [tabValue, setTabValue] = useState(0);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const response = await ventasService.getVentas();
      const data = response.results ? response.results : response;
      setVentas(data);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      Swal.fire('Error', 'No se pudieron cargar los pedidos del Kiosko.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const filteredVentas = ventas.filter(v => {
    if (tabValue === 1) return v.estado === 'PRE_VENTA';
    if (tabValue === 2) return v.estado === 'PAGADA' || v.estado === 'COMPLETADA';
    return true;
  });

  const getStatusChip = (estado) => {
    switch(estado) {
      case 'PRE_VENTA': return <Chip label="Pendiente" color="warning" size="small" />;
      case 'PAGADA': return <Chip label="Completado" color="success" size="small" />;
      case 'CANCELADA': return <Chip label="Cancelado" color="error" size="small" />;
      default: return <Chip label={estado} color="default" size="small" />;
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    return date.toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Pedidos de Kiosko / POS</Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<ShoppingCart size={20} />}
          onClick={onNewDirectSale}
        >
          Nueva Venta Directa
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 3, boxShadow: 1 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} indicatorColor="primary" textColor="primary" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tab label="Todos" />
          <Tab label="Pendientes" />
          <Tab label="Completados" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>ID / Ticket</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Vehículo</strong></TableCell>
                  <TableCell align="center"><strong>Ítems</strong></TableCell>
                  <TableCell align="right"><strong>Total (S/)</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acción</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>No hay pedidos encontrados para esta categoría.</TableCell>
                  </TableRow>
                ) : (
                  filteredVentas.map((venta) => (
                    <TableRow key={venta.id} hover sx={{ cursor: venta.estado === 'PRE_VENTA' ? 'pointer' : 'default', backgroundColor: venta.estado === 'PRE_VENTA' ? 'inherit' : '#fafafa' }}>
                      <TableCell>{venta.id} {venta.ticket_kiosko ? `(Ticket #${venta.ticket_kiosko})` : ''}</TableCell>
                      <TableCell>{formatearFecha(venta.creado_en)}</TableCell>
                      <TableCell>{venta.cliente_nombre || 'Cliente General'}</TableCell>
                      <TableCell>{venta.vehiculo_placa || '-'}</TableCell>
                      <TableCell align="center">{venta.detalles ? venta.detalles.length : 0}</TableCell>
                      <TableCell align="right"><strong>{(parseFloat(venta.total) || 0).toFixed(2)}</strong></TableCell>
                      <TableCell align="center">{getStatusChip(venta.estado)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" disabled={venta.estado !== 'PRE_VENTA'} onClick={() => venta.estado === 'PRE_VENTA' && onSelectOrder(venta)}>
                          <ArrowRight size={20} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

// -------------------------------------------------------------
// VISTA 2: CHECKOUT KIOSKO (SOLO LECTURA DE ITEMS)
// -------------------------------------------------------------
const PosCheckout = ({ order, onBack, onComplete }) => {
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [procesando, setProcesando] = useState(false);
  const total = parseFloat(order.total) || 0;

  const [metodosPago, setMetodosPago] = useState([]);
  const [pagos, setPagos] = useState([]);
  
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');

  useEffect(() => {
    const fetchDatosInit = async () => {
      try {
        const [resMetodos, resTipos] = await Promise.all([
          ventasService.getMetodosPago(),
          ventasService.getTiposComprobante()
        ]);
        const dataMetodos = resMetodos.results || resMetodos;
        setMetodosPago(dataMetodos);
        if (dataMetodos && dataMetodos.length > 0) {
          setPagos([{ id: Date.now(), metodo_id: dataMetodos[0].id, monto: total, referencia: '' }]);
        }
        
        const dataTipos = resTipos.results || resTipos;
        setTiposComprobante(dataTipos);
        if (dataTipos && dataTipos.length > 0) {
          setTipoComprobanteId(dataTipos[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchDatosInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    try {
      setProcesando(true);
      await new Promise(r => setTimeout(r, 800)); // Simulación
      Swal.fire('Venta Procesada', 'El pago ha sido registrado correctamente.', 'success').then(() => onComplete());
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al procesar la venta', 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={onBack} color="inherit" sx={{ mr: 2 }}>Volver a Pedidos</Button>
        <Typography variant="h5" fontWeight="bold">Procesar Venta #{order.id}</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LADO IZQUIERDO: CLIENTE Y COMPROBANTE */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>1</span>
              DATOS DEL CLIENTE
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre completo" fullWidth value={order.cliente_nombre || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="DNI / RUC" fullWidth size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Vehículo (Placa)" fullWidth value={order.vehiculo_placa || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" fullWidth value={order.cliente_telefono || ''} size="small" InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>2</span>
              COMPROBANTE
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Comprobante</InputLabel>
                  <Select 
                    value={tipoComprobanteId} 
                    label="Tipo de Comprobante"
                    onChange={e => setTipoComprobanteId(e.target.value)}
                  >
                    {tiposComprobante.map(tc => (
                      <MenuItem key={tc.id} value={tc.id}>{tc.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Serie</InputLabel>
                  <Select value="b001" label="Serie">
                    <MenuItem value="b001">B001 - Principal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* LADO DERECHO: PAGO */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: 1, height: '100%', width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>3</span>
              CONDICIÓN DE PAGO
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={condicionPago} onChange={(e, v) => setCondicionPago(v)}>
                <Tab label="Al Contado" value="CONTADO" />
                <Tab label="Al Crédito" value="CREDITO" />
              </Tabs>
            </Box>
            {condicionPago === 'CREDITO' ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField type="date" label="Fecha Límite" InputLabelProps={{ shrink: true }} fullWidth size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Monto a Crédito" value={total.toFixed(2)} InputProps={{ readOnly: true }} fullWidth size="small" /></Grid>
              </Grid>
            ) : (
              <Box>
                {pagos.map((pago, index) => {
                  const requiereReferencia = metodosPago.find(m => m.id === pago.metodo_id)?.requiere_referencia;
                  return (
                    <Box key={pago.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: requiereReferencia ? 1 : 0 }}>
                        <FormControl sx={{ flexGrow: 1 }} size="small">
                          <Select 
                            value={pago.metodo_id || ''} 
                            onChange={(e) => {
                              const newPagos = [...pagos];
                              newPagos[index].metodo_id = e.target.value;
                              setPagos(newPagos);
                            }}
                          >
                            {metodosPago.map((metodo) => (
                              <MenuItem key={metodo.id} value={metodo.id}>{metodo.nombre}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField 
                          size="small" 
                          value={pago.monto} 
                          onChange={(e) => {
                            const newPagos = [...pagos];
                            newPagos[index].monto = e.target.value;
                            setPagos(newPagos);
                          }}
                          sx={{ width: 120 }} 
                          inputProps={{ style: { textAlign: 'right' }, type: 'number', step: '0.01' }} 
                        />
                        <IconButton 
                          color="error"
                          onClick={() => {
                            if (pagos.length > 1) {
                              setPagos(pagos.filter(p => p.id !== pago.id));
                            }
                          }}
                          disabled={pagos.length === 1}
                        >
                          <X size={20} />
                        </IconButton>
                      </Box>
                      {requiereReferencia && (
                        <Box sx={{ mb: 1 }}>
                          <TextField 
                            size="small" 
                            fullWidth 
                            label="Número de Referencia" 
                            value={pago.referencia} 
                            onChange={(e) => {
                              const newPagos = [...pagos];
                              newPagos[index].referencia = e.target.value;
                              setPagos(newPagos);
                            }} 
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth 
                  sx={{ borderStyle: 'dashed' }}
                  onClick={() => {
                    setPagos([...pagos, { id: Date.now(), metodo_id: metodosPago[0]?.id || '', monto: 0, referencia: '' }]);
                  }}
                >
                  + Agregar método
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>

      {/* ABAJO: ITEMS DEL KIOSKO (SOLO LECTURA) */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Paper sx={{ p: 3, boxShadow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">ÍTEMS SELECCIONADOS EN KIOSKO</Typography>
              <Chip label="No editable aquí" size="small" />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3, maxHeight: 500, overflowY: 'auto' }}>
              {order.detalles && order.detalles.length > 0 ? (
                order.detalles.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">{item.repuesto_nombre || `Producto ${item.repuesto}`}</Typography>
                      <Typography variant="caption" color="textSecondary">Cantidad: {item.cantidad}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">S/ {(parseFloat(item.precio_unitario) * item.cantidad).toFixed(2)}</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 4 }}>No hay detalles.</Typography>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                  <Typography variant="body2">S/ {total.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">TOTAL A COBRAR</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">S/ {total.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" color="inherit" fullWidth size="large" onClick={onBack}>Cancelar</Button>
                  <Button variant="contained" color="primary" fullWidth size="large" onClick={handleConfirm} disabled={procesando}>
                    {procesando ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Venta'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
      </Box>
    </Box>
  );
};

// -------------------------------------------------------------
// VISTA 3: VENTA DIRECTA (TOTALMENTE EDITABLE)
// -------------------------------------------------------------
const PosDirectSale = ({ onBack, onComplete }) => {
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [procesando, setProcesando] = useState(false);
  const [carrito, setCarrito] = useState([]);
  
  const [metodosPago, setMetodosPago] = useState([]);
  const [pagos, setPagos] = useState([]);
  
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');

  const total = carrito.reduce((sum, item) => sum + (parseFloat(item.precio_lista || item.precio_cash) * item.cantidad), 0);

  useEffect(() => {
    const fetchDatosInit = async () => {
      try {
        const [resMetodos, resTipos] = await Promise.all([
          ventasService.getMetodosPago(),
          ventasService.getTiposComprobante()
        ]);
        const dataMetodos = resMetodos.results || resMetodos;
        setMetodosPago(dataMetodos);
        if (dataMetodos && dataMetodos.length > 0) {
          setPagos([{ id: Date.now(), metodo_id: dataMetodos[0].id, monto: total, referencia: '' }]);
        }
        
        const dataTipos = resTipos.results || resTipos;
        setTiposComprobante(dataTipos);
        if (dataTipos && dataTipos.length > 0) {
          setTipoComprobanteId(dataTipos[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchDatosInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pagos.length === 1 && total > 0) {
      setPagos(prev => [{ ...prev[0], monto: total }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosProductos, setResultadosProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const [dni, setDni] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  const buscarRepuestos = async (query) => {
    if (!query) {
      setResultadosProductos([]);
      return;
    }
    setCargandoProductos(true);
    try {
      const res = await inventarioService.getRepuestos({ search: query });
      setResultadosProductos(res.results || res);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoProductos(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    if (!producto) return;
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setBusquedaProducto('');
    setResultadosProductos([]);
  };

  const actualizarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCant = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: nuevaCant };
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const handleBuscarCliente = async () => {
    if (!dni || dni.length < 8) return;
    setBuscandoCliente(true);
    try {
      const res = await clienteService.consultarRuc(dni);
      setClienteNombre(res.nombre_razon_social || '');
      setClienteDireccion(res.direccion || '');
      setClienteTelefono(res.telefono || '');
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cliente encontrado', showConfirmButton: false, timer: 1500 });
    } catch (error) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'No encontrado en SUNAT/RENIEC', showConfirmButton: false, timer: 1500 });
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleConfirm = async () => {
    if (carrito.length === 0) {
      Swal.fire('Atención', 'El carrito está vacío', 'warning');
      return;
    }
    try {
      setProcesando(true);
      await new Promise(r => setTimeout(r, 800)); // Simulación
      Swal.fire('Venta Directa Procesada', 'La venta se ha registrado exitosamente.', 'success').then(() => onComplete());
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al procesar la venta', 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={onBack} color="inherit" sx={{ mr: 2 }}>Volver a Pedidos</Button>
        <Typography variant="h5" fontWeight="bold">Nueva Venta Directa</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LADO IZQUIERDO: CLIENTE Y COMPROBANTE */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>1</span>
              DATOS DEL CLIENTE
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="DNI / RUC" 
                  fullWidth 
                  size="small" 
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" color="primary" onClick={handleBuscarCliente} disabled={buscandoCliente}>
                          {buscandoCliente ? <CircularProgress size={16} /> : <Search size={18} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre completo" fullWidth value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Dirección" fullWidth value={clienteDireccion} onChange={(e) => setClienteDireccion(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" fullWidth value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} size="small" />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>2</span>
              COMPROBANTE
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Comprobante</InputLabel>
                  <Select 
                    value={tipoComprobanteId} 
                    label="Tipo de Comprobante"
                    onChange={e => setTipoComprobanteId(e.target.value)}
                  >
                    {tiposComprobante.map(tc => (
                      <MenuItem key={tc.id} value={tc.id}>{tc.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Serie</InputLabel>
                  <Select value="b001" label="Serie">
                    <MenuItem value="b001">B001 - Principal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* LADO DERECHO: CONDICION DE PAGO */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: 1, height: '100%', width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>3</span>
              CONDICIÓN DE PAGO
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={condicionPago} onChange={(e, v) => setCondicionPago(v)}>
                <Tab label="Al Contado" value="CONTADO" />
                <Tab label="Al Crédito" value="CREDITO" />
              </Tabs>
            </Box>
            {condicionPago === 'CREDITO' ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField type="date" label="Fecha Límite" InputLabelProps={{ shrink: true }} fullWidth size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Monto a Crédito" value={total.toFixed(2)} InputProps={{ readOnly: true }} fullWidth size="small" /></Grid>
              </Grid>
            ) : (
              <Box>
                {pagos.map((pago, index) => {
                  const requiereReferencia = metodosPago.find(m => m.id === pago.metodo_id)?.requiere_referencia;
                  return (
                    <Box key={pago.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: requiereReferencia ? 1 : 0 }}>
                        <FormControl sx={{ flexGrow: 1 }} size="small">
                          <Select 
                            value={pago.metodo_id || ''} 
                            onChange={(e) => {
                              const newPagos = [...pagos];
                              newPagos[index].metodo_id = e.target.value;
                              setPagos(newPagos);
                            }}
                          >
                            {metodosPago.map((metodo) => (
                              <MenuItem key={metodo.id} value={metodo.id}>{metodo.nombre}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField 
                          size="small" 
                          value={pago.monto} 
                          onChange={(e) => {
                            const newPagos = [...pagos];
                            newPagos[index].monto = e.target.value;
                            setPagos(newPagos);
                          }}
                          sx={{ width: 120 }} 
                          inputProps={{ style: { textAlign: 'right' }, type: 'number', step: '0.01' }} 
                        />
                        <IconButton 
                          color="error"
                          onClick={() => {
                            if (pagos.length > 1) {
                              setPagos(pagos.filter(p => p.id !== pago.id));
                            }
                          }}
                          disabled={pagos.length === 1}
                        >
                          <X size={20} />
                        </IconButton>
                      </Box>
                      {requiereReferencia && (
                        <Box sx={{ mb: 1 }}>
                          <TextField 
                            size="small" 
                            fullWidth 
                            label="Número de Referencia" 
                            value={pago.referencia} 
                            onChange={(e) => {
                              const newPagos = [...pagos];
                              newPagos[index].referencia = e.target.value;
                              setPagos(newPagos);
                            }} 
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth 
                  sx={{ borderStyle: 'dashed' }}
                  onClick={() => {
                    setPagos([...pagos, { id: Date.now(), metodo_id: metodosPago[0]?.id || '', monto: 0, referencia: '' }]);
                  }}
                >
                  + Agregar método
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>

      {/* ABAJO: CARRITO DE COMPRAS Y TOTALES */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>CARRITO DE COMPRAS</Typography>
            <Divider sx={{ mb: 3 }} />

            <Autocomplete
              sx={{ mb: 3 }}
              freeSolo
              options={resultadosProductos}
              getOptionLabel={(option) => typeof option === 'string' ? option : `${option.codigo || ''} - ${option.nombre}`}
              loading={cargandoProductos}
              onInputChange={(e, val) => {
                setBusquedaProducto(val);
                if (val.length >= 2) buscarRepuestos(val);
              }}
              onChange={(e, val) => {
                if (typeof val === 'object' && val !== null) agregarAlCarrito(val);
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Buscar repuesto..." 
                  size="small"
                  InputProps={{
                    ...(params.InputProps || {}),
                    startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                    endAdornment: (
                      <React.Fragment>
                        {cargandoProductos ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps?.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />

            <Box sx={{ overflowY: 'auto', maxHeight: 600, mb: 3 }}>
              {carrito.length > 0 ? (
                carrito.map((item) => {
                  const precio = parseFloat(item.precio_lista || item.precio_cash) || 0;
                  return (
                    <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">{item.nombre}</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">S/ {(precio * item.cantidad).toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="textSecondary">{item.codigo} | S/ {precio.toFixed(2)} c/u</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" onClick={() => actualizarCantidad(item.id, -1)} sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}><Minus size={14} /></IconButton>
                          <Typography variant="body2" sx={{ width: 24, textAlign: 'center' }}>{item.cantidad}</Typography>
                          <IconButton size="small" onClick={() => actualizarCantidad(item.id, 1)} sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}><Plus size={14} /></IconButton>
                          <IconButton size="small" color="error" onClick={() => eliminarDelCarrito(item.id)} sx={{ ml: 1 }}><Trash2 size={16} /></IconButton>
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ textAlign: 'center', py: 5, color: '#aaa', border: '1px solid #f0f0f0', borderRadius: 1 }}>
                  <ShoppingCart size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <Typography variant="body2">El carrito está vacío</Typography>
                  <Typography variant="caption">Busque y seleccione productos arriba</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                  <Typography variant="body2">S/ {total.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">Descuentos</Typography>
                  <Typography variant="body2">S/ 0.00</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">TOTAL A COBRAR</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">S/ {total.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" color="inherit" fullWidth size="large" onClick={onBack}>Cancelar</Button>
                  <Button variant="contained" color="primary" fullWidth size="large" onClick={handleConfirm} disabled={procesando || carrito.length === 0}>
                    {procesando ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Venta Directa'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
      </Box>
    </Box>
  );
};


// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export const POSPage = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDirectSale, setIsDirectSale] = useState(false);
  
  const handleComplete = () => {
    setSelectedOrder(null);
    setIsDirectSale(false);
  };

  if (isDirectSale) {
    return (
      <PosDirectSale 
        onBack={() => setIsDirectSale(false)} 
        onComplete={handleComplete} 
      />
    );
  }

  if (selectedOrder) {
    return (
      <PosCheckout 
        order={selectedOrder} 
        onBack={() => setSelectedOrder(null)} 
        onComplete={handleComplete} 
      />
    );
  }

  return (
    <PosOrderList 
      onSelectOrder={setSelectedOrder} 
      onNewDirectSale={() => setIsDirectSale(true)} 
    />
  );
};

export default POSPage;
