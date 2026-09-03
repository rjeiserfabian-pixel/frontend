import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  

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

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleOpenCuotas = (cuenta) => {
    navigate(`/cuentas/por-cobrar/${cuenta.id}`);
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

    </Box>
  );
}
