import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, CircularProgress, TablePagination
} from '@mui/material';
import { Wallet, DollarSign, Truck, Inbox } from 'lucide-react';
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
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        borderRadius: 4, color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,41,59,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Wallet size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>Cuentas por Pagar</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Resumen de deuda por proveedor (compras al crédito)</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Truck size={18} />
          <Typography variant="body2" fontWeight={700}>{totalProveedores} proveedor{totalProveedores !== 1 ? 'es' : ''} con crédito</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DOCUMENTO (RUC/DNI)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>PROVEEDOR</TableCell>
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
              ) : proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    <Inbox size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Typography variant="body2">No hay cuentas por pagar registradas.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((row) => (
                  <TableRow key={row.proveedor__id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ color: '#64748b' }}>{row.proveedor__numero_documento}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.proveedor__nombre_o_razon_social}</TableCell>
                    <TableCell align="right">S/ {Number(row.total_deuda || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.saldo_pendiente_total > 0 ? '#dc2626' : '#16a34a' }}>
                      S/ {Number(row.saldo_pendiente_total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getEstadoChip(row)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenProveedor(row)}
                        title="Ver Deudas del Proveedor"
                        sx={{ bgcolor: '#f1f5f9', color: '#475569', '&:hover': { bgcolor: '#e2e8f0' } }}
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
          count={totalProveedores}
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
