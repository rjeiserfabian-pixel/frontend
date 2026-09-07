import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Typography, Box, IconButton, Chip, Paper, Grid
} from '@mui/material';
import { Wallet, X, FileText, CheckCircle, Calendar, History, CreditCard, Banknote } from 'lucide-react';
import { comprasService } from '../services/comprasApi';

// Helper de Iconos de Método
const getMetodoIcon = (metodo) => {
  const m = (metodo || '').toLowerCase();
  if (m.includes('yape') || m.includes('plin')) {
    return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Banknote size={16} /></Box>;
  }
  if (m.includes('tarjeta') || m.includes('visa') || m.includes('mastercard')) {
    return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={16} /></Box>;
  }
  return <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={16} /></Box>;
};

export default function ModalHistorialPagos({ open, onClose, cuenta }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && cuenta) {
      fetchHistorial();
    }
  }, [open, cuenta]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const res = await comprasService.getPagosPorCuenta(cuenta.id);
      setPagos(res.results || res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!cuenta) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: '#f4f7fc', 
        } 
      }}
    >
      {/* Header Dark Blue */}
      <Box sx={{ 
        bgcolor: '#0f172a', // Sidebar dark blue color
        color: 'white', 
        pt: 3, 
        pb: 5, 
        px: 4,
        position: 'relative',
        backgroundImage: 'linear-gradient(to right, #0f172a, #1e293b)'
      }}>
        <IconButton 
          onClick={onClose} 
          sx={{ position: 'absolute', top: 16, right: 16, color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <X size={24} />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ 
            bgcolor: 'rgba(59, 130, 246, 0.2)', 
            p: 1.2, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <Wallet size={28} color="#60a5fa" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">Historial de Abonos</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.2 }}>
              Detalle de los abonos realizados a la cuenta
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 4, pt: 0 }}>
        {/* Overlapping Card */}
        <Paper elevation={0} sx={{ 
          mt: -2, 
          mb: 4, 
          borderRadius: 3, 
          border: '1px solid #e2e8f0',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}>
          {/* Left: Comprobante */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 3,
          }}>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box sx={{ 
                bgcolor: '#eff6ff', 
                color: '#3b82f6', 
                p: 1.5, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52
              }}>
                <FileText size={24} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>COMPROBANTE</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2, mt: 0.5 }}>
                  {cuenta.compra_comprobante || 'Deuda sin comprobante'}
                </Typography>
                <Box display="flex" flexDirection="column" mt={1.5}>
                  <Typography variant="caption" color="text.secondary">RUC/DNI:</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    {cuenta.proveedor_documento || 'No registrado'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ width: '1px', bgcolor: '#e2e8f0', my: 2 }} />

          {/* Right: Total Abonado */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 3,
          }}>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box sx={{ 
                bgcolor: '#ecfdf5', 
                color: '#10b981', 
                p: 1.5, 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52
              }}>
                <Wallet size={24} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>TOTAL ABONADO</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e293b', lineHeight: 1.2, mt: 0.5 }}>
                  S/ {parseFloat(cuenta.monto_pagado).toFixed(2)}
                </Typography>
                <Chip 
                  label={cuenta.estado === 'Parcial' ? 'Pago parcial' : 'Pagado completo'} 
                  size="small"
                  icon={<CheckCircle size={14} />}
                  sx={{ 
                    mt: 1.5,
                    bgcolor: cuenta.estado === 'Parcial' ? '#fff7ed' : '#ecfdf5',
                    color: cuenta.estado === 'Parcial' ? '#ea580c' : '#10b981',
                    fontWeight: 600,
                    '& .MuiChip-icon': { color: 'inherit' }
                  }} 
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Title */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <History size={22} color="#3b82f6" />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>
              Historial de Abonos
            </Typography>
          </Box>
          <Chip 
            label={`${pagos.length} registro${pagos.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600, px: 1 }}
          />
        </Box>

        {/* Table */}
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={6}>
              <CircularProgress />
            </Box>
          ) : pagos.length === 0 ? (
            <Box p={6} textAlign="center">
              <Typography color="text.secondary" fontWeight={500}>No hay abonos registrados para esta cuenta.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>FECHA</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>MÉTODO</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>REFERENCIA</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>MONTO</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="right">ESTADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Calendar size={18} color="#94a3b8" />
                          <Typography variant="body2" fontWeight={600} color="#334155">
                            {pago.fecha_pago}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {getMetodoIcon(pago.metodo_pago)}
                          <Typography variant="body2" fontWeight={600} color="#334155">
                            {pago.metodo_pago || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                         <Box display="flex" alignItems="center" gap={1.5}>
                          <FileText size={18} color="#94a3b8" />
                          <Typography variant="body2" color="#64748b" fontWeight={500}>
                            {pago.referencia || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                         <Typography variant="body2" fontWeight={700} sx={{ color: '#10b981' }}>
                            S/ {parseFloat(pago.monto_abonado).toFixed(2)}
                         </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label="Pagado" 
                          size="small"
                          icon={<CheckCircle size={14} />}
                          sx={{ 
                            bgcolor: '#ecfdf5',
                            color: '#10b981',
                            fontWeight: 600,
                            '& .MuiChip-icon': { color: 'inherit' }
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1, pb: 4, px: 4 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          startIcon={<X size={18} />}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 600,
            borderColor: '#cbd5e1',
            color: '#475569',
            px: 3,
            '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
