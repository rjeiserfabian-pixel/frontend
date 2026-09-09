import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  MenuItem, Alert, CircularProgress, Stack, InputAdornment
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
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
    } catch (err) {
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
      setError(`El método de pago '${selectedMethod.nombre}' requiere un número de referencia (boleta, ticket, etc).`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const conceptoBackend = formData.tipo === 'INGRESO' ? 'INGRESO_MANUAL' : 'EGRESO_MANUAL';

      const payload = {
        sesion: sesionId,
        tipo: formData.tipo,
        concepto: conceptoBackend,
        origen_movimiento: 'AJUSTE_MANUAL',
        metodo_pago: formData.metodo_pago,
        monto: formData.monto,
        observacion: formData.observacion.trim(),
        referencia: formData.referencia.trim() || null,
      };

      await registrarMovimiento(payload);
      Swal.fire({ icon: 'success', title: 'Movimiento registrado correctamente', timer: 2000, showConfirmButton: false });
      navigate(`/cajas/movimientos/${sesionId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el movimiento.');
      setLoading(false);
    }
  };

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
    <Box sx={{ py: 2 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '24px' }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
          Volver
        </Button>
        <Typography variant="h6" fontWeight={700}>
          Registrar Movimiento Manual
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card elevation={0} sx={{
        border: '1px solid', borderColor: 'divider', borderRadius: 3, maxWidth: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              
              {/* Tipo de Movimiento */}
              <TextField
                select
                fullWidth
                label="Tipo de Movimiento"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                disabled={loading}
              >
                <MenuItem value="EGRESO">Salida de Dinero (Egreso)</MenuItem>
                <MenuItem value="INGRESO">Entrada de Dinero (Ingreso)</MenuItem>
              </TextField>

              <Alert severity={formData.tipo === 'EGRESO' ? 'warning' : 'info'} sx={{ py: 0 }}>
                {formData.tipo === 'EGRESO' 
                  ? 'Este movimiento ingresará como PENDIENTE y requerirá aprobación del administrador.'
                  : 'Registrar un ingreso extra a la caja (ingresa como PENDIENTE también).'}
              </Alert>

              {/* Monto y Método de Pago */}
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Monto"
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
                />
                <TextField
                  select
                  fullWidth
                  label="Método de Pago"
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {metodosPago.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              {/* Observación */}
              <TextField
                fullWidth
                label="Concepto / Detalle (Obligatorio)"
                name="observacion"
                value={formData.observacion}
                onChange={handleChange}
                required
                multiline
                rows={2}
                disabled={loading}
                placeholder={formData.tipo === 'EGRESO' ? 'Ej. Compra de útiles de limpieza' : 'Ej. Ingreso inicial extra'}
              />

              {/* Referencia */}
              <TextField
                fullWidth
                label={`Referencia o Nro. Comprobante ${
                  metodosPago.find(m => m.id === formData.metodo_pago)?.requiere_referencia 
                    ? '(Obligatorio para este método)' 
                    : '(Opcional)'
                }`}
                name="referencia"
                value={formData.referencia}
                onChange={handleChange}
                disabled={loading}
                required={metodosPago.find(m => m.id === formData.metodo_pago)?.requiere_referencia || false}
                placeholder="Nro. Boleta, Ticket, Operación..."
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />}
                  sx={{ px: 4, py: 1 }}
                >
                  {loading ? 'Guardando...' : 'Guardar Movimiento'}
                </Button>
              </Box>

            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
