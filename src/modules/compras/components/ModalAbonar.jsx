import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions,
  Button, TextField, MenuItem, CircularProgress,
  InputAdornment, Box, Typography, FormControlLabel, Switch, IconButton
} from '@mui/material';
import { X, Wallet } from 'lucide-react';
import Swal from 'sweetalert2';
import { comprasService } from '../services/comprasApi';
import { ventasService } from '../../ventas/services/ventasApi';

export default function ModalAbonar({ open, onClose, cuenta, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [metodosList, setMetodosList] = useState([]);

  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState({
    monto_abonado: '',
    fecha_pago: getLocalDate(),
    metodo_pago_id: '',
    referencia: '',
    afecta_caja: true
  });

  useEffect(() => {
    if (open && cuenta) {
      setFormData({
        monto_abonado: parseFloat(cuenta.saldo_pendiente).toFixed(2),
        fecha_pago: getLocalDate(),
        metodo_pago_id: '',
        referencia: '',
        afecta_caja: true
      });
      fetchMetodos();
    }
  }, [open, cuenta]);

  const fetchMetodos = async () => {
    try {
      const data = await ventasService.getMetodosPago();
      const list = Array.isArray(data) ? data : (data.results || []);
      const activos = list.filter(m => m.estado);
      setMetodosList(activos);
      if (activos.length > 0) {
        setFormData(prev => ({ ...prev, metodo_pago_id: activos[0].id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const currentMetodo = metodosList.find(m => m.id === formData.metodo_pago_id);
  const reqRef = currentMetodo?.requiere_referencia || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const monto = parseFloat(formData.monto_abonado);
    if (isNaN(monto) || monto <= 0) {
      Swal.fire('Error', 'El monto a abonar debe ser mayor a 0.', 'error');
      return;
    }
    
    if (monto > parseFloat(cuenta.saldo_pendiente)) {
      Swal.fire('Error', 'El monto no puede ser mayor al saldo pendiente.', 'error');
      return;
    }

    if (reqRef && !formData.referencia.trim()) {
      Swal.fire('Error', 'Este método de pago requiere un número de referencia (ej. Nro. de Operación).', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        cuenta_por_pagar: cuenta.id,
        monto_abonado: monto,
        fecha_pago: formData.fecha_pago,
        metodo_pago: currentMetodo.nombre, // Guardamos el nombre como string según el backend
        metodo_pago_id: currentMetodo.id, // Usado solo para armar el movimiento de caja
        referencia: formData.referencia,
        afecta_caja: formData.afecta_caja
      };

      await comprasService.registrarPago(payload);

      Swal.fire({
        icon: 'success',
        title: '¡Abono registrado!',
        timer: 1500,
        showConfirmButton: false
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'Hubo un problema al registrar el abono.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!cuenta) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
        color: 'white', px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
            <Wallet size={20} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Registrar Abono</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>{cuenta.compra_comprobante || cuenta.proveedor_nombre}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <X size={20} />
        </IconButton>
      </Box>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ bgcolor: '#f8fafc', p: 3 }}>

          <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid', borderColor: '#bfdbfe' }}>
            <Typography variant="body2" color="text.secondary">Deuda actual (Saldo):</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              S/ {parseFloat(cuenta.saldo_pendiente).toFixed(2)}
            </Typography>
          </Box>

          <TextField
            label="Monto a abonar"
            type="number"
            fullWidth
            required
            sx={{ mb: 2.5 }}
            value={formData.monto_abonado}
            onChange={e => setFormData({ ...formData, monto_abonado: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">S/</InputAdornment>,
              inputProps: { min: 0.1, step: 0.1, max: parseFloat(cuenta.saldo_pendiente) }
            }}
          />
          
          <TextField 
            label="Fecha de pago"
            type="date"
            fullWidth
            required
            sx={{ mb: 2.5 }}
            value={formData.fecha_pago}
            onChange={e => setFormData({ ...formData, fecha_pago: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />

          <TextField 
            select
            label="Método de pago"
            fullWidth
            required
            sx={{ mb: 2.5 }}
            value={formData.metodo_pago_id}
            onChange={e => setFormData({ ...formData, metodo_pago_id: e.target.value })}
          >
            {metodosList.map(m => (
              <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>
            ))}
            {metodosList.length === 0 && <MenuItem value="">Cargando métodos...</MenuItem>}
          </TextField>

          {reqRef && (
            <TextField 
              label="Nro. Referencia / Operación"
              fullWidth
              required
              sx={{ mb: 1 }}
              value={formData.referencia}
              onChange={e => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Ingresar número de operación"
            />
          )}
          {!reqRef && (
            <TextField
              label="Nro. Referencia / Operación (Opcional)"
              fullWidth
              sx={{ mb: 1 }}
              value={formData.referencia}
              onChange={e => setFormData({ ...formData, referencia: e.target.value })}
              placeholder="Detalle opcional"
            />
          )}

          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: formData.afecta_caja ? '#eff6ff' : '#f1f5f9', borderRadius: 2, border: '1px solid', borderColor: formData.afecta_caja ? '#bfdbfe' : '#e2e8f0' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.afecta_caja}
                  onChange={e => setFormData({ ...formData, afecta_caja: e.target.checked })}
                />
              }
              label="Afecta a Caja"
            />
            <Typography variant="caption" display="block" color="text.secondary" sx={{ pl: '1px' }}>
              {formData.afecta_caja
                ? 'Se descontará como egreso de tu caja abierta (pago en efectivo/físico desde el cajón).'
                : 'No se tocará ninguna caja (ej. transferencia bancaria hecha fuera del sistema de caja).'}
            </Typography>
          </Box>

        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f8fafc', px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || metodosList.length === 0}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
            sx={{ px: 3, borderRadius: '8px', fontWeight: 700 }}
          >
            Confirmar Pago
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
