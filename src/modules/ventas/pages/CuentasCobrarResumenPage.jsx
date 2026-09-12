import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, TablePagination, CircularProgress
} from '@mui/material';
import { Wallet, DollarSign, Users, Inbox } from 'lucide-react';
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
      return <Chip label="Pagado" color="success" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (row.tiene_atrasos > 0) {
      return <Chip label="Atrasado" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    return <Chip label="Pendiente" color="warning" size="small" sx={{ fontWeight: 700 }} />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: 4, color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,58,138,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Wallet size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>Cuentas por Cobrar</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Resumen de deuda por cliente (ventas al crédito)</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Users size={18} />
          <Typography variant="body2" fontWeight={700}>{totalClientes} cliente{totalClientes !== 1 ? 's' : ''} con crédito</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DOCUMENTO (DNI/RUC)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>CLIENTE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DEUDA TOTAL HISTÓRICA</TableCell>
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
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    <Inbox size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Typography variant="body2">No hay cuentas por cobrar registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((row) => (
                  <TableRow key={row.venta__cliente__id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#64748b' }}>{row.venta__cliente__dni}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {(row.venta__cliente__nombres || '') + ' ' + (row.venta__cliente__apellidos || '')}
                    </TableCell>
                    <TableCell align="right">S/ {Number(row.total_deuda || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.saldo_pendiente_total > 0 ? '#dc2626' : '#16a34a' }}>
                      S/ {Number(row.saldo_pendiente_total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getEstadoChip(row)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCliente(row)}
                        title="Ver Créditos del Cliente"
                        sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#dbeafe' } }}
                      >
                        <DollarSign size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
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
      </Paper>
    </Box>
  );
}
