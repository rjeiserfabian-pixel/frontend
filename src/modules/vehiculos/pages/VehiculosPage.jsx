import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  CircularProgress, TablePagination, TextField 
} from '@mui/material';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';
import VehiculosForm from '../components/VehiculosForm';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);

  // Pagination and search
  const [page, setPage] = useState(0); // MUI TablePagination uses 0-indexed pages
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  const fetchVehiculos = useCallback(async (currentPage, currentSearch) => {
    try {
      setLoading(true);
      const res = await vehiculoService.getVehiculos(currentPage + 1, currentSearch);
      setVehiculos(res.results || res); 
      setTotalCount(res.count !== undefined ? res.count : (res.results ? res.results.length : res.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los vehículos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Regla 1.3: Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehiculos(page, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search, fetchVehiculos]);

  const handleOpenModal = (vehiculo = null) => {
    setEditingVehiculo(vehiculo);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingVehiculo(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El vehículo se eliminará de forma lógica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await vehiculoService.deleteVehiculo(id);
        Swal.fire('Eliminado!', 'El vehículo ha sido eliminado.', 'success');
        fetchVehiculos(page, search);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar el vehículo', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestión de Vehículos</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />} 
          onClick={() => handleOpenModal()}
        >
          Nuevo Vehículo
        </Button>
      </Box>

      {/* BARRA DE BÚSQUEDA */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', boxShadow: 1 }}>
        <TextField 
          label="Buscar (Placa/Marca)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Volver a la primera página al buscar
          }}
          sx={{ minWidth: 300 }}
          InputProps={{ endAdornment: <Search size={20} style={{ opacity: 0.5 }} /> }}
        />
        <Box sx={{ flexGrow: 1 }} />
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading && vehiculos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Placa</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell><strong>Modelo</strong></TableCell>
                  <TableCell><strong>Clase</strong></TableCell>
                  <TableCell><strong>Color</strong></TableCell>
                  <TableCell align="right"><strong>Kilometraje</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No hay vehículos registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiculos.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.placa}</TableCell>
                      <TableCell>{row.marca}</TableCell>
                      <TableCell>{row.modelo}</TableCell>
                      <TableCell>{row.clase || '-'}</TableCell>
                      <TableCell>{row.color || '-'}</TableCell>
                      <TableCell align="right">{row.kilometraje_actual ? `${row.kilometraje_actual} km` : '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                          <Edit size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
      </Paper>

      {/* Componente Modal refactorizado */}
      <VehiculosForm 
        open={openModal} 
        onClose={handleCloseModal} 
        onSuccess={() => fetchVehiculos(page, search)}
        vehiculoEdit={editingVehiculo}
      />
    </Box>
  );
}
