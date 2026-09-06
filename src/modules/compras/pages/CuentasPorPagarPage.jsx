import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress
} from '@mui/material';
import { DollarSign } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function CuentasPorPagarPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProveedores, setTotalProveedores] = useState(0);
  
  const navigate = useNavigate();

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/compras/cuentas-por-pagar/resumen-proveedores/`, {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      setProveedores(res.data.results || res.data);
      setTotalProveedores(res.data.count || (res.data.results ? res.data.results.length : res.data.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas por pagar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, [page, rowsPerPage]);

  const handleOpenProveedor = (proveedor) => {
    navigate(`/compras/cuentas-por-pagar/proveedor/${proveedor.proveedor__id}`);
  };

  const getEstadoChip = (row) => {
    if (row.saldo_pendiente_total <= 0) {
      return <Chip label="Pagado" color="success" size="small" />;
    }
    if (row.tiene_atrasos > 0) {
      return <Chip label="Atrasado" color="error" size="small" />;
    }
    return <Chip label="Pendiente" color="warning" size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Cuentas por Pagar (Resumen por Proveedores)
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>Documento (RUC/DNI)</strong></TableCell>
              <TableCell><strong>Proveedor</strong></TableCell>
              <TableCell align="right"><strong>Deuda Total Histórica</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente Total</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
            ) : proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay cuentas por pagar registradas.</TableCell>
              </TableRow>
            ) : (
                proveedores.map((row) => (
                <TableRow key={row.proveedor__id} hover>
                    <TableCell>{row.proveedor__numero_documento}</TableCell>
                    <TableCell>{row.proveedor__nombre_o_razon_social}</TableCell>
                    <TableCell align="right">S/ {Number(row.total_deuda || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: row.saldo_pendiente_total > 0 ? '#ef4444' : 'inherit' }}>
                    S/ {Number(row.saldo_pendiente_total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getEstadoChip(row)}</TableCell>
                    <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenProveedor(row)} title="Ver Deudas del Proveedor">
                        <DollarSign size={20} />
                    </IconButton>
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
