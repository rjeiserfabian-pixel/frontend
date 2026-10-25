import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, Grid, IconButton,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle2, FileText, Pencil, Plus, Printer, RefreshCw, Search, Send,
  Trash2, Car, Wrench
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { ventasService } from '../services/ventasApi';
import { inventarioService } from '../../inventario/services/inventarioService';
import { clienteService } from '../../clientes/services/clienteService';
import { tallerService } from '../../taller/services/tallerService';
import ClientesForm from '../../clientes/components/ClientesForm';
import VehiculosForm from '../../vehiculos/components/VehiculosForm';
import { premiumTokens } from '../../../core/theme/theme';
import api from '../../../core/api/axios';

const C = premiumTokens.colors;

const hoyISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const obtenerAfectacionDeRepuesto = (repuesto) => {
  if (!repuesto) return { tipo_afectacion: 'EXONERADO', precio_incluye_igv: true };
  const cod = String(repuesto.tipo_igv_codigo || '').trim();
  const nom = (repuesto.tipo_igv_nombre || '').toLowerCase();
  const tasa = parseFloat(repuesto.tipo_igv_tasa ?? (cod === '10' ? 18 : 0));

  // Código SUNAT 10 = Gravado con 18% (solo si explícitamente se configuró como gravado en el catálogo)
  if (cod === '10' || tasa > 0 || nom.includes('gravad')) {
    return { tipo_afectacion: 'GRAVADO_18', precio_incluye_igv: true };
  }
  // Código SUNAT 30 = Inafecto
  if (cod === '30' || nom.includes('inafect')) {
    return { tipo_afectacion: 'INAFECTO', precio_incluye_igv: true };
  }
  // Código SUNAT 20 = Exonerado (Ley N° 27037 de la Amazonía / San Martín)
  // Si en el catálogo no se seleccionó impuesto (en blanco / nulo), por defecto en San Martín es EXONERADO (0% IGV)
  return { tipo_afectacion: 'EXONERADO', precio_incluye_igv: true };
};

const nuevaLinea = (incluyeIgvDefault = true) => ({
  tempId: `${Date.now()}-${Math.random()}`,
  tipo: 'REPUESTO',
  repuesto: null,
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  descuento: 0,
  tipo_afectacion: 'EXONERADO',
  precio_incluye_igv: incluyeIgvDefault,
});

