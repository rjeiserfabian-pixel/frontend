import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { getMediaUrl } from '../../../core/utils/mediaUrl';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

/**
 * Muestra al cliente el QR del negocio (Yape, Plin...) con el monto a pagar.
 * No confirma el pago: el cajero lo verifica en su celular y registra el N.º de operación.
 */
export default function CobroQrDialog({ metodo, monto, simbolo, onClose }) {
  if (!metodo) return null;
  const importe = Number(monto) || 0;
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>Pagar con {metodo.nombre}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: C.emerald }}>
            {simbolo} {importe.toFixed(2)}
          </Typography>
          <Box component="img" src={getMediaUrl(metodo.qr_url)} alt={`QR de ${metodo.nombre}`}
            sx={{ width: 280, maxWidth: '100%', aspectRatio: '1 / 1', objectFit: 'contain', bgcolor: '#fff', borderRadius: 2, p: 1.5 }} />
          {metodo.qr_descripcion && (
            <Typography variant="body1" fontWeight={700} align="center">{metodo.qr_descripcion}</Typography>
          )}
          <Typography variant="body2" align="center" sx={{ color: C.textMuted }}>
            Pida al cliente que escanee el código e ingrese el monto. Cuando vea el pago en su celular,
            cierre esta ventana y anote el número de operación.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button variant="contained" onClick={onClose} sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
