import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Grid, Divider, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { ArrowLeft, Check, Plus, Trash2, Printer, MessageSquare } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { tallerService } from '../services/tallerService';

export default function DetalleOrdenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialogs state
  const [hallazgoModal, setHallazgoModal] = useState(false);
  const [servicioModal, setServicioModal] = useState(false);
  const [nuevoHallazgo, setNuevoHallazgo] = useState('');
  const [nuevoServicio, setNuevoServicio] = useState({ descripcion: '', precio: 0 });

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getOrden(id);
      setOrden(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHallazgo = async () => {
    try {
      await tallerService.crearHallazgo({ orden: id, descripcion: nuevoHallazgo });
      setHallazgoModal(false);
      setNuevoHallazgo('');
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServicio = async () => {
    try {
      await tallerService.crearServicio({ 
        orden: id, 
        descripcion: nuevoServicio.descripcion, 
        precio_estimado: nuevoServicio.precio 
      });
      setServicioModal(false);
      setNuevoServicio({ descripcion: '', precio: 0 });
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprobarTodo = async () => {
    try {
      // Simula aprobar todos los servicios (En la vida real se seleccionarían 1x1)
      const srvIds = orden.servicios.map(s => s.id);
      const repIds = orden.repuestos.map(r => r.id);
      
      await tallerService.aprobarServicios(id, {
        servicios_aprobados: srvIds,
        repuestos_aprobados: repIds
      });
      alert('Cotización aprobada. El mecánico ya puede iniciar.');
      fetchOrden();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !orden) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/taller/ordenes')} sx={{ mr: 2 }}>
            <ArrowLeft />
          </IconButton>
          <Typography variant="h5" fontWeight="600">
            Orden OT-{orden.numero}
          </Typography>
          <Chip label={orden.estado.replace('_', ' ')} color="primary" sx={{ ml: 2 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Printer size={18} />}>PDF Cotización</Button>
          <Button variant="contained" color="success" startIcon={<MessageSquare size={18} />}>WhatsApp</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Info del Vehículo */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>Datos del Vehículo</Typography>
            <Typography variant="body2" color="text.secondary">Placa</Typography>
            <Typography variant="body1" mb={1}>{orden.vehiculo_detalle?.placa}</Typography>
            
            <Typography variant="body2" color="text.secondary">Marca y Modelo</Typography>
            <Typography variant="body1" mb={1}>{orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}</Typography>
            
            <Typography variant="body2" color="text.secondary">Kilometraje</Typography>
            <Typography variant="body1" mb={1}>{orden.kilometraje_ingreso || 'N/A'}</Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">Motivo Ingreso (Correctivo)</Typography>
            <Typography variant="body1">{orden.motivo_ingreso || 'Mantenimiento Preventivo Normal'}</Typography>
          </Paper>
        </Grid>

        {/* Hallazgos y Servicios */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="600">1. Inspección y Hallazgos (Técnico)</Typography>
              <Button size="small" startIcon={<Plus size={16} />} onClick={() => setHallazgoModal(true)}>
                Agregar Hallazgo
              </Button>
            </Box>
            
            {orden.hallazgos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No se registraron hallazgos adicionales.</Typography>
            ) : (
              <ul>
                {orden.hallazgos.map(h => (
                  <li key={h.id}><Typography variant="body2">{h.descripcion}</Typography></li>
                ))}
              </ul>
            )}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="600">2. Servicios y Mano de Obra</Typography>
              <Button size="small" startIcon={<Plus size={16} />} onClick={() => setServicioModal(true)}>
                Agregar Servicio
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Costo Estimado</TableCell>
                  <TableCell align="center">Aprobado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orden.servicios.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.descripcion}</TableCell>
                    <TableCell align="right">S/ {s.precio_estimado}</TableCell>
                    <TableCell align="center">
                      {s.aprobado_cliente ? <Chip label="Sí" color="success" size="small" /> : <Chip label="No" size="small" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {orden.estado !== 'APROBADO' && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary" onClick={handleAprobarTodo} startIcon={<Check size={18} />}>
                  Aprobar Cotización (Simular Cliente)
                </Button>
              </Box>
            )}
            
            {orden.estado === 'APROBADO' && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="success" onClick={() => alert('Integración con POS de Ventas en proceso...')} >
                  Finalizar y Mandar a Caja
                </Button>
              </Box>
            )}

          </Paper>
        </Grid>
      </Grid>

      {/* Modals para agregar cosas rápido */}
      <Dialog open={hallazgoModal} onClose={() => setHallazgoModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Hallazgo</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus margin="dense" label="Descripción del Hallazgo" fullWidth 
            value={nuevoHallazgo} onChange={e => setNuevoHallazgo(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHallazgoModal(false)}>Cancelar</Button>
          <Button onClick={handleAddHallazgo} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={servicioModal} onClose={() => setServicioModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Servicio a Cotizar</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField 
            label="Descripción del Servicio" fullWidth 
            value={nuevoServicio.descripcion} onChange={e => setNuevoServicio({...nuevoServicio, descripcion: e.target.value})}
          />
          <TextField 
            label="Costo (Mano de Obra)" type="number" fullWidth 
            value={nuevoServicio.precio} onChange={e => setNuevoServicio({...nuevoServicio, precio: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServicioModal(false)}>Cancelar</Button>
          <Button onClick={handleAddServicio} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
