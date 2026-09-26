import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Chip, TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

// Lógica extraída a un custom hook para mantener la vista limpia
function useSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSucursales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inventarioService.getSucursales({ page: page + 1 });
      setSucursales(data.results || data);
      setTotalCount(data.count !== undefined ? data.count : (data.results ? data.results.length : data.length));
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de sucursales.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSucursales();
  }, [fetchSucursales]);

  return { sucursales, loading, fetchSucursales, page, setPage, rowsPerPage, setRowsPerPage, totalCount };
}

export default function SucursalesPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('INVENTARIO.ALMACENES.CREAR');
  const puedeEditar = tienePermiso('INVENTARIO.ALMACENES.EDITAR');
  const puedeEliminar = tienePermiso('INVENTARIO.ALMACENES.ELIMINAR');

  const { sucursales, loading, fetchSucursales, page, setPage, rowsPerPage, totalCount } = useSucursales();
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const handleOpenModal = (sucursal = null) => {
    if (sucursal) {
      setEditingId(sucursal.id);
      reset({ nombre: sucursal.nombre, direccion: sucursal.direccion || '' });
    } else {
      setEditingId(null);
      reset({ nombre: '', direccion: '' });
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
        await inventarioService.updateSucursal(editingId, data);
        Swal.fire('Éxito', 'Sucursal actualizada correctamente.', 'success');
      } else {
        await inventarioService.createSucursal(data);
        Swal.fire('Éxito', 'Sucursal creada correctamente.', 'success');
      }
      handleCloseModal();
      fetchSucursales();
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      Swal.fire('Error', 'No se pudo guardar la sucursal.', 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Desactivar "${nombre}"?`,
      text: 'La sucursal quedará inactiva pero sus datos se conservarán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        await inventarioService.deleteSucursal(id);
        Swal.fire('Desactivada', 'La sucursal ha sido desactivada.', 'success');
        fetchSucursales();
      } catch (error) {
        console.error('Error al desactivar sucursal:', error);
        Swal.fire('Error', 'No se pudo desactivar la sucursal.', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Sucursales</Typography>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenModal()}
          >
            Nueva Sucursal
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Dirección</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sucursales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay sucursales registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  sucursales.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell><strong>{row.nombre}</strong></TableCell>
                      <TableCell>{row.direccion || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.estado ? 'Activa' : 'Inactiva'}
                          color={row.estado ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {puedeEditar && (
                          <IconButton color="secondary" onClick={() => handleOpenModal(row)} title="Editar" size="small" sx={{ mr: 1, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}>
                            <Edit size={18} />
                          </IconButton>
                        )}
                        {puedeEliminar && (
                          <IconButton color="error" onClick={() => handleDelete(row.id, row.nombre)} title="Desactivar" size="small" sx={{ bgcolor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}` }}>
                            <Trash2 size={18} />
                          </IconButton>
                        )}
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
        <DialogTitle>{editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre *"
                fullWidth
                {...register('nombre', { required: 'El nombre es requerido' })}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />
              <TextField
                label="Dirección (opcional)"
                fullWidth
                multiline
                rows={2}
                {...register('direccion')}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {/* Botón deshabilitado durante el submit para evitar doble envío */}
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
