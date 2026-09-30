import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, Checkbox, IconButton, MenuItem, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import facturacionApi from '../facturacionApi';

const MOTIVOS_CREDITO = [
  { value: '01', label: 'Anulacion de la operacion' },
  { value: '02', label: 'Anulacion por error en el RUC' },
  { value: '03', label: 'Correccion en la descripcion' },
  { value: '04', label: 'Descuento global' },
  { value: '05', label: 'Descuento por item' },
  { value: '06', label: 'Devolucion total' },
  { value: '07', label: 'Devolucion por item' },
  { value: '08', label: 'Bonificacion' },
  { value: '09', label: 'Disminucion en el valor' },
  { value: '10', label: 'Otros conceptos' },
];

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

const clienteLabel = (cliente) => {
  if (!cliente) return '';
  return `${cliente.dni || ''} - ${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
};

export default function ModalNuevaNotaCredito({ onClose, onCreated }) {
  const [filtros, setFiltros] = useState({ venta_id: '', serie_numero: '', cliente: '', fecha_desde: '', fecha_hasta: '' });
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [originales, setOriginales] = useState([]);
  const [original, setOriginal] = useState(null);
  const [items, setItems] = useState([]);
  const [ventaInfo, setVentaInfo] = useState(null);
  const [motivoCodigo, setMotivoCodigo] = useState('06');
  const [tipoComprobanteId, setTipoComprobanteId] = useState('');
  const [tiposNota, setTiposNota] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [sesionesCaja, setSesionesCaja] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [impacto, setImpacto] = useState({
    reingresar_stock: false,
    registrar_devolucion_caja: false,
    sesion_caja_id: '',
    metodo_pago_id: '',
    referencia_caja: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/ventas/tipos-comprobante/', { params: { estado: true } })
      .then((res) => {
        const tipos = toArray(res.data).filter((tipo) => tipo.codigo_sunat === '07');
        setTiposNota(tipos);
        setTipoComprobanteId(tipos[0]?.id || '');
      })
      .catch(() => setTiposNota([]));
  }, []);

  useEffect(() => {
    api.get('/ventas/metodos-pago/', { params: { estado: true } })
      .then((res) => setMetodosPago(toArray(res.data)))
      .catch(() => setMetodosPago([]));
    api.get('/ventas/sesiones/')
      .then((res) => setSesionesCaja(toArray(res.data).filter((sesion) => sesion.estado === 'ABIERTA')))
      .catch(() => setSesionesCaja([]));
  }, []);

  useEffect(() => {
    const query = clienteBusqueda.trim();
    if (query.length > 0 && query.length < 2) return undefined;

    const timer = setTimeout(() => {
      setBuscandoClientes(true);
      api.get('/clientes/', { params: { search: query, page_size: 10 } })
        .then((res) => setClientes(toArray(res.data)))
        .catch(() => setClientes([]))
        .finally(() => setBuscandoClientes(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [clienteBusqueda]);

  const totalBase = useMemo(
    () => items.reduce((acc, item) => acc + (Number(item.cantidad) || 0) * (Number(item.precio_base) || 0), 0),
    [items],
  );

  const buscarOriginales = async () => {
    setError('');
    setBuscando(true);
    try {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value));
      const { data } = await facturacionApi.buscarOriginalesNotaCredito({ ...params, page_size: 10 });
      setOriginales(toArray(data));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron buscar comprobantes aceptados.');
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarOriginal = async (comprobante) => {
    setError('');
    setOriginal(comprobante);
    try {
      const { data } = await facturacionApi.itemsNotaCredito(comprobante.id);
      const [{ data: almacenesData }, { data: ubicacionesData }] = await Promise.all([
        api.get('/inventario/almacenes/', { params: { sucursal: comprobante.sucursal } }),
        api.get('/inventario/ubicaciones/', { params: { sucursal: comprobante.sucursal } }),
      ]);
      const almacenesLista = toArray(almacenesData);
      const ubicacionesLista = toArray(ubicacionesData);
      setAlmacenes(almacenesLista);
      setUbicaciones(ubicacionesLista);
      setVentaInfo(data.venta || null);
      setImpacto((prev) => ({
        ...prev,
        reingresar_stock: ['01', '06', '07'].includes(motivoCodigo),
        registrar_devolucion_caja: false,
        sesion_caja_id: prev.sesion_caja_id || sesionesCaja[0]?.id || '',
        metodo_pago_id: prev.metodo_pago_id || metodosPago[0]?.id || '',
        referencia_caja: `NC ${comprobante.serie}-${comprobante.numero}`,
      }));
      setItems((data.items || []).map((item) => {
        const ubicacionSugerida = ubicacionesLista.find((ubicacion) => ubicacion.almacen === item.almacen_origen_id);
        return {
          ...item,
          cantidad: item.cantidad || item.cantidad_vendida,
          ubicacion_destino_id: ubicacionSugerida?.id || '',
        };
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudieron cargar los items de la venta.');
      setItems([]);
    }
  };

  const actualizarItem = (idx, campo, valor) => {
    setItems((prev) => prev.map((item, index) => (index === idx ? { ...item, [campo]: valor } : item)));
  };

  const crearNota = async () => {
    setError('');
    if (!original) {
      setError('Seleccione un comprobante original.');
      return;
    }
    if (!tipoComprobanteId) {
      setError('Configure un tipo de comprobante SUNAT 07 para nota de credito.');
      return;
    }

    const itemsSeleccionados = items
      .filter((item) => Number(item.cantidad) > 0)
      .map((item) => ({
        detalle_venta_id: item.detalle_venta_id,
        codigo_producto: item.codigo_producto,
        descripcion: item.descripcion,
        codigo_sunat: item.codigo_sunat,
        codigo_unidad: item.codigo_unidad,
        cantidad: item.cantidad,
        precio_base: item.precio_base,
        tipo_igv_codigo: item.tipo_igv_codigo,
        es_repuesto: item.es_repuesto,
        ubicacion_destino_id: item.ubicacion_destino_id,
      }));
    const lineasStock = itemsSeleccionados
      .map((item) => ({
        detalle_venta_id: item.detalle_venta_id,
        cantidad: item.cantidad,
        ubicacion_destino_id: item.ubicacion_destino_id || '',
        es_repuesto: Boolean(item.es_repuesto),
      }))
      .filter((item) => item.es_repuesto);

    if (itemsSeleccionados.length === 0) {
      setError('Indique al menos un item con cantidad mayor a cero.');
      return;
    }
    if (items.some((item) => Number(item.cantidad) > Number(item.cantidad_vendida))) {
      setError('La cantidad de la nota no puede superar la cantidad vendida.');
      return;
    }
    if (itemsSeleccionados.some((item) => !item.codigo_sunat || !item.descripcion || !item.precio_base)) {
      setError('Cada item seleccionado debe tener descripcion, codigo SUNAT y precio base.');
      return;
    }
    if (impacto.reingresar_stock && lineasStock.some((linea) => !linea.ubicacion_destino_id)) {
      setError('Seleccione una ubicacion destino para cada repuesto que se reingresara a stock.');
      return;
    }
    if (impacto.registrar_devolucion_caja && (!impacto.sesion_caja_id || !impacto.metodo_pago_id)) {
      setError('Seleccione una sesion de caja abierta y metodo de pago para registrar la devolucion.');
      return;
    }

    setGuardando(true);
    try {
      const { data } = await facturacionApi.generarNotaCredito(original.id, {
        motivo_codigo: motivoCodigo,
        tipo_comprobante_id: tipoComprobanteId,
        items: itemsSeleccionados,
        impacto_interno: {
          ...impacto,
          reducir_cuenta_por_cobrar: Boolean(ventaInfo?.es_credito),
          lineas_stock: impacto.reingresar_stock ? lineasStock : [],
        },
      });
      Swal.fire('Nota creada', `${data.serie}-${data.numero} quedo pendiente de envio.`, 'success');
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo crear la nota de credito.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Nueva nota de credito
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 10 }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">
            La nota se guardara como Pendiente de envio. El envio a SUNAT se realiza despues desde el listado.
          </Alert>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Buscar comprobante aceptado</Typography>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <TextField size="small" label="ID venta" value={filtros.venta_id} onChange={(e) => setFiltros({ ...filtros, venta_id: e.target.value })} sx={{ width: 120 }} />
              <TextField size="small" label="Serie-numero" value={filtros.serie_numero} onChange={(e) => setFiltros({ ...filtros, serie_numero: e.target.value })} sx={{ width: 170 }} />
              <Autocomplete
                size="small"
                options={clientes}
                value={clienteSeleccionado}
                inputValue={clienteBusqueda}
                loading={buscandoClientes}
                getOptionLabel={clienteLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onOpen={() => {
                  if (clientes.length === 0) setClienteBusqueda('');
                }}
                onInputChange={(event, value, reason) => {
                  setClienteBusqueda(value);
                  if (reason === 'input') {
                    setClienteSeleccionado(null);
                    setFiltros({ ...filtros, cliente: value });
                  }
                  if (reason === 'clear') {
                    setClienteSeleccionado(null);
                    setFiltros({ ...filtros, cliente: '' });
                  }
                }}
                onChange={(event, value) => {
                  setClienteSeleccionado(value);
                  setClienteBusqueda(clienteLabel(value));
                  setFiltros({ ...filtros, cliente: value?.dni || '' });
                }}
                renderInput={(params) => {
                  const inputSlotProps = params.slotProps?.input || {};
                  const endAdornment = inputSlotProps.endAdornment || params.InputProps?.endAdornment;
                  return (
                    <TextField
                      {...params}
                      label="Cliente"
                      placeholder="Nombre, DNI o RUC"
                      slotProps={{
                        ...params.slotProps,
                        input: {
                          ...inputSlotProps,
                          endAdornment: (
                            <>
                              {buscandoClientes ? <CircularProgress color="inherit" size={16} /> : null}
                              {endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  );
                }}
                sx={{ minWidth: 280 }}
              />
              <TextField size="small" type="date" label="Desde" slotProps={{ inputLabel: { shrink: true } }} value={filtros.fecha_desde} onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })} />
              <TextField size="small" type="date" label="Hasta" slotProps={{ inputLabel: { shrink: true } }} value={filtros.fecha_hasta} onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })} />
              <Button variant="outlined" startIcon={buscando ? <CircularProgress size={16} /> : <Search size={16} />} onClick={buscarOriginales} disabled={buscando}>
                Buscar
              </Button>
            </Stack>
          </Box>

          {originales.length > 0 && !original && (
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Comprobante</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Venta</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Accion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {originales.map((comp) => (
                    <TableRow key={comp.id} hover>
                      <TableCell>{comp.tipo_documento_display} {comp.serie}-{comp.numero}</TableCell>
                      <TableCell>{comp.cliente_nombre || comp.cliente_documento}</TableCell>
                      <TableCell>{comp.venta || '-'}</TableCell>
                      <TableCell align="right">{comp.moneda} {Number(comp.total).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button size="small" onClick={() => seleccionarOriginal(comp)}>Seleccionar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {original && (
            <>
              <Divider />
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2">Comprobante seleccionado</Typography>
                  <Typography variant="body2">
                    {original.tipo_documento_display} {original.serie}-{original.numero} | {original.cliente_nombre || original.cliente_documento}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => { setOriginal(null); setItems([]); }}>Cambiar</Button>
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField select size="small" label="Motivo SUNAT" value={motivoCodigo} onChange={(e) => setMotivoCodigo(e.target.value)} sx={{ minWidth: 280 }}>
                  {MOTIVOS_CREDITO.map((motivo) => (
                    <MenuItem key={motivo.value} value={motivo.value}>{motivo.value} - {motivo.label}</MenuItem>
                  ))}
                </TextField>
                <TextField select size="small" label="Tipo/serie configurada" value={tipoComprobanteId} onChange={(e) => setTipoComprobanteId(e.target.value)} sx={{ minWidth: 240 }}>
                  {tiposNota.map((tipo) => <MenuItem key={tipo.id} value={tipo.id}>{tipo.nombre}</MenuItem>)}
                </TextField>
              </Stack>

              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Codigo SUNAT</TableCell>
                      <TableCell align="right">Vendida</TableCell>
                      <TableCell align="right">Cant. nota</TableCell>
                      <TableCell>Ubicacion de reingreso</TableCell>
                      <TableCell align="right">Precio base</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.detalle_venta_id || idx}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.descripcion}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.codigo_producto} {item.almacen_origen_nombre ? `| ${item.almacen_origen_nombre}` : ''}</Typography>
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={item.codigo_sunat || ''} onChange={(e) => actualizarItem(idx, 'codigo_sunat', e.target.value)} sx={{ width: 130 }} />
                        </TableCell>
                        <TableCell align="right">{Number(item.cantidad_vendida).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: Number(item.cantidad_vendida), step: '0.01' }}
                            value={item.cantidad}
                            onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)}
                            sx={{ width: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          {item.es_repuesto ? (
                            <TextField
                              select
                              size="small"
                              disabled={!impacto.reingresar_stock || Number(item.cantidad) <= 0}
                              value={item.ubicacion_destino_id || ''}
                              onChange={(e) => actualizarItem(idx, 'ubicacion_destino_id', e.target.value)}
                              sx={{ minWidth: 210 }}
                            >
                              <MenuItem value="">Seleccione ubicacion</MenuItem>
                              {ubicaciones.map((ubicacion) => {
                                const almacen = almacenes.find((itemAlmacen) => itemAlmacen.id === ubicacion.almacen);
                                return (
                                  <MenuItem key={ubicacion.id} value={ubicacion.id}>
                                    {almacen?.nombre || ubicacion.almacen_nombre} / {ubicacion.codigo}
                                  </MenuItem>
                                );
                              })}
                            </TextField>
                          ) : (
                            <Typography variant="caption" color="text.secondary">Servicio</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{Number(item.precio_base).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Impacto interno al aceptar SUNAT</Typography>
                <Stack spacing={1.5}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={impacto.reingresar_stock}
                        onChange={(e) => setImpacto({ ...impacto, reingresar_stock: e.target.checked })}
                      />
                    )}
                    label="Reingresar repuestos al almacen/ubicacion seleccionada"
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={impacto.registrar_devolucion_caja}
                        onChange={(e) => setImpacto({ ...impacto, registrar_devolucion_caja: e.target.checked })}
                      />
                    )}
                    label="Registrar egreso por devolucion en caja"
                  />
                  {impacto.registrar_devolucion_caja && (
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <TextField
                        select
                        size="small"
                        label="Sesion de caja"
                        value={impacto.sesion_caja_id}
                        onChange={(e) => setImpacto({ ...impacto, sesion_caja_id: e.target.value })}
                        sx={{ minWidth: 240 }}
                      >
                        {sesionesCaja.map((sesion) => (
                          <MenuItem key={sesion.id} value={sesion.id}>
                            {sesion.caja_nombre || `Sesion ${sesion.id}`}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Metodo de pago"
                        value={impacto.metodo_pago_id}
                        onChange={(e) => setImpacto({ ...impacto, metodo_pago_id: e.target.value })}
                        sx={{ minWidth: 200 }}
                      >
                        {metodosPago.map((metodo) => (
                          <MenuItem key={metodo.id} value={metodo.id}>{metodo.nombre}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Referencia"
                        value={impacto.referencia_caja}
                        onChange={(e) => setImpacto({ ...impacto, referencia_caja: e.target.value })}
                        sx={{ minWidth: 220 }}
                      />
                    </Stack>
                  )}
                  {ventaInfo?.es_credito && (
                    <Alert severity="info">
                      Esta venta es al credito. Al aceptarse la nota en SUNAT, se reducira automaticamente la cuenta por cobrar.
                    </Alert>
                  )}
                  <Alert severity="warning">
                    Estos efectos se aplicaran una sola vez, solo cuando la nota sea aceptada por SUNAT.
                  </Alert>
                </Stack>
              </Box>
              <Typography variant="subtitle2" align="right">Total base de la nota: {totalBase.toFixed(2)}</Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={crearNota} disabled={guardando || !original}>
          {guardando ? <CircularProgress size={20} /> : 'Crear nota pendiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
