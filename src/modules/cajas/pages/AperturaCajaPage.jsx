import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, CircularProgress, MenuItem,
  InputAdornment, Divider
} from '@mui/material';
import { Unlock, ArrowLeft, Banknote } from 'lucide-react';
import { getCajas, abrirCaja } from '../services/cajas.service';
import { useSucursal } from '../../../shared/contexts/SucursalContext';

export default function AperturaCajaPage() {
  const navigate             = useNavigate();
  const [params]             = useSearchParams();
  const { activeSucursalId } = useSucursal();

  const [cajas, setCajas]               = useState([]);
  const [cajaId, setCajaId]             = useState(params.get('caja_id') || '');
  const [saldo, setSaldo]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadingCajas, setLoadingCajas] = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    getCajas({ sucursal: activeSucursalId, estado: true })
      .then(r => setCajas(r.data?.results ?? r.data ?? []))
      .catch(() => setError('No se pudieron cargar las cajas.'))
      .finally(() => setLoadingCajas(false));
  }, [activeSucursalId]);

  const handleAbrir = async () => {
    if (!cajaId || saldo === '') {
      setError('Selecciona una caja e ingresa el saldo inicial.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await abrirCaja({ caja_id: cajaId, saldo_inicial: parseFloat(saldo) });
      navigate('/cajas');
    } catch (e) {
      const msg = e.response?.data?.error || 'Error al abrir la caja.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const cajaSeleccionada = cajas.find(c => String(c.id) === String(cajaId));

  if (loadingCajas) return (
    <Box display="flex" justifyContent="center" py={8}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box maxWidth={520} mx="auto">
      {/* Botón volver */}
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/cajas')}
        sx={{ mb: 2 }}
      >
        Dashboard Cajas
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
        {/* Header con gradiente verde */}
        <Box sx={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', p: 3, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <Unlock size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">
                Apertura de Caja
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Inicia el turno declarando el saldo inicial en efectivo
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error   && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            {/* Campo: Seleccionar Caja */}
            <TextField
              select
              fullWidth
              label="Seleccionar Caja"
              value={cajaId}
              onChange={e => setCajaId(e.target.value)}
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {cajas.length === 0 ? (
                <MenuItem disabled>No hay cajas disponibles</MenuItem>
              ) : (
                cajas.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nombre} — {c.tipo_display}
                  </MenuItem>
                ))
              )}
            </TextField>

            {/* Vista previa de caja seleccionada */}
            {cajaSeleccionada && (
              <Box
                bgcolor="#f0fdf4"
                border="1px solid #bbf7d0"
                borderRadius={2}
                p={2.5}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Box
                  sx={{
                    p: 1.2,
                    bgcolor: 'rgba(22,163,74,0.12)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Banknote size={22} color="#16a34a" />
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={700} color="success.dark">
                    {cajaSeleccionada.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cajaSeleccionada.tipo_display} · {cajaSeleccionada.sucursal_nombre}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Campo: Saldo Inicial */}
            <TextField
              fullWidth
              label="Saldo Inicial (S/)"
              type="number"
              value={saldo}
              onChange={e => setSaldo(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">S/</InputAdornment>
                ),
              }}
              helperText="Cuenta el dinero que hay físicamente en el cajón"
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Alerta informativa */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Al abrir la caja quedará registrado un <strong>saldo inicial</strong> y
              se asignará la sesión al usuario actual. Todos los movimientos quedan
              registrados para <strong>auditoría</strong>.
            </Alert>

            {/* Botón principal */}
            <Button
              variant="contained"
              size="large"
              color="success"
              startIcon={
                loading
                  ? <CircularProgress size={18} color="inherit" />
                  : <Unlock size={18} />
              }
              onClick={handleAbrir}
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 800,
                letterSpacing: '0.5px',
                color: 'white',
                boxShadow: '0 8px 16px rgba(22, 163, 74, 0.25)',
              }}
            >
              {loading ? 'ABRIENDO CAJA...' : 'ABRIR CAJA'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
