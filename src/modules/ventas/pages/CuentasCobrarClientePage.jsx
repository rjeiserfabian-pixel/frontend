import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Button, CircularProgress
} from '@mui/material';
import { Eye, ArrowLeft, User, Inbox } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function CuentasCobrarClientePage() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteInfo, setClienteInfo] = useState(null);

  const fetchCuentasCliente = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas/cuentas-por-cobrar/?cliente_id=${clienteId}`);
      const data = res.data.results || res.data;
      setCuentas(data);

      if (data.length > 0) {
        setClienteInfo({
          nombres: `${data[0].cliente_nombre} ${data[0].cliente_apellidos}`.trim(),
          dni: data[0].cliente_dni
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los créditos del cliente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      fetchCuentasCliente();
    }
  }, [clienteId]);

  const handleOpenCuotas = (cuenta) => {
    navigate(`/cuentas/por-cobrar/credito/${cuenta.id}`);
  };

  const getEstadoChip = (cuenta) => {
    // El campo "estado" nunca llega a ATRASADO por sí solo (nada lo
    // actualiza); "esta_atrasada" lo calcula el backend al vuelo comparando
    // fechas, así que tiene prioridad sobre el texto guardado.
    if (cuenta.estado !== 'PAGADO' && cuenta.esta_atrasada) {
      return <Chip label="Atrasado" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    switch (cuenta.estado) {
      case 'PENDIENTE': return <Chip label="Pendiente" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      case 'PAGADO': return <Chip label="Pagado" color="success" size="small" sx={{ fontWeight: 700 }} />;
      default: return <Chip label={cuenta.estado} size="small" />;
    }
  };

  const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.saldo_pendiente || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/cuentas/por-cobrar')}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Volver al Resumen General
      </Button>

      {/* HEADER */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: 4, color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,58,138,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <User size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              {clienteInfo ? clienteInfo.nombres : 'Cliente'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              DNI/RUC: {clienteInfo ? clienteInfo.dni : '...'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>Saldo pendiente total</Typography>
          <Typography variant="h6" fontWeight={800}>S/ {saldoTotal.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>CÓD. CRÉDITO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>NRO VENTA</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>MONTO FINANCIADO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>SALDO PENDIENTE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ESTADO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={28} /></TableCell>
                </TableRow>
              ) : cuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    <Inbox size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Typography variant="body2">Este cliente no tiene créditos registrados.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cuentas.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.codigo_credito}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{row.venta_serie}</TableCell>
                    <TableCell align="right">S/ {Number(row.monto_financiado).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.saldo_pendiente > 0 ? '#dc2626' : '#16a34a' }}>
                      S/ {Number(row.saldo_pendiente).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getEstadoChip(row)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCuotas(row)}
                        title="Ver Cuotas"
                        sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}
                      >
                        <Eye size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
