import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, TextField, MenuItem, TablePagination, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, History, ArrowRightLeft, Search, QrCode } from 'lucide-react';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import {
  ESTADOS_OPERATIVOS, herramientasService, mensajeError,
} from '../services/herramientasService';
import EstadoOperativoChip from '../components/EstadoOperativoChip';
import HerramientaFormDialog from '../components/HerramientaFormDialog';
import CambiarEstadoDialog from '../components/CambiarEstadoDialog';
import HistorialDialog from '../components/HistorialDialog';
import ResumenCards from '../components/ResumenCards';
import EtiquetasQrDialog from '../components/EtiquetasQrDialog';
import FiltroBusqueda from '../components/FiltroBusqueda';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const PAGE_SIZE = 25;

const headSx = { fontWeight: 800, color: C.textMuted };
const iconBtn = (color) => ({
  color, bgcolor: alpha(color, 0.09), border: `1px solid ${alpha(color, 0.2)}`, mr: 0.75,
});

export default function HerramientasPage() {
  const { tienePermiso } = usePermisos();
  const { sucursales, activeSucursalId } = useSucursal();
  const puedeCrear = tienePermiso('HERRAMIENTAS.INVENTARIO.CREAR');
  const puedeEditar = tienePermiso('HERRAMIENTAS.INVENTARIO.EDITAR');
  const puedeEliminar = tienePermiso('HERRAMIENTAS.INVENTARIO.ELIMINAR');
  const puedeDarDeBaja = tienePermiso('HERRAMIENTAS.BAJA.APROBAR');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [recarga, setRecarga] = useState(0);

  const [page, setPage] = useState(0);
  // Al escanear una etiqueta QR se llega con ?codigo=HER-0001 y el listado ya filtrado.
  const [searchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState(searchParams.get('codigo') || '');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const busquedaDebounced = useDebouncedValue(busqueda, 400);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [historialTarget, setHistorialTarget] = useState(null);
  const [etiquetas, setEtiquetas] = useState(null);

  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  // Categorías para filtro y formulario (si el rol no puede verlas, queda vacío)
  useEffect(() => {
    const controller = new AbortController();
    herramientasService.getCategorias(undefined, controller.signal)
      .then(setCategorias)
      .catch(() => setCategorias([]));
    return () => controller.abort();
  }, [recarga]);

  // Listado paginado, con cancelación de la petición en curso
  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: PAGE_SIZE };
    if (busquedaDebounced.trim()) params.search = busquedaDebounced.trim();
    if (filtroCategoria) params.categoria = filtroCategoria;
    if (filtroSucursal) params.sucursal = filtroSucursal;
    if (filtroEstado) params.estado_operativo = filtroEstado;

    setLoading(true);
    setErrorCarga('');
    herramientasService.getHerramientas(params, controller.signal)
      .then((data) => {
        setItems(data.results || []);
        setTotal(data.count ?? 0);
      })
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setItems([]);
        setErrorCarga(mensajeError(err, 'Error al cargar las herramientas'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, busquedaDebounced, filtroCategoria, filtroSucursal, filtroEstado, recarga]);

  const cambiarFiltro = (setter) => (e) => { setter(e.target.value); setPage(0); };

  const abrirForm = (herramienta = null) => { setEditando(herramienta); setFormOpen(true); };

  const eliminar = async (h) => {
    const r = await Swal.fire({
      title: '¿Eliminar herramienta?',
      text: `${h.codigo} - ${h.nombre} dejará de aparecer en el inventario.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!r.isConfirmed) return;
    try {
      await herramientasService.eliminarHerramienta(h.id);
      Swal.fire('Eliminada', 'La herramienta fue eliminada del inventario.', 'success');
      if (items.length === 1 && page > 0) setPage(page - 1);
      refrescar();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo eliminar la herramienta'), 'error');
    }
  };

  const columnas = 8;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 750, color: C.text }}>
          Inventario de Herramientas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<QrCode size={18} />}
            disabled={loading || items.length === 0} onClick={() => setEtiquetas(items)}
            sx={{ textTransform: 'none', borderRadius: 2 }}>
            Etiquetas QR de esta página
          </Button>
        {puedeCrear && (
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => abrirForm()}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark }, textTransform: 'none', borderRadius: 2 }}>
            Nueva herramienta
          </Button>
        )}
        </Box>
      </Box>

      <ResumenCards
        sucursalId={filtroSucursal} estadoActivo={filtroEstado} refreshKey={recarga}
        onSelectEstado={(estado) => { setFiltroEstado(estado); setPage(0); }}
      />

      <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            size="small" label="Buscar (código, nombre, marca, serie)" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: C.textMuted }} /> }}
          />
          <FiltroBusqueda label="Categoría" value={filtroCategoria} options={categorias}
            onChange={cambiarFiltro(setFiltroCategoria)} />
          <FiltroBusqueda label="Sucursal" value={filtroSucursal} options={sucursales}
            onChange={cambiarFiltro(setFiltroSucursal)} />
          <TextField select size="small" label="Estado" value={filtroEstado}
            onChange={cambiarFiltro(setFiltroEstado)}>
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS_OPERATIVOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
          </TextField>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(C.surfaceSoft, 0.92) }}>
                <TableCell sx={headSx}>Código</TableCell>
                <TableCell sx={headSx}>Nombre</TableCell>
                <TableCell sx={headSx}>Categoría</TableCell>
                <TableCell sx={headSx}>Marca / Modelo</TableCell>
                <TableCell sx={headSx}>Sucursal</TableCell>
                <TableCell sx={headSx}>Estado físico</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Estado</TableCell>
                <TableCell sx={{ ...headSx, textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={columnas} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : errorCarga ? (
                <TableRow>
                  <TableCell colSpan={columnas} align="center" sx={{ py: 4 }}>
                    <Typography color="error" sx={{ mb: 1 }}>{errorCarga}</Typography>
                    <Button size="small" onClick={refrescar}>Reintentar</Button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnas} align="center" sx={{ py: 4, color: C.textMuted }}>
                    No hay herramientas para mostrar
                  </TableCell>
                </TableRow>
              ) : items.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{h.codigo}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: C.text }}>{h.nombre}</TableCell>
                  <TableCell>{h.categoria_nombre}</TableCell>
                  <TableCell>{[h.marca, h.modelo].filter(Boolean).join(' ') || '—'}</TableCell>
                  <TableCell>{h.sucursal_nombre}{h.almacen_nombre ? ` · ${h.almacen_nombre}` : ''}</TableCell>
                  <TableCell>{h.estado_fisico_display}</TableCell>
                  <TableCell align="center">
                    <EstadoOperativoChip estado={h.estado_operativo} label={h.estado_operativo_display} />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Etiqueta QR">
                      <IconButton size="small" onClick={() => setEtiquetas([h])} sx={iconBtn(C.textMuted)}>
                        <QrCode size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Historial">
                      <IconButton size="small" onClick={() => setHistorialTarget(h)} sx={iconBtn(C.textMuted)}>
                        <History size={18} />
                      </IconButton>
                    </Tooltip>
                    {puedeEditar && (
                      <Tooltip title="Cambiar estado">
                        <IconButton size="small" onClick={() => setEstadoTarget(h)} sx={iconBtn(C.amber)}>
                          <ArrowRightLeft size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {puedeEditar && (
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => abrirForm(h)} sx={iconBtn(C.blue)}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {puedeEliminar && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => eliminar(h)} sx={iconBtn(C.brandLight)}>
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
        <TablePagination
          component="div" rowsPerPageOptions={[PAGE_SIZE]} count={total}
          rowsPerPage={PAGE_SIZE} page={page}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      <HerramientaFormDialog
        open={formOpen} herramienta={editando}
        categorias={categorias} sucursales={sucursales} sucursalActivaId={activeSucursalId}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); refrescar(); }}
      />
      <CambiarEstadoDialog
        open={Boolean(estadoTarget)} herramienta={estadoTarget} puedeDarDeBaja={puedeDarDeBaja}
        onClose={() => setEstadoTarget(null)}
        onSaved={() => { setEstadoTarget(null); refrescar(); }}
      />
      <EtiquetasQrDialog
        open={Boolean(etiquetas)} herramientas={etiquetas} onClose={() => setEtiquetas(null)}
      />
      <HistorialDialog
        open={Boolean(historialTarget)} herramienta={historialTarget}
        onClose={() => setHistorialTarget(null)}
      />
    </Box>
  );
}
