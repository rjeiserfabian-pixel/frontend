import React, { useEffect, useState } from 'react';
import {
  Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { premiumTokens } from '../../../core/theme/theme';
import useDebouncedValue from '../hooks/useDebouncedValue';
import FiltroBusqueda from './FiltroBusqueda';
import {
  ESTADOS_FISICOS, erroresPorCampo, herramientasService, mensajeError,
} from '../services/herramientasService';

const C = premiumTokens.colors;

// FiltroBusqueda espera { id, nombre }; los estados físicos vienen como { value, label }.
const ESTADOS_FISICOS_OPCIONES = ESTADOS_FISICOS.map((e) => ({ id: e.value, nombre: e.label }));

const VACIO = {
  nombre: '', categoria: '', marca: '', modelo: '', numero_serie: '',
  sucursal: '', almacen: '', ubicacion: '',
  fecha_compra: '', costo_adquisicion: '', garantia_hasta: '',
  estado_fisico: 'NUEVO', potencia: '', voltaje: '', observaciones: '',
};

const nullSiVacio = (v) => (v === '' || v === undefined ? null : v);

function toPayload(values, proveedor) {
  return {
    ...values,
    almacen: nullSiVacio(values.almacen),
    fecha_compra: nullSiVacio(values.fecha_compra),
    garantia_hasta: nullSiVacio(values.garantia_hasta),
    costo_adquisicion: nullSiVacio(values.costo_adquisicion),
    proveedor: proveedor ? proveedor.id : null,
  };
}

export default function HerramientaFormDialog({
  open, herramienta, categorias, sucursales, sucursalActivaId, onClose, onSaved,
}) {
  const editando = Boolean(herramienta);
  const {
    register, handleSubmit, reset, control, watch, setValue, setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: VACIO });

  const [almacenes, setAlmacenes] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [proveedorOpciones, setProveedorOpciones] = useState([]);
  const [proveedorTexto, setProveedorTexto] = useState('');
  const proveedorBusqueda = useDebouncedValue(proveedorTexto, 400);
  const sucursalId = watch('sucursal');

  // Carga inicial del formulario al abrir
  useEffect(() => {
    if (!open) return;
    if (herramienta) {
      reset({
        ...VACIO,
        ...Object.fromEntries(
          Object.keys(VACIO).map((k) => [k, herramienta[k] ?? ''])
        ),
      });
      setProveedor(
        herramienta.proveedor
          ? { id: herramienta.proveedor, nombre_o_razon_social: herramienta.proveedor_nombre }
          : null
      );
    } else {
      reset({ ...VACIO, sucursal: sucursalActivaId ? Number(sucursalActivaId) : '' });
      setProveedor(null);
    }
    setProveedorTexto('');
  }, [open, herramienta, reset, sucursalActivaId]);

  // Almacenes de la sucursal elegida (con cancelación si cambia o se cierra)
  useEffect(() => {
    if (!open || !sucursalId) {
      setAlmacenes([]);
      return undefined;
    }
    const controller = new AbortController();
    herramientasService.getAlmacenes(sucursalId, controller.signal)
      .then(setAlmacenes)
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') setAlmacenes([]);
      });
    return () => controller.abort();
  }, [open, sucursalId]);

  // Búsqueda de proveedores con debounce
  useEffect(() => {
    if (!open || proveedorBusqueda.trim().length < 2) return undefined;
    const controller = new AbortController();
    herramientasService.buscarProveedores(proveedorBusqueda.trim(), controller.signal)
      .then(setProveedorOpciones)
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') setProveedorOpciones([]);
      });
    return () => controller.abort();
  }, [open, proveedorBusqueda]);

  const onSubmit = async (values) => {
    const payload = toPayload(values, proveedor);
    try {
      if (editando) {
        await herramientasService.actualizarHerramienta(herramienta.id, payload);
      } else {
        await herramientasService.crearHerramienta(payload);
      }
      Swal.fire('Éxito', `Herramienta ${editando ? 'actualizada' : 'registrada'} correctamente`, 'success');
      onSaved();
    } catch (error) {
      const porCampo = erroresPorCampo(error);
      const camposConocidos = Object.keys(VACIO);
      let alguno = false;
      Object.entries(porCampo).forEach(([campo, msg]) => {
        if (camposConocidos.includes(campo)) {
          setError(campo, { type: 'server', message: msg });
          alguno = true;
        }
      });
      if (!alguno) Swal.fire('Error', mensajeError(error, 'Error al guardar la herramienta'), 'error');
    }
  };

  const seccion = (titulo) => (
    <Typography variant="subtitle2" sx={{ color: C.textMuted, fontWeight: 800, mt: 1 }}>
      {titulo}
    </Typography>
  );

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editando ? `Editar herramienta ${herramienta.codigo}` : 'Nueva herramienta'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 0.5 }}>
            <Box sx={{ gridColumn: '1 / -1' }}>{seccion('Identificación')}</Box>
            <TextField
              label="Nombre" required
              {...register('nombre', {
                required: 'El nombre es requerido',
                maxLength: { value: 150, message: 'Máximo 150 caracteres' },
              })}
              error={!!errors.nombre} helperText={errors.nombre?.message}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
            <Controller
              name="categoria" control={control}
              rules={{ required: 'Seleccione una categoría' }}
              render={({ field }) => (
                <FiltroBusqueda
                  size="medium" label="Categoría" required
                  options={categorias} value={field.value}
                  onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref}
                  error={!!errors.categoria} helperText={errors.categoria?.message}
                />
              )}
            />
            <TextField label="Marca" {...register('marca')} error={!!errors.marca} helperText={errors.marca?.message} />
            <TextField label="Modelo" {...register('modelo')} error={!!errors.modelo} helperText={errors.modelo?.message} />
            <TextField label="N.º de serie" {...register('numero_serie')} error={!!errors.numero_serie} helperText={errors.numero_serie?.message} />

            <Box sx={{ gridColumn: '1 / -1' }}>{seccion('Ubicación')}</Box>
            <Controller
              name="sucursal" control={control}
              rules={{ required: 'Seleccione una sucursal' }}
              render={({ field }) => (
                <FiltroBusqueda
                  size="medium" label="Sucursal" required
                  options={sucursales} value={field.value}
                  onChange={(e) => { field.onChange(e); setValue('almacen', ''); }}
                  onBlur={field.onBlur} inputRef={field.ref}
                  error={!!errors.sucursal} helperText={errors.sucursal?.message}
                />
              )}
            />
            <Controller
              name="almacen" control={control}
              render={({ field }) => (
                <FiltroBusqueda
                  size="medium" label="Almacén (opcional)"
                  options={almacenes} value={field.value}
                  onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref}
                  error={!!errors.almacen} helperText={errors.almacen?.message}
                />
              )}
            />
            <TextField label="Ubicación (ej. Tablero 2)" {...register('ubicacion')}
              sx={{ gridColumn: { sm: '1 / -1' } }} />

            <Box sx={{ gridColumn: '1 / -1' }}>{seccion('Compra')}</Box>
            <TextField label="Fecha de compra" type="date" slotProps={{ inputLabel: { shrink: true } }}
              {...register('fecha_compra')} error={!!errors.fecha_compra} helperText={errors.fecha_compra?.message} />
            <TextField label="Costo de adquisición (S/)" type="number"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('costo_adquisicion', { min: { value: 0, message: 'No puede ser negativo' } })}
              error={!!errors.costo_adquisicion} helperText={errors.costo_adquisicion?.message} />
            <Autocomplete
              options={proveedorOpciones}
              value={proveedor}
              onChange={(_, v) => setProveedor(v)}
              onInputChange={(_, v, reason) => { if (reason === 'input') setProveedorTexto(v); }}
              getOptionLabel={(o) => o?.nombre_o_razon_social || ''}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              filterOptions={(x) => x}
              noOptionsText="Escriba al menos 2 letras para buscar"
              renderInput={(params) => <TextField {...params} label="Proveedor" />}
            />
            <TextField label="Garantía hasta" type="date" slotProps={{ inputLabel: { shrink: true } }}
              {...register('garantia_hasta')} error={!!errors.garantia_hasta} helperText={errors.garantia_hasta?.message} />

            <Box sx={{ gridColumn: '1 / -1' }}>{seccion('Estado y datos técnicos')}</Box>
            <Controller
              name="estado_fisico" control={control}
              render={({ field }) => (
                <FiltroBusqueda
                  size="medium" label="Estado físico" clearable={false}
                  options={ESTADOS_FISICOS_OPCIONES} value={field.value}
                  onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref}
                />
              )}
            />
            <TextField label="Potencia (ej. 2200 W)" {...register('potencia')} />
            <TextField label="Voltaje (ej. 220 V)" {...register('voltaje')} />
            <TextField label="Observaciones" multiline minRows={2}
              {...register('observaciones')} sx={{ gridColumn: { sm: '1 / -1' } }} />
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
