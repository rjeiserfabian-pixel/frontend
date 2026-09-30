import { useCallback, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Car, CheckCircle2, Search, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';
import { vehiculoService } from '../../vehiculos/services/vehiculosService';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const formatoMoneda = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

const normalizarVehiculo = (data) => ({
  ...data,
  placa: data?.placa || '',
  marca: data?.marca || '',
  modelo: data?.modelo || '',
  anio: data?.anio_fabricacion || data?.anio || '',
  tipoCombustible: data?.tipo_combustible || '',
});

export default function ComparadorPlacaPage() {
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRepuestos, setLoadingRepuestos] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const vehiculoParams = useMemo(() => {
    if (!vehiculo?.marca) return null;
    return {
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      tipoCombustible: vehiculo.tipoCombustible,
    };
  }, [vehiculo]);

  const cargarRepuestos = useCallback(async ({ nextPage = page, nextRows = rowsPerPage, nextSearch = search, nextCategoria = categoria } = {}) => {
    if (!vehiculoParams) return;
    setLoadingRepuestos(true);
    try {
      const data = await inventarioService.getComparadorPorPlaca({
        ...vehiculoParams,
        search: nextSearch,
        categoria: nextCategoria,
        page: nextPage + 1,
        pageSize: nextRows,
      });
      setRepuestos(data.results || []);
      setCategorias(data.categorias_disponibles || []);
      setTotal(data.count || (data.results || []).length);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.error || 'No se pudieron cargar los repuestos compatibles', 'error');
    } finally {
      setLoadingRepuestos(false);
    }
  }, [categoria, page, rowsPerPage, search, vehiculoParams]);

  const buscarVehiculo = async (event) => {
    event.preventDefault();
    const placaLimpia = placa.trim().replaceAll('-', '').replaceAll(' ', '').toUpperCase();
    if (placaLimpia.length < 6) {
      setError('Ingresa una placa valida para consultar.');
      return;
    }

    setLoading(true);
    setError('');
    setVehiculo(null);
    setRepuestos([]);
    setCategorias([]);
    setCategoria('');
    setSearch('');
    setPage(0);

    try {
      const res = await vehiculoService.buscarPorPlaca(placaLimpia);
      const normalizado = normalizarVehiculo(res.data || {});
      setVehiculo(normalizado);
      if (!normalizado.marca) {
        setError('La consulta encontro la placa, pero no devolvio marca para comparar repuestos.');
        return;
      }
      const data = await inventarioService.getComparadorPorPlaca({
        marca: normalizado.marca,
        modelo: normalizado.modelo,
        anio: normalizado.anio,
        tipoCombustible: normalizado.tipoCombustible,
        page: 1,
        pageSize: rowsPerPage,
      });
      setRepuestos(data.results || []);
      setCategorias(data.categorias_disponibles || []);
      setTotal(data.count || (data.results || []).length);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo consultar la placa.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = async (event) => {
    event.preventDefault();
    setPage(0);
    await cargarRepuestos({ nextPage: 0 });
  };

  const handleChangePage = async (_, newPage) => {
    setPage(newPage);
    await cargarRepuestos({ nextPage: newPage });
  };

  const handleChangeRows = async (event) => {
    const nextRows = parseInt(event.target.value, 10);
    setRowsPerPage(nextRows);
    setPage(0);
    await cargarRepuestos({ nextPage: 0, nextRows });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={900} color="white">
          Comparador por Placa
        </Typography>
        <Typography color={C.textMuted}>
          Consulta el vehiculo y compara repuestos compatibles con todos los productos del inventario.
        </Typography>
      </Box>

      <Paper component="form" onSubmit={buscarVehiculo} sx={{ p: 2.5, mb: 3, bgcolor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Placa del vehiculo"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: F3H792"
              InputProps={{ startAdornment: <Car size={18} style={{ marginRight: 8, color: C.textMuted }} /> }}
            />
          </Grid>
          <Grid item xs={12} md="auto">
            <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : <Search size={18} />}>
              Buscar y comparar
            </Button>
          </Grid>
        </Grid>
        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      {vehiculo && (
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <Grid container spacing={2}>
            {[
              ['Placa', vehiculo.placa || placa],
              ['Marca', vehiculo.marca || '-'],
              ['Modelo', vehiculo.modelo || '-'],
              ['Anio', vehiculo.anio || '-'],
              ['Combustible', vehiculo.tipoCombustible || '-'],
            ].map(([label, value]) => (
              <Grid item xs={6} md={2.4} key={label}>
                <Typography variant="caption" color={C.textMuted}>{label}</Typography>
                <Typography fontWeight={800} color="white">{value}</Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {vehiculoParams && (
        <Paper sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <Box component="form" onSubmit={handleFiltrar} sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 240px auto' }, gap: 2 }}>
            <TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, codigo o barras..." />
            <TextField select value={categoria} onChange={(e) => setCategoria(e.target.value)} label="Categoria">
              <MenuItem value="">Todas</MenuItem>
              {categorias.map((cat) => (
                <MenuItem key={cat.id || 'sin-categoria'} value={cat.id || ''}>{cat.nombre || 'Sin categoria'} ({cat.total})</MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="outlined" startIcon={<Search size={18} />}>Filtrar</Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Repuesto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Kiosko</TableCell>
                  <TableCell align="right">Cash</TableCell>
                  <TableCell align="right">Mayor</TableCell>
                  <TableCell align="right">Lista</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingRepuestos ? (
                  <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={28} /></TableCell></TableRow>
                ) : repuestos.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">No hay repuestos compatibles para esta consulta.</TableCell></TableRow>
                ) : repuestos.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography fontWeight={800} color="white">{row.nombre}</Typography>
                      <Typography variant="caption" color={C.textMuted}>{row.codigo}{row.codigo_barra ? ` | ${row.codigo_barra}` : ''}</Typography>
                    </TableCell>
                    <TableCell>{row.categoria_nombre || '-'}</TableCell>
                    <TableCell>{row.marca_nombre || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={row.stock_total_disponible} color={row.stock_total_disponible > 0 ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell align="center">
                      {row.visible_en_kiosko ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#94a3b8" />}
                    </TableCell>
                    <TableCell align="right">{formatoMoneda(row.precio_cash)}</TableCell>
                    <TableCell align="right">{formatoMoneda(row.precio_por_mayor)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: alpha('#fff', 0.95) }}>{formatoMoneda(row.precio_lista)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRows}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Filas"
          />
        </Paper>
      )}
    </Box>
  );
}
