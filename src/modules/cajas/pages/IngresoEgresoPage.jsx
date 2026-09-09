import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  MenuItem, Alert, CircularProgress, InputAdornment,
  ToggleButton, ToggleButtonGroup, Divider
} from '@mui/material';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { getSesiones, registrarMovimiento, getMetodosPago } from '../services/cajas.service';

const CONCEPTOS_INGRESO = [
  { value: 'ANTICIPO',       label: 'Anticipo' },
  { value: 'OTROS_INGRESOS', label: 'Otros Ingresos' },
  { value: 'INGRESO_MANUAL', label: 'Ingreso Manual (requiere aprobación)' },
];

const CONCEPTOS_EGRESO = [
  { value: 'GASTO_OPERATIVO', label: 'Gasto Operativo' },
  { value: 'RETIRO',          label: 'Retiro' },
  { value: 'DEVOLUCION',      label: 'Devolución' },
  { value: 'OTROS_EGRESOS',   label: 'Otros Egresos' },
  { value: 'EGRESO_MANUAL',   label: 'Egreso Manual (requiere aprobación)' },
];

export default function IngresoEgresoPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sesionParam = params.get('sesion') || '';

  const [tipo,     setTipo]     = useState('INGRESO');
  const [sesionId, setSesionId] = useState(sesionParam);
  const [concepto, setConcepto] = useState('');
  const [monto,    setMonto]    = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [success, setSuccess]   = useState(false);

  const [sesiones, setSesiones]     = useState([]);
  const [metodos,  setMetodos]      = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  useEffect(() => {
    Promise.all([
      getSesiones({ estado: 'ABIERTA' }),
      getMetodosPago(),
    ])
      .then(([sRes, mRes]) => {
        setSesiones(sRes.data?.results ?? sRes.data ?? []);
        setMetodos(mRes.data ?? []);
      })
      .catch(() => setError('Error cargando datos iniciales.'))
      .finally(() => setLoadingInit(false));
  }, []);

  const conceptosList = tipo === 'INGRESO' ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO;
  const esManual = concepto === 'INGRESO_MANUAL' || concepto === 'EGRESO_MANUAL';

  const handleSubmit = async () => {
    if (!sesionId || !concepto || !monto || !metodoPago) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registrarMovimiento({
        sesion:            sesionId,
        tipo,
        concepto,
        origen_movimiento: esManual ? 'AJUSTE_MANUAL' : tipo === 'INGRESO' ? 'COBRO' : 'AJUSTE_MANUAL',
        metodo_pago:       metodoPago,
        monto:             parseFloat(monto),
        referencia,
        observacion,
      });
      setSuccess(true);
      setTimeout(() => navigate(sesionParam ? `/cajas/sesion/${sesionParam}` : '/cajas'), 1500);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al registrar el movimiento.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInit) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box maxWidth={520} mx="auto">
      <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Encabezado */}
          <Typography variant="h6" fontWeight={700} mb={0.5}>Registrar Movimiento</Typography>
          <Typography variant="caption" color="text.secondary">
            Los movimientos manuales requieren aprobación de un administrador antes de afectar el saldo.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>¡Movimiento registrado correctamente!</Alert>}

          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* Tipo */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>Tipo de Movimiento</Typography>
              <ToggleButtonGroup
                value={tipo} exclusive fullWidth
                onChange={(_, v) => { if (v) { setTipo(v); setConcepto(''); } }}
                size="small" sx={{ mt: 0.5 }}
              >
                <ToggleButton value="INGRESO" color="success" sx={{ fontWeight: 600 }}>
                  <TrendingUp size={16} style={{ marginRight: 6 }} /> Ingreso
                </ToggleButton>
                <ToggleButton value="EGRESO" color="error" sx={{ fontWeight: 600 }}>
                  <TrendingDown size={16} style={{ marginRight: 6 }} /> Egreso
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Caja (sesión abierta) */}
            <TextField select fullWidth label="Caja (sesión abierta)" value={sesionId} onChange={e => setSesionId(e.target.value)}>
              {sesiones.map(s => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.caja_nombre} — {s.usuario_nombre}
                </MenuItem>
              ))}
            </TextField>

            {/* Concepto */}
            <TextField select fullWidth label="Concepto" value={concepto} onChange={e => setConcepto(e.target.value)}>
              {conceptosList.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>

            {/* Método de pago */}
            <TextField select fullWidth label="Método de Pago" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
              {metodos.filter(m => m.estado).map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
            </TextField>

            {/* Monto */}
            <TextField
              fullWidth label="Monto (S/)" type="number" value={monto} onChange={e => setMonto(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment> }}
            />

            {/* Referencia */}
            <TextField fullWidth label="Referencia (opcional)" value={referencia} onChange={e => setReferencia(e.target.value)} />

            {/* Observación */}
            <TextField
              fullWidth label="Observación" multiline rows={2}
              value={observacion} onChange={e => setObservacion(e.target.value)}
              required={esManual}
              helperText={esManual ? 'Obligatorio para movimientos manuales.' : ''}
            />

            {esManual && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Este movimiento requiere la aprobación de un administrador antes de afectar el saldo de la caja.
              </Alert>
            )}

            <Button
              variant="contained" size="large"
              color={tipo === 'INGRESO' ? 'success' : 'error'}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : (tipo === 'INGRESO' ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
              onClick={handleSubmit} disabled={loading}
            >
              {loading ? 'Registrando...' : `Registrar ${tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}`}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
