import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Lock, DoorOpen, Banknote, List as ListIcon,
  ArrowUpCircle, ArrowDownCircle, Wallet, CalendarClock
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem,
  Grid, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TablePagination
} from '@mui/material';
import api from '../../../core/api/axios';

export const CajaPage = () => {
  const [isCajaAbierta, setIsCajaAbierta] = useState(false);
  const [cajaActual, setCajaActual] = useState(null);
  const [cajaActualSesionId, setCajaActualSesionId] = useState(null);
  const [cajasDisponibles, setCajasDisponibles] = useState([]);
  
  // Dashboard states
  const [saldoInicialStats, setSaldoInicialStats] = useState(0);
  const [ingresosStats, setIngresosStats] = useState(0);
  const [egresosStats, setEgresosStats] = useState(0);
  const [saldoActualStats, setSaldoActualStats] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [fechaApertura, setFechaApertura] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalMovimientos, setTotalMovimientos] = useState(0);

  // States para Modals
  const [openAperturaModal, setOpenAperturaModal] = useState(false);
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('100.00'); // default 100

  const [openCierreModal, setOpenCierreModal] = useState(false);
  const [saldoCierre, setSaldoCierre] = useState('');

  useEffect(() => {
    cargarCajas();
    verificarSesionActiva();
  }, []);

  useEffect(() => {
    if (cajaActualSesionId) {
      fetchDetalleSesion(cajaActualSesionId, page, rowsPerPage);
    }
  }, [page, rowsPerPage, cajaActualSesionId]);

  const cargarCajas = async () => {
    try {
      const res = await api.get('/ventas/cajas/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCajasDisponibles(data);
      if (data.length > 0) setCajaSeleccionadaId(data[0].id);
    } catch (error) {
      console.error('Error al cargar cajas:', error);
    }
  };

  const verificarSesionActiva = () => {
    const sesionStr = localStorage.getItem('sesion_caja_activa');
    if (sesionStr) {
      try {
        const sesion = JSON.parse(sesionStr);
        if (sesion.id) {
          setCajaActualSesionId(sesion.id);
          setIsCajaAbierta(true);
          setCajaActual({ id: sesion.caja_id, nombre: sesion.caja_nombre });
          if (sesion.abierto_en) setFechaApertura(new Date(sesion.abierto_en).toLocaleString());
          fetchDetalleSesion(sesion.id, page, rowsPerPage);
        }
      } catch(e) {}
    }
  };

  const fetchDetalleSesion = async (sesionId, currentPage = page, currentRows = rowsPerPage) => {
    try {
      const res = await api.get(`/ventas/sesiones/${sesionId}/detalle-activa/`, {
        params: {
          page: currentPage + 1,
          page_size: currentRows
        }
      });
      const d = res.data;
      setSaldoInicialStats(d.saldo_inicial || 0);
      setIngresosStats(d.ingresos || 0);
      setEgresosStats(d.egresos || 0);
      setSaldoActualStats(d.saldo_actual || 0);
      
      if (d.movimientos && d.movimientos.results) {
        setMovimientos(d.movimientos.results);
        setTotalMovimientos(d.movimientos.count);
      } else {
        setMovimientos(d.movimientos || []);
        setTotalMovimientos((d.movimientos || []).length);
      }
    } catch (error) {
      console.error('Error fetching session detail:', error);
    }
  };

  const aperturarCaja = () => {
    setSaldoInicial('100.00');
    setOpenAperturaModal(true);
  };

  const confirmarApertura = async () => {
    if (!cajaSeleccionadaId) {
      Swal.fire('Atención', 'Debe seleccionar una caja para aperturar el turno.', 'warning');
      return;
    }
    
    try {
      const res = await api.post('/ventas/sesiones/aperturar/', {
        caja_id: cajaSeleccionadaId,
        saldo_inicial: parseFloat(saldoInicial) || 0
      });
      
      const sesion = res.data;
      const cajaObj = cajasDisponibles.find(c => c.id === cajaSeleccionadaId);
      
      localStorage.setItem('sesion_caja_activa', JSON.stringify({
        id: sesion.id,
        caja_id: cajaObj?.id,
        caja_nombre: cajaObj?.nombre || 'Caja',
        abierto_en: sesion.fecha_apertura
      }));
      
      setIsCajaAbierta(true);
      setCajaActual(cajaObj);
      setCajaActualSesionId(sesion.id);
      if (sesion.fecha_apertura) setFechaApertura(new Date(sesion.fecha_apertura).toLocaleString());
      setOpenAperturaModal(false);
      
      fetchDetalleSesion(sesion.id);
      
      Swal.fire({
        icon: 'success',
        title: `Caja ${cajaObj?.nombre || ''} Abierta`,
        text: `Turno iniciado con S/ ${saldoInicial}`,
        toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
      });
    } catch (error) {
      const msg = error.response?.data?.error || 'No se pudo aperturar la caja.';
      Swal.fire('Error', msg, 'error');
    }
  };

  const cerrarCaja = () => {
    setSaldoCierre('');
    setOpenCierreModal(true);
  };

  const confirmarCierre = async () => {
    try {
      if (cajaActualSesionId) {
        await api.post(`/ventas/sesiones/${cajaActualSesionId}/cerrar/`, {
          saldo_cierre_real: parseFloat(saldoCierre) || 0
        });
      }
      
      localStorage.removeItem('sesion_caja_activa');
      
      setIsCajaAbierta(false);
      setCajaActual(null);
      setCajaActualSesionId(null);
      setMovimientos([]);
      setOpenCierreModal(false);
      
      Swal.fire({
        icon: 'success', title: 'Caja Cerrada',
        toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
      });
    } catch (error) {
      const msg = error.response?.data?.error || 'No se pudo cerrar la caja.';
      Swal.fire('Error', msg, 'error');
    }
  };

  // Componentes Auxiliares
  const SummaryCard = ({ title, value, icon, colorClass, bgClass }) => (
    <Paper elevation={0} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
      <Box className={`p-4 rounded-2xl ${bgClass} ${colorClass}`}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight="medium" textTransform="uppercase" letterSpacing={1}>{title}</Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5, color: '#1e293b' }}>
          S/ {value.toFixed(2)}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Banknote className="text-blue-600" size={32} />
            Gestión de Caja
          </h1>
          <p className="text-slate-500 mt-1">Apertura, cierre y control de caja en tiempo real.</p>
        </div>
        
        <div>
          {!isCajaAbierta ? (
            <button 
              onClick={aperturarCaja}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
            >
              <DoorOpen size={20} /> Aperturar Turno
            </button>
          ) : (
             <div className="flex items-center gap-4">
               <div className="flex flex-col text-blue-800 bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100">
                 <div className="flex items-center gap-2 font-medium">
                   <CheckCircle size={18} className="text-blue-600"/> Sesión Activa
                 </div>
                 <span className="text-xs font-bold uppercase">{cajaActual?.nombre || 'Caja'}</span>
               </div>
               <button 
                onClick={cerrarCaja}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <Lock size={20} /> Cerrar Caja
              </button>
             </div>
          )}
        </div>
      </div>

      {!isCajaAbierta ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-slate-500 shadow-sm">
           <Lock size={80} className="mb-6 text-slate-200" strokeWidth={1} />
           <h2 className="text-3xl font-medium text-slate-700">Caja Cerrada</h2>
           <p className="mt-3 text-slate-500 text-lg">Debe aperturar el turno para poder registrar ventas y movimientos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* DASHBOARD CARDS */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard 
                title="Saldo Inicial" 
                value={saldoInicialStats} 
                icon={<Wallet size={32} />} 
                bgClass="bg-slate-100" 
                colorClass="text-slate-600" 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard 
                title="Ingresos" 
                value={ingresosStats} 
                icon={<ArrowUpCircle size={32} />} 
                bgClass="bg-emerald-100" 
                colorClass="text-emerald-600" 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard 
                title="Egresos" 
                value={egresosStats} 
                icon={<ArrowDownCircle size={32} />} 
                bgClass="bg-red-100" 
                colorClass="text-red-600" 
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard 
                title="Saldo Actual" 
                value={saldoActualStats} 
                icon={<Banknote size={32} />} 
                bgClass="bg-blue-100" 
                colorClass="text-blue-600" 
              />
            </Grid>
          </Grid>

          {/* MOVIMIENTOS TABLE */}
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ListIcon size={20} className="text-slate-400" />
                Historial de Movimientos
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarClock size={16} /> Aperturado: {fechaApertura}
              </Typography>
            </Box>
            
            <TableContainer sx={{ maxHeight: 500, bgcolor: 'white' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#f8fafc' }}>Fecha / Hora</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#f8fafc' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#f8fafc' }}>Concepto / Referencia</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#f8fafc' }}>Método de Pago</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#64748b', bgcolor: '#f8fafc' }}>Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                        No hay movimientos registrados en este turno.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((mov) => (
                      <TableRow key={mov.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ color: '#475569' }}>
                          {new Date(mov.fecha).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={mov.tipo} 
                            size="small" 
                            sx={{ 
                              fontWeight: 'bold', 
                              borderRadius: 2,
                              bgcolor: mov.tipo === 'INGRESO' ? '#d1fae5' : '#fee2e2',
                              color: mov.tipo === 'INGRESO' ? '#059669' : '#dc2626'
                            }} 
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                          {mov.concepto}
                          {mov.referencia && <span className="text-slate-400 block text-xs font-normal">{mov.referencia}</span>}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b' }}>{mov.metodo_pago_nombre || '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: mov.tipo === 'INGRESO' ? '#059669' : '#dc2626' }}>
                          {mov.tipo === 'INGRESO' ? '+' : '-'} S/ {parseFloat(mov.monto).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalMovimientos || 0}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelDisplayedRows={({ from, to, count }) => {
                return `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`;
              }}
              labelRowsPerPage="Filas por página:"
            />
          </Paper>
        </div>
      )}

      {/* MUI Dialog Apertura Caja */}
      <Dialog open={openAperturaModal} onClose={() => setOpenAperturaModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Aperturar Caja</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Seleccione la caja física y el efectivo disponible (sencillo) con el que inicia el turno.
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Caja</InputLabel>
              <Select
                value={cajaSeleccionadaId}
                label="Caja"
                onChange={e => setCajaSeleccionadaId(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {cajasDisponibles.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} {c.sucursal_nombre ? `(${c.sucursal_nombre})` : ''}
                  </MenuItem>
                ))}
                {cajasDisponibles.length === 0 && (
                  <MenuItem disabled value="">No hay cajas configuradas</MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField 
              label="Efectivo Inicial (S/)" 
              type="number"
              fullWidth 
              value={saldoInicial}
              onChange={e => setSaldoInicial(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAperturaModal(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button onClick={confirmarApertura} variant="contained" color="primary" sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}>Aperturar Turno</Button>
        </DialogActions>
      </Dialog>

      {/* MUI Dialog Cierre Caja */}
      <Dialog open={openCierreModal} onClose={() => setOpenCierreModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1, color: '#dc2626' }}>Cierre de Caja</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Saldo Inicial:</Typography>
              <Typography fontWeight="bold">S/ {saldoInicialStats.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
              <Typography>Total Ingresos:</Typography>
              <Typography fontWeight="bold">S/ {ingresosStats.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <Typography>Total Egresos:</Typography>
              <Typography fontWeight="bold">-S/ {egresosStats.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', mb: 3 }}>
              <Typography variant="h6">Saldo del Sistema:</Typography>
              <Typography variant="h6" fontWeight="bold">S/ {saldoActualStats.toFixed(2)}</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ingrese el conteo real físico en caja (Arqueo):
            </Typography>
            <TextField 
              label="Saldo Real Físico (S/)" 
              type="number"
              fullWidth 
              value={saldoCierre}
              onChange={e => setSaldoCierre(e.target.value)}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCierreModal(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button onClick={confirmarCierre} variant="contained" color="error" sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}>Confirmar Cierre</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CajaPage;
