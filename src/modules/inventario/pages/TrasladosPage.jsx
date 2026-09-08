import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Chip
} from '@mui/material';
import { ArrowRightLeft, Printer } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import ModalNuevoTraslado from '../components/ModalNuevoTraslado';
import { generarTicketTraslado } from '../utils/printTraslado';

export default function TrasladosPage() {
  const [traslados, setTraslados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const fetchTraslados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/traslados/');
      setTraslados(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los traslados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraslados();
  }, []);

  const handlePrint = (traslado) => {
    generarTicketTraslado(traslado);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Movimientos de Almacén
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ArrowRightLeft size={18} />}
          onClick={() => setOpenModal(true)}
        >
          Nuevo Movimiento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>Fecha</b></TableCell>
              <TableCell><b>Origen</b></TableCell>
              <TableCell><b>Destino</b></TableCell>
              <TableCell><b>Usuario</b></TableCell>
              <TableCell><b>Observaciones</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : traslados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>No hay traslados registrados</TableCell>
              </TableRow>
            ) : (
              traslados.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {new Date(item.fecha_traslado).toLocaleDateString()} {new Date(item.fecha_traslado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{item.almacen_origen_nombre}</TableCell>
                  <TableCell>{item.almacen_destino_nombre}</TableCell>
                  <TableCell>{item.usuario_nombre}</TableCell>
                  <TableCell>{item.observaciones || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handlePrint(item)} title="Imprimir Nota">
                      <Printer size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {openModal && (
        <ModalNuevoTraslado 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          onSuccess={() => {
            setOpenModal(false);
            fetchTraslados();
          }} 
        />
      )}
    </Box>
  );
}
