import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Chip, TablePagination, Tabs, Tab
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function PlantillasCorrectivasPage() {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const puedeCrear    = tienePermiso('PLANTILLAS_TALLER.CREAR');
  const puedeEditar   = tienePermiso('PLANTILLAS_TALLER.EDITAR');
  const puedeEliminar = tienePermiso('PLANTILLAS_TALLER.ELIMINAR');

  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { nombre: '', descripcion: '', precio_base: '', tiempo_estimado_minutos: '', activo: true },
  });

  useEffect(() => { fetchPlantillas(); }, [page]); // eslint-disable-line

  const fetchPlantillas = async () => {
    try {
      setLoading(true);
      const data = await tallerService.getPlantillasCorrectivas({ page: page + 1 });
      setPlantillas(data.results || data);
      setTotalCount(data.count !== undefined ? data.count : (data.results ? data.results.length : data.length));
    } catch (err) {
      console.error('Error cargando plantillas correctivas:', err);
      Swal.fire('Error', 'Error al cargar las plantillas correctivas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (p = null) => {
    setEditingId(p ? p.id : null);
    reset(p
      ? { nombre: p.nombre, descripcion: p.descripcion || '', precio_base: p.precio_base || '', tiempo_estimado_minutos: p.tiempo_estimado_minutos || '', activo: p.activo }
      : { nombre: '', descripcion: '', precio_base: '', tiempo_estimado_minutos: '', activo: true }
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => { setModalOpen(false); reset(); setEditingId(null); };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        precio_base: data.precio_base ? parseFloat(data.precio_base) : null,
        tiempo_estimado_minutos: data.tiempo_estimado_minutos ? parseInt(data.tiempo_estimado_minutos, 10) : null,
      };
      if (editingId) {
        await tallerService.actualizarPlantillaCorrectiva(editingId, payload);
        Swal.fire('Exito', 'Plantilla actualizada correctamente', 'success');
      } else {
        await tallerService.crearPlantillaCorrectiva(payload);
        Swal.fire('Exito', 'Plantilla creada correctamente', 'success');
      }
      handleCloseModal();
      fetchPlantillas();
    } catch (err) {
      let msg = 'Hubo un error al guardar la plantilla.';
      if (err.response?.data?.nombre) msg = 'Ya existe una plantilla correctiva con este nombre.';
      else if (err.response?.data && typeof err.response.data === 'object') {
        const key = Object.keys(err.response.data)[0];
        if (key && Array.isArray(err.response.data[key])) msg = err.response.data[key][0];
      }
      Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: msg });
    }
  };

  const handleDelete = async (id) => {
    const r = await Swal.fire({
      title: 'Eliminar plantilla?', text: 'La plantilla se eliminara permanentemente.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar',
    });
    if (r.isConfirmed) {
      try { await tallerService.eliminarPlantillaCorrectiva(id); Swal.fire('Eliminada', 'Plantilla eliminada.', 'success'); fetchPlantillas(); }
      catch { Swal.fire('Error', 'No se pudo eliminar la plantilla', 'error'); }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Plantillas de Servicio</Typography>
        {puedeCrear && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => handleOpenModal()}>
            Nueva Plantilla
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value="/taller/plantillas-correctivas" 
          onChange={(e, newValue) => navigate(newValue)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Servicios Preventivos" value="/taller/plantillas" />
          <Tab label="Servicios Correctivos" value="/taller/plantillas-correctivas" />
        </Tabs>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripcion</strong></TableCell>
                <TableCell align="right"><strong>Precio Base (S/)</strong></TableCell>
                <TableCell align="right"><strong>Tiempo Est. (Min)</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : plantillas.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No hay plantillas correctivas registradas.</TableCell></TableRow>
              ) : (
                plantillas.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#f8fafc' }}>{p.nombre}</TableCell>
                    <TableCell>{p.descripcion || '-'}</TableCell>
                    <TableCell align="right">{p.precio_base || '-'}</TableCell>
                    <TableCell align="right">{p.tiempo_estimado_minutos || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip label={p.activo ? 'Activo' : 'Inactivo'} color={p.activo ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      {puedeEditar && (
                        <IconButton onClick={() => handleOpenModal(p)} color="secondary" size="small" sx={{ mr: 1, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}>
                          <Edit size={18} />
                        </IconButton>
                      )}
                      {puedeEliminar && (
                        <IconButton onClick={() => handleDelete(p.id)} color="error" size="small" sx={{ bgcolor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}` }}>
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
        {!loading && totalCount > 0 && (
          <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={25} rowsPerPageOptions={[25]} labelRowsPerPage="Filas por pagina:" />
        )}
      </Paper>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Plantilla Correctiva' : 'Nueva Plantilla Correctiva'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Nombre del Servicio" fullWidth {...register('nombre', { required: 'El nombre es obligatorio' })} error={!!errors.nombre} helperText={errors.nombre?.message} />
            <TextField label="Descripcion (opcional)" fullWidth multiline rows={2} {...register('descripcion')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Precio Base (S/)" type="number" inputProps={{ step: '0.01', min: '0' }} fullWidth {...register('precio_base', { min: { value: 0, message: 'No puede ser negativo' } })} error={!!errors.precio_base} helperText={errors.precio_base?.message} />
              <TextField label="Tiempo Est. (Minutos)" type="number" fullWidth {...register('tiempo_estimado_minutos', { min: { value: 1, message: 'Debe ser mayor a 0' } })} error={!!errors.tiempo_estimado_minutos} helperText={errors.tiempo_estimado_minutos?.message} />
            </Box>
            <Controller name="activo" control={control} render={({ field }) => (
              <FormControlLabel control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />} label="Activo (visible en recepcion de ordenes)" />
            )} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

