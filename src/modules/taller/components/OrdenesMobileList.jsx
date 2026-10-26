import React, { memo } from 'react';
import { Box, Typography, Chip, Paper, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { User, Calendar, Wrench, ChevronRight } from 'lucide-react';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const formatFechaMobile = (fechaStr) => {
  if (!fechaStr) return '-';
  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Componente de lista de tarjetas táctiles para Órdenes de Trabajo en teléfonos y tabletas (< 900px).
 * En escritorio (>= 900px) se utiliza la tabla tradicional.
 */
export const OrdenesMobileList = memo(function OrdenesMobileList({
  ordenes = [],
  loading = false,
  getStatusColor,
  onSelectOrden
}) {
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} gap={2}>
        <CircularProgress size={36} sx={{ color: C.brandLight }} />
        <Typography variant="body2" color="text.secondary">
          Cargando órdenes de trabajo...
        </Typography>
      </Box>
    );
  }

  if (ordenes.length === 0) {
    return (
      <Box textAlign="center" py={6} px={2}>
        <Typography variant="body1" fontWeight="600" color="text.secondary" gutterBottom>
          No hay órdenes registradas
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Prueba cambiando o limpiando los filtros de búsqueda.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
      {ordenes.map((orden) => {
        const estadoLabel = (orden.estado || '').replace(/_/g, ' ');
        const estadoColor = getStatusColor ? getStatusColor(orden.estado) : 'default';

        return (
          <Paper
            key={orden.id}
            elevation={0}
            onClick={() => onSelectOrden && onSelectOrden(orden.id)}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              bgcolor: alpha(C.surface, 0.75),
              boxShadow: S.card,
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              '&:active': {
                transform: 'scale(0.985)',
                bgcolor: alpha(C.surface, 0.95),
                borderColor: C.brandLight
              }
            }}
          >
            {/* Fila Superior: Placa, Nro OT y Chip de Estado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {orden.vehiculo_placa && (
                  <Chip
                    label={orden.vehiculo_placa}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      fontSize: '0.8rem',
                      height: 24,
                      bgcolor: alpha(C.blue, 0.18),
                      color: '#7dd3fc',
                      border: `1px solid ${alpha(C.blue, 0.4)}`,
                    }}
                  />
                )}
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#bae6fd' }}>
                  OT-{orden.numero}
                </Typography>
              </Box>

              <Chip
                label={estadoLabel}
                color={estadoColor}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 22,
                  textTransform: 'uppercase'
                }}
              />
            </Box>

            {/* Datos Centrales: Cliente, Mecánico y Fecha */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 1.5 }}>
              {/* Cliente */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={15} className="text-slate-400" style={{ flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  fontWeight="600"
                  color="text.primary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {orden.cliente_nombre || 'Cliente sin nombre'}
                </Typography>
              </Box>

              {/* Mecánico Asignado */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Wrench size={14} className="text-slate-400" style={{ flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary">
                  Mecánico:{' '}
                  <strong style={{ color: orden.mecanico_nombre ? '#e2e8f0' : '#f59e0b' }}>
                    {orden.mecanico_nombre || 'Sin Asignar'}
                  </strong>
                </Typography>
              </Box>

              {/* Fecha Ingreso */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={14} className="text-slate-400" style={{ flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary">
                  Ingreso: {formatFechaMobile(orden.fecha_ingreso)}
                </Typography>
              </Box>
            </Box>

            {/* Barra Inferior: Indicador de apertura táctil */}
            <Box
              sx={{
                pt: 1.2,
                borderTop: `1px solid ${alpha(C.border, 0.6)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: C.brandLight || '#38bdf8'
              }}
            >
              <Typography variant="caption" fontWeight="700">
                Ver detalle de orden
              </Typography>
              <ChevronRight size={16} />
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
});

export default OrdenesMobileList;
