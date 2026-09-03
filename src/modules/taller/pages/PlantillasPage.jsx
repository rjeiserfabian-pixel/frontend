import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Chip, TablePagination
} from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio_base: '',
      tiempo_estimado_minutos: '',
      activo: true
    }
  });

  useEffect(() => {
    fetchPlantillas();
  }, [page]);

  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getPlantillas({ page: page + 1 });
      setPlantillas(data.results || data);
      setTotalCount(data.count !== undefined ? data.count : (data.results ? data.results.length : data.length));
    } catch (error) {
      console.error('Error fetching plantillas:', error);
      Swal.fire('Error', 'Error al cargar las plantillas de servicio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plantilla = null) => {
    if (plantilla) {
      setEditingId(plantilla.id);
      reset({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion || '',
        precio_base: plantilla.precio_base || '',
        tiempo_estimado_minutos: plantilla.tiempo_estimado_minutos || '',
        activo: plantilla.activo
      });
    } else {
      setEditingId(null);
      reset({
        nombre: '',
        descripcion: '',
        precio_base: '',
        tiempo_estimado_minutos: '',
        activo: true
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    reset();
    setEditingId(null);
  };

  const onSubmit = async (data) => {
    try {
      const dataToSend = {
        ...data,
        precio_base: data.precio_base ? parseFloat(data.precio_base) : null,
        tiempo_estimado_minutos: data.tiempo_estimado_minutos ? parseInt(data.tiempo_estimado_minutos, 10) : null
      };

      if (editingId) {
        await tallerService.actualizarPlantilla(editingId, dataToSend);
        Swal.fire('Éxito', 'Plantilla actualizada correctamente', 'success');
      } else {
        await tallerService.crearPlantilla(dataToSend);
        Swal.fire('Éxito', 'Plantilla creada correctamente', 'success');
      }
      handleCloseModal();
      fetchPlantillas();
    } catch (error) {
      console.error('Error saving plantilla:', error);
      let errorMessage = 'Hubo un error al guardar la plantilla.';
      
      if (error.response && error.response.data) {
        // En Django REST DRF los errores de validacion vienen en el cuerpo directamente (o en un array/objeto)
        const errData = error.response.data;
        if (errData.nombre) {
          errorMessage = 'Ya existe una plantilla de servicio con este nombre.';
        } else if (typeof errData === 'object') {
          const firstKey = Object.keys(errData)[0];
          if (firstKey && Array.isArray(errData[firstKey])) {
            errorMessage = errData[firstKey][0];
          }
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: errorMessage,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "La plantilla se eliminará permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await tallerService.eliminarPlantilla(id);
        Swal.fire('Eliminada!', 'La plantilla ha sido eliminada.', 'success');
        fetchPlantillas();
      } catch (error) {
        console.error('Error deleting plantilla:', error);
        Swal.fire('Error', 'No se pudo eliminar la plantilla', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Plantillas de Servicio Preventivo</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
        >
          Nueva Plantilla
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell align="right"><strong>Precio Base (S/)</strong></TableCell>
                <TableCell align="right"><strong>Tiempo Est. (Min)</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : plantillas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No hay plantillas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                plantillas.map((plantilla) => (
                  <TableRow key={plantilla.id} hover>
                    <TableCell fontWeight="500">{plantilla.nombre}</TableCell>
                    <TableCell>{plantilla.descripcion || '-'}</TableCell>
                    <TableCell align="right">{plantilla.precio_base || '-'}</TableCell>
                    <TableCell align="right">{plantilla.tiempo_estimado_minutos || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={plantilla.activo ? 'Activo' : 'Inactivo'} 
                        color={plantilla.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleOpenModal(plantilla)} color="primary" size="small">
                        <Edit size={18} />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(plantilla.id)} color="error" size="small">
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre del Servicio"
              fullWidth
              variant="outlined"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            
            <TextField
              label="Descripción (opcional)"
              fullWidth
              multiline
              rows={2}
              {...register('descripcion')}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Precio Base (S/)"
                type="number"
                inputProps={{ step: "0.01" }}
                fullWidth
                {...register('precio_base', { 
                  min: { value: 0, message: 'No puede ser negativo' }
                })}
                error={!!errors.precio_base}
                helperText={errors.precio_base?.message}
              />
              <TextField
                label="Tiempo Est. (Minutos)"
                type="number"
                fullWidth
                {...register('tiempo_estimado_minutos', {
                  min: { value: 1, message: 'Debe ser mayor a 0' }
                })}
                error={!!errors.tiempo_estimado_minutos}
                helperText={errors.tiempo_estimado_minutos?.message}
              />
            </Box>
            
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Activo (Visible en recepción)"
                />
              )}
            />
            
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
