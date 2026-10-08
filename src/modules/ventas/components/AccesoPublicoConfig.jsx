import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { Globe, Save, ShieldCheck } from 'lucide-react';
import api from '../../../core/api/axios';

export default function AccesoPublicoConfig({ puedeEditar, onChange }) {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/seguridad/acceso-publico/').then(({ data }) => {
      if (!active) return;
      setUrl(data.url_base);
      setSavedUrl(data.url_base);
      onChange(data.url_base);
    }).catch(() => {
      if (active) setError('No se pudo cargar la direccion publica.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [onChange]);

  const guardar = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const { data } = await api.put('/seguridad/acceso-publico/', { url_base: url.trim() });
      setUrl(data.url_base);
      setSavedUrl(data.url_base);
      onChange(data.url_base);
      setStatus('Direccion guardada.');
    } catch (err) {
      const mensaje = err.response?.data?.url_base;
      setError(Array.isArray(mensaje) ? mensaje[0] : 'No se pudo guardar la direccion publica.');
    } finally {
      setBusy(false);
    }
  };

  const comprobar = async () => {
    setBusy(true);
    setError('');
    setStatus('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(new URL('/public-health', savedUrl), {
        headers: { 'ngrok-skip-browser-warning': '1' },
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || data.service !== 'taller-publico') throw new Error('Entrada no valida');
      setStatus('Entrada publica disponible.');
    } catch {
      setError('No se pudo verificar la entrada publica. Revisa Nginx, Ngrok y la direccion guardada.');
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  };

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Globe size={19} /> Acceso publico
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField label="Direccion publica HTTPS" placeholder="https://tu-dominio.ngrok-free.app" value={url}
          onChange={(event) => { setUrl(event.target.value); setStatus(''); setError(''); }}
          disabled={loading || busy || !puedeEditar} size="small" sx={{ flex: '1 1 300px' }} />
        {puedeEditar && <Button variant="contained" startIcon={busy ? <CircularProgress size={16} /> : <Save size={17} />}
          onClick={guardar} disabled={loading || busy}>Guardar</Button>}
        <Button variant="outlined" startIcon={<ShieldCheck size={17} />} onClick={comprobar}
          disabled={loading || busy || !savedUrl || url.trim().replace(/\/$/, '') !== savedUrl}>Comprobar</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      {status && <Alert severity="success" sx={{ mt: 1.5 }}>{status}</Alert>}
    </Box>
  );
}
