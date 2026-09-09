import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  MenuItem, Alert, CircularProgress, InputAdornment, Divider
} from '@mui/material';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { getSesiones, crearTransferencia } from '../services/cajas.service';

export default function TransferenciasPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sesionParam = params.get('sesion') || '';

  const [sesionOrigen,  setSesionOrigen]  = useState(sesionParam);
  const [sesionDestino, setSesionDestino] = useState('');
  const [monto,  setMonto]    = useState('');
  const [motivo, setMotivo]   = useState('');
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error,   setError]     = useState(null);
  const [success, setSuccess]   = useState(null);

  useEffect(() => {
    getSesiones({ estado: 'ABIERTA' })
      .then(r => setSesiones(r.data?.results ?? r.data ?? []))
      .catch(() => setError('Error cargando sesiones abiertas.'))
      .finally(() => setLoadingInit(false));
  }, []);

  const handleEnviar = async () => {
    if (!sesionOrigen || !sesionDestino || !monto) {
      setError('Completa todos los campos requeridos.');
      return;
    }
    if (sesionOrigen === sesionDestino) {
      setError('La caja origen y destino no pueden ser la misma.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await crearTransferencia({
        sesion_origen:  sesionOrigen,
        sesion_destino: sesionDestino,
        monto:          parseFloat(monto),
        motivo,
      });
      setSuccess(`Transferencia de S/ ${monto} realizada exitosamente.`);
      setTimeout(() => navigate('/cajas'), 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al realizar la transferencia.');
    } finally {
      setLoading(false);
    }
  };

  const sesionOrigenData  = sesiones.find(s => String(s.id) === String(sesionOrigen));
  const sesionDestinoData = sesiones.find(s => String(s.id) === String(sesionDestino));

  if (loadingInit) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box maxWidth={520} mx="auto">
      <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/cajas')} sx={{ mb: 2 }}>
        Dashboard Cajas
      </Button>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {/* Encabezado Visual */}
        <Box sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', p: 3, color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <ArrowRightLeft size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Transferencia entre Cajas</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Mueve dinero entre cajas sin generar un gasto contable
              </Typography>
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>

          {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box sx={{ bgcolor: '#f8fafc', p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            <TextField 
              select fullWidth label="Caja Origen" value={sesionOrigen} onChange={e => setSesionOrigen(e.target.value)}
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {sesiones.map(s => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.caja_nombre} — {s.usuario_nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField 
              select fullWidth label="Caja Destino" value={sesionDestino} onChange={e => setSesionDestino(e.target.value)}
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              {sesiones.filter(s => String(s.id) !== String(sesionOrigen)).map(s => (
                <MenuItem key={s.id} value={String(s.id)}>
                  {s.caja_nombre} — {s.usuario_nombre}
                </MenuItem>
              ))}
            </TextField>

            {/* Vista previa */}
            {sesionOrigenData && sesionDestinoData && (
              <Box bgcolor="#eff6ff" border="1px solid #bfdbfe" borderRadius={2} p={2.5} display="flex" alignItems="center" gap={2}>
                <Box textAlign="center" flex={1}>
                  <Typography variant="body2" fontWeight={700}>{sesionOrigenData.caja_nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">Origen</Typography>
                </Box>
                <ArrowRightLeft size={20} color="#3b82f6" />
                <Box textAlign="center" flex={1}>
                  <Typography variant="body2" fontWeight={700}>{sesionDestinoData.caja_nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">Destino</Typography>
                </Box>
              </Box>
            )}

            <TextField
              fullWidth label="Monto a transferir (S/)" type="number" value={monto} onChange={e => setMonto(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">S/</InputAdornment> }}
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth label="Motivo / Descripción" multiline rows={2}
              value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Reposición de fondo para Caja Chica"
              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Divider sx={{ my: 1 }} />

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Esta operación genera dos movimientos automáticos: un <strong>egreso</strong> en la caja origen y un <strong>ingreso</strong> en la caja destino. Ambos quedan registrados para auditoría.
            </Alert>

            <Button
              variant="contained" size="large" color="primary"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowRightLeft size={18} />}
              onClick={handleEnviar} disabled={loading}
              sx={{ 
                mt: 2,
                py: 1.5, 
                borderRadius: 2, 
                fontWeight: 800, 
                letterSpacing: '0.5px',
                color: 'white',
                boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)' 
              }}
            >
              {loading ? 'PROCESANDO TRANSFERENCIA...' : 'REALIZAR TRANSFERENCIA'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
