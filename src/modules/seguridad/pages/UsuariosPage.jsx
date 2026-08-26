import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput, Checkbox, ListItemText, TablePagination
} from '@mui/material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../core/api/axios';

import Swal from 'sweetalert2';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Estado para los roles seleccionados
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsuarios, resRoles, resSucursales] = await Promise.all([
        api.get(`seguridad/usuarios/?page=${page + 1}`),
        api.get('seguridad/roles/'),
        api.get('inventario/sucursales/')
      ]);
      
      const dataUsuarios = resUsuarios.data.data;
      setUsuarios(dataUsuarios.results ? dataUsuarios.results : (Array.isArray(dataUsuarios) ? dataUsuarios : []));
      setTotalCount(dataUsuarios.count !== undefined ? dataUsuarios.count : (dataUsuarios.results ? dataUsuarios.results.length : dataUsuarios.length));

      const dataRoles = resRoles.data.data;
      setRolesDisponibles(dataRoles.results ? dataRoles.results : (Array.isArray(dataRoles) ? dataRoles : []));
      
      const dataSucursales = resSucursales.data.results || resSucursales.data;
      setSucursalesDisponibles(Array.isArray(dataSucursales) ? dataSucursales : []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user.id_usuario);
      reset({ 
        username: user.username, 
        email: user.email, 
        nombres: user.nombres, 
        apellidos: user.apellidos 
      });
      setSelectedRoles(user.roles ? user.roles.map(r => r.id_rol) : []);
      setSelectedSucursales(user.sucursales ? user.sucursales.map(s => s.id_sucursal) : []);
    } else {
      setEditingId(null);
      reset({ username: '', email: '', nombres: '', apellidos: '', password: '' });
      setSelectedRoles([]);
      setSelectedSucursales([]);
    }
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, roles_ids: selectedRoles, sucursales_ids: selectedSucursales };
      
      if (editingId) {
        if (!payload.password) delete payload.password;
        await api.put(`seguridad/usuarios/${editingId}/`, payload);
      } else {
        await api.post('seguridad/usuarios/', payload);
      }
      handleClose();
      fetchData();
      
      Swal.fire({
        icon: 'success',
        title: editingId ? 'Usuario actualizado' : 'Usuario creado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      let errorMessage = 'Revisa los datos ingresados.';
      if (error.response?.data?.errores) {
        const errors = error.response.data.errores;
        const firstKey = Object.keys(errors)[0];
        errorMessage = `${firstKey}: ${errors[firstKey][0]}`;
      } else if (error.response?.data?.mensaje) {
        errorMessage = error.response.data.mensaje;
      }
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El usuario será desactivado del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`seguridad/usuarios/${id}/`);
        fetchData();
        Swal.fire('Desactivado', 'El usuario ha sido desactivado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo desactivar el usuario.', 'error');
      }
    }
  };

  const handleRoleChange = (event) => {
    const { target: { value } } = event;
    setSelectedRoles(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSucursalChange = (event) => {
    const { target: { value } } = event;
    setSelectedSucursales(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="slate.800">
          Gestión de Usuarios
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nombre Completo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Roles</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sucursales</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : usuarios.map((user) => (
              <TableRow key={user.id_usuario} hover>
                <TableCell fontWeight="500">{user.username}</TableCell>
                <TableCell>{user.nombres} {user.apellidos}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.roles && user.roles.map(rol => (
                      <Chip key={rol.id_rol} label={rol.nombre} size="small" variant="outlined" color="primary" />
                    ))}
                    {(!user.roles || user.roles.length === 0) && (
                      <Typography variant="body2" color="text.secondary">Sin rol</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {user.sucursales && user.sucursales.map(suc => (
                      <Chip key={suc.id_sucursal} label={suc.nombre} size="small" variant="outlined" color="secondary" />
                    ))}
                    {(!user.sucursales || user.sucursales.length === 0) && (
                      <Typography variant="body2" color="text.secondary">Ninguna</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.estado === 'activo' ? 'Activo' : 'Inactivo'} 
                    color={user.estado === 'activo' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(user)} size="small" sx={{ mr: 1 }}>
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(user.id_usuario)} size="small">
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No se encontraron usuarios.
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

      {/* Modal Crear/Editar */}
      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle fontWeight="bold">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            <TextField
              label="Nombre de usuario"
              fullWidth
              size="small"
              {...register('username', { required: 'Requerido' })}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              fullWidth
              size="small"
              {...register('email')}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nombres"
                fullWidth
                size="small"
                {...register('nombres', { required: 'Requerido' })}
                error={!!errors.nombres}
                helperText={errors.nombres?.message}
              />
              <TextField
                label="Apellidos"
                fullWidth
                size="small"
                {...register('apellidos', { required: 'Requerido' })}
                error={!!errors.apellidos}
                helperText={errors.apellidos?.message}
              />
            </Box>
            
            <FormControl fullWidth size="small">
              <InputLabel id="roles-label">Roles Asignados</InputLabel>
              <Select
                labelId="roles-label"
                multiple
                value={selectedRoles}
                onChange={handleRoleChange}
                input={<OutlinedInput label="Roles Asignados" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const rolObj = rolesDisponibles.find(r => r.id_rol === value);
                      return <Chip key={value} label={rolObj ? rolObj.nombre : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {rolesDisponibles.map((rol) => (
                  <MenuItem key={rol.id_rol} value={rol.id_rol}>
                    <Checkbox checked={selectedRoles.indexOf(rol.id_rol) > -1} />
                    <ListItemText primary={rol.nombre} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="sucursales-label">Sucursales Asignadas</InputLabel>
              <Select
                labelId="sucursales-label"
                multiple
                value={selectedSucursales}
                onChange={handleSucursalChange}
                input={<OutlinedInput label="Sucursales Asignadas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const sucObj = sucursalesDisponibles.find(s => s.id === value);
                      return <Chip key={value} label={sucObj ? sucObj.nombre : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {sucursalesDisponibles.map((sucursal) => (
                  <MenuItem key={sucursal.id} value={sucursal.id}>
                    <Checkbox checked={selectedSucursales.indexOf(sucursal.id) > -1} />
                    <ListItemText primary={sucursal.nombre} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={editingId ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              type="password"
              fullWidth
              size="small"
              {...register('password', { required: !editingId ? 'Requerida para nuevo usuario' : false })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>
              {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
