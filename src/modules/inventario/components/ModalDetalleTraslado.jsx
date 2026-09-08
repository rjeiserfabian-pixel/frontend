import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Box, Typography, Grid, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Divider, IconButton
} from '@mui/material';
import { X, Package, Calendar, User, FileText, ArrowRightLeft } from 'lucide-react';

export default function ModalDetalleTraslado({ open, onClose, traslado }) {
  if (!traslado) return null;

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
            <FileText size={20} color="white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, m: 0, lineHeight: 1.2 }}>
              Detalle del Movimiento
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              Registrado el {new Date(traslado.fecha_traslado).toLocaleDateString()} a las {new Date(traslado.fecha_traslado).toLocaleTimeString()}
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
                <Package size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Almacén Origen</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {traslado.almacen_origen_nombre}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <ArrowRightLeft size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Almacén Destino</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {traslado.almacen_destino_nombre}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <User size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Realizado por</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                {traslado.usuario_nombre}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Calendar size={16} color="#64748b" />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Estado</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5, color: '#16a34a' }}>
                COMPLETADO
              </Typography>
            </Grid>

            {traslado.observaciones && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}>Observaciones:</Typography>
                <Typography variant="body2" sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 1 }}>
                  {traslado.observaciones}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
          Productos Trasladados ({traslado.detalles?.length || 0})
        </Typography>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><b>Código</b></TableCell>
                <TableCell><b>Producto</b></TableCell>
                <TableCell><b>Ubi. Origen</b></TableCell>
                <TableCell><b>Ubi. Destino</b></TableCell>
                <TableCell align="center"><b>Cantidad</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {traslado.detalles?.map((det) => (
                <TableRow key={det.id}>
                  <TableCell>{det.repuesto_codigo}</TableCell>
                  <TableCell>{det.repuesto_nombre}</TableCell>
                  <TableCell>{det.ubicacion_origen_nombre}</TableCell>
                  <TableCell>{det.ubicacion_destino_nombre}</TableCell>
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
