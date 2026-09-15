import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, TablePagination
} from '@mui/material';
import { Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../core/api/axios';

import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';

export default function RolesPage() {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('SEGURIDAD.ROLES.CREAR');
  const puedeEditar = tienePermiso('SEGURIDAD.ROLES.EDITAR');
  const puedeEliminar = tienePermiso('SEGURIDAD.ROLES.ELIMINAR');

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const resRoles = await api.get(`seguridad/roles/?page=${page + 1}`);
      const rolesData = resRoles.data.data;
      setRoles(rolesData.results ? rolesData.results : (Array.isArray(rolesData) ? rolesData : []));
      setTotalCount(rolesData.count !== undefined ? rolesData.count : (rolesData.results ? rolesData.results.length : rolesData.length));
    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleOpen = (rol = null) => {
    if (rol) {
      setEditingId(rol.id_rol || rol.id);
      reset({ nombre: rol.nombre, descripcion: rol.descripcion });
    } else {
      setEditingId(null);
      reset({ nombre: '', descripcion: '' });
    }
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        codigo: data.nombre.toUpperCase().replace(/\s+/g, '_')
      };

      if (editingId) {
        await api.put(`seguridad/roles/${editingId}/`, payload);
      } else {
        await api.post('seguridad/roles/', payload);
      }
      handleClose();
      fetchData();

      Swal.fire({
        icon: 'success',
        title: editingId ? 'Rol actualizado' : 'Rol creado',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      Swal.fire('Error', error.response?.data?.mensaje || 'Revisa los datos', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El rol será eliminado permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`seguridad/roles/${id}/`);
        fetchData();
        Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el rol. Puede que esté asignado a usuarios.', 'error');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="slate.800">
            Gestión de Roles y Permisos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea los roles del sistema y entra a cada uno para configurar sus permisos.
          </Typography>
        </Box>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpen()}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Nuevo Rol
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : roles.map((rol) => {
                const idRol = rol.id_rol || rol.id;
                return (
                  <TableRow key={idRol} hover>
                    <TableCell>
                      <Typography fontWeight="600" color="slate.800">
                        {rol.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rol.descripcion || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/roles/${idRol}/permisos`)}
                        size="small"
                        sx={{ mr: 1 }}
                        title="Configurar permisos"
                      >
                        <ShieldCheck size={18} />
                      </IconButton>
                      {puedeEditar && (
                        <IconButton color="primary" onClick={() => handleOpen(rol)} size="small" sx={{ mr: 1 }} title="Editar rol">
                          <Edit size={18} />
                        </IconButton>
                      )}
                      {puedeEliminar && (
                        <IconButton color="error" onClick={() => handleDelete(idRol)} size="small" disabled={rol.es_sistema} title="Eliminar rol">
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No se encontraron roles.
                  </TableCell>
                </TableRow>
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

      {/* Modal Crear/Editar Rol */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle fontWeight="bold">
            {editingId ? 'Editar Rol' : 'Nuevo Rol'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            <TextField
              label="Nombre del Rol (ej. Vendedor, Mecánico)"
              fullWidth
              size="small"
              {...register('nombre', { required: 'Requerido' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              size="small"
              {...register('descripcion')}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>
              {editingId ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
