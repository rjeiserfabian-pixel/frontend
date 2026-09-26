import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  TablePagination, Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Truck, Printer, Play, CheckCircle, Eye, ReceiptText } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import ModalNuevoguia from '../components/ModalNuevaGuiaRemision';
import ModalSalidaGuia from '../components/ModalSalidaGuia';
import ModalDetalleGuiaRemision from '../components/ModalDetalleGuiaRemision';
import PrintGuiaRemisionA4 from '../components/PrintGuiaRemisionA4';
import { useReactToPrint } from 'react-to-print';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function GuiasRemisionPage() {
  const { tienePermiso } = usePermisos();
  const { activeSucursalId } = useSucursal();
  const puedeCrear = tienePermiso('INVENTARIO.TRASLADOS.CREAR');
  const puedeAprobar = tienePermiso('INVENTARIO.TRASLADOS.APROBAR');
  const puedeFacturar = tienePermiso('VENTAS.POS.CREAR');

  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModalNueva, setOpenModalNueva] = useState(false);
  const [openModalSalida, setOpenModalSalida] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [guiaDetalle, setGuiaDetalle] = useState(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGuias = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/guias-remision/', {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      if (res.data.results) {
        setGuias(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setGuias(res.data);
        setTotalCount(res.data.length);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar las guías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuias();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [guiaParaImprimir, setGuiaParaImprimir] = useState(null);
  const printRef = useRef();

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Guia_de_Remision',
    onAfterPrint: () => setGuiaParaImprimir(null),
  });

  useEffect(() => {
    if (guiaParaImprimir) {
      handlePrintAction();
    }
  }, [guiaParaImprimir, handlePrintAction]);

  const handleDarSalida = (guia) => {
    setSelectedGuia(guia);
    setOpenModalSalida(true);
  };

  const handleIniciarTraslado = async (guia) => {
    const numero = guia.numero_documento || `${guia.serie_prefijo}-${String(guia.correlativo).padStart(6,'0')}`;
    const confirm = await Swal.fire({
      title: 'Dar salida',
      text: `Se descontara el stock del almacen de origen para la guia ${numero}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, dar salida',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.post(`/inventario/guias-remision/${guia.id}/dar_salida/`);
      Swal.fire('Salida registrada', 'La guia esta ahora en traslado.', 'success');
      fetchGuias();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Error al dar salida', 'error');
    }
  };

  const handleCompletarTraslado = async (guia) => {
    const confirm = await Swal.fire({
      title: '¿Confirmar llegada?',
      text: `¿La guía ${guia.serie_prefijo}-${String(guia.correlativo).padStart(6,'0')} ya llegó a su destino?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;
    try {
      const entrega = await Swal.fire({
        title: 'Datos de entrega',
        html: `
          <div style="text-align:left;">
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">
              Recibido por *
            </label>
            <input id="swal-recibido-por" class="swal2-input" placeholder="Nombre de quien recibe" style="margin:0 0 14px; width:100%; height:42px;">
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">
              Observacion
            </label>
            <textarea id="swal-observacion-entrega" class="swal2-textarea" placeholder="Observacion opcional de entrega" style="margin:0; width:100%; min-height:82px;"></textarea>
          </div>
        `,
        icon: 'info',
        position: 'top',
        showCancelButton: true,
        confirmButtonText: 'Completar entrega',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#64748b',
        width: 520,
        focusConfirm: false,
        didOpen: () => {
          document.getElementById('swal-recibido-por')?.focus();
        },
        preConfirm: () => {
          const recibidoPor = document.getElementById('swal-recibido-por')?.value?.trim();
          const observacion = document.getElementById('swal-observacion-entrega')?.value?.trim();
          if (!recibidoPor) {
            Swal.showValidationMessage('Indique el nombre de quien recibe el traslado');
            return false;
          }
          return { recibidoPor, observacion };
        },
      });
      if (!entrega.isConfirmed) return;
      await api.post(`/inventario/guias-remision/${guia.id}/completar/`, {
        recibido_por: entrega.value.recibidoPor,
        observacion_entrega: entrega.value.observacion,
      });
      Swal.fire('¡Completado!', 'La guía ha sido marcada como completada.', 'success');
      fetchGuias();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Error al completar', 'error');
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'CREADA': return <Chip label="Creada" color="default" size="small" />;
      case 'LISTA_PARA_SALIDA': return <Chip label="Lista para Salida" color="info" size="small" />;
      case 'EN_TRASLADO': return <Chip label="En Traslado" color="warning" size="small" />;
      case 'COMPLETADA': return <Chip label="Completada" color="success" size="small" />;
      case 'FACTURADA': return <Chip label="Facturada" color="primary" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  const _handleFacturarGuia = async (guia) => {
    try {
      const [tiposRes, seriesRes, metodosRes] = await Promise.all([
        api.get('/ventas/tipos-comprobante/'),
        api.get('/ventas/series-comprobante/'),
        api.get('/ventas/metodos-pago/'),
      ]);

      const tipos = (tiposRes.data.results || tiposRes.data || []).filter(t => t.estado !== false);
      const series = (seriesRes.data.results || seriesRes.data || []).filter(s => (
        s.estado !== false && String(s.sucursal) === String(guia.sucursal || activeSucursalId)
      ));
      const metodos = (metodosRes.data.results || metodosRes.data || []).filter(m => m.estado !== false);

      if (!tipos.length || !series.length || !metodos.length) {
        Swal.fire(
          'Falta configuracion',
          'Debe existir al menos un tipo de comprobante, una serie activa para esta sucursal y un metodo de pago activo.',
          'warning'
        );
        return;
      }

      const tipoFactura = tipos.find(t => (t.nombre || '').toLowerCase().includes('factura')) || tipos[0];
      const seriesDeTipo = (tipoId) => series.filter(s => String(s.tipo_comprobante) === String(tipoId));
      const tipoInicial = tipoFactura?.id || '';
      const serieInicial = seriesDeTipo(tipoInicial)[0]?.id || '';
      const metodoInicial = metodos[0]?.id || '';
      const numero = guia.numero_documento || `${guia.serie_prefijo}-${String(guia.correlativo).padStart(6,'0')}`;

      const renderOptions = (items, getLabel) => items.map(item => (
        `<option value="${item.id}">${getLabel(item)}</option>`
      )).join('');

      const result = await Swal.fire({
        title: 'Facturar guía',
        html: `
          <div style="text-align:left;">
            <p style="margin:0 0 14px; color:#475569; text-align:center;">
              Se generará una venta pagada desde la guía <b>${numero}</b>.
            </p>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Tipo de comprobante</label>
            <select id="swal-tipo-comprobante" class="swal2-select" style="margin:0 0 12px; width:100%;">
              ${renderOptions(tipos, t => t.nombre)}
            </select>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Serie</label>
            <select id="swal-serie" class="swal2-select" style="margin:0 0 12px; width:100%;"></select>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Método de pago</label>
            <select id="swal-metodo-pago" class="swal2-select" style="margin:0 0 12px; width:100%;">
              ${renderOptions(metodos, m => m.nombre)}
            </select>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Referencia</label>
            <input id="swal-referencia" class="swal2-input" placeholder="Operación, voucher u observación de pago" style="margin:0; width:100%;">
          </div>
        `,
        icon: 'info',
        position: 'top',
        showCancelButton: true,
        confirmButtonText: 'Generar venta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        width: 560,
        focusConfirm: false,
        didOpen: () => {
          const tipoSelect = document.getElementById('swal-tipo-comprobante');
          const serieSelect = document.getElementById('swal-serie');
          const metodoSelect = document.getElementById('swal-metodo-pago');

          const cargarSeries = () => {
            const disponibles = seriesDeTipo(tipoSelect.value);
            serieSelect.innerHTML = disponibles.length
              ? renderOptions(disponibles, s => `${s.serie} (Act: ${s.correlativo_actual})`)
              : '<option value="">Sin series disponibles</option>';
          };

          tipoSelect.value = tipoInicial;
          metodoSelect.value = metodoInicial;
          cargarSeries();
          if (serieInicial) serieSelect.value = serieInicial;
          tipoSelect.addEventListener('change', cargarSeries);
        },
        preConfirm: () => {
          const tipoId = document.getElementById('swal-tipo-comprobante')?.value;
          const serieId = document.getElementById('swal-serie')?.value;
          const metodoId = document.getElementById('swal-metodo-pago')?.value;
          const referencia = document.getElementById('swal-referencia')?.value?.trim();
          if (!tipoId || !serieId || !metodoId) {
            Swal.showValidationMessage('Seleccione comprobante, serie y método de pago');
            return false;
          }
          return { tipoId, serieId, metodoId, referencia };
        },
      });

      if (!result.isConfirmed) return;

      const response = await api.post(`/inventario/guias-remision/${guia.id}/facturar/`, {
        tipo_comprobante_id: result.value.tipoId,
        serie_id: result.value.serieId,
        metodo_pago_id: result.value.metodoId,
        referencia: result.value.referencia,
      });

      const ventaSerie = response.data?.venta?.serie_correlativo || 'venta generada';
      Swal.fire('Guía facturada', `Se generó la venta ${ventaSerie}.`, 'success');
      fetchGuias();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Error al facturar la guía', 'error');
    }
  };

  const handleFacturarGuiaMultiple = async (guia) => {
    try {
      const [tiposRes, seriesRes, metodosRes] = await Promise.all([
        api.get('/ventas/tipos-comprobante/'),
        api.get('/ventas/series-comprobante/'),
        api.get('/ventas/metodos-pago/'),
      ]);

      const tipos = (tiposRes.data.results || tiposRes.data || []).filter(t => t.estado !== false);
      const series = (seriesRes.data.results || seriesRes.data || []).filter(s => (
        s.estado !== false && String(s.sucursal) === String(guia.sucursal || activeSucursalId)
      ));
      const metodos = (metodosRes.data.results || metodosRes.data || []).filter(m => m.estado !== false);

      if (!tipos.length || !series.length || !metodos.length) {
        Swal.fire(
          'Falta configuracion',
          'Debe existir al menos un tipo de comprobante, una serie activa para esta sucursal y un metodo de pago activo.',
          'warning'
        );
        return;
      }

      const tipoFactura = tipos.find(t => (t.nombre || '').toLowerCase().includes('factura')) || tipos[0];
      const seriesDeTipo = (tipoId) => series.filter(s => String(s.tipo_comprobante) === String(tipoId));
      const tipoInicial = tipoFactura?.id || '';
      const serieInicial = seriesDeTipo(tipoInicial)[0]?.id || '';
      const metodoInicial = metodos[0]?.id || '';
      const numero = guia.numero_documento || `${guia.serie_prefijo}-${String(guia.correlativo).padStart(6,'0')}`;
      const totalGuia = Number(guia.total_facturable || 0);
      const totalGuiaTexto = totalGuia.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const renderOptions = (items, getLabel) => items.map(item => (
        `<option value="${item.id}">${getLabel(item)}</option>`
      )).join('');

      const result = await Swal.fire({
        title: 'Facturar guia',
        html: `
          <div style="text-align:left;">
            <p style="margin:0 0 14px; color:#475569; text-align:center;">
              Se generara una venta pagada desde la guia <b>${numero}</b>.
            </p>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px 14px; margin-bottom:14px;">
              <span style="color:#1e3a8a; font-size:13px; font-weight:800;">Total a cobrar</span>
              <span style="color:#1d4ed8; font-size:22px; font-weight:900;">S/ ${totalGuiaTexto}</span>
            </div>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Tipo de comprobante</label>
            <select id="swal-tipo-comprobante" class="swal2-select" style="margin:0 0 12px; width:100%;">
              ${renderOptions(tipos, t => t.nombre)}
            </select>
            <label style="display:block; font-size:13px; font-weight:700; color:#334155; margin-bottom:6px;">Serie</label>
            <select id="swal-serie" class="swal2-select" style="margin:0 0 12px; width:100%;"></select>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px;">
              <label style="display:block; font-size:13px; font-weight:700; color:#334155;">Pagos</label>
              <button id="swal-agregar-pago" type="button" style="border:1px solid #2563eb; background:#eff6ff; color:#1d4ed8; border-radius:6px; padding:6px 10px; font-weight:700; cursor:pointer;">
                + Agregar metodo
              </button>
            </div>
            <div id="swal-pagos"></div>
            <p style="margin:8px 0 0; color:#64748b; font-size:12px;">
              El total de los pagos debe cubrir el total de la venta. Si un metodo exige referencia, se validara antes de facturar.
            </p>
          </div>
        `,
        icon: 'info',
        position: 'top',
        showCancelButton: true,
        confirmButtonText: 'Generar venta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        width: 650,
        focusConfirm: false,
        didOpen: () => {
          const tipoSelect = document.getElementById('swal-tipo-comprobante');
          const serieSelect = document.getElementById('swal-serie');
          const pagosContainer = document.getElementById('swal-pagos');
          const agregarPagoBtn = document.getElementById('swal-agregar-pago');
          let pagoIndex = 0;

          const cargarSeries = () => {
            const disponibles = seriesDeTipo(tipoSelect.value);
            serieSelect.innerHTML = disponibles.length
              ? renderOptions(disponibles, s => `${s.serie} (Act: ${s.correlativo_actual})`)
              : '<option value="">Sin series disponibles</option>';
          };

          const actualizarBotonesEliminar = () => {
            const rows = pagosContainer.querySelectorAll('.swal-pago-row');
            rows.forEach(row => {
              const btn = row.querySelector('.swal-eliminar-pago');
              if (btn) btn.disabled = rows.length === 1;
            });
          };

          const crearPago = () => {
            const row = document.createElement('div');
            row.className = 'swal-pago-row';
            row.style.cssText = 'border:1px solid #dbe3ef; border-radius:8px; padding:10px; margin-bottom:10px; background:#f8fafc;';
            row.innerHTML = `
              <div style="display:grid; grid-template-columns: 1fr 120px 34px; gap:8px; align-items:end;">
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Metodo</label>
                  <select class="swal-pago-metodo swal2-select" style="margin:0; width:100%;">
                    ${renderOptions(metodos, m => m.nombre)}
                  </select>
                </div>
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Monto</label>
                  <input class="swal-pago-monto swal2-input" type="number" min="0.01" step="0.01" placeholder="0.00" style="margin:0; width:100%; height:38px;">
                </div>
                <button class="swal-eliminar-pago" type="button" title="Quitar pago" style="height:38px; border:0; border-radius:6px; background:#fee2e2; color:#b91c1c; font-weight:800; cursor:pointer;">X</button>
              </div>
              <div class="swal-referencia-wrap" style="display:none; margin-top:8px;">
                <label style="display:block; font-size:12px; font-weight:700; color:#334155; margin-bottom:4px;">Referencia requerida</label>
                <input class="swal-pago-referencia swal2-input" placeholder="Operacion, voucher o codigo" style="margin:0; width:100%; height:38px;">
              </div>
            `;
            pagosContainer.appendChild(row);

            const metodoSelect = row.querySelector('.swal-pago-metodo');
            const referenciaWrap = row.querySelector('.swal-referencia-wrap');
            const eliminarBtn = row.querySelector('.swal-eliminar-pago');
            const actualizarReferencia = () => {
              const metodo = metodos.find(m => String(m.id) === String(metodoSelect.value));
              referenciaWrap.style.display = metodo?.requiere_referencia ? 'block' : 'none';
            };

            metodoSelect.value = pagoIndex === 0 ? metodoInicial : metodos[0]?.id || '';
            const montoInput = row.querySelector('.swal-pago-monto');
            if (pagoIndex === 0 && totalGuia > 0 && montoInput) {
              montoInput.value = totalGuia.toFixed(2);
            }
            pagoIndex += 1;
            actualizarReferencia();
            metodoSelect.addEventListener('change', actualizarReferencia);
            eliminarBtn.addEventListener('click', () => {
              row.remove();
              actualizarBotonesEliminar();
            });
            actualizarBotonesEliminar();
          };

          tipoSelect.value = tipoInicial;
          cargarSeries();
          if (serieInicial) serieSelect.value = serieInicial;
          tipoSelect.addEventListener('change', cargarSeries);
          crearPago();
          agregarPagoBtn.addEventListener('click', crearPago);
        },
        preConfirm: () => {
          const tipoId = document.getElementById('swal-tipo-comprobante')?.value;
          const serieId = document.getElementById('swal-serie')?.value;
          const rows = Array.from(document.querySelectorAll('.swal-pago-row'));
          if (!tipoId || !serieId || rows.length === 0) {
            Swal.showValidationMessage('Seleccione comprobante, serie y al menos un pago');
            return false;
          }

          const pagos = [];
          for (const row of rows) {
            const metodoId = row.querySelector('.swal-pago-metodo')?.value;
            const montoRaw = row.querySelector('.swal-pago-monto')?.value;
            const monto = Number(String(montoRaw || '').replace(',', '.'));
            const referencia = row.querySelector('.swal-pago-referencia')?.value?.trim() || '';
            const metodo = metodos.find(m => String(m.id) === String(metodoId));

            if (!metodoId || !monto || monto <= 0) {
              Swal.showValidationMessage('Cada pago debe tener metodo y monto mayor a cero');
              return false;
            }
            if (metodo?.requiere_referencia && !referencia) {
              Swal.showValidationMessage(`El metodo ${metodo.nombre} requiere referencia`);
              return false;
            }
            pagos.push({ metodo_pago_id: metodoId, monto, referencia });
          }

          return { tipoId, serieId, pagos };
        },
      });

      if (!result.isConfirmed) return;

      const response = await api.post(`/inventario/guias-remision/${guia.id}/facturar/`, {
        tipo_comprobante_id: result.value.tipoId,
        serie_id: result.value.serieId,
        pagos: result.value.pagos,
      });

      const ventaSerie = response.data?.venta?.serie_correlativo || 'venta generada';
      Swal.fire('Guia facturada', `Se genero la venta ${ventaSerie}.`, 'success');
      fetchGuias();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Error al facturar la guia', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Guías de Remisión
        </Typography>
        {puedeCrear && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Truck size={18} />}
            onClick={() => setOpenModalNueva(true)}
          >
            Nueva Guía
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <Table>
          <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
            <TableRow>
              <TableCell><b>Nº Guía</b></TableCell>
              <TableCell><b>Emisión</b></TableCell>
              <TableCell><b>Cliente</b></TableCell>
              <TableCell><b>Destino</b></TableCell>
              <TableCell><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : guias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>No hay guías registradas</TableCell>
              </TableRow>
            ) : (
              guias.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.serie_prefijo}-{String(item.correlativo).padStart(6, '0')}</TableCell>
                  <TableCell>
                    {new Date(item.fecha_emision).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.cliente_nombre}</TableCell>
                  <TableCell>{item.ubigeo_llegada_nombre}</TableCell>
                  <TableCell>{getStatusChip(item.estado)}</TableCell>
                  <TableCell align="center">
                    {item.estado === 'CREADA' && puedeAprobar && (
                      <IconButton color="success" onClick={() => handleDarSalida(item)} title="Preparar Salida" size="small" sx={{ mr: 0.75, bgcolor: alpha(C.emerald, 0.08), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                        <Truck size={18} />
                      </IconButton>
                    )}
                    {item.estado === 'LISTA_PARA_SALIDA' && puedeAprobar && (
                      <IconButton color="success" onClick={() => handleIniciarTraslado(item)} title="Dar Salida" size="small" sx={{ mr: 0.75, bgcolor: alpha(C.emerald, 0.08), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                        <Play size={18} />
                      </IconButton>
                    )}
                    {item.estado === 'EN_TRASLADO' && puedeAprobar && (
                      <IconButton color="secondary" onClick={() => handleCompletarTraslado(item)} title="Confirmar llegada / Completar" size="small" sx={{ mr: 0.75, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}>
                        <CheckCircle size={18} />
                      </IconButton>
                    )}
                    {item.estado === 'COMPLETADA' && !item.venta_generada && puedeFacturar && (
                      <IconButton color="success" onClick={() => handleFacturarGuiaMultiple(item)} title="Facturar guía" size="small" sx={{ mr: 0.75, bgcolor: alpha(C.emerald, 0.08), border: `1px solid ${alpha(C.emerald, 0.2)}` }}>
                        <ReceiptText size={18} />
                      </IconButton>
                    )}
                    <IconButton color="secondary" onClick={() => setGuiaDetalle(item)} title="Ver Detalle" size="small" sx={{ mr: 0.75, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}>
                      <Eye size={18} />
                    </IconButton>
                    <IconButton
                      onClick={() => setGuiaParaImprimir(item)}
                      title="Imprimir Guía"
                      disabled={item.estado === 'CREADA' || item.estado === 'LISTA_PARA_SALIDA'} // Solo imprime si ya dio salida
                      size="small"
                      sx={{ color: C.textMuted, bgcolor: alpha('#ffffff', 0.04), border: `1px solid ${C.border}` }}
                    >
                      <Printer size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
      />

      {openModalNueva && (
        <ModalNuevoguia 
          open={openModalNueva} 
          onClose={() => setOpenModalNueva(false)} 
          onSuccess={() => {
            setOpenModalNueva(false);
            fetchGuias();
          }} 
        />
      )}

      {openModalSalida && (
        <ModalSalidaGuia
          open={openModalSalida}
          onClose={() => setOpenModalSalida(false)}
          guia={selectedGuia}
          onSuccess={() => {
            setOpenModalSalida(false);
            fetchGuias();
          }}
        />
      )}

      <ModalDetalleGuiaRemision
        open={!!guiaDetalle}
        onClose={() => setGuiaDetalle(null)}
        guia={guiaDetalle}
      />

      <div style={{ display: 'none' }}>
        <PrintGuiaRemisionA4 ref={printRef} guia={guiaParaImprimir} />
      </div>
    </Box>
  );
}

