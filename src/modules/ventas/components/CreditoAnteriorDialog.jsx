import React, { useEffect, useRef, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Plus } from 'lucide-react';
import api from '../../../core/api/axios';
import { clienteService } from '../../clientes/services/clienteService';
import { tallerService } from '../../taller/services/tallerService';
import CreditoAnteriorLinea from './CreditoAnteriorLinea';
import { agruparServiciosAnteriores, ajusteDocumentoParaEnviar, detalleAnteriorParaEnviar, listarCatalogoServiciosCompleto, resumenImportesCreditoAnterior } from '../utils/creditoAnteriorLineas';
import { crearSolicitudId } from '../../../shared/utils/solicitudId';
import { notificarCobroRegistrado } from '../../../shared/utils/vencidasEvents';
import ClientesForm from '../../clientes/components/ClientesForm';
import VehiculosForm from '../../vehiculos/components/VehiculosForm';
import { vehiculoService } from '../../vehiculos/services/vehiculosService';

const hoy = () => new Date().toLocaleDateString('en-CA');
const lineaVacia = () => ({ _filaId: crearSolicitudId(), tipo: 'REPUESTO', codigo_original: '', descripcion: '', unidad: '', cantidad: '1', precio_unitario: '', descuento: '0', repuesto: null });

const nombresCampos = {
  cliente: 'Cliente',
  vehiculo: 'Vehículo / Placa',
  sin_vehiculo: 'Sin vehículo',
  sistema_origen: 'Dónde estaba registrada la deuda',
  documento_origen: 'Número de documento o referencia',
  tipo_documento_origen: 'Tipo de documento',
  concepto: 'Resumen del trabajo o venta',
  observaciones: 'Notas y origen del saldo',
  importe_original: 'Total original de la deuda',
  abonos_anteriores: 'Total abonado hasta la fecha',
  ajuste_documento: 'Ajuste del documento',
  motivo_ajuste: 'Motivo del descuento o cargo',
  fecha_original: 'Fecha del documento original',
  fecha_corte: 'Pagos revisados hasta',
  cronograma: 'Cuotas pendientes',
  detalles: 'Servicios y repuestos',
  motivo: 'Motivo de la corrección',
  non_field_errors: 'Validación general',
};

const extraerAlertasBackend = (data) => {
  if (!data) return { alertas: ['Verifique los datos ingresados en el formulario.'], mapaCampos: {} };
  if (typeof data === 'string') return { alertas: [data], mapaCampos: {} };

  const alertas = [];
  const mapaCampos = {};

  const origenErrores = data.errores || data.errors || (typeof data === 'object' && !data.mensaje && !data.detail && !data.error ? data : null);

  if (origenErrores && typeof origenErrores === 'object' && !Array.isArray(origenErrores)) {
    Object.entries(origenErrores).forEach(([campo, valor]) => {
      if (['success', 'status_code', 'status', 'solicitud_id'].includes(campo)) return;
      const etiqueta = nombresCampos[campo] || campo;
      const texto = Array.isArray(valor) ? valor.join(' · ') : typeof valor === 'object' ? Object.values(valor).flat().join(' · ') : String(valor);
      mapaCampos[campo] = texto;
      alertas.push(`${etiqueta}: ${texto}`);
    });
  }

  if (alertas.length === 0) {
    const msg = data.mensaje || data.detail || data.error;
    if (msg && typeof msg === 'string') {
      alertas.push(msg);
    } else {
      alertas.push('Verifique los campos requeridos antes de guardar.');
    }
  }

  return { alertas, mapaCampos };
};

