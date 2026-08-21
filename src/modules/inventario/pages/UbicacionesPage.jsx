import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

// Custom hook: separa la lógica de la vista
function useUbicaciones() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resUbicaciones, resAlmacenes] = await Promise.all([
        inventarioService.getUbicaciones(),
        inventarioService.getAlmacenes(),
      ]);
      setUbicaciones(resUbicaciones.results || resUbicaciones);
      setAlmacenes(resAlmacenes.results || resAlmacenes);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de ubicaciones.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ubicaciones, almacenes, loading, fetchData };
}

export default function UbicacionesPage() {
  const { ubicaciones, almacenes, loading, fetchData } = useUbicaciones();
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();

  const handleOpenModal = (ubicacion = null) => {
    if (ubicacion) {
      setEditingId(ubicacion.id);
      reset({
        almacen: ubicacion.almacen,
        codigo: ubicacion.codigo,
        pasillo: ubicacion.pasillo || '',
        estante: ubicacion.estante || '',
        casillero: ubicacion.casillero || '',
        descripcion: ubicacion.descripcion || '',
      });
    } else {
      setEditingId(null);
      reset({ almacen: '', codigo: '', pasillo: '', estante: '', casillero: '', descripcion: '' });
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
        await inventarioService.updateUbicacion(editingId, data);
        Swal.fire('Éxito', 'Ubicación actualizada correctamente.', 'success');
      } else {
        await inventarioService.createUbicacion(data);
        Swal.fire('Éxito', 'Ubicación creada correctamente.', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
      Swal.fire('Error', 'No se pudo guardar la ubicación. Verifica que el código no esté duplicado en el mismo almacén.', 'error');
    }
  };

  const handleDelete = async (id, codigo) => {
    const result = await Swal.fire({
      title: `¿Eliminar ubicación "${codigo}"?`,
      text: 'Solo se puede eliminar si no tiene stock asociado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        await inventarioService.deleteUbicacion(id);
        Swal.fire('Eliminada', 'La ubicación ha sido eliminada.', 'success');
        fetchData();
      } catch (error) {
        console.error('Error al eliminar ubicación:', error);
        Swal.fire('Error', 'No se pudo eliminar. Es posible que tenga stock o movimientos asociados.', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Ubicaciones Físicas</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
        >
          Nueva Ubicación
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
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Almacén</strong></TableCell>
                  <TableCell><strong>Sucursal</strong></TableCell>
                  <TableCell><strong>Pasillo</strong></TableCell>
                  <TableCell><strong>Estante</strong></TableCell>
                  <TableCell><strong>Casillero</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ubicaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay ubicaciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  ubicaciones.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell><strong style={{ color: '#1976d2' }}>{row.codigo}</strong></TableCell>
                      <TableCell>{row.almacen_nombre}</TableCell>
                      <TableCell>{row.sucursal_nombre}</TableCell>
                      <TableCell>{row.pasillo || '—'}</TableCell>
                      <TableCell>{row.estante || '—'}</TableCell>
                      <TableCell>{row.casillero || '—'}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenModal(row)} title="Editar">
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(row.id, row.codigo)} title="Eliminar">
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

      {/* Modal Formulario */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Ubicación' : 'Nueva Ubicación Física'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                  <Controller
                    name="almacen"
                    control={control}
                    rules={{ required: 'El almacén es requerido' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.almacen} sx={{ minWidth: 200 }}>
                        <InputLabel>Almacén *</InputLabel>
                        <Select {...field} label="Almacén *" value={field.value || ''}>
                          {almacenes.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.sucursal_nombre} → {a.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.almacen && (
                          <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                            {errors.almacen.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Código *  (Ej: A-12-3)"
                  fullWidth
                  {...register('codigo', { required: 'El código es requerido' })}
                  error={!!errors.codigo}
                  helperText={errors.codigo?.message || 'Debe ser único dentro del almacén'}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Pasillo" fullWidth {...register('pasillo')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Estante" fullWidth {...register('estante')} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Casillero" fullWidth {...register('casillero')} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Descripción (opcional)" fullWidth {...register('descripcion')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
