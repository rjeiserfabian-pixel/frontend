import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Checkbox, FormControlLabel
} from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/unidades-medida/');
      setUnidades(res.data.results || res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar las unidades de medida', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const handleOpenModal = (unidad = null) => {
    if (unidad) {
      setEditingId(unidad.id);
      reset({ 
        nombre: unidad.nombre,
        abreviatura: unidad.abreviatura,
        permite_decimales: unidad.permite_decimales
      });
    } else {
      setEditingId(null);
      reset({ nombre: '', abreviatura: '', permite_decimales: false });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/inventario/unidades-medida/${editingId}/`, data);
        Swal.fire('Éxito', 'Unidad actualizada correctamente', 'success');
      } else {
        await api.post('/inventario/unidades-medida/', data);
        Swal.fire('Éxito', 'Unidad creada correctamente', 'success');
      }
      handleCloseModal();
      fetchUnidades();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: 'Ocurrió un error al guardar la unidad de medida.'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "La unidad de medida se eliminará.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/inventario/unidades-medida/${id}/`);
        Swal.fire('Eliminada!', 'La unidad ha sido eliminada.', 'success');
        fetchUnidades();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar la unidad de medida', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Unidades de Medida</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />} 
          onClick={() => handleOpenModal()}
        >
          Nueva Unidad
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
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Abreviatura</strong></TableCell>
                  <TableCell><strong>¿Permite Decimales?</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No hay unidades registradas.</TableCell>
                  </TableRow>
                ) : (
                  unidades.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.abreviatura}</TableCell>
                      <TableCell>{row.permite_decimales ? 'Sí' : 'No'}</TableCell>
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
      </Paper>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre"
              type="text"
              fullWidth
              variant="outlined"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            <TextField
              margin="dense"
              label="Abreviatura"
              type="text"
              fullWidth
              variant="outlined"
              {...register('abreviatura', { required: 'La abreviatura es obligatoria' })}
              error={!!errors.abreviatura}
              helperText={errors.abreviatura?.message}
              sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <Controller
                name="permite_decimales"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Permitir venta fraccionada/decimal (ej. Litros, Metros)"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
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
