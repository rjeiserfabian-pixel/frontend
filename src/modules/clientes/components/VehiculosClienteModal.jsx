import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton
} from '@mui/material';
import { Printer, X, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { clienteService } from '../services/clienteService';

export default function VehiculosClienteModal({ open, onClose, clienteId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const fetchVehiculos = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const res = await clienteService.getVehiculos(clienteId);
      setData(res);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los vehículos del cliente', 'error');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    if (open && clienteId) {
      fetchVehiculos();
    } else if (!open) {
      setData(null);
    }
  }, [open, clienteId, fetchVehiculos]);

  // Regla UX 3.4: el botón se deshabilita mientras se genera el PDF, para evitar clics duplicados
  const handleImprimir = async () => {
    setPrinting(true);
    try {
      const blob = await clienteService.descargarVehiculosPdf(clienteId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo generar el PDF de vehículos', 'error');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Users size={20} />
          <Typography variant="h6" fontWeight="bold">
            Vehículos de {data ? `${data.cliente.nombres} ${data.cliente.apellidos || ''}`.trim() : ''}
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
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: '10px' }}>
              <Typography variant="body2"><strong>{data.cliente.tipo_documento}:</strong> {data.cliente.dni}</Typography>
              <Typography variant="body2"><strong>Teléfono:</strong> {data.cliente.telefono || '-'}</Typography>
              <Typography variant="body2"><strong>Total de vehículos:</strong> {data.total_vehiculos}</Typography>
            </Box>

            {data.vehiculos.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
                Este cliente no tiene vehículos asociados.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Placa</strong></TableCell>
                      <TableCell><strong>Marca / Modelo</strong></TableCell>
                      <TableCell align="center"><strong>Total OT</strong></TableCell>
                      <TableCell><strong>Último ingreso</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.vehiculos.map((v) => (
                      <TableRow key={v.id} hover>
                        <TableCell>
                          <Chip label={v.placa} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell>{v.marca} {v.modelo}{v.anio_fabricacion ? ` (${v.anio_fabricacion})` : ''}</TableCell>
                        <TableCell align="center">{v.total_ordenes}</TableCell>
                        <TableCell>
                          {v.ultimo_ingreso
                            ? `${new Date(v.ultimo_ingreso).toLocaleDateString('es-PE')} (${v.ultimo_estado})`
                            : 'Sin ingresos'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
