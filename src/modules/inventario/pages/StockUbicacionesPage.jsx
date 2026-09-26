import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Collapse,
  CircularProgress, Chip, TextField, MenuItem, TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MapPin, ChevronDown, ChevronUp, Search, Package, Warehouse } from 'lucide-react';
import { inventarioService } from '../services/inventarioService';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

// Del stock que ya trae el repuesto (todas las sucursales, porque el
// endpoint de Repuestos no lo filtra a nivel de ubicaciones) nos quedamos
// solo con las ubicaciones que pertenecen a la sucursal activa. Sin esto
// se vería stock de otra sucursal mezclado, el mismo tipo de bug que ya
// se corrigió en el kiosko.
const ubicacionesDeLaSucursal = (repuesto, sucursalNombre) =>
  (repuesto.inventario_stock || []).filter(u => u.sucursal_nombre === sucursalNombre);

// Paleta suave y consistente con el resto del sistema (mismos tonos que
// los banners de estado de Órdenes de Trabajo): nada de rojo/verde sólido
// tipo semáforo, sino chips con fondo tenue.
const nivelStockSx = (nivel) => {
  if (nivel === 'bajo') return { bgcolor: alpha(C.brand, 0.12), color: '#fda4af', border: `1px solid ${alpha(C.brandLight, 0.24)}` };
  if (nivel === 'ok') return { bgcolor: alpha(C.emerald, 0.12), color: '#6ee7b7', border: `1px solid ${alpha(C.emerald, 0.24)}` };
  return { bgcolor: alpha('#ffffff', 0.04), color: C.textMuted, border: `1px solid ${C.border}` };
};

// El backend solo entrega el detalle ya armado como "Pasillo X - Estante Y -
// Casillero Z" (un string). Sin tocar el backend, lo partimos acá para
// mostrar cada dato como su propia insignia, no todo junto como un bloque
// de texto — así se distingue de un vistazo cada código.
const segmentosUbicacion = (detalle) => (detalle || '').split(' - ').map(s => s.trim()).filter(Boolean);

