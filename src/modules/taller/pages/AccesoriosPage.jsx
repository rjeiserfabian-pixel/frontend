import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Chip, InputAdornment, TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Search, ShieldCheck } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { tallerService } from '../services/tallerService';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function AccesoriosPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('ACCESORIOS_TALLER.CREAR');
  const puedeEditar = tienePermiso('ACCESORIOS_TALLER.EDITAR');
  const puedeEliminar = tienePermiso('ACCESORIOS_TALLER.ELIMINAR');

  const [accesorios, setAccesorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Paginación estándar del sistema (idéntico a Repuestos)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '',
      descripcion: '',
      orden: 0,
      activo: true
    }
  });

  useEffect(() => {
    fetchAccesorios();
  }, [page, rowsPerPage, searchTerm]);

  const fetchAccesorios = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const data = await tallerService.getAccesorios(params);
      if (data && data.results) {
        // Paginado en servidor por DRF
        setAccesorios(data.results);
        setTotalCount(data.count || 0);
      } else {
        // Fallback defensivo si no viniera paginado
        const rawList = Array.isArray(data) ? data : [];
        setTotalCount(rawList.length);
        const startIndex = page * rowsPerPage;
        setAccesorios(rawList.slice(startIndex, startIndex + rowsPerPage));
      }
    } catch (error) {
      console.error('Error fetching accesorios:', error);
      Swal.fire('Error', 'No se pudieron cargar los accesorios y pertenencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      reset({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        orden: item.orden ?? 0,
        activo: item.activo
      });
    } else {
      setEditingId(null);
      reset({
        nombre: '',
        descripcion: '',
        orden: totalCount + 1,
        activo: true
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
      const dataToSend = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion ? data.descripcion.trim() : null,
        orden: data.orden !== '' ? parseInt(data.orden, 10) : 0,
        activo: !!data.activo
      };

      if (editingId) {
        await tallerService.actualizarAccesorio(editingId, dataToSend);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Accesorio actualizado correctamente',
          timer: 1600,
          showConfirmButton: false
        });
      } else {
        await tallerService.crearAccesorio(dataToSend);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Accesorio registrado con éxito',
          timer: 1600,
          showConfirmButton: false
        });
      }
      handleCloseModal();
      fetchAccesorios();
    } catch (error) {
      console.error('Error saving accesorio:', error);
      const msg = error.response?.data?.nombre?.[0] || 'Error al guardar el accesorio';
      Swal.fire('Error', msg, 'error');
    }
  };

  const handleToggleActivo = async (item) => {
    if (!puedeEditar) return;
    try {
      await tallerService.actualizarAccesorio(item.id, { activo: !item.activo });
      setAccesorios(prev => prev.map(a => a.id === item.id ? { ...a, activo: !a.activo } : a));
    } catch (error) {
      console.error('Error toggling activo:', error);
      Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Eliminar accesorio?',
      text: `Se eliminará "${nombre}". Si ya ha sido utilizado en órdenes anteriores, se recomienda solo desactivarlo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await tallerService.eliminarAccesorio(id);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Accesorio eliminado del catálogo',
          timer: 1600,
          showConfirmButton: false
        });
        fetchAccesorios();
      } catch (error) {
        console.error('Error deleting accesorio:', error);
        Swal.fire(
          'No se puede eliminar',
          error.response?.data?.detail || 'Este accesorio está asociado a órdenes registradas. Desactívelo en su lugar.',
          'error'
        );
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={28} className="text-rose-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Accesorios y Pertenencias</h1>
          </div>
          <p className="text-sm text-slate-300 font-medium mt-1">
            Catálogo administrable de accesorios, herramientas y pertenencias del vehículo que pueden dejarse en custodia durante la recepción.
          </p>
        </div>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenModal()}
            sx={{
              backgroundColor: C.primary,
              '&:hover': { backgroundColor: alpha(C.primary, 0.85) },
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: S.buttonPrimary,
            }}
          >
            Nuevo Accesorio
          </Button>
        )}
      </div>

      {/* Barra de Filtro / Búsqueda */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} className="text-slate-400" />
              </InputAdornment>
            ),
            sx: { borderRadius: '10px' }
          }}
        />
      </div>

      {/* Contenedor de la Tabla */}
      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden',
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          boxShadow: S.card
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha('#ffffff', 0.03) }}>
              <TableRow>
                <TableCell sx={{ color: C.textMuted, fontWeight: 700, width: 80 }}>ORDEN</TableCell>
                <TableCell sx={{ color: C.textMuted, fontWeight: 700 }}>ACCESORIO / PERTENENCIA</TableCell>
                <TableCell sx={{ color: C.textMuted, fontWeight: 700 }}>DESCRIPCIÓN / OBSERVACIÓN SUGERIDA</TableCell>
                <TableCell sx={{ color: C.textMuted, fontWeight: 700, width: 140 }}>ESTADO</TableCell>
                <TableCell align="center" sx={{ color: C.textMuted, fontWeight: 700, width: 130 }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: C.primary }} />
                    <Typography sx={{ mt: 2, color: C.textMuted, fontSize: '0.875rem' }}>
                      Cargando accesorios...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : accesorios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: C.textMuted, fontStyle: 'italic' }}>
                      {searchTerm ? 'No se encontraron accesorios con ese criterio.' : 'No hay accesorios registrados en el catálogo.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accesorios.map((item) => (
                  <TableRow 
                    key={item.id} 
                    hover
                    sx={{ '&:hover': { bgcolor: alpha('#ffffff', 0.02) } }}
                  >
                    <TableCell sx={{ color: C.textMuted, fontWeight: 600 }}>
                      #{item.orden}
                    </TableCell>
                    <TableCell sx={{ color: C.text, fontWeight: 600 }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
                        {item.nombre}
                      </div>
                    </TableCell>
                    <TableCell sx={{ color: C.textMuted, fontSize: '0.875rem' }}>
                      {item.descripcion || <span className="text-slate-500 italic">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          size="small"
                          checked={item.activo}
                          disabled={!puedeEditar}
                          onChange={() => handleToggleActivo(item)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' },
                          }}
                        />
                        <Chip 
                          label={item.activo ? 'Activo' : 'Inactivo'} 
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor: item.activo ? alpha('#10b981', 0.15) : alpha('#ef4444', 0.15),
                            color: item.activo ? '#34d399' : '#f87171',
                            border: `1px solid ${item.activo ? alpha('#10b981', 0.3) : alpha('#ef4444', 0.3)}`,
                          }} 
                        />
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <div className="flex items-center justify-center">
                        {puedeEditar && (
                          <IconButton 
                            onClick={() => handleOpenModal(item)} 
                            color="secondary" 
                            size="small" 
                            title="Editar accesorio"
                            sx={{ 
                              mr: 1, 
                              bgcolor: alpha(C.blue, 0.08), 
                              border: `1px solid ${alpha(C.blue, 0.18)}`,
                              borderRadius: '8px'
                            }}
                          >
                            <Edit size={18} />
                          </IconButton>
                        )}
                        {puedeEliminar && (
                          <IconButton 
                            onClick={() => handleDelete(item.id, item.nombre)} 
                            color="error" 
                            size="small" 
                            title="Eliminar accesorio"
                            sx={{ 
                              bgcolor: alpha(C.brand, 0.08), 
                              border: `1px solid ${alpha(C.brandLight, 0.18)}`,
                              borderRadius: '8px'
                            }}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación idéntica a Repuestos / Sistema */}
        {!loading && totalCount > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        )}
      </Paper>

      {/* Modal Crear / Editar */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: C.surface,
            backgroundImage: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: '16px',
            boxShadow: S.card
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle sx={{ color: C.text, fontWeight: 700, pb: 1 }}>
            {editingId ? 'Editar Accesorio o Pertenencia' : 'Nuevo Accesorio o Pertenencia'}
          </DialogTitle>
          <DialogContent className="flex flex-col gap-4 mt-2">
            <TextField
              fullWidth
              label="Nombre del accesorio *"
              placeholder="Ej. Extintor, Llanta de repuesto, Gata hidráulica..."
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripción / Detalles de referencia"
              placeholder="Ej. Indicar vigencia de extintor, ubicación habitual, estado de uso..."
              {...register('descripcion')}
              InputProps={{ sx: { borderRadius: '10px' } }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                fullWidth
                type="number"
                label="Orden de aparición"
                placeholder="0, 1, 2..."
                {...register('orden')}
                helperText="Define en qué orden saldrá en la recepción"
                InputProps={{ sx: { borderRadius: '10px' } }}
              />

              <div className="flex items-center pt-2">
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' },
                          }}
                        />
                      }
                      label={
                        <span className="text-sm font-semibold text-slate-200">
                          {field.value ? 'Accesorio Activo' : 'Accesorio Inactivo'}
                        </span>
                      }
                    />
                  )}
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${C.border}` }}>
            <Button 
              onClick={handleCloseModal}
              sx={{ color: C.textMuted, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                backgroundColor: C.primary,
                '&:hover': { backgroundColor: alpha(C.primary, 0.85) },
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: S.buttonPrimary,
              }}
            >
              {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
