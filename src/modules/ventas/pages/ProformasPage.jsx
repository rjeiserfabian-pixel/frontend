import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, Grid, IconButton,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle2, FileText, Pencil, Plus, Printer, RefreshCw, Search, Send,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { ventasService } from '../services/ventasApi';
import { inventarioService } from '../../inventario/services/inventarioService';
import { clienteService } from '../../clientes/services/clienteService';
import ClientesForm from '../../clientes/components/ClientesForm';
import { premiumTokens } from '../../../core/theme/theme';
import api from '../../../core/api/axios';

const C = premiumTokens.colors;

const hoyISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const nuevaLinea = () => ({
  tempId: `${Date.now()}-${Math.random()}`,
  tipo: 'REPUESTO',
  repuesto: null,
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  descuento: 0,
});

const formInicial = () => ({
  cliente: null,
  forma_pago: 'CONTADO',
  observaciones: '',
  incluye_igv: true,
  descuento_global: 0,
  valido_hasta: hoyISO(),
  moneda: 'PEN',
  tipo_cambio: 1,
  detalles: [nuevaLinea()],
});

const toArray = (data) => Array.isArray(data) ? data : (data?.results || []);
const money = (value, simbolo = 'S/') => `${simbolo} ${(parseFloat(value || 0)).toFixed(2)}`;

// IGV estimado en el frontend (solo para mostrar al usuario; el valor real lo calcula el backend)
const IGV_TASA = 0.18;

