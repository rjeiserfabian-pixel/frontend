import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Button
} from '@mui/material';
import { Eye, ArrowLeft } from 'lucide-react';
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
      <Button 
        startIcon={<ArrowLeft size={18} />} 
        onClick={() => navigate('/cuentas/por-cobrar')}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Volver al Resumen General
      </Button>
      
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
        Créditos de {clienteInfo ? clienteInfo.nombres : 'Cliente'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        DNI/RUC: {clienteInfo ? clienteInfo.dni : '...'}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>Cód. Crédito</strong></TableCell>
              <TableCell><strong>Nro Venta</strong></TableCell>
              <TableCell align="right"><strong>Monto Financiado</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cuentas.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.codigo_credito}</TableCell>
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
                <TableCell colSpan={6} align="center">Este cliente no tiene créditos registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
