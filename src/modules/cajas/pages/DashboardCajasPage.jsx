import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardActions,
  Typography, Button, Chip, CircularProgress,
  Alert, Divider, IconButton, Tooltip, Stack
} from '@mui/material';
import {
  Banknote, TrendingUp, TrendingDown,
  Plus, Eye, ArrowRightLeft, Lock,
  RefreshCw, Wallet
} from 'lucide-react';
import { getDashboardCajas } from '../services/cajas.service';
import { useSucursal } from '../../../shared/contexts/SucursalContext';

// ── Helpers ──────────────────────────────────────────────────────
const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

const EstadoChip = ({ estado }) => {
  const cfg = {
    ABIERTA:               { label: 'Abierta',          color: 'success' },
    CERRADA:               { label: 'Cerrada',          color: 'default' },
    CERRADA_CON_DIFERENCIA:{ label: 'Con diferencia',   color: 'warning' },
  };
  const { label, color } = cfg[estado] ?? { label: estado, color: 'default' };
  return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
};

// ── Componente Tarjeta Caja ──────────────────────────────────────
const CajaCard = ({ item, onAbrir }) => {
  const navigate  = useNavigate();
  const abierta   = item.estado === 'ABIERTA';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: abierta ? 'success.light' : 'divider',
        borderRadius: 3,
        transition: 'box-shadow .2s',
        '&:hover': { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: 1.5 }}>
        {/* Cabecera */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{item.caja_nombre}</Typography>
            <Typography variant="caption" color="text.secondary">
              {item.sucursal} · {item.caja_tipo === 'CAJA_CHICA' ? 'Caja Chica' : 'Operativa'}
            </Typography>
          </Box>
          <EstadoChip estado={item.estado} />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Saldo */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box sx={{ bgcolor: '#eff6ff', borderRadius: 2, p: 1, color: '#3b82f6', flexShrink: 0 }}>
            <Wallet size={20} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Saldo actual</Typography>
            <Typography variant="h5" fontWeight={800} color="primary.main" lineHeight={1.1}>
              {fmtMoney(item.saldo_actual)}
            </Typography>
          </Box>
        </Box>

        {abierta && item.sesion_activa && (
          <Typography variant="caption" color="text.secondary">
            Responsable: <strong>{item.sesion_activa.usuario}</strong>
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1 }}>
        {abierta ? (
          <>
            <Button
              size="small" variant="outlined" startIcon={<Eye size={15} />}
              onClick={() => navigate(`/cajas/sesion/${item.sesion_activa?.id}`)}
            >
              Movimientos
            </Button>
            <Button
              size="small" variant="outlined" color="warning" startIcon={<ArrowRightLeft size={15} />}
              onClick={() => navigate(`/cajas/transferencias?sesion=${item.sesion_activa?.id}`)}
            >
              Transferir
            </Button>
            <Button
              size="small" variant="contained" color="error" startIcon={<Lock size={15} />}
              onClick={() => navigate(`/cajas/cierre/${item.sesion_activa?.id}`)}
            >
              Cerrar
            </Button>
          </>
        ) : (
          <Button
            size="small" variant="contained" color="success"
            startIcon={<Plus size={15} />}
            onClick={() => onAbrir(item)}
            fullWidth
          >
            Abrir Caja
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// ── Página Principal ─────────────────────────────────────────────
export default function DashboardCajasPage() {
  const navigate = useNavigate();
  const { activeSucursalId } = useSucursal();
  const [cajas, setCajas]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardCajas(activeSucursalId);
      setCajas(res.data.data ?? []);
    } catch (e) {
      setError('No se pudo cargar el dashboard de cajas.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeSucursalId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAbrir = (item) =>
    navigate(`/cajas/apertura?caja_id=${item.caja_id}`);

  // ── Estadísticas resumen ──────────────────────────────────────
  const totalAbiertas = cajas.filter(c => c.estado === 'ABIERTA').length;
  const saldoTotal    = cajas.reduce((s, c) => s + (c.saldo_actual ?? 0), 0);

  return (
    <Box sx={{ py: 2 }}>
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ marginBottom: '24px' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>💰 Módulo de Cajas</Typography>
          <Typography variant="body2" color="text.secondary">
            Centro de control del dinero físico y electrónico
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Actualizar">
            <IconButton onClick={cargar} disabled={loading}>
              <RefreshCw size={20} className={loading ? 'spin' : ''} />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined" size="small"
            startIcon={<ArrowRightLeft size={16} />}
            onClick={() => navigate('/cajas/transferencias')}
          >
            Transferencias
          </Button>
          <Button
            variant="contained" size="small"
            startIcon={<Plus size={16} />}
            onClick={() => navigate('/cajas/nueva')}
          >
            Nueva Caja
          </Button>
        </Stack>
      </Box>

      {/* KPIs */}
      <Box sx={{ marginBottom: '24px' }}>
      <Grid container spacing={3}>
        {[
          { label: 'Cajas Abiertas',   value: totalAbiertas,    icon: <TrendingUp size={24} />,  color: '#22c55e' },
          { label: 'Saldo Total',       value: fmtMoney(saldoTotal), icon: <Banknote size={24} />, color: '#3b82f6' },
          { label: 'Total de Cajas',    value: cajas.length,     icon: <Wallet size={24} />,      color: '#8b5cf6' },
          { label: 'Cajas Cerradas',    value: cajas.length - totalAbiertas, icon: <TrendingDown size={24} />, color: '#f59e0b' },
        ].map((k) => (
          <Grid item xs={12} sm={6} md={3} key={k.label}>
            <Card elevation={0} sx={{
              border: '1px solid', borderColor: 'divider', borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'box-shadow .2s',
              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ bgcolor: `${k.color}18`, borderRadius: 2.5, p: 1.5, color: k.color, flexShrink: 0 }}>{k.icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{k.label}</Typography>
                  <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{k.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      </Box>

      {/* Estados */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>}

      {/* Tarjetas de Cajas */}
      {!loading && (
        <Grid container spacing={4} mb={4}>
          {cajas.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No hay cajas configuradas. Crea la primera caja para comenzar.</Alert>
            </Grid>
          ) : (
            cajas.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.caja_id}>
                <CajaCard item={item} onAbrir={handleAbrir} />
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
}
