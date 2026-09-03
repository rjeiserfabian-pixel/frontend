import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, TextField, MenuItem, Select, FormControl,
  InputLabel, Grid
} from '@mui/material';
import { Eye, DollarSign, X, Plus, Trash2 } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function CuentasCobrarPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog de Cuotas
  const [openCuotas, setOpenCuotas] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  // Dialog de Pago
  const [openPago, setOpenPago] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState(null);
  
  // Múltiples Pagos
  const [metodosPago, setMetodosPago] = useState([]);
  const [pagosActuales, setPagosActuales] = useState([]);
  const [montoIngreso, setMontoIngreso] = useState('');
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('');

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ventas/cuentas-por-cobrar/');
      setCuentas(res.data.results || res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas por cobrar.', 'error');
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
    fetchCuentas();
    fetchMetodos();
  }, []);

  const handleOpenCuotas = (cuenta) => {
    setSelectedCuenta(cuenta);
    setOpenCuotas(true);
  };

  const handleCloseCuotas = () => {
    setOpenCuotas(false);
    setSelectedCuenta(null);
  };

  const handleOpenPago = (cuota) => {
    setSelectedCuota(cuota);
    setPagosActuales([]);
    setMontoIngreso(cuota.saldo_pendiente);
    if (metodosPago.length > 0) {
      setMetodoSeleccionado(metodosPago[0].id);
    }
    setOpenPago(true);
  };

  const handleClosePago = () => {
    setOpenPago(false);
    setSelectedCuota(null);
    setPagosActuales([]);
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
    setPagosActuales([
      ...pagosActuales,
      {
        metodo_pago_id: metodoSeleccionado,
        metodo_nombre: metodoInfo.nombre,
        monto: Number(montoIngreso)
      }
    ]);
    
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
      await api.post(`/ventas/cuentas-por-cobrar/pagar-cuota/${selectedCuota.id}/`, {
        pagos: pagosActuales
      });
      Swal.fire('Éxito', 'Pago registrado correctamente', 'success');
      handleClosePago();
      handleCloseCuotas();
      fetchCuentas();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Ocurrió un error al procesar el pago.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return <Chip label="Pendiente" color="warning" size="small" />;
      case 'PAGADO': return <Chip label="Pagado" color="success" size="small" />;
      case 'ATRASADO': return <Chip label="Atrasado" color="error" size="small" />;
      default: return <Chip label={estado} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Cuentas por Cobrar
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>Cód. Crédito</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Nro Venta</strong></TableCell>
              <TableCell align="right"><strong>Monto Total</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cuentas.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.codigo_credito}</TableCell>
                <TableCell>
                  {row.cliente_nombre} {row.cliente_apellidos}<br/>
                  <Typography variant="caption" color="textSecondary">{row.cliente_dni}</Typography>
                </TableCell>
                <TableCell>{row.venta_serie}</TableCell>
                <TableCell align="right">S/ {Number(row.monto_financiado).toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: row.saldo_pendiente > 0 ? '#ef4444' : 'inherit' }}>
                  S/ {Number(row.saldo_pendiente).toFixed(2)}
                </TableCell>
                <TableCell align="center">{getEstadoChip(row.estado)}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenCuotas(row)} title="Ver Cuotas">
                    <Eye size={20} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {cuentas.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay cuentas por cobrar registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE CUOTAS */}
      <Dialog open={openCuotas} onClose={handleCloseCuotas} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle de Cuotas - {selectedCuenta?.codigo_credito}
          <IconButton
            onClick={handleCloseCuotas}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
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
                {selectedCuenta?.cuotas?.map((cuota) => (
                  <TableRow key={cuota.id}>
                    <TableCell>{cuota.numero_cuota}</TableCell>
                    <TableCell>{cuota.fecha_vencimiento}</TableCell>
                    <TableCell align="right">S/ {Number(cuota.monto).toFixed(2)}</TableCell>
                    <TableCell align="right">S/ {Number(cuota.saldo_pendiente).toFixed(2)}</TableCell>
                    <TableCell align="center">{getEstadoChip(cuota.estado)}</TableCell>
                    <TableCell align="center">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PAGO MÚLTIPLE */}
      <Dialog open={openPago} onClose={handleClosePago} maxWidth="sm" fullWidth>
        <DialogTitle>
          Cobrar Cuota {selectedCuota?.numero_cuota}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Saldo Pendiente de la Cuota: <strong>S/ {Number(selectedCuota?.saldo_pendiente).toFixed(2)}</strong>
          </Typography>

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

          {pagosActuales.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Método</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="center" width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagosActuales.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{p.metodo_nombre}</TableCell>
                      <TableCell align="right">S/ {p.monto.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => quitarPago(idx)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell align="right"><strong>Total a Pagar:</strong></TableCell>
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
        <DialogActions>
          <Button onClick={handleClosePago} color="inherit">Cancelar</Button>
          <Button 
            onClick={confirmarPago} 
            variant="contained" 
            color="success"
            disabled={pagosActuales.length === 0 || restanteTotal < 0}
          >
            Confirmar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