export default function CreditoAnteriorDialog({ open, onClose, onSaved, cuenta = null, clienteInicial = null }) {
  const [form, setForm] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [errorServicios, setErrorServicios] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [alertasValidacion, setAlertasValidacion] = useState([]);
  const [erroresCampos, setErroresCampos] = useState({});
  const [revision, setRevision] = useState(false);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalVehiculo, setModalVehiculo] = useState(false);
  const envio = useRef(null);
  const bloqueo = useRef(false);
  const conCobros = Boolean(cuenta?.cuotas?.some(c => c.pagos?.length));

  useEffect(() => {
    if (!open) return;
    const inicial = cuenta ? {
      ...cuenta, detalles: cuenta.detalles_anteriores.map(({ tipo, repuesto, codigo_original, descripcion, unidad, cantidad, precio_unitario, descuento }) => ({ _filaId: crearSolicitudId(), tipo, repuesto, codigo_original, descripcion, unidad, cantidad, precio_unitario, descuento })),
      descuento_global: Math.max(-Number(cuenta.ajuste_documento || 0), 0).toFixed(2), cargo_adicional: Math.max(Number(cuenta.ajuste_documento || 0), 0).toFixed(2),
      cronograma: cuenta.cuotas.map(c => ({ monto: c.monto, fecha_vencimiento: c.fecha_vencimiento })), motivo: '',
    } : {
      cliente: clienteInicial, sucursal: Number(localStorage.getItem('sucursal_id') || 1), vehiculo: null,
      sin_vehiculo: false, sin_detalle: false, sistema_origen: '', documento_origen: '', tipo_documento_origen: '', concepto: '', observaciones: '',
      moneda: 'PEN', fecha_original: '', fecha_corte: hoy(), importe_original: '', abonos_anteriores: '0', descuento_global: '0', cargo_adicional: '0', ajuste_documento: '0', motivo_ajuste: '',
      detalles: [lineaVacia()], cronograma: [{ monto: '', fecha_vencimiento: '' }], motivo: '',
    };
    setForm(inicial); setError(''); setAlertasValidacion([]); setErroresCampos({}); setRevision(false); envio.current = null;
    setCliente(null); setClientes([]); setVehiculos([]);
    let activo = true;
    if (inicial.cliente) clienteService.obtener(inicial.cliente).then(c => { if (activo) setCliente(c); }).catch(() => { if (activo) setError('No se pudo cargar el cliente.'); });
    return () => { activo = false; };
  }, [open, cuenta, clienteInicial]);

  useEffect(() => {
    if (!open) return;
    let activo = true;
    const timer = setTimeout(() => clienteService.listar(1, busqueda).then(r => { if (activo) setClientes(r.results || r); }).catch(() => { if (activo) setError('No se pudo buscar clientes.'); }), 300);
    return () => { activo = false; clearTimeout(timer); };
  }, [open, busqueda]);

  useEffect(() => {
    if (!open) return;
    let activo = true;
    setCargandoServicios(true); setServicios([]); setErrorServicios('');
    Promise.allSettled([
      listarCatalogoServiciosCompleto(tallerService.getPlantillas),
      listarCatalogoServiciosCompleto(tallerService.getPlantillasCorrectivas),
    ]).then(([preventivos, correctivos]) => {
      if (!activo) return;
      setServicios(agruparServiciosAnteriores(preventivos.status === 'fulfilled' ? preventivos.value : [], correctivos.status === 'fulfilled' ? correctivos.value : []));
      const faltantes = [preventivos.status === 'rejected' && 'preventivos', correctivos.status === 'rejected' && 'correctivos'].filter(Boolean);
      if (faltantes.length) setErrorServicios(`No se pudieron cargar los servicios ${faltantes.join(' y ')}. Revise la conexión y el permiso de ver Servicios del Taller; puede ingresar el nombre manualmente.`);
      setCargandoServicios(false);
    });
    return () => { activo = false; };
  }, [open]);

  useEffect(() => {
    if (!open || !cliente?.id) return;
    let activo = true;
    clienteService.getVehiculos(cliente.id).then(r => { if (activo) setVehiculos(r.vehiculos || []); }).catch(() => { if (activo) setError('No se pudieron cargar las placas del cliente. Revise sus permisos de clientes.'); });
    return () => { activo = false; };
  }, [open, cliente?.id]);

  if (!form) return null;

  const cambiar = (campoNombre, valor) => {
    setForm(f => ({ ...f, [campoNombre]: valor }));
    setRevision(false);
    setError('');
    setErroresCampos(prev => {
      if (!prev[campoNombre]) return prev;
      const next = { ...prev };
      delete next[campoNombre];
      return next;
    });
    setAlertasValidacion([]);
  };

  const { saldo, detalleTotal, cronograma, totalCuotas, errores: erroresImportes } = resumenImportesCreditoAnterior(form);

  const validarFormulario = () => {
    const errsCampos = {};
    const alertas = [];

    if (!conCobros) {
      if (!form.cliente) {
        errsCampos.cliente = 'Seleccione un cliente';
        alertas.push('Cliente: Debe seleccionar un cliente de la lista.');
      }
      if (!form.sin_vehiculo && !form.vehiculo) {
        errsCampos.vehiculo = 'Seleccione una placa';
        alertas.push('Placa del cliente: Seleccione una placa o marque "Repuestos vendidos sin vehículo asociado".');
      }
      if (!form.sistema_origen?.trim()) {
        errsCampos.sistema_origen = 'Campo obligatorio';
        alertas.push('Dónde estaba registrada la deuda: Indique el origen (ej. Omega, Excel o cuaderno).');
      }
      if (!form.documento_origen?.trim()) {
        errsCampos.documento_origen = 'Campo obligatorio';
        alertas.push('Número de documento: Ingrese el número de documento o referencia de la deuda.');
      }
      if (!form.fecha_original) {
        errsCampos.fecha_original = 'Campo obligatorio';
        alertas.push('Fecha original: Ingrese la fecha del documento o trabajo original.');
      }
      if (!form.fecha_corte) {
        errsCampos.fecha_corte = 'Campo obligatorio';
        alertas.push('Pagos revisados hasta: Ingrese la fecha de corte.');
      }
      if (form.fecha_original && form.fecha_corte && form.fecha_original > form.fecha_corte) {
        errsCampos.fecha_corte = 'No puede ser anterior a la fecha original';
        alertas.push('Fechas: La fecha original debe ser anterior o igual a la fecha de corte.');
      }
      if (form.importe_original === '' || Number(form.importe_original) <= 0) {
        errsCampos.importe_original = 'Debe ser mayor a 0';
        alertas.push('Total de la deuda: Ingrese un importe original válido mayor a 0.');
      }
      if (form.sin_detalle && !form.observaciones?.trim()) {
        errsCampos.observaciones = 'Obligatorio al no tener desglose';
        alertas.push('Notas adicionales: Al no tener desglose, debe explicar el origen del saldo en las notas.');
      }
      if (!form.sin_detalle) {
        if (!form.detalles?.length) {
          alertas.push('Servicios y repuestos: Agregue al menos una línea, o marque "No tengo el detalle".');
        } else {
          const lineaInvalida = form.detalles.some(d => !d.descripcion?.trim() || Number(d.cantidad) <= 0 || d.precio_unitario === '' || Number(d.precio_unitario) < 0);
          if (lineaInvalida) {
            alertas.push('Servicios y repuestos: Cada línea debe tener descripción, cantidad (> 0) y precio.');
          }
        }
      }
      if (cronograma.some(c => !c.fecha_vencimiento || Number(c.monto) <= 0)) {
        alertas.push('Cuotas pendientes: Cada cuota debe tener fecha de vencimiento y un importe mayor a 0.');
      }
      if (erroresImportes.length) {
        erroresImportes.forEach(msg => alertas.push(`Importes: ${msg}`));
      }
    }

    if (!form.concepto?.trim()) {
      errsCampos.concepto = 'Este campo no puede estar en blanco';
      alertas.push('Resumen del trabajo o venta: Este campo no puede estar en blanco.');
    }

    if (cuenta && !form.motivo?.trim()) {
      errsCampos.motivo = 'Campo obligatorio';
      alertas.push('Motivo de la corrección: Este campo es obligatorio.');
    }

    return { errsCampos, alertas, valido: alertas.length === 0 };
  };

  const revisar = () => {
    const { errsCampos, alertas, valido } = validarFormulario();
    if (!valido) {
      setErroresCampos(errsCampos);
      setAlertasValidacion(alertas);
      setError('');
      return;
    }
    setErroresCampos({});
    setAlertasValidacion([]);
    setError('');
    setRevision(true);
  };

  const campo = (nombre, label, type = 'text', extra = {}) => (
    <TextField
      size="small"
      label={label}
      type={type}
      value={form[nombre] ?? ''}
      onChange={e => cambiar(nombre, e.target.value)}
      fullWidth
      slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined}
      error={Boolean(erroresCampos[nombre])}
      helperText={erroresCampos[nombre] || extra.helperText}
      {...extra}
    />
  );

  const enviar = async () => {
    if (bloqueo.current) return;
    const { errsCampos, alertas, valido } = validarFormulario();
    if (!valido) {
      setErroresCampos(errsCampos);
      setAlertasValidacion(alertas);
      setRevision(false);
      setError('');
      return;
    }

    bloqueo.current = true;
    setGuardando(true);
    setError('');
    setAlertasValidacion([]);
    const claves = ['cliente', 'sucursal', 'vehiculo', 'sin_vehiculo', 'sin_detalle', 'sistema_origen', 'documento_origen', 'tipo_documento_origen', 'concepto', 'observaciones', 'moneda', 'fecha_original', 'fecha_corte', 'importe_original', 'abonos_anteriores', 'ajuste_documento', 'motivo_ajuste', 'detalles', 'cronograma', 'motivo'];
    const payload = conCobros ? { concepto: form.concepto, observaciones: form.observaciones, motivo: form.motivo, ...(cuenta.sin_detalle && !form.sin_detalle ? { detalles: form.detalles, sin_detalle: false } : {}) } : Object.fromEntries(claves.map(k => [k, form[k]]));
    if (payload.detalles) payload.detalles = payload.detalles.map(detalleAnteriorParaEnviar);
    if (!conCobros) { payload.cronograma = cronograma; payload.ajuste_documento = ajusteDocumentoParaEnviar(form).toFixed(2); }
    const firma = JSON.stringify(payload);
    if (!envio.current || envio.current.firma !== firma) envio.current = { firma, id: crearSolicitudId() };
    if (!cuenta) payload.solicitud_id = envio.current.id;

    try {
      const res = await api.post(cuenta ? `ventas/cuentas-por-cobrar/${cuenta.id}/editar-anterior/` : 'ventas/cuentas-por-cobrar/registrar-anterior/', payload);
      notificarCobroRegistrado();
      onSaved(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || (status >= 400 && status < 500)) {
        const { alertas: alertasResp, mapaCampos } = extraerAlertasBackend(err.response?.data);
        setAlertasValidacion(alertasResp);
        setErroresCampos(prev => ({ ...prev, ...mapaCampos }));
        setError('');
      } else {
        setError('No se pudo guardar la información en el servidor. Revise su conexión y vuelva a intentarlo.');
      }
      setRevision(false);
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => { if (!guardando) onClose(); }} maxWidth="lg" fullWidth>
        <DialogTitle>{cuenta ? 'Corregir crédito anterior' : 'Registrar crédito anterior'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {alertasValidacion.length > 0 && (
              <Alert severity="warning" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                  Por favor complete o revise los siguientes campos:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {alertasValidacion.map((item, idx) => (
                    <Typography component="li" variant="body2" key={idx}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}
            <Alert severity="info">Deuda por servicios y/o repuestos ya entregados. El alta no mueve caja ni inventario. Moneda: soles (PEN).</Alert>
            {conCobros && <Alert severity="warning">Este crédito ya tiene cobros. Solo se pueden corregir el resumen del trabajo y las notas adicionales.</Alert>}
            {conCobros && cuenta.sin_detalle && <>
              <FormControlLabel control={<Checkbox checked={!form.sin_detalle} onChange={e => { cambiar('sin_detalle', !e.target.checked); cambiar('detalles', e.target.checked ? [lineaVacia()] : []); }} />} label="Completar el desglose original sin cambiar importes ni cuotas" />
              {!form.sin_detalle && <>
                {form.detalles.map((d, i) => <CreditoAnteriorLinea key={d._filaId} linea={d} servicios={servicios} cargandoServicios={cargandoServicios} errorServicios={errorServicios}
                  onChange={linea => cambiar('detalles', form.detalles.map((v, j) => j === i ? linea : v))} onRemove={() => cambiar('detalles', form.detalles.filter((_, j) => i !== j))} />)}
                <Button onClick={() => cambiar('detalles', [...form.detalles, lineaVacia()])}>Agregar línea</Button>
                <Typography>Total del documento: S/ {detalleTotal.toFixed(2)} · Debe coincidir con el total original de la deuda: S/ {form.importe_original}</Typography>
              </>}
            </>}
            {!conCobros && !revision && <>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={clientes}
                  value={cliente}
                  filterOptions={x => x}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  getOptionLabel={c => `${c.dni || ''} · ${c.nombres || ''} ${c.apellidos || ''}`}
                  onInputChange={(_, v) => setBusqueda(v)}
                  onChange={(_, v) => {
                    setCliente(v);
                    setVehiculos([]);
                    cambiar('cliente', v?.id || null);
                    cambiar('vehiculo', null);
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Cliente (DNI/RUC o nombre)"
                      required
                      error={Boolean(erroresCampos.cliente)}
                      helperText={erroresCampos.cliente}
                    />
                  )}
                />
                <Tooltip title="Registrar nuevo cliente">
                  <IconButton onClick={() => setModalCliente(true)} sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'error.dark' }, flexShrink: 0, mt: 0.5 }}><Plus size={20} /></IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={form.sin_vehiculo} onChange={e => { cambiar('sin_vehiculo', e.target.checked); cambiar('vehiculo', null); }} slotProps={{ input: { 'aria-label': 'Repuestos vendidos sin vehículo asociado' } }} sx={{ p: 0, width: 18, height: 18, flexShrink: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} />
                <Typography component="span" variant="body2">Repuestos vendidos sin vehículo asociado</Typography>
              </Box>
              {!form.sin_vehiculo && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={vehiculos}
                    value={vehiculos.find(v => v.id === form.vehiculo) || null}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    getOptionLabel={v => v ? `${v.placa} · ${v.marca} ${v.modelo}` : ''}
                    onChange={(_, v) => cambiar('vehiculo', v ? v.id : null)}
                    noOptionsText={cliente ? "El cliente no tiene vehículos asociados" : "Primero seleccione un cliente"}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Placa del cliente"
                        required
                        error={Boolean(erroresCampos.vehiculo)}
                        helperText={erroresCampos.vehiculo}
                      />
                    )}
                  />
                  <Tooltip title="Registrar nuevo vehículo">
                    <IconButton onClick={() => setModalVehiculo(true)} sx={{ bgcolor: 'error.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'error.dark' }, flexShrink: 0, mt: 0.5 }}><Plus size={20} /></IconButton>
                  </Tooltip>
                </Box>
              )}
              <Typography variant="caption">Sucursal del registro: {form.sucursal}. Si falta un cliente o placa, regístrelo y vincúlelo desde Clientes/Vehículos.</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {campo('sistema_origen', 'Dónde estaba registrada la deuda', 'text', { required: true, helperText: 'Ej.: Omega, Excel o cuaderno de créditos.' })}{campo('tipo_documento_origen', 'Tipo de documento (opcional)', 'text', { helperText: 'Ej.: factura, boleta o nota de venta.' })}{campo('documento_origen', 'Número de documento o referencia', 'text', { required: true, helperText: 'Ej.: F001-000123. Si no tiene número, asigne una referencia única.' })}
                {campo('fecha_original', 'Fecha del documento o trabajo', 'date')}{campo('fecha_corte', 'Pagos revisados hasta', 'date', { helperText: 'Incluya los abonos del cliente realizados hasta esta fecha.' })}
                {campo('importe_original', 'Total original de la deuda (S/)', 'number', { helperText: 'Total del documento después de descuentos y antes de los abonos.' })}{campo('abonos_anteriores', 'Total abonado hasta esa fecha (S/)', 'number', { helperText: 'Pagos anteriores del cliente. Si no pagó nada, deje 0.' })}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={form.sin_detalle} onChange={e => { cambiar('sin_detalle', e.target.checked); cambiar('detalles', e.target.checked ? [] : [lineaVacia()]); }} slotProps={{ input: { 'aria-label': 'No tengo el detalle de servicios y repuestos' } }} sx={{ p: 0, width: 18, height: 18, flexShrink: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} />
                <Typography component="span" variant="body2">No tengo el detalle de servicios y repuestos (explique el origen del saldo en las notas)</Typography>
              </Box>

              {!form.sin_detalle && <>
                <Typography fontWeight={700}>Servicios y repuestos del documento original</Typography>
                {form.detalles.map((d, i) => <CreditoAnteriorLinea key={d._filaId} linea={d} servicios={servicios} cargandoServicios={cargandoServicios} errorServicios={errorServicios}
                  onChange={linea => cambiar('detalles', form.detalles.map((v, j) => j === i ? linea : v))} onRemove={() => cambiar('detalles', form.detalles.filter((_, j) => i !== j))} />)}
                <Button onClick={() => cambiar('detalles', [...form.detalles, lineaVacia()])}>Agregar servicio o repuesto</Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {campo('descuento_global', 'Descuento global (S/)', 'number', { slotProps: { htmlInput: { min: 0, step: 0.01 } }, helperText: 'Descuento sobre el total. Escriba 10 para descontar S/ 10; si no hay, deje 0.' })}
                  {Number(cuenta?.ajuste_documento) > 0 && campo('cargo_adicional', 'Cargo adicional del documento (S/)', 'number', { slotProps: { htmlInput: { min: 0, step: 0.01 } }, helperText: 'Cargo guardado en este documento anterior.' })}
                  {campo('motivo_ajuste', Number(cuenta?.ajuste_documento) > 0 ? 'Motivo del cargo o descuento' : 'Motivo del descuento global', 'text', { helperText: 'Complete si aplicó un descuento. Ej.: descuento acordado con el cliente.' })}
                </Stack>
                <Typography>Total del documento después del descuento global: S/ {detalleTotal.toFixed(2)}. Use los precios finales del documento anterior.</Typography>
              </>}
              <Typography fontWeight={700}>Cuotas pendientes · saldo a incorporar: S/ {saldo.toFixed(2)}</Typography>
              {form.importe_original !== '' && erroresImportes.length > 0 && <Alert severity="warning">{erroresImportes.map((mensaje, i) => <Typography key={i} variant="body2">{mensaje}</Typography>)}</Alert>}
              {cronograma.map((c, i) => <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField size="small" type="date" label={`Vencimiento cuota ${i + 1}`} slotProps={{ inputLabel: { shrink: true } }} value={c.fecha_vencimiento} onChange={e => cambiar('cronograma', cronograma.map((v, j) => j === i ? { ...v, fecha_vencimiento: e.target.value } : v))} />
                <TextField size="small" type="number" label="Saldo de cuota (S/)" value={c.monto} slotProps={{ input: { readOnly: cronograma.length === 1 }, htmlInput: { min: 0.01, max: saldo, step: 0.01 } }} helperText={cronograma.length === 1 ? 'Cuota única: se calcula automáticamente con el saldo pendiente.' : 'Distribuya el saldo entre las cuotas.'} error={cronograma.length > 1 && (Number(c.monto) > saldo || totalCuotas > saldo)} onChange={e => { if (cronograma.length > 1) cambiar('cronograma', cronograma.map((v, j) => j === i ? { ...v, monto: e.target.value } : v)); }} />
                <Button disabled={form.cronograma.length === 1} onClick={() => cambiar('cronograma', form.cronograma.filter((_, j) => j !== i))}>Quitar cuota</Button>
              </Stack>)}
              {cronograma.length > 1 && <Typography>Total de cuotas: S/ {totalCuotas.toFixed(2)} · Saldo pendiente: S/ {saldo.toFixed(2)}</Typography>}
              <Button onClick={() => cambiar('cronograma', [...cronograma, { monto: '', fecha_vencimiento: '' }])}>Agregar cuota</Button>
            </>}
            {!revision && <>
              {campo('concepto', 'Resumen del trabajo o venta', 'text', { multiline: true, required: true, helperText: 'Una frase que identifique la deuda. Ej.: cambio de aceite, filtros y mano de obra.' })}
              {campo('observaciones', form.sin_detalle ? 'Notas y origen del saldo (obligatorio sin detalle)' : 'Notas adicionales (opcional)', 'text', { multiline: true, required: form.sin_detalle, helperText: form.sin_detalle ? 'Explique de dónde sale el saldo. Ej.: saldo confirmado en el cuaderno de créditos, página 15.' : 'Aclaraciones útiles para cobrar o verificar la deuda. Si no hay, deje vacío.' })}
              {cuenta && campo('motivo', 'Motivo de la corrección', 'text', { required: true })}
            </>}
            {revision && <Box><Typography variant="h6">Revisar antes de guardar</Typography><Typography>{cliente?.nombres} {cliente?.apellidos} · {form.documento_origen} · {form.placa_original || vehiculos.find(v => v.id === form.vehiculo)?.placa || 'Sin vehículo'}</Typography><Typography>{form.concepto}</Typography><Typography>Original: S/ {Number(form.importe_original).toFixed(2)} · Abonos previos: S/ {Number(form.abonos_anteriores).toFixed(2)} · Saldo incorporado: S/ {saldo.toFixed(2)}</Typography><Typography>{form.sin_detalle ? 'Sin detalle desglosado' : `${form.detalles.length} líneas de servicios/repuestos`} · {cronograma.length} cuota(s) pendiente(s).</Typography><Typography>Fecha original: {form.fecha_original} · Corte: {form.fecha_corte}</Typography>{cronograma.map((c, i) => <Typography key={i}>Cuota {i + 1}: {c.fecha_vencimiento} · S/ {c.monto}</Typography>)}</Box>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={guardando} onClick={onClose}>Cancelar</Button>
          {revision && <Button disabled={guardando} onClick={() => setRevision(false)}>Volver</Button>}
          <Button variant="contained" disabled={guardando} onClick={() => revision || conCobros ? enviar() : revisar()}>{guardando ? 'Guardando…' : revision || conCobros ? 'Guardar crédito' : 'Revisar registro'}</Button>
        </DialogActions>
      </Dialog>

      {modalCliente && (
        <ClientesForm open={modalCliente} onClose={() => setModalCliente(false)} onSuccess={(c) => {
          if (!c?.id) return;
          setClientes(prev => prev.some(x => x.id === c.id) ? prev : [c, ...prev]);
          setCliente(c);
          setVehiculos([]);
          setForm(f => ({ ...f, cliente: c.id, vehiculo: null }));
          setModalCliente(false);
        }} />
      )}

      {modalVehiculo && (
        <VehiculosForm open={modalVehiculo} onClose={() => setModalVehiculo(false)} onSuccess={async (v) => {
          if (!v?.id) return;
          if (cliente?.id) {
            try {
              await vehiculoService.vincularCliente(v.id, cliente.id);
            } catch (err) {
              console.error('Error al vincular vehiculo al cliente:', err);
            }
          }
          setVehiculos(prev => prev.some(x => x.id === v.id) ? prev : [v, ...prev]);
          setForm(f => ({ ...f, vehiculo: v.id }));
          setModalVehiculo(false);
        }} />
      )}
    </>
  );
}
