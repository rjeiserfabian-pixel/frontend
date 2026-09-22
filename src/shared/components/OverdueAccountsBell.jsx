import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Badge, Popover, Box, Typography, List, ListItemButton,
  Chip, Divider, CircularProgress, Tooltip
} from '@mui/material';
import { Bell } from 'lucide-react';

const fmtMoney = (v) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v ?? 0);

// Refresca el contador cada 5 min para que no quede desactualizado mientras
// el usuario tiene la sesión abierta, sin llegar a saturar al backend.
const REFRESH_MS = 5 * 60 * 1000;

/**
 * Campanita de alertas para el header global. Genérica: recibe un
 * `fetchVencidas` que debe devolver { total, results } donde cada item de
 * `results` ya viene normalizado como { id, titulo, subtitulo, monto,
 * diasVencido, to }. El total puede ser mayor a results.length (el backend
 * limita a 30 registros para no sobrecargar el desplegable).
 *
 * Se refresca en 3 momentos, sin agregar polling agresivo:
 * 1) al montar, 2) al abrir el desplegable, 3) cada REFRESH_MS como respaldo.
 * Si se pasa `refreshEvent`, además escucha ese evento global (ver
 * shared/utils/vencidasEvents.js) para refrescarse al instante justo después
 * de que se registre un pago/cobro en otra pantalla, sin necesidad de bajar
 * el intervalo de polling.
 */
const OverdueAccountsBell = ({ label, color = 'error', fetchVencidas, refreshKey, refreshEvent }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ total: 0, results: [] });
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchVencidas();
      setData(res);
    } catch (error) {
      console.error(`Error cargando "${label}":`, error);
    } finally {
      setLoading(false);
    }
  }, [fetchVencidas, label]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshKey]);

  useEffect(() => {
    if (!refreshEvent) return;
    window.addEventListener(refreshEvent, load);
    return () => window.removeEventListener(refreshEvent, load);
  }, [refreshEvent, load]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    load();
  };

  const handleItemClick = (to) => {
    setAnchorEl(null);
    navigate(to);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={label}>
        <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 0.5 }}>
          <Badge badgeContent={data.total} color={color} max={99}>
            <Bell size={22} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: '90vw', borderRadius: '12px', mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="700">{label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {data.total === 0 ? 'Sin vencimientos' : `${data.total} ${data.total === 1 ? 'cuenta vencida' : 'cuentas vencidas'}`}
          </Typography>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : data.results.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No hay cuentas vencidas.</Typography>
          </Box>
        ) : (
          <List sx={{ py: 0, maxHeight: 380, overflowY: 'auto' }}>
            {data.results.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleItemClick(item.to)}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                  py: 1.2, borderBottom: '1px solid', borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                  <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 220 }}>
                    {item.titulo}
                  </Typography>
                  <Chip label={`${item.diasVencido} d`} size="small" color="error" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">{item.subtitulo}</Typography>
                  <Typography variant="caption" fontWeight="600" color="error.main">{fmtMoney(item.monto)}</Typography>
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
        {data.total > data.results.length && (
          <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando las {data.results.length} más urgentes de {data.total} en total.
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default OverdueAccountsBell;
