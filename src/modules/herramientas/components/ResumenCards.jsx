import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { premiumTokens } from '../../../core/theme/theme';
import { herramientasService } from '../services/herramientasService';

const C = premiumTokens.colors;

function Tarjeta({ titulo, valor, color, onClick, activa }) {
  const clickable = Boolean(onClick);
  return (
    <Paper
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      sx={{
        p: 1.5, borderRadius: '8px', cursor: clickable ? 'pointer' : 'default',
        border: `1px solid ${activa ? color : C.border}`,
        bgcolor: alpha(color, activa ? 0.16 : 0.07),
        transition: 'border-color .15s',
        '&:hover': clickable ? { borderColor: color } : undefined,
      }}
    >
      <Typography variant="caption" sx={{ color: C.textMuted, fontWeight: 700 }}>{titulo}</Typography>
      <Typography variant="h5" sx={{ color, fontWeight: 800, lineHeight: 1.2 }}>{valor}</Typography>
    </Paper>
  );
}

/**
 * Contadores del inventario. Las tarjetas de estado filtran la tabla al hacer clic.
 * `refreshKey` fuerza una nueva lectura cuando la tabla cambia (altas, bajas, cambios de estado).
 */
export default function ResumenCards({ sucursalId, estadoActivo, onSelectEstado, refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    herramientasService.getResumen(sucursalId ? { sucursal: sucursalId } : {}, controller.signal)
      .then(setData)
      .catch(() => { if (!controller.signal.aborted) setData(null); });
    return () => controller.abort();
  }, [sucursalId, refreshKey]);

  if (!data) return null;
  const e = data.por_estado;
  const filtro = (estados) => (onSelectEstado ? () => onSelectEstado(estados[0] === estadoActivo ? '' : estados[0]) : undefined);

  const tarjetas = [
    { titulo: 'Total', valor: data.total, color: C.text },
    { titulo: 'Disponibles', valor: e.DISPONIBLE, color: C.emerald, estado: 'DISPONIBLE' },
    { titulo: 'Asignadas', valor: e.ASIGNADA, color: C.blue, estado: 'ASIGNADA' },
    { titulo: 'En mantenimiento', valor: e.EN_MANTENIMIENTO, color: C.amber, estado: 'EN_MANTENIMIENTO' },
    { titulo: 'En reparación', valor: e.EN_REPARACION, color: C.amber, estado: 'EN_REPARACION' },
    { titulo: 'Fuera de servicio', valor: e.FUERA_DE_SERVICIO, color: C.brandLight, estado: 'FUERA_DE_SERVICIO' },
  ];
  const alertas = [
    { titulo: 'Mantenimientos vencidos', valor: data.mantenimientos_vencidos, color: C.brandLight },
    { titulo: 'Por vencer', valor: data.mantenimientos_por_vencer, color: C.amber },
    { titulo: 'Préstamos vencidos', valor: data.prestamos_vencidos, color: C.brandLight },
    { titulo: 'Incidencias abiertas', valor: data.incidencias_abiertas, color: C.amber },
  ].filter((t) => t.valor !== null && t.valor !== undefined);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5, mb: 1.5 }}>
        {tarjetas.map((t) => (
          <Tarjeta key={t.titulo} titulo={t.titulo} valor={t.valor} color={t.color}
            activa={Boolean(t.estado) && t.estado === estadoActivo}
            onClick={t.estado ? filtro([t.estado]) : undefined} />
        ))}
      </Box>
      {(alertas.length > 0 || data.valor_total !== null) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {alertas.map((t) => <Tarjeta key={t.titulo} titulo={t.titulo} valor={t.valor} color={t.valor > 0 ? t.color : C.textSubtle} />)}
          {data.valor_total !== null && (
            <Tarjeta titulo="Valor del inventario"
              valor={`S/ ${Number(data.valor_total).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              color={C.emerald} />
          )}
        </Box>
      )}
    </Box>
  );
}
