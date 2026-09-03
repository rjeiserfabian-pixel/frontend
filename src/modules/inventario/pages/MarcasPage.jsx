import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, TablePagination
} from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

export default function MarcasPage() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      const res = await inventarioService.getMarcas({ page: page + 1 });
      setMarcas(res.results || res);
      setTotalCount(res.count !== undefined ? res.count : (res.results ? res.results.length : res.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar las marcas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, [page]);

  const handleOpenModal = (marca = null) => {
    if (marca) {
      setEditingId(marca.id);
      reset({ nombre: marca.nombre });
    } else {
      setEditingId(null);
      reset({ nombre: '' });
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
        await inventarioService.updateMarca(editingId, data);
        Swal.fire('Éxito', 'Marca actualizada correctamente', 'success');
      } else {
        await inventarioService.createMarca(data);
        Swal.fire('Éxito', 'Marca creada correctamente', 'success');
      }
      handleCloseModal();
      fetchMarcas();
    } catch (error) {
      console.error(error);
      let errorMessage = 'Hubo un error al guardar la marca.';
      
      if (error.response && error.response.data && error.response.data.errores) {
        const errData = error.response.data.errores;
        if (errData.nombre) {
          errorMessage = 'Ya existe una marca registrada con este nombre.';
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
      text: "La marca se eliminará del listado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await inventarioService.deleteMarca(id);
        Swal.fire('Eliminada!', 'La marca ha sido eliminada.', 'success');
        fetchMarcas();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar la marca', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestión de Marcas de Repuesto</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />} 
          onClick={() => handleOpenModal()}
        >
          Nueva Marca
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
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marcas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No hay marcas registradas.</TableCell>
                  </TableRow>
                ) : (
                  marcas.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
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
        <DialogTitle>{editingId ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre de la Marca"
              type="text"
              fullWidth
              variant="outlined"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
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
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