const formInicial = () => ({
  cliente: null,
  vehiculo: null,
  kilometraje: '',
  forma_pago: 'CONTADO',
  observaciones: '',
  incluye_igv: true,
  descuento_global: 0,
  valido_hasta: hoyISO(),
  moneda: 'PEN',
  tipo_cambio: 1,
  detalles: [nuevaLinea(true)],
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
  const [vehiculos, setVehiculos] = useState([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);
  const [vehiculoBusqueda, setVehiculoBusqueda] = useState('');
  const [openVehicleModal, setOpenVehicleModal] = useState(false);
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

  // Plantillas de Servicio de Taller
  const [plantillasPreventivas, setPlantillasPreventivas] = useState([]);
  const [plantillasCorrectivas, setPlantillasCorrectivas] = useState([]);
  const [plantillasDiagnostico, setPlantillasDiagnostico] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  const [openPlantillaModal, setOpenPlantillaModal] = useState(false);
  const [tipoPlantillaModal, setTipoPlantillaModal] = useState('PREVENTIVO');
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [targetTempId, setTargetTempId] = useState(null);

  const resumenCalculado = useMemo(() => {
    let sumaBaseGravada = 0;
    let sumaBaseExonerada = 0;
    let sumaBaseInafecta = 0;
    let sumaIgvLineas = 0;
    let sumaDescuentosItems = 0;
    let totalBruto = 0;

    const detallesCalculados = form.detalles.map(item => {
      const cant = parseFloat(item.cantidad || 0);
      const prec = parseFloat(item.precio_unitario || 0);
      const desc = parseFloat(item.descuento || 0);
      const tipoAf = item.tipo_afectacion || 'GRAVADO_18';
      const incIgv = item.precio_incluye_igv !== false;

      totalBruto += (cant * prec);
      sumaDescuentosItems += desc;

      const importeNetoItem = Math.max(0, (cant * prec) - desc);
      let baseImponible = 0;
      let igvLinea = 0;
      let totalLinea = 0;

      if (tipoAf === 'GRAVADO_18') {
        if (incIgv) {
          baseImponible = +(importeNetoItem / (1 + IGV_TASA)).toFixed(2);
          igvLinea = +(importeNetoItem - baseImponible).toFixed(2);
          totalLinea = importeNetoItem;
        } else {
          baseImponible = +importeNetoItem.toFixed(2);
          igvLinea = +(baseImponible * IGV_TASA).toFixed(2);
          totalLinea = +(baseImponible + igvLinea).toFixed(2);
        }
        sumaBaseGravada += baseImponible;
        sumaIgvLineas += igvLinea;
      } else if (tipoAf === 'EXONERADO') {
        baseImponible = +importeNetoItem.toFixed(2);
        igvLinea = 0;
        totalLinea = baseImponible;
        sumaBaseExonerada += baseImponible;
      } else {
        baseImponible = +importeNetoItem.toFixed(2);
        igvLinea = 0;
        totalLinea = baseImponible;
        sumaBaseInafecta += baseImponible;
      }

      return {
        ...item,
        baseImponible,
        igvLinea,
        totalLinea,
      };
    });

    const sumaBaseTotal = sumaBaseGravada + sumaBaseExonerada + sumaBaseInafecta;
    let descGlobal = Math.max(0, parseFloat(form.descuento_global || 0));
    descGlobal = Math.min(descGlobal, sumaBaseTotal);

    let totalGravado = sumaBaseGravada;
    let totalExonerado = sumaBaseExonerada;
    let totalInafecto = sumaBaseInafecta;

    if (descGlobal > 0 && sumaBaseTotal > 0) {
      const fGrav = sumaBaseGravada / sumaBaseTotal;
      const fExon = sumaBaseExonerada / sumaBaseTotal;
      const dGrav = +(descGlobal * fGrav).toFixed(2);
      const dExon = +(descGlobal * fExon).toFixed(2);
      const dInaf = +(descGlobal - dGrav - dExon).toFixed(2);

      totalGravado = Math.max(0, sumaBaseGravada - dGrav);
      totalExonerado = Math.max(0, sumaBaseExonerada - dExon);
      totalInafecto = Math.max(0, sumaBaseInafecta - dInaf);
    }

    const igvTotal = descGlobal > 0
      ? +(totalGravado * IGV_TASA).toFixed(2)
      : +sumaIgvLineas.toFixed(2);

    const subtotal = +(totalGravado + totalExonerado + totalInafecto).toFixed(2);
    const totalFinal = +(subtotal + igvTotal).toFixed(2);
    const totalDescuentos = +(sumaDescuentosItems + descGlobal).toFixed(2);

    return {
      totalBruto,
      detallesCalculados,
      totalGravado,
      totalExonerado,
      totalInafecto,
      subtotal,
      igvTotal,
      totalDescuentos,
      totalFinal,
    };
  }, [form.detalles, form.descuento_global]);

  const bruto = resumenCalculado.totalBruto;
  const descuentoItems = resumenCalculado.totalDescuentos;
  const total = resumenCalculado.totalFinal;

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

  const fetchVehiculos = async (query = '', clienteId = form.cliente?.id) => {
    if (query.length === 1) return;
    if (!clienteId) {
      setVehiculos([]);
      return;
    }
    try {
      setLoadingVehiculos(true);
      const params = {
        cliente_id: clienteId,
        sin_paginar: true,
      };
      if (query) params.search = query;
      const res = await api.get('vehiculos/', { params });
      const data = res.data.results || res.data;
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando vehículos del cliente:', err);
      setVehiculos([]);
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const cerrarFormulario = () => {
    setOpenForm(false);
    setEditingId(null);
    setForm(formInicial());
    setVehiculos([]);
    setVehiculoBusqueda('');
    // Resetear el ref para que en la próxima apertura del diálogo vuelva a consultar si es necesario
    tcObtenidoRef.current = false;
  };

  const abrirNueva = () => {
    setEditingId(null);
    setForm(formInicial());
    setVehiculos([]);
    setVehiculoBusqueda('');
    setOpenForm(true);
  };

  const actualizarLinea = (tempId, patch) => {
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.map(item => item.tempId === tempId ? { ...item, ...patch } : item),
    }));
  };

  const agregarLinea = () => {
    setForm(prev => ({ ...prev, detalles: [...prev.detalles, nuevaLinea(true)] }));
  };

  const eliminarLinea = (tempId) => {
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.length === 1 ? [nuevaLinea()] : prev.detalles.filter(item => item.tempId !== tempId),
    }));
  };

  const fetchPlantillas = async () => {
    if (plantillasPreventivas.length > 0 || plantillasCorrectivas.length > 0 || plantillasDiagnostico.length > 0) {
      return;
    }
    try {
      setCargandoPlantillas(true);
      const [prevRes, corrRes, diagRes] = await Promise.allSettled([
        tallerService.getPlantillas({ activo: true }),
        tallerService.getPlantillasCorrectivas({ activo: true }),
        tallerService.getPlantillasDiagnostico({ activo: true }),
      ]);
      const prev = prevRes.status === 'fulfilled' ? (prevRes.value?.results || prevRes.value || []) : [];
      const corr = corrRes.status === 'fulfilled' ? (corrRes.value?.results || corrRes.value || []) : [];
      const diag = diagRes.status === 'fulfilled' ? (diagRes.value?.results || diagRes.value || []) : [];
      setPlantillasPreventivas(Array.isArray(prev) ? prev : []);
      setPlantillasCorrectivas(Array.isArray(corr) ? corr : []);
      setPlantillasDiagnostico(Array.isArray(diag) ? diag : []);
    } catch (err) {
      console.error('Error al cargar plantillas de taller en proformas:', err);
    } finally {
      setCargandoPlantillas(false);
    }
  };

  const handleAbrirPlantillaParaFila = (tempId) => {
    setTargetTempId(tempId);
    setPlantillaSeleccionada(null);
    setTipoPlantillaModal('PREVENTIVO');
    fetchPlantillas();
    setOpenPlantillaModal(true);
  };

  const handleAbrirPlantillaNuevoServicio = () => {
    setTargetTempId(null);
    setPlantillaSeleccionada(null);
    setTipoPlantillaModal('PREVENTIVO');
    fetchPlantillas();
    setOpenPlantillaModal(true);
  };

  const handleConfirmarPlantilla = () => {
    if (!plantillaSeleccionada) return;
    const desc = plantillaSeleccionada.nombre + (plantillaSeleccionada.descripcion ? ` - ${plantillaSeleccionada.descripcion}` : '');
    const precio = parseFloat(plantillaSeleccionada.precio_base || 0);
    const incIgv = plantillaSeleccionada.precio_incluye_igv !== false;

    if (targetTempId) {
      actualizarLinea(targetTempId, {
        descripcion: desc,
        precio_unitario: precio,
        tipo_afectacion: 'EXONERADO',
        precio_incluye_igv: incIgv,
      });
    } else {
      const ultima = form.detalles[form.detalles.length - 1];
      if (form.detalles.length === 1 && !ultima.repuesto && !ultima.descripcion && parseFloat(ultima.precio_unitario || 0) === 0) {
        actualizarLinea(ultima.tempId, {
          tipo: 'SERVICIO',
          repuesto: null,
          descripcion: desc,
          precio_unitario: precio,
          tipo_afectacion: 'EXONERADO',
          precio_incluye_igv: incIgv,
        });
      } else {
        setForm(prev => ({
          ...prev,
          detalles: [
            ...prev.detalles,
            {
              tempId: `${Date.now()}-${Math.random()}`,
              tipo: 'SERVICIO',
              repuesto: null,
              descripcion: desc,
              cantidad: 1,
              precio_unitario: precio,
              descuento: 0,
              tipo_afectacion: 'EXONERADO',
              precio_incluye_igv: incIgv,
            }
          ]
        }));
      }
    }
    setOpenPlantillaModal(false);
    setPlantillaSeleccionada(null);
    setTargetTempId(null);
  };

  const plantillasActuales = tipoPlantillaModal === 'PREVENTIVO'
    ? plantillasPreventivas
    : tipoPlantillaModal === 'CORRECTIVO'
      ? plantillasCorrectivas
      : plantillasDiagnostico;

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
      vehiculo: form.vehiculo?.id || null,
      kilometraje: form.kilometraje !== '' && form.kilometraje !== null ? parseInt(form.kilometraje, 10) : null,
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
        tipo_afectacion: item.tipo_afectacion || 'EXONERADO',
        precio_incluye_igv: item.precio_incluye_igv !== false,
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
    const cliObj = proforma.cliente ? {
      id: proforma.cliente,
      nombres: proforma.cliente_nombre,
      apellidos: proforma.cliente_apellidos,
      dni: proforma.cliente_dni,
    } : null;

    const vehObj = proforma.vehiculo ? {
      id: proforma.vehiculo,
      placa: proforma.vehiculo_placa,
      marca: proforma.vehiculo_marca,
      modelo: proforma.vehiculo_modelo,
      kilometraje_actual: proforma.kilometraje,
    } : null;

    setForm({
      cliente: cliObj,
      vehiculo: vehObj,
      kilometraje: proforma.kilometraje ?? '',
      forma_pago: proforma.forma_pago,
      observaciones: proforma.observaciones || '',
      incluye_igv: proforma.incluye_igv,
      descuento_global: proforma.descuento_global || 0,
      valido_hasta: proforma.valido_hasta || hoyISO(),
      moneda: proforma.moneda || 'PEN',
      tipo_cambio: proforma.tipo_cambio || 1,
      detalles: (proforma.detalles || []).map(d => {
        const repEnCatalogo = repuestos.find(r => r.id === d.repuesto);
        const stockActual = repEnCatalogo
          ? parseFloat(repEnCatalogo.stock_total_disponible || 0)
          : parseFloat(d.repuesto_stock || 0);

        return {
          tempId: `${d.id}-${Date.now()}-${Math.random()}`,
          tipo: d.tipo,
          repuesto: d.repuesto ? (repEnCatalogo || {
            id: d.repuesto,
            codigo: d.repuesto_codigo,
            nombre: d.repuesto_nombre,
            stock_total_disponible: stockActual,
            tipo_igv_codigo: d.repuesto_tipo_igv_codigo,
          }) : null,
          descripcion: d.descripcion || '',
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento: d.descuento,
          tipo_afectacion: d.tipo_afectacion || 'EXONERADO',
          precio_incluye_igv: d.precio_incluye_igv !== false,
        };
      }),
    });
    if (proforma.cliente) {
      fetchVehiculos('', proforma.cliente);
    } else {
      setVehiculos([]);
    }
    setVehiculoBusqueda(vehObj ? `${vehObj.placa} - ${vehObj.marca || ''} ${vehObj.modelo || ''}`.trim() : '');
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
      text: `Se creará una pre-venta para ${proforma.numero}.`,
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

  const convertirAOrden = async (proforma) => {
    if (!proforma.vehiculo) {
      Swal.fire({
        title: 'Vehículo requerido',
        text: 'Esta proforma no tiene un vehículo asignado. Para crear una Orden de Trabajo en taller, primero edita la proforma y selecciona el vehículo del cliente.',
        icon: 'warning',
        confirmButtonColor: '#0f172a',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Convertir a Orden de Trabajo',
      html: `
        <div style="text-align: left; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">
          <p>¿Deseas generar una Orden de Trabajo en taller para la proforma <b>${proforma.numero}</b>?</p>
          <div style="margin-top: 8px; padding: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px;">
            <div>🚗 <b>Vehículo:</b> ${proforma.vehiculo_placa || 'Placa asignada'}</div>
            <div>📋 <b>Estado inicial:</b> <span style="color: #818cf8; font-weight: bold;">RECEPCIONADO</span></div>
            <div style="margin-top: 4px; font-size: 0.8rem; color: #94a3b8;">
              Se transferirán los repuestos y servicios ya aprobados para iniciar la recepción física.
            </div>
          </div>
          <p style="margin-top: 10px; font-size: 0.8rem; color: #f59e0b;">
            ⚠️ <b>Aviso:</b> Al generar la OT, la opción de convertir a Venta/POS quedará deshabilitada para evitar duplicidades.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar OT',
      confirmButtonColor: '#6366f1',
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;

    try {
      const orden = await ventasService.convertirProformaAOt(proforma.id);
      Swal.fire({
        title: '¡Orden de Trabajo Generada!',
        html: `
          <p style="margin-bottom: 6px;">Se generó la <b>OT-${orden.numero || orden.id}</b> correctamente en estado <b>RECEPCIONADO</b>.</p>
          <p style="font-size: 0.85rem; color: #94a3b8;">Puedes acceder a ella para registrar el inventario de accesorios y fotos de ingreso.</p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Ir a la Orden',
        confirmButtonColor: '#6366f1',
        cancelButtonText: 'Quedarme aquí',
        cancelButtonColor: '#64748b',
      }).then((res) => {
        if (res.isConfirmed) {
          navigate(`/taller/ordenes/${orden.id}`);
        }
      });
      cargarProformas();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'No se pudo convertir la proforma a orden de trabajo.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const estadoColor = (estado) => {
    if (estado === 'CONVERTIDA') return 'success';
    if (estado === 'CONVERTIDA_OT') return 'secondary';
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
                <TableCell>
                  <Typography variant="body2" fontWeight="500">
                    {`${p.cliente_nombre || ''} ${p.cliente_apellidos || ''}`.trim() || 'Cliente sin nombre'}
                  </Typography>
                  {p.vehiculo_placa && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                      <Chip
                        icon={<Car size={13} style={{ marginLeft: 6 }} />}
                        label={p.vehiculo_placa}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: alpha(C.blue, 0.12),
                          color: C.blue,
                          border: `1px solid ${alpha(C.blue, 0.25)}`,
                          '& .MuiChip-icon': { color: 'inherit' }
                        }}
                      />
                      {p.kilometraje ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {Number(p.kilometraje).toLocaleString()} km
                        </Typography>
                      ) : null}
                    </Box>
                  )}
                </TableCell>
                <TableCell>{p.forma_pago}</TableCell>
                <TableCell>{p.valido_hasta ? new Date(`${p.valido_hasta}T00:00:00`).toLocaleDateString('es-PE') : '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{money(p.total)}</TableCell>
                <TableCell>
                  {p.estado === 'CONVERTIDA_OT' ? (
                    <Tooltip title={p.orden_trabajo_id ? "Clic para ver la Orden de Trabajo" : "Convertida a Orden de Trabajo"}>
                      <Chip
                        size="small"
                        icon={<Wrench size={13} style={{ marginLeft: 6 }} />}
                        label={p.orden_trabajo_numero ? `OT-${p.orden_trabajo_numero}` : 'Convertida a OT'}
                        onClick={p.orden_trabajo_id ? () => navigate(`/taller/ordenes/${p.orden_trabajo_id}`) : undefined}
                        sx={{
                          fontWeight: 700,
                          bgcolor: alpha('#6366f1', 0.16),
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          cursor: p.orden_trabajo_id ? 'pointer' : 'default',
                          '& .MuiChip-icon': { color: '#818cf8' },
                          '&:hover': p.orden_trabajo_id ? { bgcolor: alpha('#6366f1', 0.28) } : {},
                        }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip size="small" color={estadoColor(p.estado)} label={p.estado} />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={p.estado === 'CONVERTIDA' || p.estado === 'CONVERTIDA_OT' ? "Proforma convertida (no editable)" : "Editar"}>
                    <span>
                      <IconButton
                        title="Editar"
                        onClick={() => editar(p)}
                        disabled={p.estado === 'CONVERTIDA' || p.estado === 'CONVERTIDA_OT' || p.estado === 'ANULADA'}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <Pencil size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Imprimir PDF">
                    <IconButton title="PDF" color="primary" onClick={() => imprimir(p.id)} size="small" sx={{ mr: 0.5 }}>
                      <Printer size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={p.estado === 'CONVERTIDA_OT' ? "Ya convertida a Orden de Trabajo" : (p.estado === 'CONVERTIDA' ? "Ya convertida a POS" : "Convertir a Orden de Trabajo")}>
                    <span>
                      <IconButton
                        title="Convertir a Orden de Trabajo"
                        onClick={() => convertirAOrden(p)}
                        disabled={p.estado === 'CONVERTIDA' || p.estado === 'CONVERTIDA_OT' || p.estado === 'ANULADA'}
                        size="small"
                        sx={{
                          mr: 0.5,
                          color: (p.estado === 'CONVERTIDA' || p.estado === 'CONVERTIDA_OT' || p.estado === 'ANULADA') ? undefined : '#818cf8',
                          '&:hover': { bgcolor: alpha('#6366f1', 0.12) }
                        }}
                      >
                        <Wrench size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={p.estado === 'CONVERTIDA_OT' ? "Ya convertida a Orden de Trabajo" : (p.estado === 'CONVERTIDA' ? "Ya convertida a POS" : "Convertir a POS")}>
                    <span>
                      <IconButton
                        title="Convertir a POS"
                        color="success"
                        onClick={() => convertir(p)}
                        disabled={p.estado === 'CONVERTIDA' || p.estado === 'CONVERTIDA_OT' || p.estado === 'ANULADA'}
                        size="small"
                      >
                        <Send size={18} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openForm}
        onClose={cerrarFormulario}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: { xs: '98vw', md: '1440px' },
            width: '100%',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={22} /> {editingId ? 'Editar proforma' : 'Nueva proforma'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
            Datos del comprobante
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {/* Cliente con botón de registro rápido */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={clientes}
                    value={form.cliente}
                    onInputChange={(e, val) => cargarClientes(val)}
                    onChange={(e, value) => {
                      const nuevoClienteId = value?.id || null;
                      setForm(prev => ({
                        ...prev,
                        cliente: value,
                        vehiculo: null,
                        kilometraje: '',
                      }));
                      setVehiculoBusqueda('');
                      if (nuevoClienteId) {
                        fetchVehiculos('', nuevoClienteId);
                      } else {
                        setVehiculos([]);
                      }
                    }}
                    getOptionLabel={(option) => option ? `${option.dni || ''} - ${option.nombres || ''} ${option.apellidos || ''}`.trim() : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    renderInput={(params) => <TextField {...params} label="Buscar Cliente *" size="small" />}
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

            {/* Vehículo con botón de registro rápido */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Autocomplete
                    options={vehiculos}
                    disabled={!form.cliente?.id}
                    loading={loadingVehiculos}
                    noOptionsText={
                      !form.cliente?.id 
                        ? 'Primero seleccione un cliente' 
                        : 'El cliente no tiene vehículos registrados'
                    }
                    value={form.vehiculo}
                    inputValue={vehiculoBusqueda}
                    onOpen={() => {
                      if (form.cliente?.id && vehiculos.length === 0) {
                        fetchVehiculos('', form.cliente.id);
                      }
                    }}
                    onInputChange={(e, newInputValue, reason) => {
                      setVehiculoBusqueda(newInputValue);
                      if ((reason === 'input' || reason === 'clear') && form.cliente?.id) {
                        fetchVehiculos(newInputValue, form.cliente.id);
                      }
                    }}
                    getOptionLabel={(option) => option ? `${option.placa || ''} - ${option.marca || ''} ${option.modelo || ''}`.trim() : ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    onChange={(e, val) => {
                      setForm(prev => ({
                        ...prev,
                        vehiculo: val,
                        kilometraje: val?.kilometraje_actual !== undefined && val?.kilometraje_actual !== null 
                          ? String(val.kilometraje_actual) 
                          : prev.kilometraje,
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label={form.cliente?.id ? "Buscar Vehículo por Placa (Opcional)" : "Seleccione primero un Cliente"} 
                        size="small"
                        helperText={
                          !form.cliente?.id 
                            ? 'Seleccione el cliente para habilitar sus vehículos' 
                            : (vehiculos.length === 0 ? 'Sin vehículos. Puede registrar uno con el botón (+)' : '')
                        }
                      />
                    )}
                  />
                </Box>
                <Tooltip title="Registrar nuevo vehículo">
                  <span>
                    <Button
                      variant="contained"
                      disabled={!form.cliente?.id}
                      onClick={() => setOpenVehicleModal(true)}
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
                  </span>
                </Tooltip>
              </Box>
            </Grid>

            {/* Kilometraje Actual */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Kilometraje Actual"
                type="number"
                size="small"
                fullWidth
                placeholder="Ej. 45000"
                value={form.kilometraje}
                onChange={e => setForm(prev => ({ ...prev, kilometraje: e.target.value }))}
                inputProps={{ min: '0' }}
                helperText="Editable libremente"
              />
            </Grid>

            {/* Forma de pago */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Forma de pago</InputLabel>
                <Select value={form.forma_pago} label="Forma de pago" onChange={e => setForm(prev => ({ ...prev, forma_pago: e.target.value }))}>
                  <MenuItem value="CONTADO">Contado</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Válido hasta */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Válido hasta" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={form.valido_hasta} onChange={e => setForm(prev => ({ ...prev, valido_hasta: e.target.value }))} />
            </Grid>

            {/* Moneda */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={form.moneda}
                  label="Moneda"
                  onChange={e => {
                    const nuevaMoneda = e.target.value;
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

            {/* T. Cambio */}
            <Grid size={{ xs: 12, md: 3 }}>
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

            {/* Descuento global */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField label="Descuento global" type="number" size="small" fullWidth value={form.descuento_global} onChange={e => setForm(prev => ({ ...prev, descuento_global: e.target.value }))} />
            </Grid>

            {/* Observaciones */}
            <Grid size={{ xs: 12 }}>
              <TextField label="Observaciones" size="small" fullWidth multiline minRows={2} value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="bold">Items</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                startIcon={<Wrench size={16} />}
                variant="outlined"
                color="inherit"
                onClick={handleAbrirPlantillaNuevoServicio}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  borderColor: alpha(C.border, 0.8),
                  '&:hover': { borderColor: C.brandLight, bgcolor: alpha(C.brand, 0.08) }
                }}
              >
                + Servicio de Plantilla
              </Button>
              <Button
                startIcon={<Plus size={18} />}
                variant="outlined"
                onClick={agregarLinea}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Agregar item
              </Button>
            </Box>
          </Box>

          <TableContainer sx={{ mt: 1, border: `1px solid ${C.border}`, borderRadius: 1, maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 115 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 240 }}>Producto / Servicio</TableCell>
                  <TableCell align="center" sx={{ width: 75 }}>Stock</TableCell>
                  <TableCell align="center" sx={{ width: 105 }}>Cant.</TableCell>
                  <TableCell align="center" sx={{ width: 130 }}>P. Unit.</TableCell>
                  <TableCell align="center" sx={{ width: 165 }}>Tratamiento IGV</TableCell>
                  <TableCell align="center" sx={{ width: 115 }}>Desc.</TableCell>
                  <TableCell align="right" sx={{ width: 115 }}>Total</TableCell>
                  <TableCell align="center" sx={{ width: 45 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.detalles.map((item, idx) => {
                  const calc = resumenCalculado.detallesCalculados[idx] || {
                    baseImponible: 0,
                    igvLinea: 0,
                    totalLinea: Math.max(0, (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)) - parseFloat(item.descuento || 0)),
                  };
                  const lineaTotal = calc.totalLinea;
                  const valorTratamiento = item.tipo_afectacion === 'GRAVADO_18'
                    ? (item.precio_incluye_igv !== false ? 'GRAVADO_INC' : 'GRAVADO_NETO')
                    : (item.tipo_afectacion || 'EXONERADO');

                  return (
                    <TableRow key={item.tempId}>
                      <TableCell sx={{ width: 115 }}>
                        <Select
                          size="small"
                          fullWidth
                          value={item.tipo}
                          onChange={e => actualizarLinea(item.tempId, {
                            tipo: e.target.value,
                            repuesto: null,
                            descripcion: '',
                            precio_unitario: 0,
                            tipo_afectacion: item.tipo_afectacion || 'EXONERADO',
                            precio_incluye_igv: item.precio_incluye_igv !== false,
                          })}
                        >
                          <MenuItem value="REPUESTO">Producto</MenuItem>
                          <MenuItem value="SERVICIO">Servicio</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell sx={{ minWidth: 240 }}>
                        {item.tipo === 'REPUESTO' ? (
                          <Autocomplete
                            options={repuestos}
                            value={item.repuesto}
                            onOpen={() => cargarRepuestos()}
                            onInputChange={(e, val) => cargarRepuestos(val)}
                            onChange={(e, value) => {
                              const afec = obtenerAfectacionDeRepuesto(value);
                              actualizarLinea(item.tempId, {
                                repuesto: value,
                                descripcion: value?.nombre || '',
                                precio_unitario: parseFloat(value?.precio_lista || value?.precio_cash || 0),
                                tipo_afectacion: afec.tipo_afectacion,
                                precio_incluye_igv: afec.precio_incluye_igv,
                              });
                            }}
                            getOptionLabel={(option) => option ? `${option.codigo || ''} ${option.codigo_barra || ''} - ${option.nombre || ''}`.trim() : ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box sx={{ width: '100%' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">{option.codigo} - {option.nombre}</Typography>
                                    {option.tipo_igv_codigo && option.tipo_igv_codigo !== '10' && (
                                      <Chip
                                        size="small"
                                        label={option.tipo_igv_codigo === '20' ? 'Exonerado' : 'Inafecto'}
                                        sx={{ height: 18, fontSize: '0.65rem', ml: 1, fontWeight: 600 }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Barras: {option.codigo_barra || '-'} | Stock: {stockTotal(option)} | P. Lista: S/ {parseFloat(option.precio_lista || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                            renderInput={(params) => <TextField {...params} placeholder="Buscar por código, barras o nombre..." size="small" />}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Descripción del servicio (o elija una plantilla)"
                              value={item.descripcion}
                              onChange={e => actualizarLinea(item.tempId, { descripcion: e.target.value })}
                            />
                            <Tooltip title="Cargar desde plantilla de taller">
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => handleAbrirPlantillaParaFila(item.tempId)}
                                sx={{
                                  minWidth: 36,
                                  px: 1,
                                  height: 36,
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  borderColor: alpha(C.border, 0.8),
                                  '&:hover': { borderColor: C.brandLight, bgcolor: alpha(C.brand, 0.08) }
                                }}
                              >
                                <Wrench size={14} color={C.brandLight} />
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Plantilla</Box>
                              </Button>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 75, fontWeight: 700, color: stockTotal(item.repuesto) <= 0 ? 'text.secondary' : 'success.main' }}>
                        {item.tipo === 'REPUESTO' ? stockTotal(item.repuesto) : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ width: 105 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.cantidad}
                          onChange={e => actualizarLinea(item.tempId, { cantidad: e.target.value })}
                          inputProps={{
                            min: 0,
                            step: '0.01',
                            style: { textAlign: 'right', padding: '6px 8px', fontSize: '0.875rem' }
                          }}
                          sx={{
                            width: '100%',
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            '& input[type=number]': { MozAppearance: 'textfield' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 130 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.precio_unitario}
                          onChange={e => actualizarLinea(item.tempId, { precio_unitario: e.target.value })}
                          inputProps={{
                            min: 0,
                            step: '0.01',
                            style: { textAlign: 'right', padding: '6px 8px', fontSize: '0.875rem' }
                          }}
                          sx={{
                            width: '100%',
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            '& input[type=number]': { MozAppearance: 'textfield' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: 165 }}>
                        <Select
                          size="small"
                          fullWidth
                          value={valorTratamiento}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'GRAVADO_INC') {
                              actualizarLinea(item.tempId, { tipo_afectacion: 'GRAVADO_18', precio_incluye_igv: true });
                            } else if (val === 'GRAVADO_NETO') {
                              actualizarLinea(item.tempId, { tipo_afectacion: 'GRAVADO_18', precio_incluye_igv: false });
                            } else if (val === 'EXONERADO') {
                              actualizarLinea(item.tempId, { tipo_afectacion: 'EXONERADO', precio_incluye_igv: true });
                            } else if (val === 'INAFECTO') {
                              actualizarLinea(item.tempId, { tipo_afectacion: 'INAFECTO', precio_incluye_igv: true });
                            }
                          }}
                          sx={{ fontSize: '0.8rem' }}
                        >
                          <MenuItem value="GRAVADO_INC" sx={{ fontSize: '0.8rem' }}>🟢 Gravado (Inc. 18%)</MenuItem>
                          <MenuItem value="GRAVADO_NETO" sx={{ fontSize: '0.8rem' }}>🟡 Gravado (+18% IGV)</MenuItem>
                          <MenuItem value="EXONERADO" sx={{ fontSize: '0.8rem' }}>⚪ Exonerado (0%)</MenuItem>
                          <MenuItem value="INAFECTO" sx={{ fontSize: '0.8rem' }}>⚪ Inafecto (0%)</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell align="center" sx={{ width: 115 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.descuento}
                          onChange={e => actualizarLinea(item.tempId, { descuento: e.target.value })}
                          inputProps={{
                            min: 0,
                            step: '0.01',
                            style: { textAlign: 'right', padding: '6px 8px', fontSize: '0.875rem' }
                          }}
                          sx={{
                            width: '100%',
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                            '& input[type=number]': { MozAppearance: 'textfield' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {money(lineaTotal, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}
                        {calc.igvLinea > 0 && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.7rem', fontWeight: 'normal' }}>
                            IGV: {money(calc.igvLinea, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}
                          </Typography>
                        )}
                      </TableCell>
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
            <Box sx={{ minWidth: 340, p: 2.5, border: `1px solid ${C.border}`, borderRadius: 2, bgcolor: alpha(C.blue, 0.04) }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                Resumen de Liquidación (SUNAT)
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2" color="text.secondary">Op. Gravadas (Base)</Typography>
                <Typography variant="body2" fontWeight="600">{money(resumenCalculado.totalGravado, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}</Typography>
              </Box>

              {resumenCalculado.totalExonerado > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Op. Exoneradas</Typography>
                  <Typography variant="body2" fontWeight="600">{money(resumenCalculado.totalExonerado, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}</Typography>
                </Box>
              )}

              {resumenCalculado.totalInafecto > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">Op. Inafectas</Typography>
                  <Typography variant="body2" fontWeight="600">{money(resumenCalculado.totalInafecto, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}</Typography>
                </Box>
              )}

              {resumenCalculado.totalDescuentos > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" color="error.main">Descuentos Totales</Typography>
                  <Typography variant="body2" fontWeight="600" color="error.main">
                    - {money(resumenCalculado.totalDescuentos, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2" color="text.secondary">Subtotal (Valor Venta)</Typography>
                <Typography variant="body2" fontWeight="600">{money(resumenCalculado.subtotal, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">IGV (18%)</Typography>
                <Typography variant="body2" fontWeight="600">{money(resumenCalculado.igvTotal, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Total General</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {money(resumenCalculado.totalFinal, form.moneda === 'PEN' ? 'S/' : form.moneda === 'USD' ? '$' : '€')}
                </Typography>
              </Box>
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

      {/* Modal Selector de Plantillas de Servicio */}
      <Dialog
        open={openPlantillaModal}
        onClose={() => setOpenPlantillaModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="700" display="flex" alignItems="center" gap={1}>
            <Wrench size={20} color={C.brandLight} />
            Seleccionar Servicio desde Plantilla
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {targetTempId ? 'El servicio seleccionado se aplicará a la fila actual.' : 'El servicio se agregará a los items de la proforma.'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          {/* Categorías */}
          <Box>
            <Typography variant="caption" fontWeight="700" color="text.secondary" display="block" mb={1}>
              Categoría de Plantilla:
            </Typography>
            <ToggleButtonGroup
              value={tipoPlantillaModal}
              exclusive
              onChange={(e, val) => {
                if (val) {
                  setTipoPlantillaModal(val);
                  setPlantillaSeleccionada(null);
                }
              }}
              size="small"
              fullWidth
            >
              <ToggleButton value="PREVENTIVO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                Preventivos ({plantillasPreventivas.length})
              </ToggleButton>
              <ToggleButton value="CORRECTIVO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                Correctivos ({plantillasCorrectivas.length})
              </ToggleButton>
              <ToggleButton value="DIAGNOSTICO" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                Diagnóstico ({plantillasDiagnostico.length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Autocomplete de Plantillas */}
          <Autocomplete
            loading={cargandoPlantillas}
            options={plantillasActuales}
            value={plantillaSeleccionada}
            getOptionLabel={(option) => {
              if (!option) return '';
              const precio = option.precio_base ? ` | S/ ${parseFloat(option.precio_base).toFixed(2)}` : '';
              return `${option.nombre}${precio}`;
            }}
            onChange={(e, val) => setPlantillaSeleccionada(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar o Buscar Servicio"
                placeholder="Escribe para buscar..."
                size="small"
              />
            )}
            noOptionsText={cargandoPlantillas ? 'Cargando plantillas...' : 'No hay plantillas disponibles en esta categoría'}
          />

          {/* Tarjeta de previsualización del servicio seleccionado */}
          {plantillaSeleccionada && (
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${alpha(C.brand, 0.4)}`,
                bgcolor: alpha(C.surface, 0.6),
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Typography variant="subtitle2" fontWeight="700" color={C.text}>
                {plantillaSeleccionada.nombre}
              </Typography>
              {plantillaSeleccionada.descripcion && (
                <Typography variant="body2" color="text.secondary">
                  {plantillaSeleccionada.descripcion}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, pt: 1, borderTop: `1px solid ${C.border}` }}>
                {plantillaSeleccionada.tiempo_estimado_minutos ? (
                  <Chip
                    label={`~${plantillaSeleccionada.tiempo_estimado_minutos} min`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                  />
                ) : <span />}
                <Typography variant="body2" fontWeight="700" sx={{ color: C.brandLight }}>
                  Precio Sugerido: S/ {parseFloat(plantillaSeleccionada.precio_base || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenPlantillaModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!plantillaSeleccionada}
            onClick={handleConfirmarPlantilla}
            startIcon={<CheckCircle2 size={18} />}
          >
            Aplicar a Proforma
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
            setForm(prev => ({
              ...prev,
              cliente: createdClient,
              vehiculo: null,
              kilometraje: '',
            }));
            setVehiculos([]);
            setVehiculoBusqueda('');
            setOpenClientModal(false);
          }}
        />
      )}

      {/* Modal de registro rápido de vehículo */}
      {openVehicleModal && (
        <VehiculosForm
          open={openVehicleModal}
          onClose={() => setOpenVehicleModal(false)}
          clienteInicial={form.cliente}
          onSuccess={(createdVehicle) => {
            if (!createdVehicle?.id) return;
            setVehiculos(prev => prev.some(v => v.id === createdVehicle.id) ? prev : [createdVehicle, ...prev]);
            setForm(prev => ({
              ...prev,
              vehiculo: createdVehicle,
              kilometraje: createdVehicle.kilometraje_actual !== undefined && createdVehicle.kilometraje_actual !== null 
                ? String(createdVehicle.kilometraje_actual) 
                : prev.kilometraje,
            }));
            setVehiculoBusqueda(`${createdVehicle.placa} - ${createdVehicle.marca || ''} ${createdVehicle.modelo || ''}`.trim());
            setOpenVehicleModal(false);
          }}
        />
      )}
    </Box>
  );
};

export default ProformasPage;
