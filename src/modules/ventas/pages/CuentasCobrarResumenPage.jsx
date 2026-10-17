import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, TablePagination, CircularProgress, Button, TextField, MenuItem
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Wallet, DollarSign, Users, Inbox } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import CreditoAnteriorDialog from '../components/CreditoAnteriorDialog';
import { usePermisos } from '../../../shared/contexts/PermisosContext';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function CuentasCobrarResumenPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClientes, setTotalClientes] = useState(0);
  const [nuevo, setNuevo] = useState(false);
  const [search, setSearch] = useState('');
  const [origen, setOrigen] = useState('');
  const { tienePermiso } = usePermisos();

  const navigate = useNavigate();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas/cuentas-por-cobrar/resumen-clientes/`, {
        params: {
          page: page + 1,
          page_size: rowsPerPage, search, origen,
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
  }, [page, rowsPerPage, search, origen]);

  const handleOpenCliente = (cliente) => {
    navigate(`/cuentas/por-cobrar/cliente/${cliente.cliente_id}?moneda=${cliente.moneda}`);
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
      <CreditoAnteriorDialog open={nuevo} onClose={() => setNuevo(false)} onSaved={c => { setNuevo(false); navigate(`/cuentas/por-cobrar/credito/${c.id}`); }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" label="Cliente o documento" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          <TextField select size="small" label="Origen" value={origen} sx={{ minWidth: 180 }} onChange={e => { setOrigen(e.target.value); setPage(0); }}><MenuItem value="">Todos</MenuItem><MenuItem value="VENTA">Ventas del sistema</MenuItem><MenuItem value="CREDITO_ANTERIOR">Créditos anteriores</MenuItem></TextField>
        </Box>
        {tienePermiso('CUENTAS.POR_COBRAR.REGISTRAR_ANTERIOR') && <Button variant="contained" onClick={() => setNuevo(true)}>Registrar crédito anterior</Button>}
      </Box>
      <Box sx={{
        background: `linear-gradient(135deg, ${C.bgElevated}, ${C.surfaceSoft})`,
        border: `1px solid ${C.border}`, borderRadius: '8px', color: 'white', p: 3, mb: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        boxShadow: '0 8px 24px rgba(30,58,138,0.25)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Wallet size={26} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>Cuentas por Cobrar</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>Créditos por cliente y moneda · ventas y deudas anteriores</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1 }}>
          <Users size={18} />
          <Typography variant="body2" fontWeight={700}>{totalClientes} grupo{totalClientes !== 1 ? 's' : ''} de cliente y moneda</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>DOCUMENTO (DNI/RUC)</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>CLIENTE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>IMPORTE GESTIONADO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>SALDO PENDIENTE</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>ESTADO</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#bae6fd', fontSize: '0.8rem' }}>ACCIONES</TableCell>
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
                  <TableRow key={`${row.cliente_id}-${row.moneda}`} hover>
                    <TableCell sx={{ color: '#7dd3fc', fontWeight: 700 }}>{row.venta__cliente__dni}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {(row.venta__cliente__nombres || '') + ' ' + (row.venta__cliente__apellidos || '')}
                    </TableCell>
                    <TableCell align="right">{row.moneda} {Number(row.total_deuda || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.saldo_pendiente_total > 0 ? '#dc2626' : '#16a34a' }}>
                      {row.moneda} {Number(row.saldo_pendiente_total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">{getEstadoChip(row)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCliente(row)}
                        title="Ver Créditos del Cliente"
                        sx={{ bgcolor: alpha(C.blue, 0.08), color: C.blue, border: `1px solid ${alpha(C.blue, 0.18)}`, '&:hover': { bgcolor: alpha(C.blue, 0.16) } }}
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
