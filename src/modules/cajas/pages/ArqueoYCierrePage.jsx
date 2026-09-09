import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, CircularProgress, Divider, InputAdornment, Stack
} from '@mui/material';
import { ArrowLeft, Scale, Lock } from 'lucide-react';
import { calcularArqueo, cerrarCaja } from '../services/cajas.service';

const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

export default function ArqueoYCierrePage() {
  const { id }  = useParams();
  const navigate = useNavigate();

  const [arqueo, setArqueo]   = useState(null);
  const [contado, setContado] = useState('');
  const [motivo,  setMotivo]  = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingArqueo, setLoadingArqueo] = useState(true);
  const [error,   setError]   = useState(null);

  const cargarArqueo = useCallback(async () => {
    setLoadingArqueo(true);
    try {
      const res = await calcularArqueo(id);
      setArqueo(res.data);
    } catch {
      setError('No se pudo calcular el saldo teórico.');
    } finally {
      setLoadingArqueo(false);
    }
  }, [id]);

  useEffect(() => { cargarArqueo(); }, [cargarArqueo]);

  const contadoNum  = parseFloat(contado) || 0;
  const teoricoNum  = parseFloat(arqueo?.saldo_teorico) || 0;
  const diferencia  = contadoNum - teoricoNum;
  const hayDiferencia = Math.abs(diferencia) > 0.001;

  const handleCerrar = async () => {
    if (!contado) { setError('Ingresa el efectivo contado.'); return; }
    if (hayDiferencia && !motivo.trim()) {
      setError('Hay una diferencia en el arqueo. Debes justificarla antes de cerrar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await cerrarCaja(id, { saldo_contado: contadoNum, motivo_diferencia: motivo });
      navigate('/cajas');
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cerrar la caja.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingArqueo) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box maxWidth={560} mx="auto">
      <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* Encabezado Visual */}
        <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', p: 3, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <Scale size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Arqueo y Cierre de Caja</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {arqueo?.caja} — {arqueo?.cajero}
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Saldo Teórico (Sistema) */}
          <Box bgcolor="#f0f9ff" borderRadius={2} p={2.5} mb={2.5}>
            <Typography variant="overline" color="primary" fontWeight={700}>
              📊 Saldo Teórico (Sistema)
            </Typography>
            <Stack spacing={0.5} mt={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Saldo inicial</Typography>
                <Typography variant="body2">{fmtMoney(arqueo?.saldo_inicial)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="success.main">+ Ingresos</Typography>
                <Typography variant="body2" color="success.main">{fmtMoney(arqueo?.ingresos)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="error.main">- Egresos</Typography>
                <Typography variant="body2" color="error.main">{fmtMoney(arqueo?.egresos)}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>Saldo esperado</Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {fmtMoney(arqueo?.saldo_teorico)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Formulario de Cierre */}
          <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={1}>
                  💵 Efectivo Contado Físicamente
                </Typography>
                <TextField
                  fullWidth type="number" value={contado}
                  onChange={e => setContado(e.target.value)}
                  placeholder="0.00"
                  InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment> }}
                  sx={{ 
                    bgcolor: 'white', 
                    '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                  }}
                />
              </Box>

          {/* Resultado del Arqueo */}
          {contado !== '' && (
            <Box
              bgcolor={hayDiferencia ? '#fff7ed' : '#f0fdf4'}
              border="1px solid"
              borderColor={hayDiferencia ? 'warning.light' : 'success.light'}
              borderRadius={2} p={2} mb={2.5}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                  {hayDiferencia
                    ? (diferencia < 0 ? '⚠️ Faltante en caja' : '✅ Sobrante en caja')
                    : '✅ Caja cuadrada perfectamente'}
                </Typography>
                <Typography
                  variant="h6" fontWeight={700}
                  color={hayDiferencia ? (diferencia < 0 ? 'error.main' : 'warning.main') : 'success.main'}
                >
                  {diferencia >= 0 ? '+' : ''}{fmtMoney(diferencia)}
                </Typography>
              </Box>
            </Box>
          )}

              {/* Motivo de diferencia */}
              {hayDiferencia && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={1}>
                    📝 Justificación de la Diferencia
                  </Typography>
                  <TextField
                    fullWidth multiline rows={3}
                    value={motivo} onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej: Error al dar vuelto en una venta de la tarde..."
                    helperText="El administrador revisará esta justificación. Es obligatoria."
                    sx={{ 
                      bgcolor: 'white', 
                      '& .MuiOutlinedInput-root': { borderRadius: 2 } 
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Box>

          <Alert severity={hayDiferencia ? 'warning' : 'info'} sx={{ mb: 2.5, borderRadius: 2 }}>
            {hayDiferencia
              ? 'La sesión se cerrará con estado "Diferencia". El administrador recibirá una alerta para revisarla.'
              : 'Al confirmar, la sesión quedará bloqueada y no se podrán realizar más movimientos.'}
          </Alert>

          <Button
            fullWidth variant="contained" color="error" size="large"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Lock size={18} />}
            onClick={handleCerrar} disabled={loading}
            sx={{ 
              py: 1.5, 
              borderRadius: 2, 
              fontWeight: 800, 
              letterSpacing: '0.5px',
              boxShadow: '0 8px 16px rgba(220, 38, 38, 0.2)' 
            }}
          >
            {loading ? 'CERRANDO CAJA...' : 'CONFIRMAR CIERRE DE CAJA'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
