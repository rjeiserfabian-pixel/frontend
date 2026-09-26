import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Chip, MenuItem, FormControlLabel, Switch
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Monitor, Link as LinkIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { kioskoService } from '../services/kioskoService';
import { inventarioService } from '../../inventario/services/inventarioService';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

function useKioskos() {
  const [kioskos, setKioskos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKioskos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kioskoService.listar();
      setKioskos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar kioskos:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de kioskos.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKioskos();
    inventarioService.getSucursales().then(data => {
      setSucursales((data.results || data || []).filter(s => s.estado !== false));
    }).catch(() => {});
  }, [fetchKioskos]);

  return { kioskos, sucursales, loading, fetchKioskos };
}

const formatFecha = (iso) => {
  if (!iso) return 'Nunca';
  return new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

// URL completa y lista para pegar en el navegador del equipo físico — antes
// solo se mostraba el código a secas y había que armarla a mano.
const urlActivacion = (codigo) => `${window.location.origin}/kiosko/activar/${codigo}`;

const copiarEnlaceActivacion = async (codigo) => {
  const url = urlActivacion(codigo);
  try {
    await navigator.clipboard.writeText(url);
    Swal.fire({
      toast: true, position: 'top', timer: 1800, showConfirmButton: false,
      icon: 'success', title: 'Enlace copiado',
    });
  } catch {
    // Sin permiso de portapapeles (ej. HTTP sin TLS): mostramos el enlace para copiarlo a mano.
    Swal.fire({ title: 'Enlace de activación', html: `<code style="word-break:break-all;">${url}</code>`, confirmButtonText: 'Cerrar' });
  }
};

export default function KioskosPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('CONFIGURACION.KIOSKOS.CREAR');
  const puedeEditar = tienePermiso('CONFIGURACION.KIOSKOS.EDITAR');
  const puedeEliminar = tienePermiso('CONFIGURACION.KIOSKOS.ELIMINAR');

  const { kioskos, sucursales, loading, fetchKioskos } = useKioskos();
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm();

  const handleOpenModal = (kiosko = null) => {
    if (kiosko) {
      setEditingId(kiosko.id);
      reset({ nombre: kiosko.nombre, sucursal: kiosko.sucursal, activo: kiosko.activo });
    } else {
      setEditingId(null);
      reset({ nombre: '', sucursal: '', activo: true });
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
        await kioskoService.actualizar(editingId, data);
        Swal.fire('Éxito', 'Kiosko actualizado correctamente.', 'success');
        handleCloseModal();
      } else {
        const nuevo = await kioskoService.crear(data);
        handleCloseModal();
        Swal.fire({
          icon: 'success',
          title: 'Kiosko registrado',
          html: `
            <p style="text-align:left;margin-bottom:8px;">Abre este enlace en el dispositivo físico para activarlo (una sola vez):</p>
            <code style="display:block;background:#0f172a;color:#fff;padding:10px;border-radius:8px;font-size:0.85rem;word-break:break-all;">
              ${urlActivacion(nuevo.codigo_activacion)}
            </code>
            <p style="text-align:left;margin-top:10px;font-size:0.85rem;color:#64748b;">
              Desde ahí ese equipo recordará su sucursal automáticamente, incluso si lo apagan y lo prenden otro día.
            </p>
          `,
          confirmButtonText: 'Copiar Enlace',
          showCancelButton: true,
          cancelButtonText: 'Cerrar',
        }).then((result) => {
          if (result.isConfirmed) copiarEnlaceActivacion(nuevo.codigo_activacion);
        });
      }
      fetchKioskos();
    } catch (error) {
      console.error('Error al guardar kiosko:', error);
      Swal.fire('Error', 'No se pudo guardar el kiosko.', 'error');
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${nombre}"?`,
      text: 'El dispositivo dejará de poder generar tickets.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        await kioskoService.eliminar(id);
        Swal.fire('Eliminado', 'El kiosko ha sido eliminado.', 'success');
        fetchKioskos();
      } catch (error) {
        console.error('Error al eliminar kiosko:', error);
        Swal.fire('Error', 'No se pudo eliminar el kiosko.', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <Monitor size={24} /> Kioskos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Terminales de autoservicio registrados y la sucursal a la que pertenece cada uno.
          </Typography>
        </Box>
        {puedeCrear && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => handleOpenModal()}>
            Nuevo Kiosko
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', boxShadow: S.card }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Sucursal</strong></TableCell>
                  <TableCell><strong>Código de Activación</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Última Actividad</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {kioskos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay kioskos registrados. Crea uno para empezar a activar terminales físicos.
                    </TableCell>
                  </TableRow>
                ) : (
                  kioskos.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell><strong>{row.nombre}</strong></TableCell>
                      <TableCell>{row.sucursal_nombre}</TableCell>
                      <TableCell>
                        <Chip label={row.codigo_activacion} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={row.activo ? 'Activo' : 'Inactivo'} color={row.activo ? 'success' : 'default'} size="small" />
                          {!row.activado_en && <Chip label="Sin activar" color="warning" size="small" variant="outlined" />}
                        </Box>
                      </TableCell>
                      <TableCell>{formatFecha(row.ultima_actividad)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => copiarEnlaceActivacion(row.codigo_activacion)} title="Copiar enlace de activación" sx={{ color: '#a78bfa', bgcolor: alpha('#8b5cf6', 0.1), border: `1px solid ${alpha('#8b5cf6', 0.3)}`, borderRadius: '6px', '&:hover': { bgcolor: alpha('#8b5cf6', 0.2) } }}>
                          <LinkIcon size={18} />
                        </IconButton>
                        {puedeEditar && (
                          <IconButton size="small" onClick={() => handleOpenModal(row)} title="Editar" sx={{ ml: 0.75, color: '#38bdf8', bgcolor: alpha(C.blue, 0.1), border: `1px solid ${alpha(C.blue, 0.3)}`, borderRadius: '6px', '&:hover': { bgcolor: alpha(C.blue, 0.2) } }}>
                            <Edit size={18} />
                          </IconButton>
                        )}
                        {puedeEliminar && (
                          <IconButton size="small" onClick={() => handleDelete(row.id, row.nombre)} title="Eliminar" sx={{ ml: 0.75, color: '#fb7185', bgcolor: alpha(C.brand, 0.1), border: `1px solid ${alpha(C.brand, 0.3)}`, borderRadius: '6px', '&:hover': { bgcolor: alpha(C.brand, 0.2) } }}>
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
        )}
      </Paper>

      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Kiosko' : 'Nuevo Kiosko'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre *"
                fullWidth
                placeholder="Ej: Kiosko Recepción"
                {...register('nombre', { required: 'El nombre es requerido' })}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />
              <Controller
                name="sucursal"
                control={control}
                rules={{ required: 'La sucursal es requerida' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Sucursal *"
                    fullWidth
                    error={!!errors.sucursal}
                    helperText={errors.sucursal?.message}
                  >
                    {sucursales.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
              {editingId && (
                <Controller
                  name="activo"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />}
                      label="Kiosko activo"
                    />
                  )}
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
