import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress 
} from '@mui/material';
import { Plus, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tallerService } from '../services/tallerService';

export default function OrdenesTrabajoPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getOrdenes();
      setOrdenes(data.results || data); // Adjust according to DRF pagination
    } catch (error) {
      console.error('Error fetching ordenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    const colors = {
      RECEPCIONADO: 'default',
      INSPECCION: 'info',
      ESPERANDO_APROBACION: 'warning',
      APROBADO: 'primary',
      FINALIZADO: 'success',
      FACTURADO: 'success',
      CANCELADO: 'error'
    };
    return colors[estado] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="600">Órdenes de Trabajo</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => navigate('/taller/ordenes/nueva')}
        >
          Nueva Orden
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nro Orden</TableCell>
                <TableCell>Fecha Ingreso</TableCell>
                <TableCell>Placa</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Mecánico</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : ordenes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay órdenes registradas.
                  </TableCell>
                </TableRow>
              ) : (
                ordenes.map((orden) => (
                  <TableRow key={orden.id} hover>
                    <TableCell fontWeight="500">OT-{orden.numero}</TableCell>
                    <TableCell>{new Date(orden.fecha_ingreso).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={orden.vehiculo_placa} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{orden.cliente_nombre}</TableCell>
                    <TableCell>{orden.mecanico_nombre || 'Sin Asignar'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={orden.estado.replace('_', ' ')} 
                        color={getStatusColor(orden.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => navigate(`/taller/ordenes/${orden.id}`)} color="primary">
                        <Eye size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