function FilaRepuesto({ repuesto, sucursalNombre }) {
  const [abierto, setAbierto] = useState(false);
  const ubicaciones = ubicacionesDeLaSucursal(repuesto, sucursalNombre);
  const stockSucursal = ubicaciones.reduce((sum, u) => sum + parseFloat(u.stock_disponible || 0), 0);
  const minimoSucursal = ubicaciones.reduce((sum, u) => sum + parseFloat(u.stock_minimo || 0), 0);
  const nivel = ubicaciones.length === 0 ? 'sin' : (stockSucursal <= minimoSucursal ? 'bajo' : 'ok');

  return (
    <>
      <TableRow hover sx={{ '& td': { borderColor: 'divider' } }}>
        <TableCell sx={{ py: 1.5 }}>
          <IconButton
            size="small"
            onClick={() => setAbierto(v => !v)}
            disabled={ubicaciones.length === 0}
            sx={{ bgcolor: abierto ? alpha(C.blue, 0.1) : 'transparent', color: abierto ? C.blue : C.textMuted, border: `1px solid ${abierto ? alpha(C.blue, 0.2) : 'transparent'}`, borderRadius: '8px' }}
          >
            {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontWeight: 600 }}>{repuesto.codigo}</TableCell>
        <TableCell sx={{ fontWeight: 700, color: C.text }}>{repuesto.nombre}</TableCell>
        <TableCell>
          {repuesto.categoria_nombre
            ? <Chip label={repuesto.categoria_nombre} size="small" sx={{ bgcolor: alpha(C.blue, 0.08), color: C.blue, border: `1px solid ${alpha(C.blue, 0.18)}`, fontWeight: 600, borderRadius: '6px' }} />
            : <Typography variant="body2" color="text.secondary">—</Typography>}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary' }}>{repuesto.marca_nombre || '—'}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(repuesto.precio_lista || 0).toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(repuesto.precio_cash || 0).toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>S/ {parseFloat(repuesto.precio_por_mayor || 0).toFixed(2)}</TableCell>
        <TableCell align="center">
          <Chip
            label={nivel === 'sin' ? 'Sin stock aquí' : `${stockSucursal} unid.`}
            size="small"
            sx={{ fontWeight: 700, borderRadius: '8px', px: 0.5, ...nivelStockSx(nivel) }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ p: 0, borderBottom: abierto ? undefined : 'none' }}>
          <Collapse in={abierto} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2.5, bgcolor: alpha('#000000', 0.16), borderTop: `1px dashed ${C.border}` }}>
              <Typography variant="caption" fontWeight="700" color="text.secondary" textTransform="uppercase" display="flex" alignItems="center" gap={0.75} mb={1.5}>
                <Warehouse size={14} /> Ubicaciones de "{repuesto.nombre}" en esta sucursal
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: '8px', border: `1px solid ${C.border}`, overflow: 'hidden', bgcolor: C.surfaceSoft }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: alpha(C.surfaceMuted, 0.76), fontWeight: 700, color: C.textMuted, borderColor: C.border } }}>
                      <TableCell>Almacén</TableCell>
                      <TableCell>Ubicación</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Mínimo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ubicaciones.map(u => {
                      const nivelUbicacion = parseFloat(u.stock_disponible) <= parseFloat(u.stock_minimo) ? 'bajo' : 'ok';
                      return (
                        <TableRow key={u.id} sx={{ bgcolor: 'transparent', '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{u.almacen_nombre}</TableCell>
                          <TableCell>
                            {segmentosUbicacion(u.ubicacion_detalle).length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {segmentosUbicacion(u.ubicacion_detalle).map((seg, i) => (
                                  <Chip
                                    key={i}
                                    label={seg}
                                    size="small"
                                    sx={{ bgcolor: alpha(C.blue, 0.1), color: '#7dd3fc', border: `1px solid ${alpha(C.blue, 0.18)}`, fontWeight: 600, borderRadius: '6px', height: '22px', fontSize: '0.72rem' }}
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">{u.ubicacion_codigo}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={u.stock_disponible}
                              size="small"
                              sx={{ fontWeight: 700, borderRadius: '8px', ...nivelStockSx(nivelUbicacion) }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>{u.stock_minimo}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function StockUbicacionesPage() {
  const { sucursales, activeSucursalId } = useSucursal();
  const sucursalActiva = sucursales.find(s => String(s.id) === String(activeSucursalId));

  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRepuestos = useCallback(async () => {
    if (!activeSucursalId) return;
    try {
      setLoading(true);
      const data = await inventarioService.getRepuestos({
        sucursal: activeSucursalId,
        search,
        categoria: filterCategoria,
        marca: filterMarca,
        page: page + 1,
        page_size: rowsPerPage,
      });
      setRepuestos(data.results || data || []);
      setTotalCount(data.count ?? (data.results ? data.results.length : (Array.isArray(data) ? data.length : 0)));
    } catch (error) {
      console.error('Error al cargar stock por ubicaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [activeSucursalId, search, filterCategoria, filterMarca, page, rowsPerPage]);

  useEffect(() => { fetchRepuestos(); }, [fetchRepuestos]);

  useEffect(() => {
    inventarioService.getCategorias().then(d => setCategorias(d.results || d || [])).catch(() => {});
    inventarioService.getMarcas().then(d => setMarcas(d.results || d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '8px' } };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', pb: 6 }}>
      {/* Encabezado */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.1)}, transparent 46%), linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 68%)` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '8px', bgcolor: alpha(C.brand, 0.16), border: `1px solid ${alpha(C.brandLight, 0.26)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={22} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="800" color={C.text}>Ubicaciones de Stock</Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Consulta el stock y las ubicaciones de los repuestos en la sucursal actual.
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<MapPin size={14} color={C.blue} />}
            label={<span>Sucursal: <strong>{sucursalActiva?.nombre || '—'}</strong> (solo esta sucursal)</span>}
            sx={{ bgcolor: alpha(C.blue, 0.1), color: '#7dd3fc', border: `1px solid ${alpha(C.blue, 0.22)}`, fontWeight: 600, borderRadius: '8px', py: 2.2 }}
          />
        </Box>
      </Paper>

      {/* Filtros */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <TextField
          select size="small" label="Categoría" sx={{ minWidth: 170, ...inputSx }}
          value={filterCategoria} onChange={e => { setFilterCategoria(e.target.value); setPage(0); }}
        >
          <MenuItem value="">Todas</MenuItem>
          {categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Marca" sx={{ minWidth: 170, ...inputSx }}
          value={filterMarca} onChange={e => { setFilterMarca(e.target.value); setPage(0); }}
        >
          <MenuItem value="">Todas</MenuItem>
          {marcas.map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
        </TextField>
        <TextField
          size="small" placeholder="Buscar por nombre o código..." sx={{ flex: 1, minWidth: 220, ...inputSx }}
          value={searchInput} onChange={e => setSearchInput(e.target.value)}
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> }}
        />
      </Paper>

      {/* Tabla */}
      <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: alpha(C.surfaceSoft, 0.92), fontWeight: 700, color: C.textMuted, py: 2, borderColor: C.border } }}>
                  <TableCell width={44} />
                  <TableCell>Código</TableCell>
                  <TableCell>Repuesto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell align="right">Precio Lista</TableCell>
                  <TableCell align="right">Precio Cash</TableCell>
                  <TableCell align="right">Precio Mayor</TableCell>
                  <TableCell align="center">Stock Sucursal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repuestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                      <Package size={32} style={{ opacity: 0.35, marginBottom: 8 }} />
                      <Typography variant="body2">No hay repuestos con stock en esta sucursal para los filtros aplicados.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  repuestos.map(r => (
                    <FilaRepuesto key={r.id} repuesto={r} sucursalNombre={sucursalActiva?.nombre} />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!loading && totalCount > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            labelRowsPerPage="Filas por página:"
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Paper>
    </Box>
  );
}
