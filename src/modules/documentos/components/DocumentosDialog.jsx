import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import { mensajeError } from '../../../shared/utils/errores';
import { documentosService } from '../services/documentosService';
import DocumentoFormDialog from './DocumentoFormDialog';

const C = premiumTokens.colors;

const fecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

export const chipVigencia = (doc) => {
  const dias = doc.dias_para_vencer;
  switch (doc.estado_vigencia) {
    case 'VENCIDO': return <Chip size="small" color="error" label={`Vencido hace ${Math.abs(dias)} d`} />;
    case 'POR_VENCER': return <Chip size="small" color="warning" label={dias === 0 ? 'Vence hoy' : `Vence en ${dias} d`} />;
    case 'VIGENTE': return <Chip size="small" color="success" label="Vigente" />;
    default: return <Chip size="small" label="Sin vencimiento" />;
  }
};

/**
 * Documentos de un vehículo o de un cliente (SOAT, revisión técnica, licencia...).
 * `entidad` = 'VEHICULO' | 'CLIENTE'. `puedeGestionar` habilita agregar/editar/eliminar.
 */
export default function DocumentosDialog({ open, entidad, entidadId, titulo, puedeGestionar, onClose }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async (signal) => {
    setLoading(true);
    try {
      const params = entidad === 'VEHICULO' ? { vehiculo: entidadId } : { cliente: entidadId };
      const data = await documentosService.listar(params, signal);
      setDocumentos(data.results || []);
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') Swal.fire('Error', mensajeError(error, 'No se pudieron cargar los documentos'), 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [entidad, entidadId]);

  useEffect(() => {
    if (!open || !entidadId) return undefined;
    const controller = new AbortController();
    cargar(controller.signal);
    return () => controller.abort();
  }, [open, entidadId, cargar]);

  const abrirFormulario = (doc = null) => { setEditando(doc); setFormAbierto(true); };

  const verArchivo = async (doc) => {
    try { await documentosService.abrirArchivo(doc.id); }
    catch (error) { Swal.fire('Error', mensajeError(error, 'No se pudo abrir el archivo'), 'error'); }
  };

  const eliminar = async (doc) => {
    const r = await Swal.fire({
      title: '¿Eliminar documento?', text: `${doc.tipo_display} ${doc.numero || ''}`.trim(),
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!r.isConfirmed) return;
    try {
      await documentosService.eliminar(doc.id);
      cargar();
    } catch (error) {
      Swal.fire('Error', mensajeError(error, 'No se pudo eliminar el documento'), 'error');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Documentos · {titulo}</span>
          {puedeGestionar && (
            <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => abrirFormulario()}
              sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
              Agregar documento
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
          ) : documentos.length === 0 ? (
            <Typography align="center" sx={{ py: 4, color: C.textMuted }}>
              Aún no hay documentos registrados. {puedeGestionar ? 'Use "Agregar documento" para registrar el primero.' : ''}
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Documento</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Número</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Emisor</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Vence</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Estado</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{doc.tipo_display}</TableCell>
                    <TableCell>{doc.numero || '—'}</TableCell>
                    <TableCell>{doc.entidad_emisora || '—'}</TableCell>
                    <TableCell>{fecha(doc.fecha_vencimiento)}</TableCell>
                    <TableCell align="center">{chipVigencia(doc)}</TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      {doc.tiene_archivo && (
                        <IconButton size="small" title="Ver archivo" aria-label="Ver archivo" onClick={() => verArchivo(doc)}>
                          <Eye size={18} />
                        </IconButton>
                      )}
                      {puedeGestionar && (
                        <>
                          <IconButton size="small" title="Editar" aria-label="Editar documento" onClick={() => abrirFormulario(doc)}>
                            <Pencil size={18} />
                          </IconButton>
                          <IconButton size="small" color="error" title="Eliminar" aria-label="Eliminar documento" onClick={() => eliminar(doc)}>
                            <Trash2 size={18} />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ color: '#64748b' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <DocumentoFormDialog
        open={formAbierto} entidad={entidad} entidadId={entidadId} documento={editando}
        onClose={() => setFormAbierto(false)}
        onSaved={() => { setFormAbierto(false); cargar(); }}
      />
    </>
  );
}
