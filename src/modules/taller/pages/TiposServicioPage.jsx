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

export default function TiposServicioPage() {
  const [tipos, setTipos] = useState([]);
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
      estado: true
    }
  });

  useEffect(() => {
    fetchTipos();
  }, [page]);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getTiposServicio({ page: page + 1 });
      setTipos(data.results || data);
      setTotalCount(data.count !== undefined ? data.count : (data.results ? data.results.length : data.length));
    } catch (error) {
      console.error('Error fetching tipos servicio:', error);
      Swal.fire('Error', 'Error al cargar los tipos de servicio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tipo = null) => {
    if (tipo) {
      setEditingId(tipo.id);
      reset({
        nombre: tipo.nombre,
        estado: tipo.estado
      });
    } else {
      setEditingId(null);
      reset({
        nombre: '',
        estado: true
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
      if (editingId) {
        await tallerService.actualizarTipoServicio(editingId, data);
        Swal.fire('Éxito', 'Tipo de servicio actualizado correctamente', 'success');
      } else {
        await tallerService.crearTipoServicio(data);
        Swal.fire('Éxito', 'Tipo de servicio creado correctamente', 'success');
      }
      handleCloseModal();
      fetchTipos();
    } catch (error) {
      console.error('Error saving tipo servicio:', error);
      Swal.fire('Error', error.response?.data?.nombre?.[0] || 'Error al guardar el tipo de servicio', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await tallerService.eliminarTipoServicio(id);
        Swal.fire('Eliminado!', 'El tipo de servicio ha sido eliminado.', 'success');
        fetchTipos();
      } catch (error) {
        console.error('Error deleting tipo servicio:', error);
        Swal.fire('Error', 'No se puede eliminar el tipo de servicio porque está siendo usado', 'error');
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a' }}>
          Tipos de Servicio
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            borderRadius: 2
          }}
        >
          Nuevo Tipo
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'center' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : tipos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#64748b' }}>
                    No hay tipos de servicio registrados
                  </TableCell>
                </TableRow>
              ) : (
                tipos.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.nombre}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.estado ? 'Activo' : 'Inactivo'} 
                        size="small"
                        sx={{ 
                          bgcolor: row.estado ? '#dcfce7' : '#fee2e2',
                          color: row.estado ? '#166534' : '#991b1b',
                          fontWeight: 500
                        }} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenModal(row)}
                        sx={{ color: '#2563eb', mr: 1 }}
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(row.id)}
                        sx={{ color: '#ef4444' }}
                      >
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
          rowsPerPageOptions={[25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingId ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                {...register('nombre', { required: 'El nombre es requerido' })}
                label="Nombre del Tipo de Servicio"
                fullWidth
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                placeholder="Ej. Mantenimiento Preventivo"
              />
              
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Estado Activo"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button 
              onClick={handleCloseModal}
              sx={{ color: '#64748b' }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              sx={{
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
