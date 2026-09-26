import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, TablePagination, Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

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
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const resRoles = await api.get(`seguridad/roles/?page=${page + 1}`);
      const rolesData = resRoles.data.data;
      setRoles(rolesData.results ? rolesData.results : (Array.isArray(rolesData) ? rolesData : []));
      setTotalCount(rolesData.count !== undefined ? rolesData.count : (rolesData.results ? rolesData.results.length : rolesData.length));
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      title: 'Estas seguro?',
      text: 'El rol sera eliminado permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`seguridad/roles/${id}/`);
        fetchData();
        Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success');
      } catch {
        Swal.fire('Error', 'No se pudo eliminar el rol. Puede que este asignado a usuarios.', 'error');
      }
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: C.brandLight, fontWeight: 800, letterSpacing: 0.8 }}>
            Seguridad
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 850, color: C.text, lineHeight: 1.08 }}>
            Gestion de Roles y Permisos
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, mt: 0.75 }}>
            Crea los roles del sistema y entra a cada uno para configurar sus permisos.
          </Typography>
        </Box>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpen()}
          >
            Nuevo Rol
          </Button>
        )}
      </Box>

      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          background:
            `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 42%), ${C.surface}`,
          border: `1px solid ${C.border}`,
          boxShadow: S.card,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rol</TableCell>
                <TableCell align="right">Acciones</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: C.brandLight,
                            bgcolor: alpha(C.brand, 0.12),
                            border: `1px solid ${alpha(C.brandLight, 0.24)}`,
                            flexShrink: 0,
                          }}
                        >
                          <ShieldCheck size={18} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight="800" color={C.text}>
                            {rol.nombre}
                          </Typography>
                          <Typography variant="body2" color={C.textMuted}>
                            {rol.descripcion || 'Sin descripcion'}
                          </Typography>
                        </Box>
                        {rol.es_sistema && (
                          <Chip
                            label="Sistema"
                            size="small"
                            variant="outlined"
                            sx={{
                              ml: { xs: 0, sm: 1 },
                              color: C.blue,
                              borderColor: alpha(C.blue, 0.36),
                              bgcolor: alpha(C.blue, 0.08),
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => navigate(`/roles/${idRol}/permisos`)}
                        size="small"
                        sx={{ mr: 1, color: C.brandLight, bgcolor: alpha(C.brand, 0.08) }}
                        title="Configurar permisos"
                      >
                        <ShieldCheck size={18} />
                      </IconButton>
                      {puedeEditar && (
                        <IconButton onClick={() => handleOpen(rol)} size="small" sx={{ mr: 1, color: C.blue }} title="Editar rol">
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
                  <TableCell colSpan={2} align="center" sx={{ py: 4, color: C.textMuted }}>
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
            labelRowsPerPage="Filas por pagina:"
          />
        )}
      </Paper>

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle fontWeight="bold">
            {editingId ? 'Editar Rol' : 'Nuevo Rol'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            <TextField
              label="Nombre del Rol (ej. Vendedor, Mecanico)"
              fullWidth
              size="small"
              {...register('nombre', { required: 'Requerido' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
            <TextField
              label="Descripcion"
              fullWidth
              multiline
              rows={3}
              size="small"
              {...register('descripcion')}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={handleClose} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
