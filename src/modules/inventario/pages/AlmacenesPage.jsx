import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

// Custom hook: separa la lógica de la vista
function useAlmacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resAlmacenes, resSucursales] = await Promise.all([
        inventarioService.getAlmacenes(),
        inventarioService.getSucursales(),
      ]);
      setAlmacenes(resAlmacenes.results || resAlmacenes);
      setSucursales(resSucursales.results || resSucursales);
    } catch (error) {
      console.error('Error al cargar almacenes:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de almacenes.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { almacenes, sucursales, loading, fetchData };
}

export default function AlmacenesPage() {
  const { almacenes, sucursales, loading, fetchData } = useAlmacenes();
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();

  const handleOpenModal = (almacen = null) => {
    if (almacen) {
      setEditingId(almacen.id);
      reset({
        nombre: almacen.nombre,
        descripcion: almacen.descripcion || '',
        sucursal: almacen.sucursal,
      });
    } else {
      setEditingId(null);
      reset({ nombre: '', descripcion: '', sucursal: '' });
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
        await inventarioService.updateAlmacen(editingId, data);
        Swal.fire('Éxito', 'Almacén actualizado correctamente.', 'success');
      } else {
        await inventarioService.createAlmacen(data);
        Swal.fire('Éxito', 'Almacén creado correctamente.', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error al guardar almacén:', error);
      Swal.fire('Error', 'No se pudo guardar el almacén.', 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Desactivar "${nombre}"?`,
      text: 'El almacén quedará inactivo pero sus datos se conservarán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        await inventarioService.deleteAlmacen(id);
        Swal.fire('Desactivado', 'El almacén ha sido desactivado.', 'success');
        fetchData();
      } catch (error) {
        console.error('Error al desactivar almacén:', error);
        Swal.fire('Error', 'No se pudo desactivar el almacén.', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Almacenes</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
        >
          Nuevo Almacén
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
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Sucursal</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {almacenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay almacenes registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  almacenes.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell><strong>{row.nombre}</strong></TableCell>
                      <TableCell>{row.sucursal_nombre}</TableCell>
                      <TableCell>{row.descripcion || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.estado ? 'Activo' : 'Inactivo'}
                          color={row.estado ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenModal(row)} title="Editar">
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(row.id, row.nombre)} title="Desactivar">
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
        <DialogTitle>{editingId ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Controller para el Select de MUI con react-hook-form */}
              <Controller
                name="sucursal"
                control={control}
                rules={{ required: 'La sucursal es requerida' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.sucursal}>
                    <InputLabel>Sucursal *</InputLabel>
                    <Select {...field} label="Sucursal *" value={field.value || ''}>
                      {sucursales.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                      ))}
                    </Select>
                    {errors.sucursal && (
                      <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                        {errors.sucursal.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <TextField
                label="Nombre del Almacén *"
                fullWidth
                {...register('nombre', { required: 'El nombre es requerido' })}
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
            </Box>
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
