import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput, Checkbox, ListItemText, TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, UserRound, ShieldCheck, Building2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../core/api/axios';

import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const getInitials = (user) => {
  const first = user?.nombres?.trim()?.charAt(0) || user?.username?.trim()?.charAt(0) || 'U';
  const last = user?.apellidos?.trim()?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
};

export default function UsuariosPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('SEGURIDAD.USUARIOS.CREAR');
  const puedeEditar = tienePermiso('SEGURIDAD.USUARIOS.EDITAR');
  const puedeEliminar = tienePermiso('SEGURIDAD.USUARIOS.ELIMINAR');

  const [usuarios, setUsuarios] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSucursales, setSelectedSucursales] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
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
      console.error('Error al cargar datos:', error);
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
        const responseErrors = error.response.data.errores;
        const firstKey = Object.keys(responseErrors)[0];
        errorMessage = `${firstKey}: ${responseErrors[firstKey][0]}`;
      } else if (error.response?.data?.mensaje) {
        errorMessage = error.response.data.mensaje;
      }
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'El usuario será desactivado del sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`seguridad/usuarios/${id}/`);
        fetchData();
        Swal.fire('Desactivado', 'El usuario ha sido desactivado.', 'success');
      } catch {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: C.brandLight, fontWeight: 800, letterSpacing: 0.6, lineHeight: 1 }}
          >
            Seguridad / Usuarios
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: C.text, mt: 0.6 }}>
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, mt: 0.5 }}>
            Administra accesos, roles y sucursales asignadas al personal.
          </Typography>
        </Box>

        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpen()}
            sx={{ px: 2.2, alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: '8px',
          border: `1px solid ${C.border}`,
          boxShadow: S.card,
          backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)`,
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Sucursales</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : usuarios.map((user) => (
                <TableRow key={user.id_usuario} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(C.brand, 0.16),
                          color: C.brandLight,
                          border: `1px solid ${alpha(C.brandLight, 0.28)}`,
                          fontWeight: 800,
                          fontSize: '0.78rem',
                        }}
                      >
                        {getInitials(user)}
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: C.text }}>
                          {user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: C.text }}>{user.nombres} {user.apellidos}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.roles && user.roles.map(rol => (
                        <Chip
                          key={rol.id_rol}
                          icon={<ShieldCheck size={14} />}
                          label={rol.nombre}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ bgcolor: alpha(C.brand, 0.08) }}
                        />
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <Typography variant="body2" color="text.secondary">Sin rol</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.sucursales && user.sucursales.map(suc => (
                        <Chip
                          key={suc.id_sucursal}
                          icon={<Building2 size={14} />}
                          label={suc.nombre}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ bgcolor: alpha(C.blue, 0.08) }}
                        />
                      ))}
                      {(!user.sucursales || user.sucursales.length === 0) && (
                        <Typography variant="body2" color="text.secondary">Ninguna</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: C.textMuted }}>
                      <Mail size={15} />
                      <Typography variant="body2" sx={{ color: C.textMuted }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      color={user.estado === 'activo' ? 'success' : 'default'}
                      size="small"
                      sx={{
                        bgcolor: user.estado === 'activo' ? alpha(C.emerald, 0.14) : alpha('#ffffff', 0.06),
                        color: user.estado === 'activo' ? '#6ee7b7' : C.textMuted,
                        border: `1px solid ${user.estado === 'activo' ? alpha(C.emerald, 0.28) : C.border}`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {puedeEditar && (
                      <IconButton
                        color="secondary"
                        onClick={() => handleOpen(user)}
                        size="small"
                        sx={{ mr: 1, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}
                      >
                        <Edit size={18} />
                      </IconButton>
                    )}
                    {puedeEliminar && (
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(user.id_usuario)}
                        size="small"
                        sx={{ bgcolor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}` }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 7, color: 'text.secondary' }}>
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

      <Dialog open={openModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pb: 1.5,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(C.brand, 0.14),
                border: `1px solid ${alpha(C.brandLight, 0.24)}`,
                color: C.brandLight,
              }}
            >
              <UserRound size={19} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: C.text }}>
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Typography>
              <Typography variant="caption" sx={{ color: C.textMuted }}>
                {editingId ? 'Actualiza los accesos del usuario.' : 'Registra un nuevo usuario en el sistema.'}
              </Typography>
            </Box>
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
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
              label={editingId ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              type="password"
              fullWidth
              size="small"
              {...register('password', { required: !editingId ? 'Requerida para nuevo usuario' : false })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
