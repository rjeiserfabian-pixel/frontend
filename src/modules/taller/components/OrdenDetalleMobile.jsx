import React, { memo, useState } from 'react';
import { Box, Typography, Chip, IconButton, LinearProgress, Collapse, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Pencil, X, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';
import { premiumTokens } from '../../../core/theme/theme';

/**
 * Vistas exclusivas para celular / tableta vertical (< 900 px) del detalle de una OT.
 * En laptop/PC no se renderizan: DetalleOrdenPage sigue mostrando el Stepper y las tablas.
 */

const C = premiumTokens.colors;
const TOUCH = premiumTokens.touch.minTarget;

const formatFecha = (valor) => {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
};

const toNumber = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/* ------------------------------------------------------------------ */
/* Indicador de fase (reemplaza al Stepper horizontal de 5 pasos)      */
/* ------------------------------------------------------------------ */

export const FaseOrdenMobile = memo(function FaseOrdenMobile({ orden, pasos }) {
  const [verHistorial, setVerHistorial] = useState(false);

  const facturada = orden.estado === 'FACTURADO';
  const indice = facturada ? pasos.length - 1 : Math.max(pasos.indexOf(orden.estado), 0);
  const numeroPaso = indice + 1;
  const progreso = facturada ? 100 : Math.round((numeroPaso / pasos.length) * 100);
  const siguiente = facturada ? null : pasos[indice + 1] || null;

  const fechaDePaso = (paso, idx) => {
    const h = orden.historial_estados?.find((x) => x.estado === paso);
    if (h) return formatFecha(h.fecha_registro);
    if (idx === 0) return formatFecha(orden.fecha_ingreso);
    return null;
  };

  const estadoLabel = (facturada ? 'FACTURADO' : orden.estado || '').replace(/_/g, ' ');
  const fechaActual = facturada
    ? formatFecha(orden.historial_estados?.find((x) => x.estado === 'FACTURADO')?.fecha_registro)
    : fechaDePaso(pasos[indice], indice);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '8px',
        border: `1px solid ${C.border}`,
        bgcolor: alpha('#ffffff', 0.03),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
        <Chip
          label={estadoLabel}
          size="small"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.3,
            bgcolor: alpha(facturada || progreso === 100 ? C.emerald : C.blue, 0.16),
            color: facturada || progreso === 100 ? '#6ee7b7' : '#bae6fd',
            border: `1px solid ${alpha(facturada || progreso === 100 ? C.emerald : C.blue, 0.4)}`,
          }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          Paso {numeroPaso} de {pasos.length}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progreso}
        color={progreso === 100 ? 'success' : 'primary'}
        sx={{ height: 8, borderRadius: 4, bgcolor: alpha('#ffffff', 0.08) }}
        aria-label={`Progreso de la orden: ${progreso}%`}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          {fechaActual ? `Desde: ${fechaActual}` : '\u00a0'}
        </Typography>
        {siguiente && (
          <Typography variant="caption" color="text.secondary">
            Siguiente: <strong>{siguiente.replace(/_/g, ' ')}</strong>
          </Typography>
        )}
      </Box>

      <Button
        size="small"
        onClick={() => setVerHistorial((v) => !v)}
        endIcon={verHistorial ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        sx={{ mt: 1, px: 0, color: 'text.secondary', fontWeight: 600 }}
        aria-expanded={verHistorial}
      >
        {verHistorial ? 'Ocultar historial' : 'Ver historial de estados'}
      </Button>

      <Collapse in={verHistorial} unmountOnExit>
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {pasos.map((paso, idx) => {
            const hecho = facturada || idx <= indice;
            const fecha = fechaDePaso(paso, idx);
            return (
              <Box component="li" key={paso} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                {hecho
                  ? <CheckCircle size={16} color={C.emerald} style={{ flexShrink: 0 }} />
                  : <Circle size={16} color={C.textSubtle} style={{ flexShrink: 0 }} />}
                <Typography variant="body2" fontWeight={idx === indice ? 800 : 600} color={hecho ? 'text.primary' : 'text.secondary'} sx={{ flex: 1 }}>
                  {paso.replace(/_/g, ' ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">{fecha || '—'}</Typography>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Piezas comunes de las tarjetas                                     */
/* ------------------------------------------------------------------ */

const itemCardSx = {
  p: 1.75,
  borderRadius: '8px',
  border: `1px solid ${C.border}`,
  bgcolor: alpha('#ffffff', 0.03),
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const touchIconSx = { width: TOUCH, height: TOUCH };

function AccionesItem({ puedeEditar, puedeEliminar, onEditar, onEliminar, etiquetaEditar, etiquetaEliminar }) {
  if (!puedeEditar && !puedeEliminar) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, mt: -0.75, mr: -0.75 }}>
      {puedeEditar && (
        <IconButton size="small" onClick={onEditar} aria-label={etiquetaEditar} title={etiquetaEditar} sx={touchIconSx}>
          <Pencil size={16} />
        </IconButton>
      )}
      {puedeEliminar && (
        <IconButton size="small" onClick={onEliminar} aria-label={etiquetaEliminar} title={etiquetaEliminar} sx={touchIconSx}>
          <X size={17} className="text-red-500" />
        </IconButton>
      )}
    </Box>
  );
}

function TotalFooter({ total }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1.75,
        py: 1.5,
        borderRadius: '8px',
        bgcolor: alpha(C.blue, 0.07),
      }}
    >
      <Typography fontWeight={700}>Total</Typography>
      <Typography fontWeight={800} color="primary.main">S/ {total.toFixed(2)}</Typography>
    </Box>
  );
}

function EmptyState({ texto }) {
  return (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">{texto}</Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Servicios y mano de obra                                            */
/* ------------------------------------------------------------------ */

export const ServiciosMobileList = memo(function ServiciosMobileList({
  servicios, puedeEditar, puedeEliminar, onEditar, onEliminar,
}) {
  if (!servicios || servicios.length === 0) {
    return <EmptyState texto="No hay servicios agregados a la cotización." />;
  }

  const total = servicios.reduce((sum, s) => sum + toNumber(s.precio_estimado), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {servicios.map((s) => (
        <Box key={s.id} sx={itemCardSx}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Typography fontWeight={600} sx={{ wordBreak: 'break-word', lineHeight: 1.4, flex: 1, minWidth: 0 }}>
              {s.descripcion}
            </Typography>
            <AccionesItem
              puedeEditar={puedeEditar}
              puedeEliminar={puedeEliminar}
              onEditar={() => onEditar(s)}
              onEliminar={() => onEliminar(s)}
              etiquetaEditar="Editar servicio"
              etiquetaEliminar="Eliminar servicio"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            {s.aprobado_cliente ? (
              <Chip label="Aprobado" color="success" size="small" sx={{ fontWeight: 600, borderRadius: '6px' }} />
            ) : (
              <Chip
                label="Pendiente"
                size="small"
                sx={{ fontWeight: 700, borderRadius: '6px', bgcolor: alpha(C.amber, 0.14), color: '#fcd34d', border: `1px solid ${alpha(C.amber, 0.3)}` }}
              />
            )}
            <Typography fontWeight={700}>S/ {toNumber(s.precio_estimado).toFixed(2)}</Typography>
          </Box>
        </Box>
      ))}
      <TotalFooter total={total} />
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Repuestos y materiales                                              */
/* ------------------------------------------------------------------ */

const chipStockSx = { height: 22, fontSize: '0.7rem', fontWeight: 700 };

function ChipStock({ r }) {
  const tieneStock = r.instalado || r.tiene_stock_suficiente || (toNumber(r.stock_disponible) >= toNumber(r.cantidad));
  const hayEnOtraSucursal = !tieneStock && (toNumber(r.stock_otras_sucursales) >= toNumber(r.cantidad));

  if (r.instalado) return <Chip label="Instalado" size="small" color="success" sx={chipStockSx} />;
  if (tieneStock) return <Chip label="En stock" size="small" color="primary" variant="outlined" sx={{ ...chipStockSx, fontWeight: 600 }} />;
  if (hayEnOtraSucursal) {
    return <Chip label={`⚠️ En otra sede (${toNumber(r.stock_otras_sucursales)} disp.)`} size="small" color="info" sx={chipStockSx} />;
  }
  return <Chip label="⚠️ Sin stock (Por comprar)" size="small" color="warning" sx={chipStockSx} />;
}

export const RepuestosMobileList = memo(function RepuestosMobileList({
  repuestos, puedeEditar, puedeEliminar, onEditarCantidad, onEliminar,
}) {
  if (!repuestos || repuestos.length === 0) {
    return <EmptyState texto="No hay repuestos agregados a la cotización." />;
  }

  const total = repuestos.reduce((sum, r) => sum + toNumber(r.cantidad) * toNumber(r.precio_unitario), 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {repuestos.map((r) => {
        const cantidad = toNumber(r.cantidad);
        const precio = toNumber(r.precio_unitario);
        return (
          <Box key={r.id} sx={itemCardSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={600} sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {r.repuesto_detalle?.nombre || 'Repuesto'}
                </Typography>
                {r.repuesto_detalle?.codigo_fabricante && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {r.repuesto_detalle.codigo_fabricante}
                  </Typography>
                )}
              </Box>
              <AccionesItem
                puedeEditar={puedeEditar}
                puedeEliminar={puedeEliminar}
                onEditar={() => onEditarCantidad(r)}
                onEliminar={() => onEliminar(r)}
                etiquetaEditar="Editar cantidad"
                etiquetaEliminar="Eliminar repuesto"
              />
            </Box>
            <Box>
              <ChipStock r={r} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {cantidad} × S/ {precio.toFixed(2)}
              </Typography>
              <Typography fontWeight={700} color="primary.main">
                S/ {(cantidad * precio).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        );
      })}
      <TotalFooter total={total} />
    </Box>
  );
});
