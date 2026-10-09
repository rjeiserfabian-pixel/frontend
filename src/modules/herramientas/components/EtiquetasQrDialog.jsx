import React, { useRef } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const MAX_ETIQUETAS = 60;

const PAGE_STYLE = `
  @page { size: A4; margin: 8mm; }
  body { margin: 0; }
`;

/** URL que codifica el QR: al escanearlo se abre el inventario filtrado por ese código. */
export const urlDeHerramienta = (codigo) =>
  `${window.location.origin}/herramientas?codigo=${encodeURIComponent(codigo)}`;

function Etiqueta({ herramienta }) {
  const nombre = herramienta.nombre.length > 40 ? `${herramienta.nombre.slice(0, 39)}…` : herramienta.nombre;
  return (
    <Box sx={{
      width: '70mm', height: '36mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: `0.5mm solid ${C.brand}`, borderRadius: '2mm', bgcolor: '#fff', color: '#000', breakInside: 'avoid',
      printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
    }}>
      <Box sx={{
        bgcolor: C.brand, color: '#fff', px: '2mm', height: '6mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact',
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: '2.8mm', letterSpacing: '0.3mm', color: '#fff' }}>HERRAMIENTA</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '2.4mm', color: '#fff' }}>ESCANEAR QR</Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2.5mm', px: '2mm', minHeight: 0 }}>
        <Box sx={{ p: '0.8mm', border: '0.3mm solid #000', borderRadius: '1.2mm', lineHeight: 0, flexShrink: 0 }}>
          <QRCodeSVG value={urlDeHerramienta(herramienta.codigo)} size={96} level="M" style={{ width: '23mm', height: '23mm' }} />
        </Box>
        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Typography sx={{ fontWeight: 900, fontSize: '5.2mm', lineHeight: 1.05, color: C.brandDark }}>{herramienta.codigo}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: '3mm', lineHeight: 1.15, color: '#000', wordBreak: 'break-word', mt: '0.6mm' }}>
            {nombre}
          </Typography>
          <Typography sx={{ fontSize: '2.4mm', color: '#444', mt: '0.8mm' }}>{herramienta.sucursal_nombre}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function EtiquetasQrDialog({ open, herramientas, onClose }) {
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Etiquetas_Herramientas',
    pageStyle: PAGE_STYLE,
  });

  const lista = (herramientas || []).slice(0, MAX_ETIQUETAS);
  const recortado = (herramientas || []).length > MAX_ETIQUETAS;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Etiquetas QR ({lista.length})
      </DialogTitle>
      <DialogContent dividers>
        {recortado && (
          <Typography variant="body2" sx={{ color: C.amber, mb: 1.5 }}>
            Se muestran las primeras {MAX_ETIQUETAS} etiquetas. Filtre el listado para imprimir el resto.
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: C.textMuted, mb: 1.5 }}>
          Pegue la etiqueta en la herramienta. Al escanearla con el celular se abre su ficha en el inventario.
        </Typography>
        <Box sx={{ bgcolor: '#e5e7eb', p: 1.5, borderRadius: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <Box ref={printRef} sx={{ display: 'flex', flexWrap: 'wrap', gap: '2mm', bgcolor: '#fff', p: '2mm', width: 'fit-content', maxWidth: '100%' }}>
            {lista.map((h) => <Etiqueta key={h.id} herramienta={h} />)}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cerrar</Button>
        <Button variant="contained" startIcon={<Printer size={18} />} onClick={handlePrint} disabled={lista.length === 0}
          sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
