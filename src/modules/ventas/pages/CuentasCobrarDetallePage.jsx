import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Grid, Card, CardContent, Divider
} from '@mui/material';
import { ArrowLeft, DollarSign, X, Plus, Trash2, Wrench, FileText, Eye, Printer, Wallet, CheckCircle, Calendar, History, CreditCard, Banknote, User, Receipt, Package, Phone, MapPin } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import TicketReciboAbono from '../components/TicketReciboAbono';

// Helper de Iconos de Método
const getMetodoIcon = (metodo) => {
  const m = (metodo || '').toLowerCase();
  if (m.includes('yape') || m.includes('plin')) {
    return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Banknote size={16} /></Box>;
  }
  if (m.includes('tarjeta') || m.includes('visa') || m.includes('mastercard')) {
    return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={16} /></Box>;
  }
  return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={16} /></Box>;
};

// Tarjeta de información con encabezado a color, usada en Cliente/Venta/Repuestos
const InfoCard = ({ icon, title, accent, children }) => (
  <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
      <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${accent}1A`, color: accent, display: 'flex' }}>
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={800} color="#1e293b">{title}</Typography>
    </Box>
    {children}
  </Paper>
);

// Fila etiqueta/valor usada dentro de InfoCard
const InfoField = ({ icon, label, children }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
    {icon && <Box sx={{ color: '#94a3b8', mt: 0.3 }}>{icon}</Box>}
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Typography>
      <Typography variant="body1" fontWeight={700} sx={{ wordBreak: 'break-word', color: '#1e293b' }}>{children}</Typography>
    </Box>
  </Box>
);

export default function CuentasCobrarDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cuenta, setCuenta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog de Pago
  const [openPago, setOpenPago] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState(null);

  // Dialog de Historial
  const [openHistorial, setOpenHistorial] = useState(false);
  const [cuotaHistorial, setCuotaHistorial] = useState(null);

  // Impresión
  const printRef = React.useRef();
  const [abonoParaImprimir, setAbonoParaImprimir] = useState(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => setAbonoParaImprimir(null),
  });
  
  const getPagosAgrupados = (pagos) => {
    if (!pagos) return [];
    const agrupados = {};
    pagos.forEach(pago => {
      const opId = pago.operacion_id || pago.id;
      if (!agrupados[opId]) {
        agrupados[opId] = { ...pago, subpagos: [pago] };
      } else {
        agrupados[opId].monto = Number(agrupados[opId].monto) + Number(pago.monto);
        agrupados[opId].metodo_pago_nombre = 'Múltiple';
        agrupados[opId].subpagos.push(pago);
      }
    });
    return Object.values(agrupados).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago));
  };
  
  // Múltiples Pagos
  const [metodosPago, setMetodosPago] = useState([]);
  const [pagosActuales, setPagosActuales] = useState([]);
  const [montoIngreso, setMontoIngreso] = useState('');
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('');
  const [referencia, setReferencia] = useState('');

  const fetchCuentaDetalle = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas/cuentas-por-cobrar/${id}/`);
      setCuenta(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el detalle de la cuenta.', 'error');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetodos = async () => {
    try {
      const res = await api.get('/ventas/metodos-pago/');
      setMetodosPago(res.data.results || res.data);
      if (res.data.length > 0) {
        setMetodoSeleccionado(res.data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCuentaDetalle();
    fetchMetodos();
  }, [id]);

  const handleOpenPago = (cuota) => {
    setSelectedCuota(cuota);
    setPagosActuales([]);
    setMontoIngreso(cuota.saldo_pendiente);
    setReferencia('');
    if (metodosPago.length > 0) {
      setMetodoSeleccionado(metodosPago[0].id);
    }
    setOpenPago(true);
  };

  const handleClosePago = () => {
    setOpenPago(false);
    setSelectedCuota(null);
    setPagosActuales([]);
    setReferencia('');
  };

  const handleOpenHistorial = (cuota) => {
    setCuotaHistorial(cuota);
    setOpenHistorial(true);
  };

  const handleCloseHistorial = () => {
    setOpenHistorial(false);
    setCuotaHistorial(null);
  };

  const handlePrintAbono = (pago, cuota = null) => {
    setAbonoParaImprimir(pago);
    if (cuota) {
      setCuotaHistorial(cuota);
    }
    setTimeout(() => {
      if (printRef.current) {
        handlePrint();
      }
    }, 100);
  };

  const agregarPago = () => {
    if (!montoIngreso || isNaN(montoIngreso) || Number(montoIngreso) <= 0) {
      Swal.fire('Error', 'Ingrese un monto válido', 'warning');
      return;
    }
    if (!metodoSeleccionado) {
      Swal.fire('Error', 'Seleccione un método de pago', 'warning');
      return;
    }
    
    const metodoInfo = metodosPago.find(m => m.id === metodoSeleccionado);
    if (metodoInfo.requiere_referencia && !referencia.trim()) {
      Swal.fire('Error', 'Debe ingresar el número de referencia para este método de pago.', 'warning');
      return;
    }

    setPagosActuales([
      ...pagosActuales,
      {
        metodo_pago_id: metodoSeleccionado,
        metodo_nombre: metodoInfo.nombre,
        monto: Number(montoIngreso),
        referencia: referencia.trim()
      }
    ]);
    
    setReferencia('');

    // Auto calcular restante
    const totalActual = pagosActuales.reduce((acc, p) => acc + p.monto, 0) + Number(montoIngreso);
    const restante = Number(selectedCuota.saldo_pendiente) - totalActual;
    if (restante > 0) {
      setMontoIngreso(restante.toFixed(2));
    } else {
      setMontoIngreso('');
    }
  };

  const quitarPago = (index) => {
    const nuevos = [...pagosActuales];
    nuevos.splice(index, 1);
    setPagosActuales(nuevos);
  };

  const totalPorPagar = pagosActuales.reduce((acc, p) => acc + p.monto, 0);
  const restanteTotal = selectedCuota ? Number(selectedCuota.saldo_pendiente) - totalPorPagar : 0;

  const confirmarPago = async () => {
    if (pagosActuales.length === 0) {
      Swal.fire('Atención', 'Agregue al menos un método de pago', 'warning');
      return;
    }

    if (totalPorPagar > Number(selectedCuota.saldo_pendiente)) {
      Swal.fire('Error', 'El monto supera el saldo pendiente de la cuota', 'error');
      return;
    }

    try {
      const response = await api.post(`/ventas/cuentas-por-cobrar/pagar-cuota/${selectedCuota.id}/`, {
        pagos: pagosActuales
      });
      Swal.fire('Éxito', 'Pago registrado correctamente', 'success');
      const nuevosPagos = response.data.pagos || [];
      const agrupadosNuevos = getPagosAgrupados(nuevosPagos);
      const pagoImprimir = agrupadosNuevos.length > 0 ? agrupadosNuevos[0] : null;
      const cuotaActual = selectedCuota; // Guardamos la cuota actual antes de cerrar el modal

      handleClosePago();
      fetchCuentaDetalle();
      
      Swal.fire({
        title: 'Pago Exitoso',
        text: '¿Desea imprimir el recibo ahora?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Sí, Imprimir',
        cancelButtonText: 'Más tarde'
      }).then((result) => {
        if (result.isConfirmed && pagoImprimir) {
            handlePrintAbono(pagoImprimir, cuotaActual);
        }
      });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Ocurrió un error al procesar el pago.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const getEstadoChip = (cuota) => {
    // El estado real de CuotaCredito es PENDIENTE/PARCIAL/PAGADA/ATRASADA
    // (nunca "PAGADO"/"ATRASADO", esos son los de CuentaPorCobrar) — antes
    // este switch comparaba contra los valores equivocados y nunca hacía
    // match salvo PENDIENTE. Además, como nada marca ATRASADA en la BD,
    // "esta_vencida" (calculado por el backend por fecha) tiene prioridad.
    if (cuota.estado !== 'PAGADA' && cuota.esta_vencida) {
      return <Chip label="Atrasada" color="error" size="small" />;
    }
    switch (cuota.estado) {
      case 'PENDIENTE': return <Chip label="Pendiente" color="warning" size="small" />;
      case 'PARCIAL': return <Chip label="Pago Parcial" color="info" size="small" />;
      case 'PAGADA': return <Chip label="Pagada" color="success" size="small" />;
      default: return <Chip label={cuota.estado} size="small" />;
    }
  };

  if (loading || !cuenta) {
    return <Typography sx={{ p: 3 }}>Cargando detalle...</Typography>;
  }

  const repuestos = cuenta.venta_detalles ? cuenta.venta_detalles.filter(d => d.repuesto) : [];
  const servicios = cuenta.venta_detalles ? cuenta.venta_detalles.filter(d => !d.repuesto) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: 4, color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,58,138,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
            <ArrowLeft />
          </IconButton>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Wallet size={24} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              Cuenta {cuenta.codigo_credito}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {cuenta.cliente_nombre} {cuenta.cliente_apellidos}
            </Typography>
          </Box>
          {cuenta.esta_atrasada && cuenta.estado !== 'PAGADO' && (
            <Chip label="Atrasado" color="error" size="small" sx={{ fontWeight: 700, ml: 1 }} />
          )}
        </Box>
        <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>Saldo pendiente</Typography>
          <Typography variant="h6" fontWeight={800}>S/ {Number(cuenta.saldo_pendiente).toFixed(2)}</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sección: Datos del Cliente */}
        <Grid item xs={12} md={4}>
          <InfoCard icon={<User size={18} />} title="Datos del Cliente" accent="#2563eb">
            <InfoField icon={<User size={15} />} label="Nombre Completo">
              {cuenta.cliente_nombre} {cuenta.cliente_apellidos}
            </InfoField>
            <InfoField label="DNI">{cuenta.cliente_dni || 'N/A'}</InfoField>
            <InfoField icon={<Phone size={15} />} label="Teléfono">{cuenta.cliente_telefono || 'N/A'}</InfoField>
            <InfoField icon={<MapPin size={15} />} label="Dirección">{cuenta.cliente_direccion || 'N/A'}</InfoField>
          </InfoCard>
        </Grid>

        {/* Sección: Datos de Venta */}
        <Grid item xs={12} md={4}>
          <InfoCard icon={<Receipt size={18} />} title="Datos de la Venta" accent="#7c3aed">
            <InfoField label="Nro Comprobante">{cuenta.venta_serie || 'N/A'}</InfoField>
            <InfoField icon={<Calendar size={15} />} label="Fecha y Hora">
              {cuenta.venta_fecha ? new Date(cuenta.venta_fecha).toLocaleString() : 'N/A'}
            </InfoField>
            <InfoField label="Monto Financiado">S/ {Number(cuenta.monto_financiado).toFixed(2)}</InfoField>
            <Box sx={{ mt: 2.5, p: 1.8, borderRadius: 2, bgcolor: cuenta.saldo_pendiente > 0 ? '#fef2f2' : '#f0fdf4', border: '1px solid', borderColor: cuenta.saldo_pendiente > 0 ? '#fecaca' : '#bbf7d0' }}>
              <Typography variant="caption" sx={{ color: cuenta.saldo_pendiente > 0 ? '#991b1b' : '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                Saldo Pendiente Total
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: cuenta.saldo_pendiente > 0 ? '#dc2626' : '#16a34a' }}>
                S/ {Number(cuenta.saldo_pendiente).toFixed(2)}
              </Typography>
            </Box>
          </InfoCard>
        </Grid>

        {/* Sección: Repuestos */}
        <Grid item xs={12} md={4}>
          <InfoCard icon={<Package size={18} />} title="Repuestos" accent="#16a34a">
            {repuestos.length > 0 ? (
              repuestos.map((detalle, index) => (
                <Box
                  key={detalle.id}
                  sx={{
                    mb: index !== repuestos.length - 1 ? 2 : 0,
                    pb: index !== repuestos.length - 1 ? 2 : 0,
                    borderBottom: index !== repuestos.length - 1 ? '1px dashed #e2e8f0' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Wrench size={15} color="#16a34a" />
                    <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>
                      {detalle.repuesto_nombre}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {detalle.cantidad} {detalle.repuesto_unidad_medida} × S/ {Number(detalle.precio_unitario).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#16a34a">
                      S/ {Number(detalle.subtotal_linea).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">No hay repuestos.</Typography>
            )}
          </InfoCard>
        </Grid>
      </Grid>

      {/* Sección: Servicios (Si existen) */}
      {servicios.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 1 }}>
            Servicios Realizados
          </Typography>
          <Grid container spacing={3}>
            {servicios.map((detalle) => (
              <Grid item xs={12} sm={6} md={4} key={detalle.id}>
                <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FileText size={18} color="#10b981" style={{ marginRight: 8 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                      {detalle.descripcion_servicio || 'Servicio General'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">Total:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>S/ {Number(detalle.subtotal_linea).toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Sección: Detalle de Cuotas */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Cronograma de Pagos (Cuotas)
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>Nro</strong></TableCell>
              <TableCell><strong>F. Vencimiento</strong></TableCell>
              <TableCell align="right"><strong>Monto Cuota</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acción</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cuenta.cuotas?.map((cuota) => {
              const [y, m, d] = (cuota.fecha_vencimiento || '').split('-');
              const fechaFormat = y ? `${d}/${m}/${y}` : '';
              return (
                <TableRow key={cuota.id}>
                  <TableCell>{cuota.numero_cuota}</TableCell>
                  <TableCell>{fechaFormat}</TableCell>
                  <TableCell align="right">S/ {Number(cuota.monto).toFixed(2)}</TableCell>
                  <TableCell align="right">S/ {Number(cuota.saldo_pendiente).toFixed(2)}</TableCell>
                  <TableCell align="center">{getEstadoChip(cuota)}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {cuota.estado !== 'PAGADA' && (
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<DollarSign size={16} />}
                        onClick={() => handleOpenPago(cuota)}
                      >
                        Cobrar
                      </Button>
                    )}
                    {(cuota.estado === 'PAGADA' || cuota.estado === 'PARCIAL' || (cuota.pagos && cuota.pagos.length > 0)) && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => handleOpenHistorial(cuota)}
                        title="Ver Historial de Pagos"
                        sx={{ minWidth: 40, px: 1 }}
                      >
                        <Eye size={18} />
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
            {(!cuenta.cuotas || cuenta.cuotas.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay cuotas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE PAGO MÚLTIPLE */}
      <Dialog open={openPago} onClose={handleClosePago} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: 'white', px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
              <DollarSign size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                Cobrar Cuota {selectedCuota?.numero_cuota}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Saldo pendiente: S/ {Number(selectedCuota?.saldo_pendiente).toFixed(2)}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClosePago} sx={{ color: 'white' }}>
            <X size={20} />
          </IconButton>
        </Box>
        <DialogContent sx={{ bgcolor: '#f8fafc', p: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
            <FormControl size="small" sx={{ flex: 2 }}>
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={metodoSeleccionado}
                label="Método de Pago"
                onChange={(e) => setMetodoSeleccionado(e.target.value)}
              >
                {metodosPago.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Monto"
              type="number"
              sx={{ flex: 1 }}
              value={montoIngreso}
              onChange={(e) => setMontoIngreso(e.target.value)}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            <Button 
              variant="outlined" 
              onClick={agregarPago}
              sx={{ height: 40, minWidth: '40px', p: 1 }}
            >
              <Plus size={20} />
            </Button>
          </Box>

          {metodosPago.find(m => m.id === metodoSeleccionado)?.requiere_referencia && (
            <Box sx={{ mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="Número de Referencia"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. Nro de Operación"
              />
            </Box>
          )}

          {pagosActuales.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Método</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="center" width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosActuales.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.metodo_nombre}</TableCell>
                      <TableCell>{p.referencia || '-'}</TableCell>
                      <TableCell align="right">S/ {p.monto.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => quitarPago(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} align="right"><strong>Total a Pagar:</strong></TableCell>
                    <TableCell align="right"><strong>S/ {totalPorPagar.toFixed(2)}</strong></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {restanteTotal > 0 && pagosActuales.length > 0 && (
            <Typography variant="body2" color="warning.main">
              Falta cobrar: S/ {restanteTotal.toFixed(2)}
            </Typography>
          )}
          {restanteTotal < 0 && (
            <Typography variant="body2" color="error.main">
              El monto ingresado excede el saldo de la cuota en S/ {Math.abs(restanteTotal).toFixed(2)}
            </Typography>
          )}

        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f8fafc', px: 3, py: 2 }}>
          <Button onClick={handleClosePago} variant="outlined" color="inherit">Cancelar</Button>
          <Button
            onClick={confirmarPago}
            variant="contained"
            color="success"
            disabled={pagosActuales.length === 0 || restanteTotal < 0}
            sx={{ fontWeight: 700 }}
          >
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE HISTORIAL DE ABONOS */}
      <Dialog 
        open={openHistorial} 
        onClose={handleCloseHistorial} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: '#f4f7fc', 
          } 
        }}
      >
        {/* Header Dark Blue */}
        <Box sx={{ 
          bgcolor: '#0f172a', 
          color: 'white', 
          pt: 3, 
          pb: 5, 
          px: 4,
          position: 'relative',
          backgroundImage: 'linear-gradient(to right, #0f172a, #1e293b)'
        }}>
          <IconButton 
            onClick={handleCloseHistorial} 
            sx={{ position: 'absolute', top: 16, right: 16, color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <X size={24} />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'rgba(59, 130, 246, 0.2)', 
              p: 1.2, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <Wallet size={28} color="#60a5fa" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">Historial de Pagos</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.2 }}>
                Detalle de los pagos realizados a la cuota {cuotaHistorial?.numero_cuota}
              </Typography>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: 4, pt: 0 }}>
          {/* Overlapping Card */}
          <Paper elevation={0} sx={{ 
            mt: -2, 
            mb: 4, 
            borderRadius: 3, 
            border: '1px solid #e2e8f0',
            position: 'relative',
            zIndex: 1,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflow: 'hidden',
          }}>
            {/* Left: Cuota */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: 3,
            }}>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box sx={{ 
                  bgcolor: '#eff6ff', 
                  color: '#3b82f6', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52
                }}>
                  <FileText size={24} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>COMPROBANTE / CUOTA</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2, mt: 0.5 }}>
                    {cuenta?.venta_serie || 'Sin comprobante'}
                  </Typography>
                  <Box display="flex" flexDirection="column" mt={1.5}>
                    <Typography variant="caption" color="text.secondary">Vencimiento:</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                      {cuotaHistorial?.fecha_vencimiento || '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Divider */}
            <Box sx={{ width: '1px', bgcolor: '#e2e8f0', my: 2 }} />

            {/* Right: Total Pagado */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: 3,
            }}>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Box sx={{ 
                  bgcolor: '#ecfdf5', 
                  color: '#10b981', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52
                }}>
                  <Wallet size={24} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>TOTAL PAGADO</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2, mt: 0.5 }}>
                    S/ {parseFloat((cuotaHistorial?.monto || 0) - (cuotaHistorial?.saldo_pendiente || 0)).toFixed(2)}
                  </Typography>
                  <Chip 
                    label={cuotaHistorial?.estado || 'PARCIAL'} 
                    size="small"
                    icon={<CheckCircle size={14} />}
                    sx={{ 
                      mt: 1.5,
                      bgcolor: cuotaHistorial?.estado === 'PAGADA' ? '#ecfdf5' : '#fff7ed',
                      color: cuotaHistorial?.estado === 'PAGADA' ? '#10b981' : '#ea580c',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: 'inherit' }
                    }} 
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Title */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <History size={22} color="#3b82f6" />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>
                Historial de Pagos
              </Typography>
            </Box>
            <Chip 
              label={`${cuotaHistorial?.pagos?.length || 0} registro${(cuotaHistorial?.pagos?.length || 0) !== 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600, px: 1 }}
            />
          </Box>

          {/* Table */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            {!cuotaHistorial?.pagos || cuotaHistorial.pagos.length === 0 ? (
              <Box p={6} textAlign="center">
                <Typography color="text.secondary" fontWeight={500}>No hay pagos registrados para esta cuota.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>FECHA</TableCell>
                      <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>MÉTODO</TableCell>
                      <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>MONTO</TableCell>
                      <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="right">ESTADO</TableCell>
                      <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="center">RECIBO</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPagosAgrupados(cuotaHistorial.pagos).map((pago) => (
                      <TableRow key={pago.operacion_id || pago.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Calendar size={18} color="#94a3b8" />
                            <Typography variant="body2" fontWeight={600} color="#334155">
                              {new Date(pago.fecha_pago).toLocaleDateString()} {new Date(pago.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            {getMetodoIcon(pago.metodo_pago_nombre)}
                            <Typography variant="body2" fontWeight={600} color="#334155">
                              {pago.subpagos && pago.subpagos.length > 1 ? 'Múltiple' : (pago.referencia ? `${pago.metodo_pago_nombre} (Op: ${pago.referencia})` : pago.metodo_pago_nombre)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                           <Typography variant="body2" fontWeight={700} sx={{ color: '#10b981' }}>
                              S/ {parseFloat(pago.monto).toFixed(2)}
                           </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label="Pagado" 
                            size="small"
                            icon={<CheckCircle size={14} />}
                            sx={{ 
                              bgcolor: '#ecfdf5',
                              color: '#10b981',
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: 'inherit' }
                            }} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handlePrintAbono(pago)}
                            title="Imprimir Recibo"
                            sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                          >
                            <Printer size={16} color="#3b82f6" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, pb: 4, px: 4 }}>
          <Button 
            onClick={handleCloseHistorial} 
            variant="outlined" 
            color="inherit"
            startIcon={<X size={18} />}
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              borderColor: '#cbd5e1',
              color: '#475569',
              px: 3,
              '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Invisible para Impresión */}
      <Box sx={{ display: 'none' }}>
        <TicketReciboAbono 
          ref={printRef} 
          pagoAbono={abonoParaImprimir} 
          cuenta={cuenta} 
          cuota={cuotaHistorial} 
        />
      </Box>
    </Box>
  );
}
