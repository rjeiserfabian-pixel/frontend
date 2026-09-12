import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Button, CircularProgress
} from '@mui/material';
import { CreditCard, ArrowLeft, Eye, Truck, Inbox } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import ModalAbonar from '../components/ModalAbonar';
import ModalHistorialPagos from '../components/ModalHistorialPagos';

export default function CuentasPorPagarProveedorPage() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proveedorInfo, setProveedorInfo] = useState(null);

  const [modalAbonarOpen, setModalAbonarOpen] = useState(false);
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);

  const fetchCuentasProveedor = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/compras/cuentas-por-pagar/?proveedor_id=${proveedorId}`);
      const data = res.data.results || res.data;
      setCuentas(data);

      if (data.length > 0) {
        setProveedorInfo({
          nombres: data[0].proveedor_nombre,
          documento: data[0].proveedor_documento || '...'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas del proveedor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proveedorId) {
      fetchCuentasProveedor();
    }
  }, [proveedorId]);

  // El backend no marca "vencida" por sí solo; se calcula aquí comparando
  // fechas, igual que en Cuentas por Cobrar — así una factura "Pendiente"
  // que todavía no vence no se pinta en rojo como si ya estuviera atrasada.
  const hoy = new Date().toISOString().split('T')[0];
  const getEstadoChip = (cuenta) => {
    const vencida = cuenta.estado !== 'Pagada' && cuenta.fecha_vencimiento < hoy;
    if (vencida) {
      return <Chip label="Atrasada" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    switch (cuenta.estado) {
      case 'Pendiente': return <Chip label="Pendiente" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'Parcial': return <Chip label="Pago Parcial" color="info" size="small" sx={{ fontWeight: 700 }} />;
      case 'Pagada': return <Chip label="Pagada" color="success" size="small" sx={{ fontWeight: 700 }} />;
      default: return <Chip label={cuenta.estado} size="small" />;
    }
  };

  const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo_pendiente || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/compras/cuentas-por-pagar')}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Volver al Resumen General
      </Button>

      {/* HEADER */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        borderRadius: 4, color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,41,59,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Truck size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              {proveedorInfo ? proveedorInfo.nombres : 'Proveedor'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              RUC/DNI: {proveedorInfo ? proveedorInfo.documento : '...'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>Saldo pendiente total</Typography>
          <Typography variant="h6" fontWeight={800}>S/ {saldoTotal.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>VENCIMIENTO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>COMPROBANTE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>TOTAL DEUDA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ABONADO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>SALDO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ESTADO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : cuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    <Inbox size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Typography variant="body2">No hay deudas pendientes registradas con este proveedor.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cuentas.map((cuenta) => (
                  <TableRow key={cuenta.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: cuenta.estado !== 'Pagada' && cuenta.fecha_vencimiento < hoy ? '#dc2626' : 'inherit', fontWeight: cuenta.estado !== 'Pagada' && cuenta.fecha_vencimiento < hoy ? 700 : 400 }}>
                      {cuenta.fecha_vencimiento}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{cuenta.compra_comprobante}</TableCell>

                    <TableCell align="right">S/ {parseFloat(cuenta.monto_total).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: '#16a34a' }}>S/ {parseFloat(cuenta.monto_pagado).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700 }}>S/ {parseFloat(cuenta.saldo_pendiente).toFixed(2)}</TableCell>

                    <TableCell align="center">{getEstadoChip(cuenta)}</TableCell>
                    <TableCell align="center">
                       <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                         <Button
                           size="small"
                           variant="contained"
                           color="primary"
                           disabled={cuenta.estado === 'Pagada'}
                           startIcon={<CreditCard size={16}/>}
                           onClick={() => {
                             setCuentaSeleccionada(cuenta);
                             setModalAbonarOpen(true);
                           }}
                           sx={{ textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                         >
                            Abonar
                         </Button>
                         <IconButton
                           size="small"
                           title="Ver Historial de Pagos"
                           onClick={() => {
                             setCuentaSeleccionada(cuenta);
                             setModalHistorialOpen(true);
                           }}
                           sx={{ bgcolor: '#f1f5f9', color: '#475569', '&:hover': { bgcolor: '#e2e8f0' } }}
                         >
                            <Eye size={18}/>
                         </IconButton>
                       </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ModalAbonar
        open={modalAbonarOpen}
        onClose={() => {
          setModalAbonarOpen(false);
          setCuentaSeleccionada(null);
        }}
        cuenta={cuentaSeleccionada}
        onSuccess={fetchCuentasProveedor}
      />

      <ModalHistorialPagos
        open={modalHistorialOpen}
        onClose={() => {
          setModalHistorialOpen(false);
          setCuentaSeleccionada(null);
        }}
        cuenta={cuentaSeleccionada}
      />
    </Box>
  );
}
