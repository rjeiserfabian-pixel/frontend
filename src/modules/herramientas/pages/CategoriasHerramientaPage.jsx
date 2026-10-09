import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, TablePagination, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { erroresPorCampo, herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;
const headSx = { fontWeight: 800, color: C.textMuted };

export default function CategoriasHerramientaPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('HERRAMIENTAS.CATEGORIAS.CREAR');
  const puedeEditar = tienePermiso('HERRAMIENTAS.CATEGORIAS.EDITAR');
  const puedeEliminar = tienePermiso('HERRAMIENTAS.CATEGORIAS.ELIMINAR');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [recarga, setRecarga] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 400);
  // El catálogo llega completo (sin paginar en backend); se pagina en cliente.
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const {
    register, handleSubmit, reset, setError, formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { nombre: '', descripcion: '' } });

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorCarga('');
    const params = busquedaDebounced.trim() ? { search: busquedaDebounced.trim() } : undefined;
    herramientasService.getCategorias(params, controller.signal)
      .then((data) => setItems(Array.isArray(data) ? data : data.results || []))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar las categorías'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [busquedaDebounced, recarga]);

  const abrirModal = (cat = null) => {
    setEditingId(cat ? cat.id : null);
    reset({ nombre: cat?.nombre ?? '', descripcion: cat?.descripcion ?? '' });
    setModalOpen(true);
  };
  const cerrarModal = () => { setModalOpen(false); setEditingId(null); };

  const onSubmit = async (values) => {
    try {
      if (editingId) await herramientasService.actualizarCategoria(editingId, values);
      else await herramientasService.crearCategoria(values);
      Swal.fire('Éxito', `Categoría ${editingId ? 'actualizada' : 'creada'} correctamente`, 'success');
      cerrarModal();
      refrescar();
    } catch (error) {
      const porCampo = erroresPorCampo(error);
      if (porCampo.nombre) setError('nombre', { type: 'server', message: porCampo.nombre });
      else Swal.fire('Error', mensajeError(error, 'Error al guardar la categoría'), 'error');
    }
  };

  const eliminar = async (cat) => {
    const r = await Swal.fire({
      title: '¿Eliminar categoría?', text: cat.nombre, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    try {
      await herramientasService.eliminarCategoria(cat.id);
      Swal.fire('Eliminada', 'La categoría fue eliminada.', 'success');
      refrescar();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo eliminar la categoría'), 'error');
    }
  };

  const visibles = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 750, color: C.text }}>Categorías de Herramientas</Typography>
        {puedeCrear && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => abrirModal()}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
            Nueva categoría
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TextField size="small" label="Buscar categoría" value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }}
          sx={{ minWidth: { sm: 320 } }} />
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={headSx}>Nombre</TableCell>
                <TableCell sx={headSx}>Descripción</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Herramientas</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : errorCarga ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="error" sx={{ mb: 1 }}>{errorCarga}</Typography>
                    <Button size="small" onClick={refrescar}>Reintentar</Button>
                  </TableCell>
                </TableRow>
              ) : visibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: C.textMuted }}>
                    No hay categorías registradas
                  </TableCell>
                </TableRow>
              ) : visibles.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: C.text }}>{c.nombre}</TableCell>
                  <TableCell>{c.descripcion || '—'}</TableCell>
                  <TableCell align="center">{c.total_herramientas ?? 0}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {puedeEditar && (
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => abrirModal(c)}
                          sx={{ color: C.blue, mr: 1, bgcolor: alpha(C.blue, 0.09), border: `1px solid ${alpha(C.blue, 0.2)}` }}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {puedeEliminar && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => eliminar(c)}
                          sx={{ color: C.brandLight, bgcolor: alpha(C.brand, 0.09), border: `1px solid ${alpha(C.brandLight, 0.2)}` }}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" rowsPerPageOptions={[PAGE_SIZE]} count={items.length}
          rowsPerPage={PAGE_SIZE} page={page} onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
      </Paper>

      <Dialog open={modalOpen} onClose={isSubmitting ? undefined : cerrarModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogTitle sx={{ fontWeight: 600 }}>
            {editingId ? 'Editar categoría' : 'Nueva categoría'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField label="Nombre" required placeholder="Ej. Amoladoras" fullWidth
                {...register('nombre', {
                  required: 'El nombre es requerido',
                  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
                  validate: (v) => v.trim().length > 0 || 'El nombre es requerido',
                })}
                error={!!errors.nombre} helperText={errors.nombre?.message} />
              <TextField label="Descripción" fullWidth multiline minRows={2}
                {...register('descripcion', { maxLength: { value: 255, message: 'Máximo 255 caracteres' } })}
                error={!!errors.descripcion} helperText={errors.descripcion?.message} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={cerrarModal} disabled={isSubmitting} sx={{ color: '#64748b' }}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}
              sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
