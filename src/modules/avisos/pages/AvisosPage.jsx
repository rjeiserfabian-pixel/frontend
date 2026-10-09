import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, Paper, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { Ban, Copy, MessageCircle, RefreshCw, Undo2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import FiltroBusqueda from '../../../shared/components/FiltroBusqueda';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { mensajeError } from '../../../shared/utils/errores';
import { TIPOS_AVISO, avisosService } from '../services/avisosService';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const headSx = { fontWeight: 800, color: C.textMuted };

const fecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

function useDebounced(valor, ms) {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return debounced;
}

// Lógica de datos separada de la vista
function useAvisos() {
  const [estado, setEstado] = useState('PENDIENTE');
  const [tipo, setTipo] = useState('');
  const [texto, setTexto] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [datos, setDatos] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const busqueda = useDebounced(texto, 400);

  useEffect(() => {
    const controller = new AbortController();
    const params = { estado, page: page + 1, page_size: rowsPerPage };
    if (tipo) params.tipo = tipo;
    if (busqueda.trim()) params.search = busqueda.trim();
    setLoading(true);
    avisosService.listar(params, controller.signal)
      .then(setDatos)
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') Swal.fire('Error', mensajeError(error, 'No se pudieron cargar los avisos'), 'error');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [estado, tipo, busqueda, page, rowsPerPage, recarga]);

  const recargar = useCallback(() => setRecarga((n) => n + 1), []);
  const reiniciar = (setter) => (valor) => { setter(valor); setPage(0); };
  return {
    estado, setEstado: reiniciar(setEstado), tipo, setTipo: reiniciar(setTipo), texto, setTexto: reiniciar(setTexto),
    page, setPage, rowsPerPage, setRowsPerPage, datos, loading, recargar,
  };
}

export default function AvisosPage() {
  const { tienePermiso } = usePermisos();
  const puedeGestionar = tienePermiso('AVISOS.GESTIONAR');
  const a = useAvisos();
  const [actualizando, setActualizando] = useState(false);
  const { recargar } = a;

  const actualizar = useCallback(async (silencioso = false) => {
    setActualizando(true);
    try {
      const r = await avisosService.generar();
      recargar();
      if (!silencioso) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', timer: 3500, showConfirmButton: false,
          title: `${r.creados} aviso(s) nuevo(s), ${r.descartados} descartado(s) por ya no aplicar` });
      }
    } catch (error) {
      if (!silencioso) Swal.fire('Error', mensajeError(error, 'No se pudieron actualizar los avisos'), 'error');
    } finally {
      setActualizando(false);
    }
  }, [recargar]);

  // Al entrar a la pantalla se calculan los avisos del día (es seguro: no duplica).
  useEffect(() => { actualizar(true); }, [actualizar]);

  const accion = async (promesa, mensajeFallo) => {
    try { await promesa; recargar(); }
    catch (error) { Swal.fire('Error', mensajeError(error, mensajeFallo), 'error'); }
  };

  const enviarWhatsapp = (aviso) => {
    window.open(aviso.whatsapp_url, '_blank', 'noopener');
    // Se registra como enviado al abrir WhatsApp; si no se envió, se puede reabrir.
    if (puedeGestionar && aviso.estado === 'PENDIENTE') accion(avisosService.marcarEnviado(aviso.id), 'No se pudo marcar como enviado');
  };

  const copiar = async (aviso) => {
    try {
      await navigator.clipboard.writeText(aviso.mensaje);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', timer: 1800, showConfirmButton: false, title: 'Mensaje copiado' });
    } catch {
      Swal.fire('Copiar manualmente', aviso.mensaje, 'info');
    }
  };

  const filas = a.datos.results || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Avisos a Clientes</Typography>
          <Typography variant="body2" color="text.secondary">
            Citas de mañana, vehículos listos, cotizaciones y mantenimientos por vencer, documentos y cuotas. El mensaje ya está redactado:
            pulse el botón de WhatsApp para enviarlo.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={actualizando ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
          onClick={() => actualizar(false)} disabled={actualizando}>
          Actualizar avisos
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <Tabs value={a.estado} onChange={(_, v) => a.setEstado(v)} sx={{ mb: 2 }}>
          <Tab value="PENDIENTE" label="Pendientes" />
          <Tab value="ENVIADO" label="Enviados" />
          <Tab value="DESCARTADO" label="Descartados" />
        </Tabs>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" label="Buscar (cliente o teléfono)" value={a.texto}
            onChange={(e) => a.setTexto(e.target.value)} sx={{ minWidth: 260 }} />
          <FiltroBusqueda label="Tipo de aviso" options={TIPOS_AVISO} value={a.tipo}
            onChange={(e) => a.setTipo(e.target.value)} sx={{ minWidth: 240 }} />
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Tipo</TableCell>
                <TableCell sx={headSx}>Cliente</TableCell>
                <TableCell sx={headSx}>Teléfono</TableCell>
                <TableCell sx={headSx}>Mensaje</TableCell>
                <TableCell sx={headSx}>Fecha</TableCell>
                <TableCell sx={headSx} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {a.loading && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              )}
              {!a.loading && filas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: C.textMuted }}>
                    {a.estado === 'PENDIENTE' ? 'No hay avisos pendientes. ¡Todo al día!' : 'No hay avisos en esta lista.'}
                  </TableCell>
                </TableRow>
              )}
              {!a.loading && filas.map((aviso) => (
                <TableRow key={aviso.id} hover>
                  <TableCell><Chip size="small" label={aviso.tipo_display} /></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{aviso.cliente_nombre}</TableCell>
                  <TableCell>
                    {aviso.telefono
                      ? `+${aviso.telefono}`
                      : <Tooltip title="El cliente no tiene un teléfono válido. Complételo en Contactos > Clientes y actualice los avisos.">
                          <Chip size="small" color="warning" label="Sin teléfono" />
                        </Tooltip>}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={aviso.mensaje}>
                      {aviso.mensaje}
                    </Typography>
                    {aviso.atendido_por_nombre && (
                      <Typography variant="caption" sx={{ color: C.textMuted }}>
                        {aviso.descartado_automatico ? 'Descartado automáticamente (ya no aplica)' : `Por ${aviso.atendido_por_nombre}`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fecha(aviso.fecha_evento)}</TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {aviso.whatsapp_url && aviso.estado !== 'DESCARTADO' && (
                      <Tooltip title={aviso.estado === 'ENVIADO' ? 'Volver a abrir WhatsApp' : 'Enviar por WhatsApp'}>
                        <IconButton size="small" sx={{ color: C.emerald }} aria-label="Enviar por WhatsApp" onClick={() => enviarWhatsapp(aviso)}>
                          <MessageCircle size={20} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Copiar mensaje">
                      <IconButton size="small" aria-label="Copiar mensaje" onClick={() => copiar(aviso)}><Copy size={18} /></IconButton>
                    </Tooltip>
                    {puedeGestionar && aviso.estado === 'PENDIENTE' && (
                      <Tooltip title="Descartar aviso">
                        <IconButton size="small" color="error" aria-label="Descartar aviso"
                          onClick={() => accion(avisosService.descartar(aviso.id), 'No se pudo descartar el aviso')}>
                          <Ban size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {puedeGestionar && aviso.estado !== 'PENDIENTE' && (
                      <Tooltip title="Volver a pendientes">
                        <IconButton size="small" aria-label="Volver a pendientes"
                          onClick={() => accion(avisosService.reabrir(aviso.id), 'No se pudo reabrir el aviso')}>
                          <Undo2 size={18} />
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
          component="div" count={a.datos.count || 0} page={a.page}
          onPageChange={(_, p) => a.setPage(p)} rowsPerPage={a.rowsPerPage}
          onRowsPerPageChange={(e) => { a.setRowsPerPage(parseInt(e.target.value, 10)); a.setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]} labelRowsPerPage="Filas por página:"
        />
      </Paper>
    </Box>
  );
}
