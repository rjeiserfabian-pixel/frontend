import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import FiltroBusqueda from '../../../shared/components/FiltroBusqueda';
import { mensajeError } from '../../../shared/utils/errores';
import { auditoriaService } from '../services/auditoriaService';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const headSx = { fontWeight: 800, color: C.textMuted };

// Acciones que merecen atención visual
const ACCIONES_ROJAS = ['ELIMINAR', 'VENTA_ANULADA', 'PEDIDO_CANCELADO', 'ACCESO_DENEGADO', 'LOGIN_FALLIDO'];
const ACCIONES_NARANJA = ['CAMBIO_PRECIO', 'AJUSTE_STOCK', 'CAMBIO_PERMISOS_ROL', 'CIERRE_CAJA'];

const colorAccion = (accion) => {
  if (ACCIONES_ROJAS.includes(accion)) return 'error';
  if (ACCIONES_NARANJA.includes(accion)) return 'warning';
  if (accion === 'CREAR') return 'success';
  return 'default';
};

const fechaHora = (iso) => new Date(iso).toLocaleString('es-PE', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

const aOpciones = (lista) => (lista || []).map((v) => ({ id: v, nombre: v }));

function useDebounced(valor, ms) {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}

// Lógica de datos separada de la vista
function useAuditoria() {
  const [filtros, setFiltros] = useState({ usuario: '', modulo: '', accion: '', fecha_desde: '', fecha_hasta: '', search: '' });
  const [opciones, setOpciones] = useState({ modulos: [], acciones: [] });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [datos, setDatos] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const usuario = useDebounced(filtros.usuario, 400);
  const busqueda = useDebounced(filtros.search, 400);

  useEffect(() => {
    auditoriaService.opciones().then(setOpciones).catch(() => setOpciones({ modulos: [], acciones: [] }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { page: page + 1, page_size: rowsPerPage };
    if (usuario.trim()) params.usuario = usuario.trim();
    if (busqueda.trim()) params.search = busqueda.trim();
    ['modulo', 'accion', 'fecha_desde', 'fecha_hasta'].forEach((k) => { if (filtros[k]) params[k] = filtros[k]; });
    setLoading(true);
    auditoriaService.listar(params, controller.signal)
      .then(setDatos)
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') Swal.fire('Error', mensajeError(error, 'No se pudo cargar la auditoría'), 'error');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, rowsPerPage, usuario, busqueda, filtros.modulo, filtros.accion, filtros.fecha_desde, filtros.fecha_hasta]);

  const cambiar = (campo) => (valor) => { setFiltros((f) => ({ ...f, [campo]: valor })); setPage(0); };
  return { filtros, cambiar, opciones, page, setPage, rowsPerPage, setRowsPerPage, datos, loading };
}

const Json = ({ titulo, valor }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="subtitle2" sx={{ color: C.textMuted, fontWeight: 800, mb: 0.5 }}>{titulo}</Typography>
    <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1, fontSize: '0.78rem', overflow: 'auto', maxHeight: 320 }}>
      {valor ? JSON.stringify(valor, null, 2) : '—'}
    </Box>
  </Box>
);

export default function AuditoriaPage() {
  const a = useAuditoria();
  const [detalle, setDetalle] = useState(null);
  const filas = a.datos.results || [];
  const modulos = useMemo(() => aOpciones(a.opciones.modulos), [a.opciones.modulos]);
  const acciones = useMemo(() => aOpciones(a.opciones.acciones), [a.opciones.acciones]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Auditoría del Sistema</Typography>
        <Typography variant="body2" color="text.secondary">
          Registro de quién hizo qué y cuándo (altas, cambios, eliminaciones, anulaciones, ajustes de stock, precios,
          permisos, cierres de caja e inicios de sesión). Es de solo lectura y no se puede modificar.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TextField size="small" label="Usuario" value={a.filtros.usuario} onChange={(e) => a.cambiar('usuario')(e.target.value)} sx={{ width: 180 }} />
        <FiltroBusqueda label="Módulo" options={modulos} value={a.filtros.modulo} onChange={(e) => a.cambiar('modulo')(e.target.value)} sx={{ width: 190 }} />
        <FiltroBusqueda label="Acción" options={acciones} value={a.filtros.accion} onChange={(e) => a.cambiar('accion')(e.target.value)} sx={{ width: 220 }} />
        <TextField size="small" type="date" label="Desde" slotProps={{ inputLabel: { shrink: true } }} value={a.filtros.fecha_desde}
          onChange={(e) => a.cambiar('fecha_desde')(e.target.value)} sx={{ width: 160 }} />
        <TextField size="small" type="date" label="Hasta" slotProps={{ inputLabel: { shrink: true } }} value={a.filtros.fecha_hasta}
          onChange={(e) => a.cambiar('fecha_hasta')(e.target.value)} sx={{ width: 160 }} />
        <TextField size="small" label="Tabla o N.º de registro" value={a.filtros.search} onChange={(e) => a.cambiar('search')(e.target.value)} sx={{ width: 200 }} />
      </Paper>

      <Paper sx={{ borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Fecha y hora</TableCell>
                <TableCell sx={headSx}>Usuario</TableCell>
                <TableCell sx={headSx}>Módulo</TableCell>
                <TableCell sx={headSx}>Acción</TableCell>
                <TableCell sx={headSx}>Sobre</TableCell>
                <TableCell sx={headSx}>IP</TableCell>
                <TableCell sx={headSx} align="center">Detalle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {a.loading && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              )}
              {!a.loading && filas.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: C.textMuted }}>No hay registros con estos filtros.</TableCell></TableRow>
              )}
              {!a.loading && filas.map((f) => (
                <TableRow key={f.id_auditoria} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaHora(f.fecha)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{f.usuario_nombre || <span style={{ color: C.textMuted }}>Sin sesión</span>}</TableCell>
                  <TableCell>{f.modulo}</TableCell>
                  <TableCell><Chip size="small" color={colorAccion(f.accion)} label={f.accion.replaceAll('_', ' ')} /></TableCell>
                  <TableCell>{f.tabla_afectada}{f.registro_id ? ` #${f.registro_id}` : ''}</TableCell>
                  <TableCell>{f.ip || '—'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" aria-label="Ver detalle" onClick={() => setDetalle(f)}><Eye size={18} /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={a.datos.count || 0} page={a.page}
          onPageChange={(_, p) => a.setPage(p)} rowsPerPage={a.rowsPerPage}
          onRowsPerPageChange={(e) => { a.setRowsPerPage(parseInt(e.target.value, 10)); a.setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]} labelRowsPerPage="Filas por página:"
        />
      </Paper>

      <Dialog open={Boolean(detalle)} onClose={() => setDetalle(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {detalle?.accion?.replaceAll('_', ' ')} · {detalle?.tabla_afectada}{detalle?.registro_id ? ` #${detalle.registro_id}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: C.textMuted }}>
            {detalle && `${fechaHora(detalle.fecha)} · ${detalle.usuario_nombre || 'Sin sesión'} · IP ${detalle.ip || '—'}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <Json titulo="Antes" valor={detalle?.datos_anteriores} />
            <Json titulo="Después / datos enviados" valor={detalle?.datos_nuevos} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setDetalle(null)}>Cerrar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
