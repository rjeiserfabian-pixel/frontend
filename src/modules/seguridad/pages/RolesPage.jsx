import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, Card, CardContent, Checkbox, FormControlLabel,
  Select, MenuItem, FormControl, Divider, Alert, TablePagination, Radio
} from '@mui/material';
import { Plus, Edit2, Trash2, Shield, Settings2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../core/api/axios';

import Swal from 'sweetalert2';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [todosPermisos, setTodosPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Estados para la configuración de permisos
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisosAsignados, setPermisosAsignados] = useState({}); // { id_permiso: alcance }
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRoles, resPermisos] = await Promise.all([
        api.get(`seguridad/roles/?page=${page + 1}`),
        api.get('seguridad/permisos/')
      ]);
      
      const rolesData = resRoles.data.data;
      setRoles(rolesData.results ? rolesData.results : (Array.isArray(rolesData) ? rolesData : []));
      setTotalCount(rolesData.count !== undefined ? rolesData.count : (rolesData.results ? rolesData.results.length : rolesData.length));

      const permisosData = resPermisos.data.data;
      setTodosPermisos(permisosData.results ? permisosData.results : (Array.isArray(permisosData) ? permisosData : []));
    } catch (error) {
      console.error("Error al cargar datos:", error);
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
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`seguridad/roles/${id}/`);
        if (rolSeleccionado && (rolSeleccionado.id_rol === id || rolSeleccionado.id === id)) {
           setRolSeleccionado(null);
        }
        fetchData();
        Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el rol. Puede que esté asignado a usuarios.', 'error');
      }
    }
  };

  // Configuración de permisos
  const seleccionarRol = (rol) => {
    // Si se hace clic en el rol que ya está seleccionado, lo desmarcamos
    if (rolSeleccionado && (rolSeleccionado.id_rol === rol.id_rol || rolSeleccionado.id === rol.id)) {
      setRolSeleccionado(null);
      setPermisosAsignados({});
      return;
    }

    setRolSeleccionado(rol);
    // Mapear los permisos actuales del rol seleccionado
    const asignados = {};
    if (rol.permisos) {
      rol.permisos.forEach(rp => {
        asignados[rp.permiso.id_permiso] = rp.alcance;
      });
    }
    setPermisosAsignados(asignados);
  };

  const togglePermiso = (id_permiso) => {
    setPermisosAsignados(prev => {
      const nuevo = { ...prev };
      if (nuevo[id_permiso]) {
        delete nuevo[id_permiso]; // Quitar
      } else {
        nuevo[id_permiso] = 'PROPIO'; // Asignar con alcance por defecto
      }
      return nuevo;
    });
  };

  const cambiarAlcance = (id_permiso, alcance) => {
    setPermisosAsignados(prev => ({
      ...prev,
      [id_permiso]: alcance
    }));
  };

  const guardarPermisos = async () => {
    if (!rolSeleccionado) return;
    const idRol = rolSeleccionado.id_rol || rolSeleccionado.id;
    
    setGuardandoPermisos(true);
    
    const payload = {
      permisos: Object.entries(permisosAsignados).map(([id_permiso, alcance]) => ({
        id_permiso,
        alcance
      }))
    };

    try {
      await api.post(`seguridad/roles/${idRol}/permisos/`, payload);
      fetchData(); // Refrescar para tener el rol actualizado en la tabla
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Permisos actualizados correctamente',
        showConfirmButton: false,
        timer: 1500,
        toast: true
      });
    } catch (error) {
      Swal.fire('Error', 'No se pudieron guardar los permisos.', 'error');
    } finally {
      setGuardandoPermisos(false);
    }
  };

  // Agrupar permisos por módulo
  const permisosAgrupados = todosPermisos.reduce((acc, p) => {
    const mod = p.modulo_nombre || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="slate.800">
          Gestión de Roles y Permisos
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Nuevo Rol
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Lado izquierdo: Lista de Roles */}
        <Grid item xs={12} md={6} lg={5}>
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
                  const isSelected = rolSeleccionado && (rolSeleccionado.id_rol === rol.id_rol);
                  return (
                    <TableRow 
                      key={rol.id_rol || rol.id} 
                      hover
                      selected={isSelected}
                      sx={{ 
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.08)' } 
                      }}
                      onClick={() => seleccionarRol(rol)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Radio 
                            checked={isSelected}
                            onChange={() => {}} // El clic lo maneja el TableRow
                            onClick={(e) => e.stopPropagation()} // Evitamos comportamiento raro, la fila se encarga
                            size="small"
                            sx={{ p: 0.5, pointerEvents: 'none' }}
                          />
                          <Box>
                            <Typography fontWeight={isSelected ? "bold" : "500"} color={isSelected ? 'primary.main' : 'slate.800'}>
                              {rol.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {rol.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton color="primary" onClick={() => handleOpen(rol)} size="small" sx={{ mr: 1 }}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(rol.id_rol || rol.id)} size="small" disabled={rol.es_sistema}>
                          <Trash2 size={18} />
                        </IconButton>
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
        </Grid>

        {/* Lado derecho: Configuración de Permisos */}
        <Grid item xs={12} md={6} lg={7}>
          <Card elevation={0} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', minHeight: 400 }}>
            {!rolSeleccionado ? (
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
                <Settings2 size={48} className="text-slate-300 mb-4" />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Configuración de Permisos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecciona un rol de la tabla para ver o modificar sus permisos.
                </Typography>
              </CardContent>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'slate.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" color="slate.800">
                      Permisos para {rolSeleccionado.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activa los módulos y define el nivel de alcance.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={guardandoPermisos ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
                    onClick={guardarPermisos}
                    disabled={guardandoPermisos || rolSeleccionado.es_sistema}
                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                  >
                    Guardar
                  </Button>
                </Box>
                
                <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1, maxHeight: '600px' }}>
                  {rolSeleccionado.es_sistema && (
                     <Alert severity="info" sx={{ mb: 3 }}>
                       Este es un rol de sistema. Sus permisos no pueden ser modificados.
                     </Alert>
                  )}

                  {Object.entries(permisosAgrupados).map(([modulo, permisos]) => (
                    <Box key={modulo} sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Shield size={16} className="text-blue-500" /> 
                        </Box>
                        Módulo: {modulo}
                      </Typography>
                      
                      {permisos.map(p => {
                        const isChecked = !!permisosAsignados[p.id_permiso];
                        return (
                          <Box key={p.id_permiso} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, '&:hover': { bgcolor: 'slate.50' }, borderRadius: '8px', mb: 1 }}>
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={isChecked} 
                                  onChange={() => togglePermiso(p.id_permiso)}
                                  disabled={rolSeleccionado.es_sistema}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" fontWeight="500">{p.nombre}</Typography>
                                  <Typography variant="caption" color="text.secondary">{p.codigo}</Typography>
                                </Box>
                              }
                            />
                            {isChecked && (
                              <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                  value={permisosAsignados[p.id_permiso]}
                                  onChange={(e) => cambiarAlcance(p.id_permiso, e.target.value)}
                                  disabled={rolSeleccionado.es_sistema}
                                  sx={{ fontSize: '0.875rem', borderRadius: '8px' }}
                                >
                                  <MenuItem value="GLOBAL">Global</MenuItem>
                                  <MenuItem value="TALLER">Taller</MenuItem>
                                  <MenuItem value="ASIGNADO">Asignado a mí</MenuItem>
                                  <MenuItem value="PROPIO">Creado por mí</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          </Box>
                        );
                      })}
                      <Divider sx={{ mt: 2 }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

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
