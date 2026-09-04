import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, TablePagination
} from '@mui/material';
import { Eye, DollarSign } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';

export default function CuentasCobrarResumenPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClientes, setTotalClientes] = useState(0);
  
  const navigate = useNavigate();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas/cuentas-por-cobrar/resumen-clientes/`, {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      setClientes(res.data.results || res.data);
      setTotalClientes(res.data.count || (res.data.results ? res.data.results.length : res.data.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas por cobrar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [page, rowsPerPage]);

  const handleOpenCliente = (cliente) => {
    navigate(`/cuentas/por-cobrar/cliente/${cliente.venta__cliente__id}`);
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
        Cuentas por Cobrar (Resumen por Clientes)
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><strong>Documento (DNI/RUC)</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell align="right"><strong>Deuda Total Histórica</strong></TableCell>
              <TableCell align="right"><strong>Saldo Pendiente Total</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.map((row) => (
              <TableRow key={row.venta__cliente__id}>
                <TableCell>{row.venta__cliente__dni}</TableCell>
                <TableCell>
                  {(row.venta__cliente__nombres || '') + ' ' + (row.venta__cliente__apellidos || '')}
                </TableCell>
                <TableCell align="right">S/ {Number(row.total_deuda || 0).toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: row.saldo_pendiente_total > 0 ? '#ef4444' : 'inherit' }}>
                  S/ {Number(row.saldo_pendiente_total || 0).toFixed(2)}
                </TableCell>
                <TableCell align="center">{getEstadoChip(row)}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenCliente(row)} title="Ver Créditos del Cliente">
                    <DollarSign size={20} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {clientes.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay cuentas por cobrar registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalClientes}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
        labelRowsPerPage="Filas por página:"
      />
    </Box>
  );
}