const ProformasPage = () => {
  const navigate = useNavigate();
  const activeSucursalId = parseInt(localStorage.getItem('sucursal_id') || 1, 10);

  const [proformas, setProformas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [cargandoTC, setCargandoTC] = useState(false);
  // Ref para no repetir la petición al SUNAT si ya obtuvimos el TC en esta sesión
  const tcObtenidoRef = useRef(false);

  const bruto = useMemo(() => (
    form.detalles.reduce((sum, item) => {
      const cantidad = parseFloat(item.cantidad || 0);
      const precio = parseFloat(item.precio_unitario || 0);
      return sum + (cantidad * precio);
    }, 0)
  ), [form.detalles]);

  const descuentoItems = useMemo(() => (
    form.detalles.reduce((sum, item) => sum + (parseFloat(item.descuento || 0)), 0)
  ), [form.detalles]);

  const total = Math.max(0, bruto - descuentoItems - (parseFloat(form.descuento_global || 0)));

  const cargarProformas = async () => {
    setLoading(true);
    try {
      const data = await ventasService.getProformas({
        sucursal: activeSucursalId,
        search,
        page_size: 50,
      });
      setProformas(toArray(data));
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar las proformas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async (query = '') => {
    const data = await clienteService.listar(1, query);
    setClientes(toArray(data));
  };

  const cargarRepuestos = async (query = '') => {
    const data = await inventarioService.getRepuestos({ search: query, page_size: 20 });
    setRepuestos(toArray(data));
  };

  useEffect(() => {
    cargarProformas();
    cargarClientes();
    cargarRepuestos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-carga del tipo de cambio SUNAT cuando se selecciona USD o EUR
  useEffect(() => {
    const fetchTC = async () => {
      if (form.moneda !== 'PEN') {
        // El TC SUNAT no cambia en el día; si ya lo obtuvimos, no repetimos la petición
        if (tcObtenidoRef.current) return;
        setCargandoTC(true);
        try {
          const res = await api.get('/ventas/tipo-cambio/');
          if (res.data && res.data.venta) {
            setForm(prev => ({ ...prev, tipo_cambio: parseFloat(res.data.venta) }));
            tcObtenidoRef.current = true;
          }
        } catch (error) {
          console.error('Error al obtener TC SUNAT:', error);
        } finally {
          setCargandoTC(false);
        }
      } else {
        setForm(prev => ({ ...prev, tipo_cambio: 1 }));
      }
    };
    fetchTC();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.moneda]);

  const cerrarFormulario = () => {
    setOpenForm(false);
    setEditingId(null);
    setForm(formInicial());
    // Resetear el ref para que en la próxima apertura del diálogo vuelva a consultar si es necesario
    tcObtenidoRef.current = false;
  };

  const abrirNueva = () => {
    setEditingId(null);
    setForm(formInicial());
    setOpenForm(true);
  };

  const actualizarLinea = (tempId, patch) => {
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.map(item => item.tempId === tempId ? { ...item, ...patch } : item),
    }));
  };

  const agregarLinea = () => {
    setForm(prev => ({ ...prev, detalles: [...prev.detalles, nuevaLinea()] }));
  };

  const eliminarLinea = (tempId) => {
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.length === 1 ? [nuevaLinea()] : prev.detalles.filter(item => item.tempId !== tempId),
    }));
  };

  const stockTotal = (repuesto) => {
    if (!repuesto) return 0;
    return parseFloat(repuesto.stock_total_disponible || 0);
  };

  const validar = () => {
    if (!form.cliente?.id) return 'Debe seleccionar un cliente.';
    if (!form.detalles.length) return 'Debe agregar al menos un item.';
    for (const item of form.detalles) {
      if (item.tipo === 'REPUESTO' && !item.repuesto?.id) return 'Cada producto debe tener un repuesto seleccionado.';
      if (item.tipo === 'SERVICIO' && !item.descripcion.trim()) return 'Cada servicio debe tener una descripcion.';
      if (parseFloat(item.cantidad || 0) <= 0) return 'La cantidad debe ser mayor a cero.';
      if (parseFloat(item.precio_unitario || 0) < 0) return 'El precio no puede ser negativo.';
      if (parseFloat(item.descuento || 0) < 0) return 'El descuento no puede ser negativo.';
      if (parseFloat(item.descuento || 0) > parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)) {
        return 'El descuento no puede superar el total del item.';
      }
    }
    return null;
  };

  const guardar = async () => {
    const error = validar();
    if (error) {
      Swal.fire('Atencion', error, 'warning');
      return;
    }

    const payload = {
      cliente: form.cliente.id,
      sucursal: activeSucursalId,
      forma_pago: form.forma_pago,
      observaciones: form.observaciones,
      incluye_igv: form.incluye_igv,
      descuento_global: parseFloat(form.descuento_global || 0),
      valido_hasta: form.valido_hasta || null,
      moneda: form.moneda,
      tipo_cambio: parseFloat(form.tipo_cambio || 1),
      detalles: form.detalles.map(item => ({
        tipo: item.tipo,
        repuesto: item.tipo === 'REPUESTO' ? item.repuesto.id : null,
        descripcion: item.tipo === 'REPUESTO' ? (item.repuesto?.nombre || item.descripcion) : item.descripcion,
        cantidad: parseFloat(item.cantidad || 0),
        precio_unitario: parseFloat(item.precio_unitario || 0),
        descuento: parseFloat(item.descuento || 0),
      })),
    };

    try {
      setSaving(true);
      if (editingId) await ventasService.actualizarProforma(editingId, payload);
      else await ventasService.crearProforma(payload);
      Swal.fire({ icon: 'success', title: editingId ? 'Proforma actualizada' : 'Proforma creada', toast: true, position: 'top-end', showConfirmButton: false, timer: 1800 });
      cerrarFormulario();
      cargarProformas();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo guardar la proforma.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const editar = (proforma) => {
    setEditingId(proforma.id);
    setForm({
      cliente: {
        id: proforma.cliente,
        nombres: proforma.cliente_nombre,
        apellidos: proforma.cliente_apellidos,
        dni: proforma.cliente_dni,
      },
      forma_pago: proforma.forma_pago,
      observaciones: proforma.observaciones || '',
      incluye_igv: proforma.incluye_igv,
      descuento_global: proforma.descuento_global || 0,
      valido_hasta: proforma.valido_hasta || hoyISO(),
      moneda: proforma.moneda || 'PEN',
      tipo_cambio: proforma.tipo_cambio || 1,
      detalles: (proforma.detalles || []).map(d => ({
        tempId: `${d.id}-${Date.now()}`,
        tipo: d.tipo,
        repuesto: d.repuesto ? {
          id: d.repuesto,
          codigo: d.repuesto_codigo,
          nombre: d.repuesto_nombre,
          stock_total_disponible: 0,
        } : null,
        descripcion: d.descripcion || '',
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        descuento: d.descuento,
      })),
    });
    setOpenForm(true);
  };

  const imprimir = async (id) => {
    try {
      const blob = await ventasService.descargarProformaPdf(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
    }
  };

  const convertir = async (proforma) => {
    const result = await Swal.fire({
      title: 'Convertir a POS',
      text: `Se creara una pre-venta para ${proforma.numero}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Convertir',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      const venta = await ventasService.convertirProformaAPos(proforma.id);
      Swal.fire('Convertida', `Ticket POS: ${venta.ticket_kiosko || venta.id}`, 'success').then(() => {
        navigate('/ventas/pos');
      });
      cargarProformas();
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo convertir la proforma.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const estadoColor = (estado) => {
    if (estado === 'CONVERTIDA') return 'success';
    if (estado === 'ANULADA' || estado === 'VENCIDA') return 'error';
    if (estado === 'BORRADOR') return 'default';
    return 'primary';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={26} /> Ventas / Proformas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<RefreshCw size={18} />} onClick={cargarProformas}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={abrirNueva}>
            Nueva proforma
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, border: `1px solid ${C.border}` }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por numero o cliente"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cargarProformas()}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> }}
            sx={{ minWidth: { xs: '100%', sm: 360 }, flex: 1 }}
          />
          <Button variant="contained" onClick={cargarProformas}>Buscar</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}` }}>
        <Table>
          <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
            <TableRow>
              <TableCell><b>Numero</b></TableCell>
              <TableCell><b>Cliente</b></TableCell>
              <TableCell><b>Forma de pago</b></TableCell>
              <TableCell><b>Valido hasta</b></TableCell>
              <TableCell align="right"><b>Total</b></TableCell>
              <TableCell><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : proformas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No hay proformas registradas.</TableCell>
              </TableRow>
            ) : proformas.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Typography fontWeight="bold">{p.numero}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.creado_en ? new Date(p.creado_en).toLocaleDateString('es-PE') : ''}
                  </Typography>
                </TableCell>
                <TableCell>{`${p.cliente_nombre || ''} ${p.cliente_apellidos || ''}`.trim()}</TableCell>
                <TableCell>{p.forma_pago}</TableCell>
                <TableCell>{p.valido_hasta ? new Date(`${p.valido_hasta}T00:00:00`).toLocaleDateString('es-PE') : '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{money(p.total)}</TableCell>
                <TableCell><Chip size="small" color={estadoColor(p.estado)} label={p.estado} /></TableCell>
                <TableCell align="center">
                  <IconButton title="Editar" onClick={() => editar(p)} disabled={p.estado === 'CONVERTIDA'} size="small" sx={{ mr: 0.75 }}>
                    <Pencil size={18} />
                  </IconButton>
                  <IconButton title="PDF" color="primary" onClick={() => imprimir(p.id)} size="small" sx={{ mr: 0.75 }}>
                    <Printer size={18} />
                  </IconButton>
                  <IconButton title="Convertir a POS" color="success" onClick={() => convertir(p)} disabled={p.estado === 'CONVERTIDA'} size="small">
                    <Send size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={cerrarFormulario} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={22} /> {editingId ? 'Editar proforma' : 'Nueva proforma'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
            Datos del comprobante
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              {/* Cliente con botón de registro rápido */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={clientes}
                    value={form.cliente}
                    onInputChange={(e, val) => cargarClientes(val)}
                    onChange={(e, value) => setForm(prev => ({ ...prev, cliente: value }))}
                    getOptionLabel={(option) => option ? `${option.dni || ''} ${option.nombres || ''} ${option.apellidos || ''}`.trim() : ''}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <TextField {...params} label="Cliente" size="small" />}
                  />
                </Box>
                <Tooltip title="Registrar nuevo cliente">
                  <Button
                    variant="contained"
                    onClick={() => setOpenClientModal(true)}
                    sx={{
                      minWidth: 40, px: 0, height: 40,
                      borderRadius: '8px',
                      bgcolor: alpha('#e11d48', 0.85),
                      '&:hover': { bgcolor: '#e11d48' },
                      boxShadow: 'none',
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={20} />
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Forma de pago</InputLabel>
                <Select value={form.forma_pago} label="Forma de pago" onChange={e => setForm(prev => ({ ...prev, forma_pago: e.target.value }))}>
                  <MenuItem value="CONTADO">Contado</MenuItem>
                  <MenuItem value="CREDITO">Credito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField label="Valido hasta" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={form.valido_hasta} onChange={e => setForm(prev => ({ ...prev, valido_hasta: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={form.moneda}
                  label="Moneda"
                  onChange={e => {
                    const nuevaMoneda = e.target.value;
                    // Resetear ref para forzar nueva consulta si cambia entre monedas extranjeras
                    if (nuevaMoneda !== form.moneda) tcObtenidoRef.current = false;
                    setForm(prev => ({
                      ...prev,
                      moneda: nuevaMoneda,
                      tipo_cambio: nuevaMoneda === 'PEN' ? 1 : prev.tipo_cambio,
                    }));
                  }}
                >
                  <MenuItem value="PEN">Soles (S/)</MenuItem>
                  <MenuItem value="USD">Dólares ($)</MenuItem>
                  <MenuItem value="EUR">Euros (€)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="T. Cambio"
                type="number"
                size="small"
                fullWidth
                disabled={form.moneda === 'PEN'}
                value={form.tipo_cambio}
                onChange={e => setForm(prev => ({ ...prev, tipo_cambio: e.target.value }))}
                inputProps={{ step: '0.0001', min: '0' }}
                InputProps={{
                  endAdornment: cargandoTC ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : null,
                }}
                helperText={form.moneda === 'PEN' ? 'No aplica' : 'Obtenido de SUNAT'}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField label="Observaciones" size="small" fullWidth multiline minRows={2} value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField label="Descuento global" type="number" size="small" fullWidth value={form.descuento_global} onChange={e => setForm(prev => ({ ...prev, descuento_global: e.target.value }))} />
            </Grid>
            {/* SWITCH IGV */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: 1.5, borderRadius: 1,
                border: `1px solid ${form.incluye_igv ? '#22c55e44' : '#64748b44'}`,
                bgcolor: form.incluye_igv ? 'rgba(34,197,94,0.06)' : 'rgba(100,116,139,0.06)',
                transition: 'all 0.2s',
              }}>
                <Tooltip title={form.incluye_igv
                  ? 'Los precios ingresados YA incluyen IGV (18%). El sistema desglosa el impuesto en el PDF.'
                  : 'Los precios ingresados NO incluyen IGV. El total final es el precio tal como se ingresa, sin agregar impuesto.'
                }>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.incluye_igv}
                        onChange={e => setForm(prev => ({ ...prev, incluye_igv: e.target.checked }))}
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: form.incluye_igv ? 'success.main' : 'text.secondary' }}>
                          {form.incluye_igv ? '✅ Precios incluyen IGV (18%)' : '❌ Precios sin IGV'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {form.incluye_igv
                            ? 'El IGV se desglosará automáticamente en el PDF'
                            : 'No se cobrará IGV. El total es el precio ingresado'}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Items</Typography>
            <Button startIcon={<Plus size={18} />} variant="outlined" onClick={agregarLinea}>Agregar item</Button>
          </Box>

          <TableContainer sx={{ mt: 1, border: `1px solid ${C.border}`, borderRadius: 1, maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Producto / Servicio</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">P. Unit.</TableCell>
                  <TableCell align="right">Desc.</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.detalles.map((item) => {
                  const lineaTotal = Math.max(0, (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)) - parseFloat(item.descuento || 0));
                  return (
                    <TableRow key={item.tempId}>
                      <TableCell sx={{ width: 130 }}>
                        <Select size="small" fullWidth value={item.tipo} onChange={e => actualizarLinea(item.tempId, { tipo: e.target.value, repuesto: null, descripcion: '', precio_unitario: 0 })}>
                          <MenuItem value="REPUESTO">Producto</MenuItem>
                          <MenuItem value="SERVICIO">Servicio</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 300 }}>
                        {item.tipo === 'REPUESTO' ? (
                          <Autocomplete
                            options={repuestos}
                            value={item.repuesto}
                            onOpen={() => cargarRepuestos()}
                            onInputChange={(e, val) => cargarRepuestos(val)}
                            onChange={(e, value) => actualizarLinea(item.tempId, {
                              repuesto: value,
                              descripcion: value?.nombre || '',
                              precio_unitario: parseFloat(value?.precio_lista || value?.precio_cash || 0),
                            })}
                            getOptionLabel={(option) => option ? `${option.codigo || ''} ${option.codigo_barra || ''} - ${option.nombre || ''}`.trim() : ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography variant="body2">{option.codigo} - {option.nombre}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Barras: {option.codigo_barra || '-'} | Stock: {stockTotal(option)}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => <TextField {...params} placeholder="Buscar por codigo, barras o nombre..." size="small" />}
                          />
                        ) : (
                          <TextField size="small" fullWidth placeholder="Descripcion del servicio" value={item.descripcion} onChange={e => actualizarLinea(item.tempId, { descripcion: e.target.value })} />
                        )}
                      </TableCell>
                      <TableCell align="right">{item.tipo === 'REPUESTO' ? stockTotal(item.repuesto) : '-'}</TableCell>
                      <TableCell align="right" sx={{ width: 95 }}>
                        <TextField size="small" type="number" value={item.cantidad} onChange={e => actualizarLinea(item.tempId, { cantidad: e.target.value })} inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        <TextField size="small" type="number" value={item.precio_unitario} onChange={e => actualizarLinea(item.tempId, { precio_unitario: e.target.value })} inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 105 }}>
                        <TextField size="small" type="number" value={item.descuento} onChange={e => actualizarLinea(item.tempId, { descuento: e.target.value })} inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>{money(lineaTotal)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" onClick={() => eliminarLinea(item.tempId)}><Trash2 size={18} /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ minWidth: 300, p: 2, border: `1px solid ${C.border}`, borderRadius: 1, bgcolor: alpha(C.blue, 0.05) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal items</Typography>
                <Typography variant="body2">{money(bruto)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Descuentos</Typography>
                <Typography variant="body2">{money(descuentoItems + parseFloat(form.descuento_global || 0))}</Typography>
              </Box>
              {form.incluye_igv && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    IGV incluido (18%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ≈ {money(total - total / (1 + IGV_TASA))}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight="bold">Total</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">{money(total)}</Typography>
              </Box>
              {form.incluye_igv && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                  El IGV está incluido en el precio
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarFormulario} color="inherit">Cancelar</Button>
          <Button variant="contained" startIcon={saving ? <CircularProgress color="inherit" size={18} /> : <CheckCircle2 size={18} />} onClick={guardar} disabled={saving}>
            {editingId ? 'Actualizar proforma' : 'Grabar proforma'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de registro rápido de cliente */}
      {openClientModal && (
        <ClientesForm
          open={openClientModal}
          onClose={() => setOpenClientModal(false)}
          onSuccess={(createdClient) => {
            if (!createdClient?.id) return;
            setClientes(prev => prev.some(c => c.id === createdClient.id) ? prev : [createdClient, ...prev]);
            setForm(prev => ({ ...prev, cliente: createdClient }));
            setOpenClientModal(false);
          }}
        />
      )}
    </Box>
  );
};

export default ProformasPage;
