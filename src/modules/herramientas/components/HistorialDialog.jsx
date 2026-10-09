import React, { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService, mensajeError } from '../services/herramientasService';

const C = premiumTokens.colors;

export default function HistorialDialog({ open, herramienta, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !herramienta) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    herramientasService.getHistorial(herramienta.id, controller.signal)
      .then(setItems)
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setError(mensajeError(err, 'No se pudo cargar el historial'));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, herramienta]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Historial — {herramienta?.codigo} {herramienta?.nombre}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ color: C.textMuted, textAlign: 'center', py: 3 }}>
            Sin movimientos registrados
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((h) => (
              <Box key={h.id} sx={{ borderLeft: `3px solid ${C.brand}`, pl: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{h.accion_display}</Typography>
                {h.detalle && <Typography variant="body2" sx={{ color: C.textMuted }}>{h.detalle}</Typography>}
                <Typography variant="caption" sx={{ color: C.textSubtle }}>
                  {new Date(h.fecha).toLocaleString('es-PE')}
                  {h.usuario_nombre ? ` · ${h.usuario_nombre}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
