import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  Pagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ChevronDown, Printer, X, Car } from 'lucide-react';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

const ESTADO_COLOR = {
  RECEPCIONADO: 'default',
  INSPECCION: 'info',
  ESPERANDO_APROBACION: 'warning',
  APROBADO: 'primary',
  FINALIZADO: 'success',
  FACTURADO: 'success',
  CANCELADO: 'error',
};

export default function HistorialVehiculoModal({ open, onClose, vehiculoId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);

  const fetchHistorial = useCallback(async (currentPage) => {
    if (!vehiculoId) return;
    setLoading(true);
    try {
      const res = await vehiculoService.getHistorial(vehiculoId, currentPage);
      setData(res);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el historial del vehículo', 'error');
    } finally {
      setLoading(false);
    }
  }, [vehiculoId]);

  useEffect(() => {
    if (open && vehiculoId) {
      setPage(1);
      fetchHistorial(1);
    } else if (!open) {
      setData(null);
    }
  }, [open, vehiculoId, fetchHistorial]);

  const handlePageChange = (_e, newPage) => {
    setPage(newPage);
    fetchHistorial(newPage);
  };

  // Regla UX 3.4: el botón se deshabilita mientras se genera el PDF, para evitar clics duplicados
  const handleImprimir = async () => {
    setPrinting(true);
    try {
      const blob = await vehiculoService.descargarHistorialPdf(vehiculoId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo generar el PDF del historial', 'error');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Car size={20} />
          <Typography variant="h6" fontWeight="bold">
            Historial del vehículo {data?.vehiculo?.placa || ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && !data ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : !data ? null : (
          <>
            <Box sx={{ mb: 2, p: 2, bgcolor: alpha(C.blue, 0.1), border: `1px solid ${alpha(C.blue, 0.25)}`, borderRadius: '8px' }}>
              <Typography variant="body2">
                <strong>Marca/Modelo:</strong> {data.vehiculo.marca} {data.vehiculo.modelo}
                {data.vehiculo.anio_fabricacion ? ` (${data.vehiculo.anio_fabricacion})` : ''}
              </Typography>
              <Typography variant="body2">
                <strong>Propietario(s):</strong>{' '}
                {data.vehiculo.propietarios.length > 0
                  ? data.vehiculo.propietarios.map(p => `${p.nombre} (${p.documento})`).join(', ')
                  : 'Sin registrar'}
              </Typography>
              <Typography variant="body2"><strong>Total de ingresos al taller:</strong> {data.total_ordenes}</Typography>
            </Box>

            {data.ordenes.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                Este vehículo no registra ingresos al taller.
              </Typography>
            ) : (
              data.ordenes.map((o) => (
                <Accordion
                  key={o.numero}
                  sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: `1px solid ${C.border}`, borderRadius: '8px !important', overflow: 'hidden', bgcolor: alpha('#ffffff', 0.025), '&.Mui-expanded': { bgcolor: alpha('#ffffff', 0.045) } }}
                >
                  <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">OT-{o.numero}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(o.fecha_ingreso).toLocaleDateString('es-PE')}
                          {o.cliente ? ` — ${o.cliente.nombre}` : ''}
                        </Typography>
                      </Box>
                      <Chip label={o.estado_display} size="small" color={ESTADO_COLOR[o.estado] || 'default'} />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {o.motivo_ingreso && (
                      <Typography variant="body2" sx={{ mb: 1.5 }}><strong>Motivo:</strong> {o.motivo_ingreso}</Typography>
                    )}
                    {(o.servicios.length > 0 || o.repuestos.length > 0) ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Descripción</strong></TableCell>
                              <TableCell align="right"><strong>Cant.</strong></TableCell>
                              <TableCell align="right"><strong>P. Unit.</strong></TableCell>
                              <TableCell align="right"><strong>Total</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {o.servicios.map((s, i) => (
                              <TableRow key={`s-${i}`}>
                                <TableCell>{s.descripcion}{s.completado ? ' ✓' : ''}</TableCell>
                                <TableCell align="right">1.00</TableCell>
                                <TableCell align="right">S/ {Number(s.precio_estimado).toFixed(2)}</TableCell>
                                <TableCell align="right">S/ {Number(s.precio_estimado).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            {o.repuestos.map((r, i) => (
                              <TableRow key={`r-${i}`}>
                                <TableCell>{r.descripcion}{r.instalado ? ' ✓' : ''}</TableCell>
                                <TableCell align="right">{Number(r.cantidad).toFixed(2)}</TableCell>
                                <TableCell align="right">S/ {Number(r.precio_unitario).toFixed(2)}</TableCell>
                                <TableCell align="right">S/ {Number(r.total).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} align="right"><strong>Total de la orden</strong></TableCell>
                              <TableCell align="right"><strong>S/ {Number(o.total_general).toFixed(2)}</strong></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="textSecondary">Sin servicios ni repuestos registrados.</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            )}

            {data.total_pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination count={data.total_pages} page={page} onChange={handlePageChange} size="small" />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button
          variant="contained"
          startIcon={<Printer size={16} />}
          onClick={handleImprimir}
          disabled={printing || !data}
        >
          {printing ? 'Generando...' : 'Imprimir PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
