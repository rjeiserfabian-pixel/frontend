import { useState } from 'react';
import { 
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, 
  Typography, IconButton, Tooltip 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { getMediaUrl } from '../../../core/utils/mediaUrl';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

/**
 * Muestra al cliente el QR del negocio (Yape, Plin...) con el monto a pagar.
 * Permite ampliar el código QR para facilitar el escaneo si la imagen es pequeña.
 * No confirma el pago: el cajero lo verifica en su celular y registra el N.º de operación.
 */
export default function CobroQrDialog({ metodo, monto, simbolo, onClose }) {
  const [ampliado, setAmpliado] = useState(false);

  if (!metodo) return null;
  const importe = Number(monto) || 0;

  return (
    <Dialog 
      open 
      onClose={onClose} 
      maxWidth={ampliado ? "sm" : "xs"} 
      fullWidth
      PaperProps={{
        sx: {
          transition: 'all 0.25s ease-in-out',
          borderRadius: '16px',
          bgcolor: C.surface,
          border: `1px solid ${C.border}`,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 700, 
        textAlign: 'center',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        px: 3,
        pt: 2.5
      }}>
        <Box sx={{ width: 40 }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: C.text }}>
          Pagar con {metodo.nombre}
        </Typography>
        <Tooltip title={ampliado ? "Reducir tamaño" : "Ampliar código QR"} arrow>
          <IconButton 
            size="small"
            onClick={() => setAmpliado(!ampliado)}
            sx={{ 
              color: C.blue,
              bgcolor: alpha(C.blue, 0.1),
              border: `1px solid ${alpha(C.blue, 0.25)}`,
              '&:hover': { bgcolor: alpha(C.blue, 0.2) }
            }}
          >
            {ampliado ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          {/* Monto a pagar */}
          <Typography variant="h4" fontWeight={800} sx={{ color: C.emerald }}>
            {simbolo} {importe.toFixed(2)}
          </Typography>

          {/* Botón de acción rápida para alternar tamaño */}
          <Button
            size="small"
            variant="outlined"
            onClick={() => setAmpliado(!ampliado)}
            startIcon={ampliado ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              py: 0.3,
              px: 1.8,
              color: ampliado ? '#38bdf8' : C.textMuted,
              borderColor: ampliado ? alpha('#38bdf8', 0.4) : alpha('#94a3b8', 0.25),
              bgcolor: ampliado ? alpha('#38bdf8', 0.08) : 'transparent',
              '&:hover': {
                borderColor: '#38bdf8',
                bgcolor: alpha('#38bdf8', 0.12)
              }
            }}
          >
            {ampliado ? 'Tamaño normal' : 'Ampliar QR'}
          </Button>

          {/* Contenedor de la imagen QR con soporte de zoom */}
          <Box
            onClick={() => setAmpliado(!ampliado)}
            title={ampliado ? "Clic para reducir" : "Clic para ampliar"}
            sx={{
              position: 'relative',
              width: ampliado ? 440 : 280,
              maxWidth: '100%',
              aspectRatio: '1 / 1',
              bgcolor: '#ffffff',
              borderRadius: 3,
              p: ampliado ? 2.5 : 1.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: ampliado ? '0 12px 36px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(0,0,0,0.25)',
              border: `2px solid ${ampliado ? alpha(C.blue, 0.6) : alpha('#ffffff', 0.8)}`,
              transition: 'all 0.25s ease-in-out',
              '&:hover': {
                transform: 'scale(1.01)',
                borderColor: C.blue
              }
            }}
          >
            <Box 
              component="img" 
              src={getMediaUrl(metodo.qr_url)} 
              alt={`QR de ${metodo.nombre}`}
              sx={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
            />
          </Box>

          {metodo.qr_descripcion && (
            <Typography variant="body1" fontWeight={700} align="center" sx={{ color: C.text }}>
              {metodo.qr_descripcion}
            </Typography>
          )}

          <Typography variant="body2" align="center" sx={{ color: C.textMuted, maxWidth: 360, fontSize: '0.82rem' }}>
            Pida al cliente que escanee el código e ingrese el monto. Cuando vea el pago en su celular,
            cierre esta ventana y anote el número de operación.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, justifyContent: 'center', gap: 1.5, borderTop: `1px solid ${C.border}` }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setAmpliado(!ampliado)}
          startIcon={ampliado ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            color: C.blue,
            borderColor: alpha(C.blue, 0.4),
            '&:hover': { borderColor: C.blue, bgcolor: alpha(C.blue, 0.08) }
          }}
        >
          {ampliado ? 'Reducir' : 'Ampliar QR'}
        </Button>

        <Button 
          variant="contained" 
          onClick={onClose} 
          sx={{ 
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            bgcolor: C.brand, 
            '&:hover': { bgcolor: C.brandDark } 
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
