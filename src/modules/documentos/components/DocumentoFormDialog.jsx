import { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import FiltroBusqueda from '../../../shared/components/FiltroBusqueda';
import { erroresPorCampo, mensajeError } from '../../../shared/utils/errores';
import { TIPOS_POR_ENTIDAD, documentosService } from '../services/documentosService';

const C = premiumTokens.colors;
const VACIO = { tipo: '', numero: '', entidad_emisora: '', fecha_emision: '', fecha_vencimiento: '', observaciones: '' };

/** Alta / edición de un documento (con archivo opcional PDF/JPG/PNG de hasta 5 MB). */
export default function DocumentoFormDialog({ open, entidad, entidadId, documento, onClose, onSaved }) {
  const editando = Boolean(documento);
  const { register, handleSubmit, reset, control, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: VACIO });
  const [archivo, setArchivo] = useState(null);
  const inputArchivo = useRef(null);

  useEffect(() => {
    if (!open) return;
    reset(documento
      ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, documento[k] ?? '']))
      : VACIO);
    setArchivo(null);
  }, [open, documento, reset]);

  const onSubmit = async (valores) => {
    const datos = { ...valores, archivo };
    try {
      if (editando) {
        await documentosService.actualizar(documento.id, datos);
      } else {
        await documentosService.crear({ ...datos, [entidad === 'VEHICULO' ? 'vehiculo' : 'cliente']: entidadId });
      }
      onSaved();
    } catch (error) {
      const porCampo = erroresPorCampo(error);
      let alguno = false;
      Object.entries(porCampo).forEach(([campo, msg]) => {
        if (campo in VACIO || campo === 'archivo') {
          setError(campo === 'archivo' ? 'numero' : campo, { type: 'server', message: msg });
          alguno = true;
        }
      });
      if (!alguno || porCampo.archivo) Swal.fire('Error', mensajeError(error, 'No se pudo guardar el documento'), 'error');
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>{editando ? 'Editar documento' : 'Nuevo documento'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 0.5 }}>
            <Controller
              name="tipo" control={control} rules={{ required: 'Seleccione el tipo de documento' }}
              render={({ field }) => (
                <FiltroBusqueda
                  size="medium" label="Tipo de documento" required clearable={false}
                  options={TIPOS_POR_ENTIDAD[entidad]} value={field.value}
                  onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref}
                  error={!!errors.tipo} helperText={errors.tipo?.message}
                  sx={{ gridColumn: { sm: '1 / -1' } }}
                />
              )}
            />
            <TextField label="Número" {...register('numero', { maxLength: { value: 60, message: 'Máximo 60 caracteres' } })}
              error={!!errors.numero} helperText={errors.numero?.message} />
            <TextField label="Entidad emisora (aseguradora, planta...)" {...register('entidad_emisora')} />
            <TextField label="Fecha de emisión" type="date" slotProps={{ inputLabel: { shrink: true } }}
              {...register('fecha_emision')} error={!!errors.fecha_emision} helperText={errors.fecha_emision?.message} />
            <TextField label="Fecha de vencimiento" type="date" slotProps={{ inputLabel: { shrink: true } }}
              {...register('fecha_vencimiento')} error={!!errors.fecha_vencimiento} helperText={errors.fecha_vencimiento?.message} />
            <TextField label="Observaciones" multiline minRows={2} {...register('observaciones')}
              sx={{ gridColumn: { sm: '1 / -1' } }} />
            <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
              <input ref={inputArchivo} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
              <Button variant="outlined" onClick={() => inputArchivo.current?.click()} disabled={isSubmitting}>
                {archivo ? 'Cambiar archivo' : (editando && documento.tiene_archivo ? 'Reemplazar archivo' : 'Adjuntar archivo')}
              </Button>
              <Typography variant="caption" sx={{ ml: 1.5, color: C.textMuted }}>
                {archivo ? archivo.name : 'PDF, JPG o PNG de hasta 5 MB (opcional)'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} sx={{ color: '#64748b' }}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}
            sx={{ bgcolor: C.brand, '&:hover': { bgcolor: C.brandDark } }}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
