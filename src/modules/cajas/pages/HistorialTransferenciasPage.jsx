import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, IconButton, Tooltip, Stack, TablePagination, Chip, Button
} from '@mui/material';
import { History, ArrowRightLeft, Printer, ArrowLeft } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { getTransferencias } from '../services/cajas.service';
import PrintTransferenciaComponent from '../components/PrintTransferenciaComponent';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(d));
};

const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

const EstadoBadge = ({ estado, estadoDisplay }) => (
  <Chip
    size="small"
    label={estadoDisplay || estado}
    color={estado === 'COMPLETADA' ? 'success' : 'error'}
    sx={{ fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5 }}
  />
);

export default function HistorialTransferenciasPage() {
  const navigate = useNavigate();

  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Reimpresión
  const [transferenciaAImprimir, setTransferenciaAImprimir] = useState(null);
  const printRef = useRef();

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Comprobante_Transferencia_Caja',
    onAfterPrint: () => setTransferenciaAImprimir(null),
  });

  useEffect(() => {
    if (transferenciaAImprimir) {
      handlePrintAction();
    }
  }, [transferenciaAImprimir, handlePrintAction]);

  const cargarTransferencias = useCallback(async (pg, limit) => {
    setLoading(true);
    try {
      const res = await getTransferencias({ page: pg + 1, page_size: limit });
      const data = res.data?.results || res.data;
      const count = res.data?.count ?? data.length;
      setTransferencias(data);
      setTotal(count);
      setError(null);
    } catch (err) {
      setError('Error al cargar el historial de transferencias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTransferencias(page, rowsPerPage);
  }, [cargarTransferencias, page, rowsPerPage]);

  return (
    <Box sx={{ py: 2 }}>
      {/* Encabezado Visual */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Box sx={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', p: 3, color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <History size={28} color="white" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Historial de Transferencias entre Cajas</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Consulta y reimprime el comprobante de cualquier transferencia realizada
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined" size="small" color="inherit"
                startIcon={<ArrowLeft size={16} />}
                onClick={() => navigate('/cajas')}
                sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
              >
                Dashboard
              </Button>
              <Button
                variant="contained" size="small" color="primary"
                startIcon={<ArrowRightLeft size={16} />}
                onClick={() => navigate('/cajas/transferencias')}
              >
                Nueva Transferencia
              </Button>
            </Stack>
          </Box>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabla */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>N° Documento</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Origen (Entrega)</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Destino (Recibe)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 2 }}>Monto</TableCell>
                <TableCell sx={{ fontWeight: 700, py: 2 }}>Registrado por</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, py: 2 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : transferencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No se encontraron transferencias registradas.
                  </TableCell>
                </TableRow>
              ) : (
                transferencias.map(t => (
                  <TableRow key={t.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {t.numero_documento || `TC-${String(t.id).padStart(6, '0')}`}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDate(t.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.caja_origen_nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.cajero_origen_nombre}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.caja_destino_nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.cajero_destino_nombre}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {fmtMoney(t.monto)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{t.usuario_nombre}</TableCell>
                    <TableCell align="center">
                      <EstadoBadge estado={t.estado} estadoDisplay={t.estado_display} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Reimprimir comprobante">
                        <IconButton size="small" color="primary" onClick={() => setTransferenciaAImprimir(t)}>
                          <Printer size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas:"
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      <div style={{ display: 'none' }}>
        <PrintTransferenciaComponent ref={printRef} transferencia={transferenciaAImprimir} />
      </div>
    </Box>
  );
}
