import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Chip, CircularProgress, FormControlLabel, Paper, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { inventarioService } from '../services/inventarioService';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const headSx = { fontWeight: 800, color: C.textMuted };

const num = (v) => Number(v || 0).toLocaleString('es-PE', { maximumFractionDigits: 2 });
const soles = (v) => `S/ ${Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function useDebounced(valor, ms) {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}

// Lógica de datos separada de la vista
function useReposicion() {
  const { activeSucursalId } = useSucursal();
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState(null);
  const [texto, setTexto] = useState('');
  const [soloAgotados, setSoloAgotados] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [datos, setDatos] = useState({ results: [], count: 0, resumen: null });
  const [loading, setLoading] = useState(true);
  const busqueda = useDebounced(texto, 400);

  useEffect(() => {
    inventarioService.getCategorias({ page_size: 500 })
      .then((d) => setCategorias(d.results || d))
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: rowsPerPage };
    if (activeSucursalId) params.sucursal = activeSucursalId;
    if (categoria) params.categoria = categoria.id;
    if (busqueda.trim()) params.search = busqueda.trim();
    if (soloAgotados) params.solo_agotados = 1;
    setLoading(true);
    inventarioService.getReposicion(params, controller.signal)
      .then(setDatos)
      .catch((error) => {
        if (error.code === 'ERR_CANCELED') return;
        Swal.fire('Error', 'No se pudo cargar la reposición de stock.', 'error');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, rowsPerPage, activeSucursalId, categoria, busqueda, soloAgotados]);

  const volverAPrimera = (setter) => (valor) => { setter(valor); setPage(0); };
  return {
    categorias, categoria, setCategoria: volverAPrimera(setCategoria),
    texto, setTexto: volverAPrimera(setTexto),
    soloAgotados, setSoloAgotados: volverAPrimera(setSoloAgotados),
    page, setPage, rowsPerPage, setRowsPerPage, datos, loading,
  };
}

const Kpi = ({ titulo, valor, color }) => (
  <Paper sx={{ p: 2, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, flex: '1 1 180px' }}>
    <Typography variant="caption" sx={{ color: C.textMuted, fontWeight: 700 }}>{titulo}</Typography>
    <Typography variant="h5" fontWeight={800} sx={{ color }}>{valor}</Typography>
  </Paper>
);

export default function ReposicionStockPage() {
  const r = useReposicion();
  const resumen = r.datos.resumen;
  const filas = r.datos.results || [];
  const hayFiltros = useMemo(() => Boolean(r.categoria || r.texto || r.soloAgotados), [r.categoria, r.texto, r.soloAgotados]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Reposición de Stock</Typography>
        <Typography variant="body2" color="text.secondary">
          Repuestos con stock igual o menor a su mínimo. La cantidad sugerida lleva el stock a 2 veces el mínimo.
          El mínimo se configura en Repuestos &gt; Ajustar stock.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Kpi titulo="Repuestos en alerta" valor={resumen ? resumen.total_alertas : '-'} color={C.amber} />
        <Kpi titulo="Agotados" valor={resumen ? resumen.agotados : '-'} color={C.brandLight} />
        <Kpi titulo="Bajo el mínimo" valor={resumen ? resumen.bajos : '-'} color={C.amber} />
        <Kpi titulo="Costo estimado de reposición" valor={resumen ? soles(resumen.costo_reposicion_estimado) : '-'} color={C.emerald} />
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TextField size="small" label="Buscar (código o nombre)" value={r.texto}
          onChange={(e) => r.setTexto(e.target.value)} sx={{ minWidth: 260 }} />
        <Autocomplete
          size="small" sx={{ minWidth: 220 }} options={r.categorias} value={r.categoria}
          getOptionLabel={(o) => o.nombre || ''} isOptionEqualToValue={(o, v) => o.id === v.id}
          onChange={(_, v) => r.setCategoria(v)} noOptionsText="Sin resultados"
          renderInput={(params) => <TextField {...params} label="Categoría" />}
        />
        <FormControlLabel
          control={<Switch checked={r.soloAgotados} onChange={(e) => r.setSoloAgotados(e.target.checked)} />}
          label="Solo agotados"
        />
      </Paper>

      <Paper sx={{ borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Código</TableCell>
                <TableCell sx={headSx}>Repuesto</TableCell>
                <TableCell sx={headSx}>Almacén</TableCell>
                <TableCell sx={headSx} align="right">Disponible</TableCell>
                <TableCell sx={headSx} align="right">Mínimo</TableCell>
                <TableCell sx={headSx} align="right">Sugerido</TableCell>
                <TableCell sx={headSx} align="right">Costo est.</TableCell>
                <TableCell sx={headSx}>Último proveedor</TableCell>
                <TableCell sx={headSx} align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {r.loading && (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              )}
              {!r.loading && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: C.textMuted }}>
                    {hayFiltros ? 'Ningún repuesto coincide con los filtros.' : 'Todo el stock está por encima del mínimo.'}
                  </TableCell>
                </TableRow>
              )}
              {!r.loading && filas.map((f) => (
                <TableRow key={`${f.repuesto_id}-${f.almacen_id}`} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{f.codigo}</TableCell>
                  <TableCell>
                    {f.nombre}
                    <Typography variant="caption" display="block" sx={{ color: C.textMuted }}>
                      {[f.categoria, f.marca].filter(Boolean).join(' · ')}
                    </Typography>
                  </TableCell>
                  <TableCell>{f.sucursal} · {f.almacen}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: f.nivel === 'AGOTADO' ? C.brandLight : C.amber }}>
                    {num(f.disponible)} {f.unidad}
                  </TableCell>
                  <TableCell align="right">{num(f.minimo)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{num(f.sugerido)}</TableCell>
                  <TableCell align="right">{soles(f.costo_estimado)}</TableCell>
                  <TableCell>{f.ultimo_proveedor || <span style={{ color: C.textMuted }}>—</span>}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={f.nivel === 'AGOTADO' ? 'Agotado' : 'Bajo'}
                      color={f.nivel === 'AGOTADO' ? 'error' : 'warning'}
                      sx={{ fontWeight: 700, bgcolor: alpha(f.nivel === 'AGOTADO' ? C.brandLight : C.amber, 0.18) }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={r.datos.count || 0} page={r.page}
          onPageChange={(_, p) => r.setPage(p)} rowsPerPage={r.rowsPerPage}
          onRowsPerPageChange={(e) => { r.setRowsPerPage(parseInt(e.target.value, 10)); r.setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]} labelRowsPerPage="Filas por página:"
        />
      </Paper>
    </Box>
  );
}
