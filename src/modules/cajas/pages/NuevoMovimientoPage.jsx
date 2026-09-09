import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  MenuItem, Alert, CircularProgress, Stack, InputAdornment, Divider
} from '@mui/material';
import { ArrowLeft, Save, TrendingDown, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { registrarMovimiento, getMetodosPago } from '../services/cajas.service';
import Swal from 'sweetalert2';

export default function NuevoMovimientoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sesionId = searchParams.get('sesion');

  const [loading, setLoading] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    tipo: 'EGRESO',
    monto: '',
    metodo_pago: '',
    observacion: '',
    referencia: '',
  });

  useEffect(() => {
    if (!sesionId) {
      setError('No se especificó la sesión de caja.');
    } else {
      cargarMetodosPago();
    }
  }, [sesionId]);

  const cargarMetodosPago = async () => {
    try {
      const res = await getMetodosPago();
      const data = res.data.results || res.data;
      const activos = data.filter(m => m.estado);
      setMetodosPago(activos);
      if (activos.length > 0) {
        setFormData(prev => ({ ...prev, metodo_pago: activos[0].id }));
      }
    } catch {
      setError('Error al cargar métodos de pago.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto || Number(formData.monto) <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    if (!formData.observacion.trim()) {
      setError('La observación (concepto) es obligatoria.');
      return;
    }

    const selectedMethod = metodosPago.find(m => m.id === formData.metodo_pago);
    if (selectedMethod?.requiere_referencia && !formData.referencia.trim()) {
      setError(`El método '${selectedMethod.nombre}' requiere un número de referencia.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const conceptoBackend = formData.tipo === 'INGRESO' ? 'INGRESO_MANUAL' : 'EGRESO_MANUAL';

      await registrarMovimiento({
        sesion: sesionId,
        tipo: formData.tipo,
        concepto: conceptoBackend,
        origen_movimiento: 'AJUSTE_MANUAL',
        metodo_pago: formData.metodo_pago,
        monto: formData.monto,
        observacion: formData.observacion.trim(),
        referencia: formData.referencia.trim() || null,
      });

      Swal.fire({
        icon: 'success',
        title: 'Movimiento registrado correctamente',
        timer: 2000,
        showConfirmButton: false,
      });
      navigate(`/cajas/sesion/${sesionId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el movimiento.');
      setLoading(false);
    }
  };

  // Colores según tipo de movimiento
  const esEgreso = formData.tipo === 'EGRESO';
  const headerGrad = esEgreso
    ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
  const headerShadow = esEgreso
    ? '0 8px 16px rgba(220,38,38,0.25)'
    : '0 8px 16px rgba(37,99,235,0.25)';

  if (!sesionId) {
    return (
      <Box sx={{ py: 2, px: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/cajas')} sx={{ mt: 2 }}>
          Volver a Cajas
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={560} mx="auto">
      {/* Botón volver */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header dinámico según tipo */}
        <Box sx={{ background: headerGrad, p: 3, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              {esEgreso
                ? <TrendingDown size={28} color="white" />
                : <TrendingUp size={28} color="white" />}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
                Registrar Movimiento Manual
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {esEgreso
                  ? 'Registra una salida de dinero en la caja activa'
                  : 'Registra una entrada de dinero en la caja activa'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                bgcolor: '#f8fafc',
                p: 3.5,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 3.5,
              }}
            >
              {/* Tipo de Movimiento */}
              <TextField
                select fullWidth
                label="Tipo de Movimiento"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                disabled={loading}
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="EGRESO">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ArrowDownCircle size={16} color="#dc2626" />
                    Salida de Dinero (Egreso)
                  </Box>
                </MenuItem>
                <MenuItem value="INGRESO">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ArrowUpCircle size={16} color="#2563eb" />
                    Entrada de Dinero (Ingreso)
                  </Box>
                </MenuItem>
              </TextField>

              <Alert severity={esEgreso ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
                {esEgreso
                  ? <span>Este movimiento ingresará como <strong>PENDIENTE</strong> y requerirá aprobación del administrador.</span>
                  : <span>Se registrará un ingreso extra a la caja como <strong>PENDIENTE</strong> de aprobación.</span>}
              </Alert>

              {/* Monto y Método de Pago */}
              <Stack direction="row" spacing={2.5}>
                <TextField
                  fullWidth
                  label="Monto *"
                  name="monto"
                  type="number"
                  inputProps={{ step: '0.01', min: '0.01' }}
                  value={formData.monto}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">S/</InputAdornment>,
                  }}
                  sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  select fullWidth
                  label="Método de Pago *"
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {metodosPago.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              {/* Concepto / Observación */}
              <TextField
                fullWidth
                label="Concepto / Detalle (Obligatorio) *"
                name="observacion"
                value={formData.observacion}
                onChange={handleChange}
                required
                multiline
                rows={2}
                disabled={loading}
                placeholder={esEgreso ? 'Ej: Compra de útiles de limpieza' : 'Ej: Ingreso inicial extra'}
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* Referencia */}
              <TextField
                fullWidth
                label={`Referencia o Nro. Comprobante ${metodosPago.find(m => m.id === formData.metodo_pago)?.requiere_referencia
                    ? '(Obligatorio para este método)'
                    : '(Opcional)'
                  }`}
                name="referencia"
                value={formData.referencia}
                onChange={handleChange}
                disabled={loading}
                required={metodosPago.find(m => m.id === formData.metodo_pago)?.requiere_referencia || false}
                placeholder="Nro. Boleta, Ticket, Operación..."
                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Divider sx={{ my: 1 }} />

              {/* Botón */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                color={esEgreso ? 'error' : 'primary'}
                disabled={loading}
                startIcon={
                  loading
                    ? <CircularProgress size={18} color="inherit" />
                    : <Save size={18} />
                }
                sx={{
                  mt: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  color: 'white',
                  boxShadow: headerShadow,
                }}
              >
                {loading ? 'GUARDANDO...' : 'GUARDAR MOVIMIENTO'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
