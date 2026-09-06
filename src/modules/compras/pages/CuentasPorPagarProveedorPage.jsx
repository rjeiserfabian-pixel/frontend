import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Button, CircularProgress
} from '@mui/material';
import { CreditCard, ArrowLeft } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function CuentasPorPagarProveedorPage() {
  const { proveedorId } = useParams();
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proveedorInfo, setProveedorInfo] = useState(null);

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

  return (
    <Box sx={{ p: 3 }}>
      <Button 
        startIcon={<ArrowLeft size={18} />} 
        onClick={() => navigate('/compras/cuentas-por-pagar')}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}
      >
        Volver al Resumen General
      </Button>
      
      <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
        Cuentas de {proveedorInfo ? proveedorInfo.nombres : 'Proveedor'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        RUC/DNI: {proveedorInfo ? proveedorInfo.documento : '...'}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
                <TableCell><b>Vencimiento</b></TableCell>
                <TableCell><b>Comprobante</b></TableCell>
                <TableCell align="right"><b>Total Deuda</b></TableCell>
                <TableCell align="right"><b>Abonado</b></TableCell>
                <TableCell align="right"><b>Saldo</b></TableCell>
                <TableCell align="center"><b>Estado</b></TableCell>
                <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
            ) : cuentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay deudas pendientes registradas con este proveedor.
                  </TableCell>
                </TableRow>
            ) : (
                cuentas.map((cuenta) => (
                  <TableRow key={cuenta.id} hover>
                    <TableCell>{cuenta.fecha_vencimiento}</TableCell>
                    <TableCell>{cuenta.compra_comprobante}</TableCell>
                    
                    <TableCell align="right">S/ {parseFloat(cuenta.monto_total).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>S/ {parseFloat(cuenta.monto_pagado).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>S/ {parseFloat(cuenta.saldo_pendiente).toFixed(2)}</TableCell>
                    
                    <TableCell align="center">
                      <Chip 
                        label={cuenta.estado} 
                        color={cuenta.estado === 'Pendiente' ? 'error' : cuenta.estado === 'Parcial' ? 'warning' : 'success'} 
                        size="small" 
                        variant={cuenta.estado === 'Pagada' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                       <Button size="small" variant="outlined" disabled={cuenta.estado === 'Pagada'} startIcon={<CreditCard size={16}/>}>
                          Abonar
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
