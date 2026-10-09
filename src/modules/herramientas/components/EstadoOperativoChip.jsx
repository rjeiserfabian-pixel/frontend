import React from 'react';
import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;

const COLORES = {
  DISPONIBLE: C.emerald,
  ASIGNADA: C.blue,
  EN_MANTENIMIENTO: C.amber,
  EN_REPARACION: C.amber,
  FUERA_DE_SERVICIO: C.brandLight,
  PERDIDA: C.brandLight,
  DADA_DE_BAJA: C.textSubtle,
};

export default function EstadoOperativoChip({ estado, label }) {
  const color = COLORES[estado] || C.textMuted;
  return (
    <Chip
      label={label || estado}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.16),
        color,
        border: `1px solid ${alpha(color, 0.4)}`,
        fontWeight: 700,
      }}
    />
  );
}
