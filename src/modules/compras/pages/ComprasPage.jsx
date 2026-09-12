import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, TablePagination, Autocomplete, TextField, MenuItem, IconButton,
  Dialog, DialogContent, DialogActions, Divider, Grid
} from '@mui/material';
import { Plus, FileText, Ban, CreditCard, X, Receipt, Package, Wallet, Truck, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { comprasService } from '../services/comprasApi';
import { proveedorService } from '../../clientes/services/proveedorService';

const ESTADOS = ['Completada', 'Anulada'];
const TIPOS_PAGO = ['Contado', 'Credito'];

const ComprasPage = () => {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState([]);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros
  const [filtroProveedor, setFiltroProveedor] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipoPago, setFiltroTipoPago] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Detalle
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [cuentaDetalle, setCuentaDetalle] = useState(null);

  useEffect(() => {
    proveedorService.listar()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || data.data || []);
        setProveedores(list);
      })
      .catch((error) => console.error('Error al cargar proveedores', error));
  }, []);

  useEffect(() => {
    fetchCompras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filtroProveedor, filtroEstado, filtroTipoPago, filtroFechaDesde, filtroFechaHasta]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, page_size: rowsPerPage };
      if (filtroProveedor) params.proveedor_id = filtroProveedor.id;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroTipoPago) params.tipo_pago = filtroTipoPago;
      if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde;
      if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta;

      const data = await comprasService.getCompras(params);
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCompras(list);
      setTotalCount(data.count !== undefined ? data.count : list.length);
    } catch (error) {
      console.error("Error al cargar compras", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarFiltro = (setter) => (valor) => {
    setPage(0);
    setter(valor);
  };

  const limpiarFiltros = () => {
    setPage(0);
    setFiltroProveedor(null);
    setFiltroEstado('');
    setFiltroTipoPago('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const hayFiltrosActivos = !!(filtroProveedor || filtroEstado || filtroTipoPago || filtroFechaDesde || filtroFechaHasta);

  const verDetalle = async (compra) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    setCompraDetalle(null);
    setCuentaDetalle(null);
    try {
      const data = await comprasService.getCompraById(compra.id);
      setCompraDetalle(data);

      if (data.tipo_pago === 'Credito') {
        const cuentasData = await comprasService.getCuentasPorPagar({ compra_id: compra.id });
        const lista = Array.isArray(cuentasData) ? cuentasData : (cuentasData.results || cuentasData.data || []);
        setCuentaDetalle(lista[0] || null);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el detalle de la compra.', 'error');
    } finally {
      setDetalleLoading(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalleOpen(false);
    setCompraDetalle(null);
    setCuentaDetalle(null);
  };

  const handleAnular = async (compra) => {
    const result = await Swal.fire({
      title: '¿Anular esta compra?',
      html: `Se revertirá el stock ingresado y quedará registrado en el kardex.<br/>Comprobante: <b>${compra.tipo_comprobante_nombre || 'Comprobante'} ${compra.serie}-${compra.numero_comprobante}</b>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await comprasService.anularCompra(compra.id);
      Swal.fire({
        icon: 'success',
        title: 'Compra anulada',
        showConfirmButton: false,
        timer: 1500
      });
      fetchCompras();
    } catch (error) {
      // El backend envuelve los errores como { success, status_code, mensaje, errores }
      // (ver apps/seguridad/exceptions.py). El detalle específico viaja en "errores".
      const data = error.response?.data;
      let mensaje = 'No se pudo anular la compra.';
      if (Array.isArray(data?.errores) && data.errores.length > 0) {
        mensaje = data.errores[0];
      } else if (typeof data?.errores === 'string') {
        mensaje = data.errores;
      } else if (data?.mensaje) {
        mensaje = data.mensaje;
      }
      Swal.fire('No se puede anular', mensaje, 'error');
    }
  };

  const verCuentaPorPagar = (compra) => {
    navigate(`/compras/cuentas-por-pagar/proveedor/${compra.proveedor}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a' }}>
          Listado de Compras
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/compras/nueva')}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            borderRadius: 2
          }}
        >
          Nueva Compra
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Autocomplete
            size="small"
            sx={{ width: 260 }}
            options={proveedores}
            getOptionLabel={(option) => `${option.numero_documento} - ${option.nombre_o_razon_social}`}
            value={filtroProveedor}
            onChange={(e, val) => cambiarFiltro(setFiltroProveedor)(val)}
            renderInput={(params) => <TextField {...params} label="Proveedor" />}
          />
          <TextField
            select
            size="small"
            label="Estado"
            sx={{ width: 160 }}
            value={filtroEstado}
            onChange={(e) => cambiarFiltro(setFiltroEstado)(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Tipo de Pago"
            sx={{ width: 160 }}
            value={filtroTipoPago}
            onChange={(e) => cambiarFiltro(setFiltroTipoPago)(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {TIPOS_PAGO.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            size="small"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            inputProps={{ style: { colorScheme: 'light' } }}
            sx={{ width: 160 }}
            value={filtroFechaDesde}
            onChange={(e) => cambiarFiltro(setFiltroFechaDesde)(e.target.value)}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            inputProps={{ style: { colorScheme: 'light' } }}
            sx={{ width: 160 }}
            value={filtroFechaHasta}
            onChange={(e) => cambiarFiltro(setFiltroFechaHasta)(e.target.value)}
          />
          {hayFiltrosActivos && (
            <Button size="small" onClick={limpiarFiltros} sx={{ textTransform: 'none' }}>
              Limpiar filtros
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Comprobante</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tipo Pago</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay compras registradas.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id} hover>
                    <TableCell>{compra.fecha_emision}</TableCell>
                    <TableCell>
                      {compra.tipo_comprobante_nombre} {compra.serie}-{compra.numero_comprobante}
                    </TableCell>
                    <TableCell>{compra.proveedor_detalle?.nombre_o_razon_social}</TableCell>
                    <TableCell>
                      <Chip
                        label={compra.tipo_pago}
                        color={compra.tipo_pago === 'Contado' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">S/ {parseFloat(compra.total).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={compra.estado}
                        color={compra.estado === 'Completada' ? 'primary' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                        <Button size="small" startIcon={<FileText size={16} />} onClick={() => verDetalle(compra)}>
                          Ver
                        </Button>
                        {compra.tipo_pago === 'Credito' && (
                          <IconButton size="small" color="warning" title="Ver cuenta por pagar" onClick={() => verCuentaPorPagar(compra)}>
                            <CreditCard size={16} />
                          </IconButton>
                        )}
                        {compra.estado === 'Completada' && (
                          <IconButton size="small" color="error" title="Anular compra" onClick={() => handleAnular(compra)}>
                            <Ban size={16} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Modal Detalle de Compra */}
      <Dialog
        open={detalleOpen}
        onClose={cerrarDetalle}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: 'white', px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1.2, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, display: 'flex' }}>
              <Receipt size={22} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                Compra {compraDetalle ? `#${compraDetalle.id}` : ''}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {compraDetalle ? `${compraDetalle.tipo_comprobante_nombre || 'Comprobante'} ${compraDetalle.serie}-${compraDetalle.numero_comprobante}` : 'Detalle de compra'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={cerrarDetalle} sx={{ color: 'white' }}>
            <X size={20} />
          </IconButton>
        </Box>

        <DialogContent sx={{ bgcolor: '#f8fafc', p: 3 }}>
          {detalleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : compraDetalle ? (
            <Box>
              {/* PROVEEDOR Y COMPRA */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%', bgcolor: 'white' }}>
                    <Typography variant="overline" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'primary.main', fontWeight: 700, letterSpacing: 0.5 }}>
                      <Truck size={15} /> Proveedor
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                      {compraDetalle.proveedor_detalle?.nombre_o_razon_social}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {compraDetalle.proveedor_detalle?.numero_documento}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%', bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="overline" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'primary.main', fontWeight: 700, letterSpacing: 0.5 }}>
                        <CalendarDays size={15} /> Compra
                      </Typography>
                      <Chip label={compraDetalle.estado} color={compraDetalle.estado === 'Completada' ? 'success' : 'error'} size="small" />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{compraDetalle.fecha_emision}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* ITEMS */}
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5, bgcolor: 'white' }}>
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                  <Typography variant="overline" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'primary.main', fontWeight: 700, letterSpacing: 0.5 }}>
                    <Package size={15} /> Repuestos Comprados
                  </Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Repuesto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Cant.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>P. Unit.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(compraDetalle.detalles || []).map((det) => (
                      <TableRow key={det.id}>
                        <TableCell sx={{ fontSize: '0.9rem' }}>
                          <Typography variant="body2" fontWeight={600}>{det.repuesto_nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">{det.repuesto_codigo}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.9rem' }}>{det.cantidad}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.9rem' }}>S/ {parseFloat(det.precio_unitario).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>S/ {parseFloat(det.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* PAGO Y TOTALES */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white' }}>
                <Typography variant="overline" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, color: 'primary.main', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>
                  <Wallet size={15} /> Pago y Totales
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={7}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={compraDetalle.tipo_pago === 'Contado' ? undefined : <CreditCard size={14} />}
                        label={compraDetalle.tipo_pago === 'Contado' ? 'Compra al Contado' : 'Compra al Crédito'}
                        color={compraDetalle.tipo_pago === 'Contado' ? 'default' : 'warning'}
                        sx={{ fontWeight: 600 }}
                      />
                      {cuentaDetalle && (
                        <Chip label={`Cuenta por pagar: ${cuentaDetalle.estado}`} size="small" variant="outlined" />
                      )}
                    </Box>
                    {compraDetalle.observaciones && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Observaciones</Typography>
                        <Typography variant="body2">{compraDetalle.observaciones}</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2.5, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                        <Typography variant="body2" fontWeight={600}>S/ {parseFloat(compraDetalle.subtotal).toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">IGV</Typography>
                        <Typography variant="body2" fontWeight={600}>S/ {parseFloat(compraDetalle.igv).toFixed(2)}</Typography>
                      </Box>
                      <Divider sx={{ mb: 1.5, borderColor: '#bfdbfe' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight={700}>TOTAL</Typography>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                          S/ {parseFloat(compraDetalle.total).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          ) : (
            <Typography color="text.secondary">No se pudo cargar el detalle.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f8fafc', px: 3, py: 2 }}>
          {compraDetalle?.tipo_pago === 'Credito' && (
            <Button onClick={() => verCuentaPorPagar(compraDetalle)} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Ver cuenta por pagar
            </Button>
          )}
          <Button onClick={cerrarDetalle} variant="outlined" color="primary" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComprasPage;
