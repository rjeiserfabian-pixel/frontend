import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Grid, TextField, MenuItem, Select, InputLabel, 
  FormControl, Divider, Tabs, Tab, Autocomplete, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, TablePagination
} from '@mui/material';
import { 
  ArrowRight, Search, Check, X, ArrowLeft, Plus, Minus, Trash2,
  CreditCard, Banknote, Calendar, User, FileText, ShoppingCart, Printer, Eye
} from 'lucide-react';
import Swal from 'sweetalert2';
import { ventasService } from './../../ventas/services/ventasApi';
import { inventarioService } from './../../inventario/services/inventarioService';
import { clienteService } from './../../clientes/services/clienteService';
import api from '../../../core/api/axios';
import { useReactToPrint } from 'react-to-print';
import TicketImpresion from '../components/TicketImpresion';


import { useSucursal } from '../../../shared/contexts/SucursalContext';
// ...

// -------------------------------------------------------------
const PosOrderList = ({ onSelectOrder, onNewDirectSale, onPrint }) => {
  const [tabValue, setTabValue] = useState(0);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      let estadoFiltro = '';
      if (tabValue === 1) estadoFiltro = 'PENDIENTE';
      if (tabValue === 2) estadoFiltro = 'COMPLETADO';
      
      const response = await ventasService.getVentas({
        page: page + 1,
        page_size: rowsPerPage,
        estado: estadoFiltro
      });
      const data = response.results ? response.results : response;
      setVentas(data);
      setTotalCount(response.count || (response.results ? response.results.length : response.length) || 0);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      Swal.fire('Error', 'No se pudieron cargar los pedidos del Kiosko.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, tabValue]);

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
  
    const getSaleOrigin = (ticket_kiosko) => {
      if (!ticket_kiosko) return { text: 'Directa', color: 'info' };
      if (ticket_kiosko.startsWith('OT-')) return { text: 'Taller', color: 'primary' };
      if (ticket_kiosko.startsWith('TK-')) return { text: 'Kiosko', color: 'secondary' };
      return { text: 'Otro', color: 'default' };
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
        <Tabs value={tabValue} onChange={(e, v) => { setTabValue(v); setPage(0); }} indicatorColor="primary" textColor="primary" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tab label="Todos" />
          <Tab label="Pendientes" />
          <Tab label="Completados" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Origen</strong></TableCell>
                    <TableCell><strong>Referencia</strong></TableCell>
                    <TableCell><strong>Comprobante</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Vehículo</strong></TableCell>
                    <TableCell align="right"><strong>Total (S/)</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acción</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>No hay pedidos encontrados para esta categoría.</TableCell>
                    </TableRow>
                  ) : (
                    ventas.map((venta) => {
                      const origen = getSaleOrigin(venta.ticket_kiosko);
                      return (
                      <TableRow key={venta.id} hover sx={{ cursor: venta.estado === 'PRE_VENTA' ? 'pointer' : 'default', backgroundColor: venta.estado === 'PRE_VENTA' ? 'inherit' : '#fafafa' }}>
                        <TableCell>
                          <Chip label={origen.text} color={origen.color} size="small" sx={{ fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell>{venta.ticket_kiosko || '-'}</TableCell>
                        <TableCell><strong>{venta.serie_correlativo || 'Por emitir'}</strong></TableCell>
                        <TableCell>{formatearFecha(venta.creado_en)}</TableCell>
                        <TableCell>{venta.cliente_nombre || 'Cliente General'}</TableCell>
                        <TableCell>{venta.vehiculo_placa || '-'}</TableCell>
                        <TableCell align="right"><strong>{(parseFloat(venta.total) || 0).toFixed(2)}</strong></TableCell>
                        <TableCell align="center">{getStatusChip(venta.estado)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            title="Ver Detalles"
                            color="info"
                            onClick={() => setSelectedSaleDetails(venta)}
                          >
                            <Eye size={20} />
                          </IconButton>
                          {(venta.estado === 'PAGADA' || venta.estado === 'COMPLETADA') ? (
                            <IconButton
                              title="Reimprimir comprobante"
                              sx={{ color: '#7c3aed' }}
                              onClick={() => onPrint && onPrint(venta)}
                            >
                              <Printer size={20} />
                            </IconButton>
                          ) : (
                            <IconButton color="primary" disabled={venta.estado !== 'PRE_VENTA'} onClick={() => venta.estado === 'PRE_VENTA' && onSelectOrder(venta)}>
                              <ArrowRight size={20} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Filas por página:"
            />
          </>
        )}
      </Paper>

      {/* MODAL PARA VER DETALLES */}
      <Dialog open={Boolean(selectedSaleDetails)} onClose={() => setSelectedSaleDetails(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={20} />
          Detalles de la Venta #{selectedSaleDetails?.id}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>Datos del Cliente</Typography>
              <Typography variant="body2"><strong>Nombres:</strong> {selectedSaleDetails?.cliente_nombre || 'General'} {selectedSaleDetails?.cliente_apellidos && selectedSaleDetails.cliente_apellidos !== '-' ? selectedSaleDetails.cliente_apellidos : ''}</Typography>
              <Typography variant="body2"><strong>DNI/RUC:</strong> {selectedSaleDetails?.cliente_dni || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>Datos de la Venta</Typography>
              <Typography variant="body2"><strong>Estado:</strong> {selectedSaleDetails?.estado}</Typography>
              <Typography variant="body2"><strong>Fecha:</strong> {formatearFecha(selectedSaleDetails?.creado_en)}</Typography>
              <Typography variant="body2"><strong>Comprobante:</strong> {selectedSaleDetails?.tipo_comprobante_nombre || '-'} {selectedSaleDetails?.serie_correlativo || ''}</Typography>
            </Grid>
          </Grid>
          <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Ítems Comprados</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Producto</strong></TableCell>
                <TableCell align="center"><strong>Cant.</strong></TableCell>
                <TableCell align="right"><strong>P. Unit.</strong></TableCell>
                <TableCell align="right"><strong>Subtotal</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedSaleDetails?.detalles && selectedSaleDetails.detalles.length > 0 ? (
                selectedSaleDetails.detalles.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.descripcion_servicio || item.repuesto_nombre || `Producto ${item.repuesto || 'Adicional'}`}</TableCell>
                    <TableCell align="center">{item.cantidad}</TableCell>
                    <TableCell align="right">S/ {parseFloat(item.precio_unitario || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">S/ {(parseFloat(item.precio_unitario || 0) * item.cantidad).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 2 }}>No hay detalles disponibles para esta venta.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>Pagos y Totales</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                {selectedSaleDetails?.estado === 'AL_CREDITO' ? (
                   <Typography variant="body2"><strong>Condición de Pago:</strong> Crédito</Typography>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Condición de Pago:</strong> Contado</Typography>
                    {selectedSaleDetails?.pagos && selectedSaleDetails.pagos.length > 0 && (
                      <Box sx={{ pl: 1 }}>
                        {selectedSaleDetails.pagos.map((p, i) => (
                          <Typography key={i} variant="caption" display="block" color="textSecondary">
                            • {p.metodo_pago}: S/ {parseFloat(p.monto).toFixed(2)} {p.referencia ? `(Ref: ${p.referencia})` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={5} sx={{ textAlign: 'right' }}>
                <Typography variant="body2"><strong>Monto Recibido:</strong> S/ {parseFloat(selectedSaleDetails?.monto_recibido || 0).toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Vuelto:</strong> S/ {parseFloat(selectedSaleDetails?.vuelto || 0).toFixed(2)}</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, color: 'primary.main' }}>
                  Total: S/ {parseFloat(selectedSaleDetails?.total || 0).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSaleDetails(null)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
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

  const [seriesComprobante, setSeriesComprobante] = useState([]);
  const [serieId, setSerieId] = useState('');

  useEffect(() => {
    const fetchDatosInit = async () => {
      try {
        const [resMetodos, resTipos, resSeries] = await Promise.all([
          ventasService.getMetodosPago(),
          ventasService.getTiposComprobante(),
          ventasService.getSeriesComprobante()
        ]);
        const dataMetodos = resMetodos.results || resMetodos;
        setMetodosPago(dataMetodos);
        if (dataMetodos && dataMetodos.length > 0) {
          setPagos([{ id: Date.now(), metodo_id: dataMetodos[0].id, monto: total, referencia: '' }]);
        }
        
        const dataTipos = resTipos.results || resTipos;
        setTiposComprobante(dataTipos);
        
        const dataSeries = resSeries.results || resSeries;
        setSeriesComprobante(dataSeries);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDatosInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seriesFiltradas = seriesComprobante.filter(s => s.tipo_comprobante === tipoComprobanteId);
  const serieSeleccionada = seriesFiltradas.find(s => s.id === serieId);
  useEffect(() => {
    if (seriesFiltradas.length > 0) {
      if (!seriesFiltradas.find(s => s.id === serieId)) {
        setSerieId(seriesFiltradas[0].id);
      }
    } else {
      setSerieId('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoComprobanteId, seriesComprobante]);

  const handleConfirm = async () => {
    if (!tipoComprobanteId || !serieId) {
      Swal.fire('Atención', 'Debe seleccionar el Tipo de Comprobante y la Serie.', 'warning');
      return;
    }
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
        <Grid item xs={12} md={7}>
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
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
              <FormControl size="small" sx={{ flex: 1, minWidth: 90 }}>
                <InputLabel>Serie</InputLabel>
                <Select 
                  value={serieId} 
                  label="Serie"
                  onChange={e => setSerieId(e.target.value)}
                >
                  {seriesFiltradas.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.serie}</MenuItem>
                  ))}
                  {seriesFiltradas.length === 0 && <MenuItem value="" disabled>No hay series</MenuItem>}
                </Select>
              </FormControl>
              <TextField 
                size="small" 
                label="Correlativo" 
                value={serieSeleccionada ? String((serieSeleccionada.correlativo_actual || 0) + 1).padStart(8, '0') : ''}
                disabled
                sx={{ 
                  width: 120,
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                    fontWeight: "bold"
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* LADO DERECHO: PAGO */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
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
                {(() => {
                  const sumP = pagos.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
                  if (sumP > total) {
                    return (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 1, display: 'flex', justifyContent: 'space-between', border: '1px solid #c8e6c9' }}>
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">VUELTO AL CLIENTE:</Typography>
                        <Typography variant="subtitle1" color="success.main" fontWeight="bold">S/ {(sumP - total).toFixed(2)}</Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}
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
                      <Typography variant="body2" fontWeight="bold">{item.descripcion_servicio || item.repuesto_nombre || `Producto ${item.repuesto || 'Adicional'}`}</Typography>
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
// -------------------------------------------------------------
// VISTA 3: VENTA DIRECTA (TOTALMENTE EDITABLE)
// -------------------------------------------------------------
const PosDirectSale = ({ initialOrder, onBack, onComplete }) => {
  const { activeSucursalId } = useSucursal();
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [fechaLimite, setFechaLimite] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  const [procesando, setProcesando] = useState(false);
  const [carrito, setCarrito] = useState(() => {
    if (initialOrder && initialOrder.detalles) {
      return initialOrder.detalles.map(d => ({
        id: d.repuesto || `srv_${d.id}`,
        nombre: d.descripcion_servicio || d.repuesto_nombre || `Producto ${d.repuesto || 'Adicional'}`,
        codigo: d.repuesto_codigo || 'SRV',
        precio_venta: parseFloat(d.precio_unitario || 0),
        cantidad: parseFloat(d.cantidad || 1),
        tipo: d.repuesto ? 'REPUESTO' : 'SERVICIO',
        originalDetalleId: d.id
      }));
    }
    return [];
  });
  
  const [metodosPago, setMetodosPago] = useState([]);
  const [pagos, setPagos] = useState([]);
  
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');

  const [seriesComprobante, setSeriesComprobante] = useState([]);
  const [serieId, setSerieId] = useState('');

  const [todosAlmacenes, setTodosAlmacenes] = useState([]);
  const [almacenOrigenId, setAlmacenOrigenId] = useState('');

  const [moneda, setMoneda] = useState('PEN');
  const [tipoCambio, setTipoCambio] = useState(1.0000);
  const [cargandoTC, setCargandoTC] = useState(false);

  const total = carrito.reduce((sum, item) => sum + ((parseFloat(item.precio_venta) || 0) * item.cantidad), 0);
  const totalSinDescuento = carrito.reduce((sum, item) => sum + ((parseFloat(item.precio_lista) || parseFloat(item.precio_venta) || 0) * item.cantidad), 0);
  const totalDescuentos = totalSinDescuento - total;

  useEffect(() => {
    const fetchDatosInit = async () => {
      try {
        const [resMetodos, resTipos, resSeries, resAlmacenes] = await Promise.all([
          ventasService.getMetodosPago(),
          ventasService.getTiposComprobante(),
          ventasService.getSeriesComprobante(),
          api.get('/inventario/almacenes/')
        ]);
        const dataMetodos = resMetodos.results || resMetodos;
        setMetodosPago(dataMetodos);
        if (dataMetodos && dataMetodos.length > 0) {
          setPagos([{ id: Date.now(), metodo_id: dataMetodos[0].id, monto: total, referencia: '' }]);
        }
        
        const dataTipos = resTipos.results || resTipos;
        setTiposComprobante(dataTipos);

        const dataSeries = resSeries.results || resSeries;
        setSeriesComprobante(dataSeries);

        const dataAlmacenes = resAlmacenes.data.results || resAlmacenes.data;
        setTodosAlmacenes(Array.isArray(dataAlmacenes) ? dataAlmacenes : []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDatosInit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seriesFiltradas = seriesComprobante.filter(s => s.tipo_comprobante === tipoComprobanteId);
  const serieSeleccionada = seriesFiltradas.find(s => s.id === serieId);
  useEffect(() => {
    if (seriesFiltradas.length > 0) {
      if (!seriesFiltradas.find(s => s.id === serieId)) {
        setSerieId(seriesFiltradas[0].id);
      }
    } else {
      setSerieId('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoComprobanteId, seriesComprobante]);

  useEffect(() => {
    if (activeSucursalId && todosAlmacenes.length > 0) {
      const sucursalAlmacenes = todosAlmacenes.filter(a => String(a.sucursal) === String(activeSucursalId));
      if (sucursalAlmacenes.length > 0) {
        // Seleccionamos el primero por defecto (Almacén Principal de esta sucursal)
        setAlmacenOrigenId(sucursalAlmacenes[0].id);
      } else {
        setAlmacenOrigenId('');
      }
    }
  }, [activeSucursalId, todosAlmacenes]);

  useEffect(() => {
    if (pagos.length === 1 && total > 0) {
      setPagos(prev => [{ ...prev[0], monto: total }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    const fetchTC = async () => {
      if (moneda !== 'PEN') {
        setCargandoTC(true);
        try {
          const api = (await import('../../../core/api/axios')).default;
          const res = await api.get('/ventas/tipo-cambio/');
          if (res.data && res.data.venta) {
            setTipoCambio(parseFloat(res.data.venta));
          }
        } catch (error) {
          console.error("Error al obtener TC", error);
        } finally {
          setCargandoTC(false);
        }
      } else {
        setTipoCambio(1.0000);
      }
    };
    fetchTC();
  }, [moneda]);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosProductos, setResultadosProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const [clienteId, setClienteId] = useState(initialOrder?.cliente || null);
  const [dni, setDni] = useState(initialOrder?.cliente_dni || '');
  const [clienteNombre, setClienteNombre] = useState(initialOrder?.cliente_nombre || '');
  const [clienteApellidos, setClienteApellidos] = useState(initialOrder?.cliente_apellidos || '');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    if (initialOrder && initialOrder.cliente) {
      const fetchDatosCliente = async () => {
        try {
          const cli = await clienteService.obtener(initialOrder.cliente);
          if (cli) {
            setClienteDireccion(cli.direccion || '');
            setClienteTelefono(cli.telefono || '');
          }
        } catch (err) {
          console.error("Error al cargar detalles del cliente", err);
        }
      };
      fetchDatosCliente();
    }
  }, [initialOrder]);


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

  const getStockDisponible = (producto) => {
    if (!producto || !producto.inventario_stock) return producto?.stock_total_disponible || 0;
    const selectedAlmacen = todosAlmacenes.find(a => a.id === almacenOrigenId);
    if (!selectedAlmacen) return 0;
    // Sumar el stock de todas las ubicaciones dentro de ese almacén
    const stockEnAlmacen = producto.inventario_stock
      .filter(s => s.almacen_nombre === selectedAlmacen.nombre)
      .reduce((sum, s) => sum + parseFloat(s.stock_disponible || 0), 0);
    return stockEnAlmacen;
  };

  const agregarAlCarrito = (producto) => {
    if (!producto) return;
    
    // Validar si el producto está agotado en el almacén seleccionado
    const stockReal = getStockDisponible(producto);
    if (stockReal <= 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Producto agotado en este almacén', showConfirmButton: false, timer: 2500 });
      return;
    }
    
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad + 1 > stockReal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: `Solo hay ${stockReal} unidades disponibles`, showConfirmButton: false, timer: 2500 });
        return;
      }
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1, stock_maximo: stockReal } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1, precio_venta: parseFloat(producto.precio_lista || producto.precio_cash || 0), stock_maximo: stockReal }]);
    }
    setBusquedaProducto('');
    setResultadosProductos([]);
  };

  const actualizarPrecioItem = (id, nuevoPrecioStr) => {
    let nuevoPrecio = parseFloat(nuevoPrecioStr);
    if (isNaN(nuevoPrecio)) nuevoPrecio = 0;
    
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        let minimo = parseFloat(item.precio_lista || 0);
        const pMayor = parseFloat(item.precio_por_mayor || 0);
        const pCash = parseFloat(item.precio_cash || 0);
        const pLista = parseFloat(item.precio_lista || 0);
        
        if (pMayor > 0) minimo = pMayor;
        else if (pCash > 0) minimo = pCash;
        else if (pLista > 0) minimo = pLista;

        if (nuevoPrecio < minimo) {
          nuevoPrecio = minimo;
          Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: `Precio mínimo permitido: S/ ${minimo.toFixed(2)}`, showConfirmButton: false, timer: 2500 });
        }
        
        return { ...item, precio_venta: nuevoPrecio };
      }
      return item;
    }));
  };

  const actualizarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const step = item.unidad_medida_permite_decimales ? 0.1 : 1;
        const nuevaCant = Math.max(step, item.cantidad + (delta > 0 ? step : -step));
        
        if (item.stock_maximo !== undefined && nuevaCant > item.stock_maximo) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: `Solo hay ${item.stock_maximo} disponibles`, showConfirmButton: false, timer: 2500 });
          return { ...item, cantidad: item.stock_maximo };
        }
        
        return { ...item, cantidad: Number(nuevaCant.toFixed(2)) };
      }
      return item;
    }));
  };

  const actualizarCantidadDirecta = (id, val) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        let cant = parseFloat(val);
        if (isNaN(cant) || cant <= 0) cant = item.unidad_medida_permite_decimales ? 0.1 : 1;
        if (!item.unidad_medida_permite_decimales) cant = Math.floor(cant);
        
        if (item.stock_maximo !== undefined && cant > item.stock_maximo) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: `Solo hay ${item.stock_maximo} disponibles`, showConfirmButton: false, timer: 2500 });
          cant = item.stock_maximo;
        }
        
        return { ...item, cantidad: cant };
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
      let res;
      if (dni.length === 8) {
        res = await clienteService.consultarDni(dni);
      } else {
        res = await clienteService.consultarRuc(dni);
      }
      
      if (res.origen === 'local') {
        setClienteId(res.data.id);
        setClienteNombre(res.data.nombres || '');
        setClienteApellidos(res.data.apellidos || '-');
        setClienteDireccion(res.data.direccion || '');
        setClienteTelefono(res.data.telefono || '');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cliente cargado de BD', showConfirmButton: false, timer: 1500 });
      } else {
        setClienteId(null); // Nuevo cliente
        if (dni.length === 11) {
          setClienteNombre(res.data.razon_social || res.data.nombre_o_razon_social || '');
          setClienteApellidos('-');
        } else {
          setClienteNombre(res.data.nombres || '');
          const paterno = res.data.apellido_paterno || '';
          const materno = res.data.apellido_materno || '';
          setClienteApellidos(`${paterno} ${materno}`.trim());
        }
        setClienteDireccion(res.data.direccion || '');
        setClienteTelefono(''); // Para que lo llene el usuario
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Datos obtenidos de RENIEC/SUNAT. Complete los campos restantes.', showConfirmButton: false, timer: 3000 });
      }
    } catch (error) {
      setClienteId(null);
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'No encontrado. Deberá llenarlo manualmente.', showConfirmButton: false, timer: 2000 });
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleConfirm = async () => {
    if (carrito.length === 0) {
      Swal.fire('Atención', 'El carrito está vacío', 'warning');
      return;
    }
    if (!tipoComprobanteId || !serieId) {
      Swal.fire('Atención', 'Debe seleccionar el Tipo de Comprobante y la Serie.', 'warning');
      return;
    }
    if (!dni || !clienteNombre) {
      Swal.fire('Atención', 'Debe ingresar al menos el DNI/RUC y los Nombres del cliente.', 'warning');
      return;
    }

    if (!activeSucursalId) {
      Swal.fire('Atención', 'Seleccione una sucursal en la parte superior antes de continuar.', 'warning');
      return;
    }

    // Verificar que haya una sesión de caja abierta
    const sesionStr = localStorage.getItem('sesion_caja_activa');
    const sesionActiva = sesionStr ? JSON.parse(sesionStr) : null;
    if (!sesionActiva?.id) {
      Swal.fire('Caja Cerrada', 'Debe aperturar su caja en "Gestión de Caja" antes de procesar una venta.', 'warning');
      return;
    }

      let pagosFinales = pagos;
      let montoRecibido = 0;
      let vuelto = 0;

      if (condicionPago === 'CONTADO') {
        const sumPagos = pagos.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        if (sumPagos < total - 0.01) {
          Swal.fire('Atención', `El monto pagado (S/ ${sumPagos.toFixed(2)}) es menor al total de la venta (S/ ${total.toFixed(2)}).`, 'warning');
          return;
        }

        montoRecibido = sumPagos;
        vuelto = Math.max(0, sumPagos - total);

        if (vuelto > 0) {
          let vueltoRestante = vuelto;
          pagosFinales = pagos.map(p => {
            const montoOriginal = parseFloat(p.monto) || 0;
            if (vueltoRestante > 0 && montoOriginal > 0) {
              const restar = Math.min(montoOriginal, vueltoRestante);
              vueltoRestante -= restar;
              return { ...p, monto: (montoOriginal - restar).toFixed(2) };
            }
            return { ...p };
          });
        }
      }

    try {
      setProcesando(true);
      
      let finalClienteId = clienteId;
      if (!finalClienteId) {
        // 1. Intentar encontrar cliente existente por DNI antes de crear uno nuevo
        const existente = await clienteService.buscarPorDni(dni);
        if (existente) {
          finalClienteId = existente.id;
          setClienteId(finalClienteId);
          // Actualizar datos si el usuario los llenó o editó
          try {
            await clienteService.actualizar(finalClienteId, { dni, nombres: clienteNombre, apellidos: clienteApellidos || '-', direccion: clienteDireccion, telefono: clienteTelefono, email: existente.email || '' });
          } catch(e) {}
        } else {
          // 2. Solo crear si no existe
          const nuevoCliente = {
            dni: dni,
            nombres: clienteNombre,
            apellidos: dni.length === 11 ? '-' : (clienteApellidos || '-'),
            direccion: clienteDireccion,
            telefono: clienteTelefono,
            email: ''
          };
          const resCli = await clienteService.crear(nuevoCliente);
          finalClienteId = resCli.id;
          setClienteId(finalClienteId);
        }
      } else {
        // Cliente ya existe (ej. viene del Kiosko o se buscó). Actualizar si editó la info.
        try {
          await clienteService.actualizar(finalClienteId, { dni, nombres: clienteNombre, apellidos: clienteApellidos || '-', direccion: clienteDireccion, telefono: clienteTelefono, email: '' });
        } catch (e) { console.error("Error al actualizar cliente", e); }
      }

      const payloadVenta = {
        venta_id: initialOrder?.id || undefined,
        sucursal_id: parseInt(activeSucursalId, 10),
        cliente_id: finalClienteId,
        tipo_comprobante_id: tipoComprobanteId,
        serie_id: serieId,
        condicion_pago: condicionPago,
        fecha_limite: condicionPago === 'CREDITO' ? fechaLimite : null,
        almacen_origen_id: almacenOrigenId || null,
        sesion_caja_id: sesionActiva.id,
        detalles: carrito.map(item => ({
          repuesto_id: item.id,
          cantidad: item.cantidad,
          precio_venta: parseFloat(item.precio_venta) || 0
        })),
        pagos: pagosFinales,
          monto_recibido: montoRecibido,
          vuelto: vuelto,
        moneda: moneda,
        tipo_cambio: tipoCambio
      };

      console.log('Enviando venta con payload:', payloadVenta);

      // Conexión real al backend
      await api.post('/ventas/transacciones/directa/', payloadVenta);
      
      Swal.fire('Venta Directa Procesada', 'La venta se ha registrado exitosamente en la base de datos.', 'success').then(() => onComplete());
    } catch (error) {
      console.error(error);
      const backendError = error.response?.data?.error;
      const errorMsg = backendError || 'Hubo un problema al procesar la venta o registrar el cliente.';
      Swal.fire('Error', errorMsg, 'error');
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
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3, boxShadow: 1, width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>1</span>
              DATOS DEL CLIENTE
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField 
                  label="DNI / RUC" 
                  fullWidth 
                  size="small" 
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
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
              <Grid item xs={12} sm={4}>
                <TextField label={dni.length === 11 ? "Razón Social" : "Nombres"} fullWidth value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Apellidos" fullWidth value={clienteApellidos} onChange={(e) => setClienteApellidos(e.target.value)} size="small" disabled={dni.length === 11} />
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
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
              <FormControl size="small" sx={{ flex: 1, minWidth: 90 }}>
                <InputLabel>Serie</InputLabel>
                <Select 
                  value={serieId} 
                  label="Serie"
                  onChange={e => setSerieId(e.target.value)}
                >
                  {seriesFiltradas.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.serie}</MenuItem>
                  ))}
                  {seriesFiltradas.length === 0 && <MenuItem value="" disabled>No hay series</MenuItem>}
                </Select>
              </FormControl>
              <TextField 
                size="small" 
                label="Correlativo" 
                value={serieSeleccionada ? String((serieSeleccionada.correlativo_actual || 0) + 1).padStart(8, '0') : ''}
                disabled
                sx={{ 
                  width: 120,
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                    fontWeight: "bold"
                  }
                }}
              />
              
              <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
                <InputLabel>Almacén de Origen</InputLabel>
                <Select
                  value={almacenOrigenId}
                  label="Almacén de Origen"
                  onChange={e => setAlmacenOrigenId(e.target.value)}
                  disabled={!activeSucursalId}
                >
                  {todosAlmacenes.filter(a => String(a.sucursal) === String(activeSucursalId)).map(a => (
                    <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                  ))}
                  {todosAlmacenes.filter(a => String(a.sucursal) === String(activeSucursalId)).length === 0 && (
                    <MenuItem value="" disabled>No hay almacenes</MenuItem>
                  )}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>
        {/* LADO DERECHO: CONDICION DE PAGO Y MONEDA */}
        <Grid item xs={12} md={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={12}>
              <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
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
                <Grid item xs={12} sm={6}>
                  <TextField 
                    type="date" 
                    label="Fecha Límite" 
                    InputLabelProps={{ shrink: true }} 
                    fullWidth 
                    size="small" 
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                  />
                </Grid>
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
                {(() => {
                  const sumP = pagos.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
                  if (sumP > total) {
                    return (
                      <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 1, display: 'flex', justifyContent: 'space-between', border: '1px solid #c8e6c9' }}>
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">VUELTO AL CLIENTE:</Typography>
                        <Typography variant="subtitle1" color="success.main" fontWeight="bold">S/ {(sumP - total).toFixed(2)}</Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}
              </Box>
            )}
              </Paper>
            </Grid>

            {/* SECCION 4: MONEDA Y TIPO DE CAMBIO */}
            <Grid item xs={12} sm={6} md={12}>
              <Paper sx={{ p: 3, boxShadow: 1, width: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>4</span>
                  MONEDA Y TIPO DE CAMBIO
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
                    <InputLabel>Moneda</InputLabel>
                    <Select 
                      value={moneda} 
                      label="Moneda"
                      onChange={e => setMoneda(e.target.value)}
                    >
                      <MenuItem value="PEN">Soles (S/)</MenuItem>
                      <MenuItem value="USD">Dólares ($)</MenuItem>
                      <MenuItem value="EUR">Euros (€)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField 
                    size="small" 
                    label="Tipo de Cambio (TC)" 
                    value={tipoCambio.toFixed(4)}
                    disabled={moneda === 'PEN'}
                    onChange={e => setTipoCambio(parseFloat(e.target.value) || 0)}
                    sx={{ width: 150 }}
                    InputProps={{
                      endAdornment: cargandoTC ? (
                        <InputAdornment position="end">
                          <CircularProgress size={16} />
                        </InputAdornment>
                      ) : null
                    }}
                    helperText={moneda === 'PEN' ? "No aplica" : "Obtenido de SUNAT"}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
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
              getOptionDisabled={(option) => getStockDisponible(option) <= 0}
              renderOption={(props, option) => {
                const stockOption = getStockDisponible(option);
                const agotado = stockOption <= 0;
                // Para evitar errores en Material UI al pasar key y otros props
                const { key, ...otherProps } = props;
                return (
                  <li key={key || option.id} {...otherProps} style={{ color: agotado ? '#aaa' : 'inherit', cursor: agotado ? 'not-allowed' : 'pointer', opacity: agotado ? 0.7 : 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">{option.codigo} - {option.nombre}</Typography>
                      {agotado ? (
                        <Typography variant="caption" color="error" fontWeight="bold">AGOTADO</Typography>
                      ) : (
                        <Typography variant="caption" color="textSecondary" fontWeight="bold">Stock disponible: {stockOption}</Typography>
                      )}
                    </Box>
                  </li>
                );
              }}
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
                  const pLista = parseFloat(item.precio_lista || 0);
                  const pCash = parseFloat(item.precio_cash || 0);
                  const pMayor = parseFloat(item.precio_por_mayor || 0);
                  const precioVenta = parseFloat(item.precio_venta || 0);
                  
                  return (
                    <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0', '&:last-child': { mb: 0, pb: 0, borderBottom: 'none' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{item.codigo} - {item.nombre}</Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                            Ref: {pLista > 0 && `Lista S/ ${pLista.toFixed(2)} `}{pCash > 0 && `| Cash S/ ${pCash.toFixed(2)} `}{pMayor > 0 && `| Mayor S/ ${pMayor.toFixed(2)}`}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>
                          S/ {(precioVenta * item.cantidad).toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField 
                            size="small" 
                            variant="outlined"
                            type="number"
                            value={item.precio_venta}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCarrito(carrito.map(x => x.id === item.id ? { ...x, precio_venta: val } : x));
                            }}
                            onBlur={(e) => actualizarPrecioItem(item.id, e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start" sx={{ ml: 0.5, mr: 0.5 }}>S/</InputAdornment>,
                            }}
                            sx={{ width: 110, '& .MuiInputBase-input': { p: '4px 8px', fontSize: '0.85rem' } }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" onClick={() => actualizarCantidad(item.id, -1)} sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}><Minus size={14} /></IconButton>
                          <TextField
                            size="small"
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCarrito(carrito.map(x => x.id === item.id ? { ...x, cantidad: val } : x));
                            }}
                            onBlur={(e) => actualizarCantidadDirecta(item.id, e.target.value)}
                            inputProps={{
                              step: item.unidad_medida_permite_decimales ? "0.1" : "1",
                              min: item.unidad_medida_permite_decimales ? "0.1" : "1",
                              style: { textAlign: 'center', padding: '4px', width: '40px' }
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { pr: 0, pl: 0 } }}
                          />
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
                  <Typography variant="body2" color="error">S/ {totalDescuentos > 0 ? totalDescuentos.toFixed(2) : '0.00'}</Typography>
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
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null);
  const printRef = React.useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setVentaParaImprimir(null),
    documentTitle: 'Comprobante',
  });

  const triggerPrint = (venta) => {
    setVentaParaImprimir(venta);
  };

  React.useEffect(() => {
    if (ventaParaImprimir) {
      // Wait for React to render TicketImpresion before triggering print
      const timer = setTimeout(() => {
        if (printRef.current) {
          handlePrint();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaParaImprimir]);

  const handleCompleteWithPrint = (ventaRes) => {
    handleComplete();
    if (ventaRes && ventaRes.id) {
      triggerPrint(ventaRes);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDirectSale, setIsDirectSale] = useState(false);
  
  useEffect(() => {
    if (location.state?.autoOpenVentaId && !selectedOrder) {
      const fetchVenta = async () => {
        try {
          const response = await ventasService.getVentas();
          const ventasList = response.results ? response.results : response;
          const venta = ventasList.find(v => v.id === location.state.autoOpenVentaId);
          if (venta) {
            setSelectedOrder(venta);
            // Limpiar el state de react-router para que no vuelva a abrirse si el usuario le da a Cancelar o termina
            navigate(location.pathname, { replace: true, state: {} });
          }
        } catch (error) {
          console.error("Error fetching venta para auto-open:", error);
        }
      };
      fetchVenta();
    }
  }, [location.state, selectedOrder, navigate, location.pathname]);

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
      <PosDirectSale 
        initialOrder={selectedOrder}
        onBack={() => setSelectedOrder(null)} 
        onComplete={handleComplete} 
      />
    );
  }

  return (
    <>
      <PosOrderList 
        onSelectOrder={setSelectedOrder} 
        onNewDirectSale={() => setIsDirectSale(true)}
        onPrint={triggerPrint}
      />
      {/* TicketImpresion siempre renderizado para que printRef esté siempre disponible */}
      <div style={{ display: 'none' }}>
        <TicketImpresion ref={printRef} venta={ventaParaImprimir} />
      </div>
    </>
  );
};

export default POSPage;
