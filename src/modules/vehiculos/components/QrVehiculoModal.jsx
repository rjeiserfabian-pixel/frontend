import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Ban, Copy, Printer, QrCode, RefreshCw, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';

const getErrorMessage = (error) =>
  error?.response?.data?.error || 'No se pudo completar la operacion con el codigo QR.';

export default function QrVehiculoModal({ open, onClose, vehiculoId, puedeGestionar }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    if (!open || !vehiculoId) return undefined;

    let vigente = true;
    vehiculoService.getQr(vehiculoId)
      .then((response) => {
        if (vigente) setData(response);
      })
      .catch((error) => {
        if (vigente) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, [open, vehiculoId]);

  const urlPublica = useMemo(() => {
    if (!data?.qr?.ruta_publica) return '';
    return new URL(data.qr.ruta_publica, data.url_base_publica || window.location.origin).toString();
  }, [data]);

  const imprimir = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR_${data?.vehiculo?.placa || 'vehiculo'}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 16mm;
      }

      html,
      body {
        background: #ffffff !important;
        color: #111827 !important;
      }

      body {
        margin: 0 !important;
        min-height: auto !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
      }

      * {
        box-sizing: border-box;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    `,
  });

  const ejecutar = async (accion, mensajeExito) => {
    setProcessing(true);
    try {
      setData(await accion(vehiculoId));
      Swal.fire('Listo', mensajeExito, 'success');
    } catch (error) {
      Swal.fire('Error', getErrorMessage(error), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const generar = () => ejecutar(vehiculoService.generarQr, 'El codigo QR fue generado.');

  const regenerar = async () => {
    const result = await Swal.fire({
      title: 'Regenerar codigo QR',
      text: 'El codigo anterior dejara de ser valido.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Regenerar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      ejecutar(vehiculoService.regenerarQr, 'El codigo QR fue regenerado.');
    }
  };

  const desactivar = async () => {
    const result = await Swal.fire({
      title: 'Desactivar codigo QR',
      text: 'El enlace dejara de ser valido hasta generar uno nuevo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      ejecutar(vehiculoService.desactivarQr, 'El codigo QR fue desactivado.');
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlPublica);
      Swal.fire({ title: 'Enlace copiado', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire('Error', 'No se pudo copiar el enlace.', 'error');
    }
  };

  const qr = data?.qr;
  const vehiculo = data?.vehiculo;

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, py: 2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <QrCode size={19} />
        </Box>
        <Box>
          <Typography fontWeight={800} lineHeight={1.15}>Codigo QR</Typography>
          <Typography variant="caption" color="text.secondary">Identificacion del vehiculo</Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} disabled={processing} aria-label="Cerrar">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          minHeight: 470,
          p: { xs: 2, sm: 3 },
          bgcolor: 'rgba(0, 0, 0, 0.08)',
        }}
      >
        {loading && !data ? (
          <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
            <CircularProgress />
          </Box>
        ) : loadError ? (
          <Alert severity="error" sx={{ width: '100%' }}>{loadError}</Alert>
        ) : qr?.activo ? (
          <Box sx={{ width: '100%', display: 'grid', justifyItems: 'center', gap: 2.25 }}>
            <Box
              ref={printRef}
              sx={{
                width: 330,
                maxWidth: '100%',
                bgcolor: '#fff',
                color: '#111827',
                p: { xs: 2.5, sm: 3 },
                mx: 'auto',
                textAlign: 'center',
                border: '1px solid #d1d5db',
                borderRadius: 1,
                boxShadow: '0 14px 32px rgba(0, 0, 0, 0.28)',
                '@media print': {
                  border: '1px solid #d1d5db',
                  boxShadow: 'none',
                  width: '80mm',
                  maxWidth: '80mm',
                  margin: '0 auto',
                  padding: '8mm',
                  borderRadius: 0,
                },
              }}
            >
              <Typography sx={{ color: '#111827', fontSize: 18, fontWeight: 800 }}>
                {vehiculo?.placa}
              </Typography>
              <Typography sx={{ color: '#4b5563', fontSize: 13, mb: 2 }}>
                {vehiculo?.marca} {vehiculo?.modelo}
              </Typography>
              <QRCodeSVG value={urlPublica} size={220} level="M" includeMargin />
              <Typography sx={{ color: '#111827', fontSize: 12, fontWeight: 700, mt: 1 }}>
                {qr.codigo_corto}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 330,
                maxWidth: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 1,
                px: 1.5,
                py: 1.25,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Chip label="Activo" color="success" size="small" />
              <Typography variant="caption" color="text.secondary">
                Creado: {new Date(qr.fecha_creacion).toLocaleString('es-PE')}
              </Typography>
            </Box>

            <Box
              sx={{
                width: 330,
                maxWidth: '100%',
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                '& .MuiIconButton-root': {
                  width: 42,
                  height: 42,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                },
              }}
            >
              <Tooltip title="Copiar enlace">
                <IconButton onClick={copiar} aria-label="Copiar enlace"><Copy size={19} /></IconButton>
              </Tooltip>
              <Tooltip title="Imprimir etiqueta">
                <IconButton onClick={imprimir} aria-label="Imprimir etiqueta"><Printer size={19} /></IconButton>
              </Tooltip>
              {puedeGestionar && (
                <>
                  <Tooltip title="Regenerar QR">
                    <IconButton onClick={regenerar} disabled={processing} aria-label="Regenerar QR">
                      <RefreshCw size={19} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar QR">
                    <IconButton color="error" onClick={desactivar} disabled={processing} aria-label="Desactivar QR">
                      <Ban size={19} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        ) : (
          <Stack spacing={2} alignItems="center" sx={{ py: 5 }}>
            <Alert severity="info" sx={{ width: '100%' }}>
              Este vehiculo no tiene un codigo QR activo.
            </Alert>
            {puedeGestionar && (
              <Button variant="contained" startIcon={<QrCode size={18} />} onClick={generar} disabled={processing}>
                Generar codigo QR
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} disabled={processing} sx={{ minWidth: 120 }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
