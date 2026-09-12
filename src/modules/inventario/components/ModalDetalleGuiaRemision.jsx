import React from 'react';
import {
  Dialog, DialogContent, DialogActions, Button,
  Box, Typography, Grid, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Divider, IconButton, Chip
} from '@mui/material';
import { X, Truck, MapPin, User, Calendar, FileText, Package } from 'lucide-react';

const ESTADO_CHIP = {
  CREADA: { label: 'Creada', color: 'default' },
  EN_TRASLADO: { label: 'En Traslado', color: 'warning' },
  COMPLETADA: { label: 'Completada', color: 'success' },
};

export default function ModalDetalleGuiaRemision({ open, onClose, guia }) {
  if (!guia) return null;

  const estadoInfo = ESTADO_CHIP[guia.estado] || { label: guia.estado, color: 'default' };
  const numeroGuia = `${guia.serie_prefijo || 'GR'}-${String(guia.correlativo).padStart(6, '0')}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: '#f8fafc'
        }
      }}
    >
      <Box sx={{
        bgcolor: '#1e293b',
        color: 'white',
        p: 2.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, display: 'flex' }}>
            <Truck size={20} color="white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, m: 0, lineHeight: 1.2 }}>
              Detalle de la Guía {numeroGuia}
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Emitida el {new Date(guia.fecha_emision).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <MapPin size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Punto de Partida</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {guia.ubigeo_partida_nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', pl: 3.5 }}>
                {guia.punto_partida}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <MapPin size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Punto de Llegada</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {guia.ubigeo_llegada_nombre}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', pl: 3.5 }}>
                {guia.punto_llegada}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <User size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Cliente / Destinatario</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {guia.cliente_nombre || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Calendar size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Estado</Typography>
              </Box>
              <Box sx={{ pl: 3.5 }}>
                <Chip label={estadoInfo.label} color={estadoInfo.color} size="small" />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Truck size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Transportista</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {guia.transportista_nombre || 'Aún no asignado'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Package size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Vehículo / Placa</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {guia.vehiculo_placa || 'Aún no asignado'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Motivo del traslado</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{guia.motivo_traslado || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Fecha de traslado</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {guia.fecha_traslado ? new Date(guia.fecha_traslado + 'T00:00').toLocaleDateString() : '-'}
              </Typography>
            </Grid>

            {guia.observaciones && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}>Observaciones:</Typography>
                <Typography variant="body2" sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 1 }}>
                  {guia.observaciones}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
          Bienes a Transportar ({guia.detalles?.length || 0})
        </Typography>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><b>Código</b></TableCell>
                <TableCell><b>Descripción</b></TableCell>
                <TableCell align="center"><b>U.M.</b></TableCell>
                <TableCell align="center"><b>Cantidad</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {guia.detalles?.map((det) => (
                <TableRow key={det.id}>
                  <TableCell>{det.repuesto_codigo}</TableCell>
                  <TableCell>{det.repuesto_nombre}</TableCell>
                  <TableCell align="center">{det.repuesto_unidad || '-'}</TableCell>
                  <TableCell align="center">
                    <Typography sx={{ fontWeight: 'bold', color: '#2563eb' }}>
                      {parseFloat(det.cantidad)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
