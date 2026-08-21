import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, TablePagination
} from '@mui/material';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [buscandoSunarp, setBuscandoSunarp] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm();
  
  const placaValue = watch('placa');

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const res = await vehiculoService.getVehiculos(page + 1);
      setVehiculos(res.results || res); // Manejar con o sin paginación backend
      setTotalCount(res.count !== undefined ? res.count : (res.results ? res.results.length : res.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los vehículos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
  }, [page]);

  const handleOpenModal = (vehiculo = null) => {
    if (vehiculo) {
      setEditingId(vehiculo.id);
      reset({ 
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        serie: vehiculo.serie,
        color: vehiculo.color,
        motor: vehiculo.motor
      });
    } else {
      setEditingId(null);
      reset({ placa: '', marca: '', modelo: '', serie: '', color: '', motor: '' });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    reset();
  };

  const handleBuscarPlaca = async () => {
    if (!placaValue || placaValue.length < 6) {
      Swal.fire('Aviso', 'Ingrese una placa válida para buscar', 'info');
      return;
    }
    
    setBuscandoSunarp(true);
    try {
      const data = await vehiculoService.buscarPorPlaca(placaValue);
      // Supongamos que la API devuelve { marca, modelo, serie, color, motor }
      if(data) {
        setValue('marca', data.marca || '');
        setValue('modelo', data.modelo || '');
        setValue('serie', data.serie || '');
        setValue('color', data.color || '');
        setValue('motor', data.motor || '');
        Swal.fire('Éxito', 'Datos obtenidos de la API Vehicular', 'success');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se encontraron datos para la placa', 'error');
    } finally {
      setBuscandoSunarp(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await vehiculoService.updateVehiculo(editingId, data);
        Swal.fire('Éxito', 'Vehículo actualizado correctamente', 'success');
      } else {
        await vehiculoService.createVehiculo(data);
        Swal.fire('Éxito', 'Vehículo registrado correctamente', 'success');
      }
      handleCloseModal();
      fetchVehiculos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un error al guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El vehículo se eliminará de forma lógica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await vehiculoService.deleteVehiculo(id);
        Swal.fire('Eliminado!', 'El vehículo ha sido eliminado.', 'success');
        fetchVehiculos();
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

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading ? (
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
                  <TableCell><strong>Motor</strong></TableCell>
                  <TableCell><strong>Color</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No hay vehículos registrados.</TableCell>
                  </TableRow>
                ) : (
                  vehiculos.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.placa}</TableCell>
                      <TableCell>{row.marca}</TableCell>
                      <TableCell>{row.modelo}</TableCell>
                      <TableCell>{row.motor || '-'}</TableCell>
                      <TableCell>{row.color || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                          <Edit2 size={18} />
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
        {!loading && totalCount > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[25]}
            labelRowsPerPage="Filas por página:"
          />
        )}
      </Paper>

      {/* Modal Formulario */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} display="flex" gap={1}>
                <TextField
                  label="Placa"
                  type="text"
                  fullWidth
                  variant="outlined"
                  {...register('placa', { required: 'La placa es obligatoria' })}
                  error={!!errors.placa}
                  helperText={errors.placa?.message}
                />
                {!editingId && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleBuscarPlaca}
                    disabled={buscandoSunarp}
                    sx={{ minWidth: '120px' }}
                  >
                    {buscandoSunarp ? <CircularProgress size={20} /> : <><Search size={16} style={{marginRight: 4}} /> Consultar API</>}
                  </Button>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField label="Marca" fullWidth {...register('marca', { required: 'Requerido' })} error={!!errors.marca} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Modelo" fullWidth {...register('modelo', { required: 'Requerido' })} error={!!errors.modelo} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Motor" fullWidth {...register('motor')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Serie" fullWidth {...register('serie')} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Color" fullWidth {...register('color')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
