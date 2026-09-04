import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton, InputAdornment, TablePagination 
} from '@mui/material';
import { Plus, Edit, Trash2, Search as SearchIcon } from 'lucide-react';
import VehiculosTransporteForm from '../components/VehiculosTransporteForm';
import { useVehiculosTransporte } from '../hooks/useVehiculosTransporte';
import Swal from 'sweetalert2';

const VehiculosTransportePage = () => {
  const { 
    vehiculos, loading, cargarVehiculos, eliminarVehiculo, 
    totalCount 
  } = useVehiculosTransporte();
  
  const [openModal, setOpenModal] = useState(false);
  const [vehiculoEdit, setVehiculoEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination states (MUI TablePagination uses 0-indexed pages)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debounce para búsquedas en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    cargarVehiculos(page + 1, debouncedSearch);
  }, [cargarVehiculos, debouncedSearch, page]);

  const handleOpenModal = (vehiculo = null) => {
    setVehiculoEdit(vehiculo);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setVehiculoEdit(null);
  };

  const handleSuccess = () => {
    cargarVehiculos(page + 1, debouncedSearch);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El vehículo se eliminará del listado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await eliminarVehiculo(id);
        if (success) {
          cargarVehiculos(page + 1, debouncedSearch);
        }
      }
    });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Vehículos de Transporte
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Administra el listado de vehículos utilizados para el traslado de mercadería (Flota).
          </Typography>
        </Box>
      </Box>

      {/* TOOLBAR */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'grey.200' }}>
          <TextField
            size="small"
            placeholder="Buscar por placa o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Button 
            variant="contained" 
            startIcon={<Plus size={20} />} 
            onClick={() => handleOpenModal()}
          >
            Nuevo Vehículo
          </Button>
        </Box>

        {/* TABLE */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Placa</strong></TableCell>
                <TableCell><strong>Marca / Modelo</strong></TableCell>
                <TableCell><strong>Certificado MTC</strong></TableCell>
                <TableCell><strong>Configuración</strong></TableCell>
                <TableCell><strong>Carga Útil</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Cargando vehículos...</TableCell>
                </TableRow>
              ) : vehiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron resultados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vehiculos.map((vehiculo) => (
                  <TableRow key={vehiculo.id} hover>
                    <TableCell>{vehiculo.placa}</TableCell>
                    <TableCell>{vehiculo.marca} {vehiculo.modelo}</TableCell>
                    <TableCell>{vehiculo.certificado_inscripcion || '-'}</TableCell>
                    <TableCell>{vehiculo.configuracion_vehicular || '-'}</TableCell>
                    <TableCell>{vehiculo.carga_util ? `${vehiculo.carga_util} (Kg/Ton)` : '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenModal(vehiculo)}>
                        <Edit size={18} />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(vehiculo.id)}>
                        <Trash2 size={18} />
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
          count={totalCount || 0}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelDisplayedRows={({ from, to, count }) => {
            return `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`;
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>
      
      {openModal && (
        <VehiculosTransporteForm 
          open={openModal} 
          onClose={handleCloseModal} 
          onSuccess={handleSuccess}
          vehiculoEdit={vehiculoEdit}
        />
      )}
    </Box>
  );
};

export default VehiculosTransportePage;
