import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Typography, Box, IconButton, Chip, Paper, Grid
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Wallet, X, FileText, CheckCircle, Calendar, History, CreditCard, Banknote } from 'lucide-react';
import { comprasService } from '../services/comprasApi';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

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
          borderRadius: '8px',
          overflow: 'hidden',
          bgcolor: C.bgElevated,
          border: `1px solid ${C.border}`,
        } 
      }}
    >
      {/* Header Dark Blue */}
      <Box sx={{ 
        bgcolor: C.bgElevated,
        color: 'white', 
        pt: 3, 
        pb: 5, 
        px: 4,
        position: 'relative',
        backgroundImage: `linear-gradient(to right, ${C.bgElevated}, ${C.surfaceSoft})`
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
          border: `1px solid ${C.border}`,
          bgcolor: C.bgElevated,
          position: 'relative',
          zIndex: 1,
          boxShadow: S.card,
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
                bgcolor: alpha(C.blue, 0.14),
                color: '#7dd3fc',
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
                <Typography variant="caption" sx={{ color: '#cbd5e1' }} fontWeight={700} letterSpacing={0.5}>COMPROBANTE</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: C.text, lineHeight: 1.2, mt: 0.5 }}>
                  {cuenta.compra_comprobante || 'Deuda sin comprobante'}
                </Typography>
                <Box display="flex" flexDirection="column" mt={1.5}>
                  <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 700 }}>RUC/DNI:</Typography>
                  <Typography variant="body2" sx={{ color: '#7dd3fc', fontWeight: 700 }}>
                    {cuenta.proveedor_documento || 'No registrado'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ width: '1px', bgcolor: C.border, my: 2 }} />

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
                bgcolor: alpha(C.emerald, 0.14),
                color: '#6ee7b7',
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
                <Typography variant="caption" sx={{ color: '#cbd5e1' }} fontWeight={700} letterSpacing={0.5}>TOTAL ABONADO</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#6ee7b7', lineHeight: 1.2, mt: 0.5 }}>
                  S/ {parseFloat(cuenta.monto_pagado).toFixed(2)}
                </Typography>
                <Chip 
                  label={cuenta.estado === 'Parcial' ? 'Pago parcial' : 'Pagado completo'} 
                  size="small"
                  icon={<CheckCircle size={14} />}
                  sx={{ 
                    mt: 1.5,
                    bgcolor: cuenta.estado === 'Parcial' ? alpha(C.amber, 0.16) : alpha(C.emerald, 0.14),
                    color: cuenta.estado === 'Parcial' ? '#fcd34d' : '#6ee7b7',
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
            <History size={22} color="#38bdf8" />
            <Typography variant="h6" fontWeight="bold" sx={{ color: C.text }}>
              Historial de Abonos
            </Typography>
          </Box>
          <Chip 
            label={`${pagos.length} registro${pagos.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: alpha(C.blue, 0.16), color: '#7dd3fc', fontWeight: 700, px: 1 }}
          />
        </Box>

        {/* Table */}
        <Paper elevation={0} sx={{ border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', bgcolor: C.bgElevated }}>
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
                <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
                  <TableRow>
                    <TableCell sx={{ color: '#bae6fd', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>FECHA</TableCell>
                    <TableCell sx={{ color: '#bae6fd', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>MÉTODO</TableCell>
                    <TableCell sx={{ color: '#bae6fd', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>REFERENCIA</TableCell>
                    <TableCell sx={{ color: '#bae6fd', fontWeight: 800, fontSize: '0.75rem', py: 2 }}>MONTO</TableCell>
                    <TableCell sx={{ color: '#bae6fd', fontWeight: 800, fontSize: '0.75rem', py: 2 }} align="right">ESTADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Calendar size={18} color="#7dd3fc" />
                          <Typography variant="body2" fontWeight={700} color={C.text}>
                            {pago.fecha_pago}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          {getMetodoIcon(pago.metodo_pago)}
                          <Typography variant="body2" fontWeight={700} color={C.text}>
                            {pago.metodo_pago || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                         <Box display="flex" alignItems="center" gap={1.5}>
                          <FileText size={18} color="#7dd3fc" />
                          <Typography variant="body2" sx={{ color: '#cbd5e1' }} fontWeight={600}>
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
                            bgcolor: alpha(C.emerald, 0.14),
                            color: '#6ee7b7',
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
      <DialogActions sx={{ p: 3, pt: 1, pb: 4, px: 4, bgcolor: C.bgElevated, borderTop: `1px solid ${C.border}` }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          startIcon={<X size={18} />}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none', 
            fontWeight: 600,
            borderColor: C.border,
            color: '#e2e8f0',
            px: 3,
            '&:hover': { bgcolor: alpha(C.surfaceSoft, 0.7), borderColor: '#7dd3fc' }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
