import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, CircularProgress, MenuItem,
  InputAdornment, Divider
} from '@mui/material';
import { Unlock, ArrowLeft } from 'lucide-react';
import { getCajas, abrirCaja } from '../services/cajas.service';
import { useSucursal } from '../../../shared/contexts/SucursalContext';

export default function AperturaCajaPage() {
  const navigate         = useNavigate();
  const [params]         = useSearchParams();
  const { activeSucursalId } = useSucursal();

  const [cajas, setCajas]       = useState([]);
  const [cajaId, setCajaId]     = useState(params.get('caja_id') || '');
  const [saldo, setSaldo]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingCajas, setLoadingCajas] = useState(true);
  const [error, setError]       = useState(null);

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

  return (
    <Box maxWidth={480} mx="auto">
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/cajas')}
        sx={{ mb: 2 }}
      >
        Volver al Dashboard
      </Button>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <Unlock size={26} color="#22c55e" />
            <Box>
              <Typography variant="h6" fontWeight={700}>Apertura de Caja</Typography>
              <Typography variant="caption" color="text.secondary">
                Inicia el turno declarando el saldo inicial en efectivo
              </Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loadingCajas ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2.5}>
              <TextField
                select fullWidth label="Seleccionar Caja"
                value={cajaId} onChange={e => setCajaId(e.target.value)}
              >
                {cajas.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nombre} ({c.tipo_display})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth label="Saldo Inicial (S/)"
                type="number" value={saldo}
                onChange={e => setSaldo(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">S/</InputAdornment>
                }}
                helperText="Cuenta el dinero que hay físicamente en el cajón"
              />

              {cajaSeleccionada && (
                <>
                  <Divider />
                  <Box bgcolor="#f0fdf4" borderRadius={2} p={2}>
                    <Typography variant="body2" color="success.dark" fontWeight={600}>
                      📦 {cajaSeleccionada.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tipo: {cajaSeleccionada.tipo_display} · Sucursal: {cajaSeleccionada.sucursal_nombre}
                    </Typography>
                  </Box>
                </>
              )}

              <Button
                variant="contained" color="success" size="large"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Unlock size={18} />}
                onClick={handleAbrir}
                disabled={loading}
              >
                {loading ? 'Abriendo...' : 'ABRIR CAJA'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
