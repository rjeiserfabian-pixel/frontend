import React, { useState } from 'react';
import { Search, MonitorPlay, CreditCard, Banknote, FileText, CheckCircle, Lock, DoorOpen } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box, Typography, Divider 
} from '@mui/material';

export const CajaPage = () => {
  const [isCajaAbierta, setIsCajaAbierta] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ventaActiva, setVentaActiva] = useState(null);
  const [pagosMixtos, setPagosMixtos] = useState([]);
  const [montoPago, setMontoPago] = useState('');
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('Efectivo');
  const [modoVenta, setModoVenta] = useState('TICKET'); // 'TICKET' o 'DIRECTA'

  // Mocks
  const metodosDisponibles = ['Efectivo', 'Yape', 'Plin', 'Visa / Mastercard'];
  const totalAPagar = ventaActiva ? ventaActiva.total : 0;
  const totalPagado = pagosMixtos.reduce((acc, p) => acc + p.monto, 0);
  const saldoPendiente = totalAPagar - totalPagado;

  // States para Modals
  const [openAperturaModal, setOpenAperturaModal] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState('100.00');

  const [openCierreModal, setOpenCierreModal] = useState(false);
  const [saldoCierre, setSaldoCierre] = useState('');

  const aperturarCaja = () => {
    setSaldoInicial('100.00');
    setOpenAperturaModal(true);
  };

  const confirmarApertura = () => {
    setIsCajaAbierta(true);
    setOpenAperturaModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Caja Abierta',
      text: `Turno iniciado con S/ ${saldoInicial}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const cerrarCaja = () => {
    setSaldoCierre('');
    setOpenCierreModal(true);
  };

  const confirmarCierre = () => {
    setIsCajaAbierta(false);
    setVentaActiva(null);
    setOpenCierreModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Caja Cerrada',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const buscarTicket = () => {
    if (ticketSearch === 'TK-048' || ticketSearch === 'TK-482') {
      setVentaActiva({
        id: 1,
        cliente: 'Juan Pérez',
        placa: 'ABC-123',
        detalles: [
          { nombre: 'Filtro de Aire Premium', precio: 45.00, cantidad: 1 },
          { nombre: 'Aceite Sintético 5W30', precio: 150.00, cantidad: 2 }
        ],
        total: 345.00
      });
      setPagosMixtos([]);
      setMontoPago('345.00'); // Por defecto llenar el total
    } else {
      Swal.fire({ icon: 'error', title: 'No encontrado', text: 'Ticket no válido o ya cobrado' });
    }
  };

  const agregarPago = () => {
    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) return;
    if (monto > saldoPendiente) {
      Swal.fire({ icon: 'warning', title: 'Monto excede saldo' });
      return;
    }
    
    setPagosMixtos([...pagosMixtos, { metodo: metodoSeleccionado, monto }]);
    const nuevoSaldo = saldoPendiente - monto;
    setMontoPago(nuevoSaldo > 0 ? nuevoSaldo.toFixed(2) : '');
  };

  const procesarVenta = () => {
    Swal.fire({
      icon: 'success',
      title: 'Venta Procesada Exitosamente',
      text: 'Se ha descontado el stock y generado el comprobante B001-000452',
      confirmButtonColor: '#3b82f6',
    }).then(() => {
      setVentaActiva(null);
      setTicketSearch('');
      setPagosMixtos([]);
    });
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER DE CAJA */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <MonitorPlay className="text-blue-600" size={32} />
            Punto de Venta
          </h1>
          <p className="text-slate-500 mt-1">Gestión de cobros, facturación y control de caja.</p>
        </div>
        
        <div>
          {!isCajaAbierta ? (
            <button 
              onClick={aperturarCaja}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <DoorOpen size={20} /> Aperturar Turno
            </button>
          ) : (
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-medium border border-emerald-200">
                 <CheckCircle size={20} /> Caja Abierta
               </div>
               <button 
                onClick={cerrarCaja}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
              >
                <Lock size={20} /> Cerrar Caja
              </button>
             </div>
          )}
        </div>
      </div>

      {!isCajaAbierta ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-500 shadow-sm">
           <Lock size={64} className="mb-4 text-slate-300" />
           <h2 className="text-2xl font-medium text-slate-700">La caja está cerrada</h2>
           <p className="mt-2 text-slate-500">Debe aperturar el turno para poder procesar cobros y ventas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-full min-h-[600px]">
          
          {/* LADO IZQUIERDO: Buscador y Carrito */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
               <div className="flex bg-slate-100 rounded-xl p-1 w-full max-w-sm border border-slate-200">
                 <button 
                   onClick={() => { setModoVenta('TICKET'); setVentaActiva(null); setTicketSearch(''); }}
                   className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${modoVenta === 'TICKET' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Cobrar Ticket Kiosko
                 </button>
                 <button 
                   onClick={() => { setModoVenta('DIRECTA'); setVentaActiva(null); }}
                   className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${modoVenta === 'DIRECTA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Venta Directa
                 </button>
               </div>
               
               {modoVenta === 'TICKET' ? (
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                   <input 
                     type="text" 
                     value={ticketSearch}
                     onChange={(e) => setTicketSearch(e.target.value.toUpperCase())}
                     onKeyDown={(e) => e.key === 'Enter' && buscarTicket()}
                     placeholder="Escanear o ingresar Ticket (Ej. TK-048)..."
                     className="w-full bg-white border border-slate-200 text-slate-800 text-xl p-4 pl-14 rounded-xl focus:outline-none focus:border-blue-500 transition-all uppercase placeholder:normal-case placeholder:text-slate-400 shadow-sm"
                   />
                   <button onClick={buscarTicket} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                     Buscar
                   </button>
                 </div>
               ) : (
                 <div className="flex gap-2">
                    <input 
                     type="text" 
                     placeholder="Buscar repuesto para añadir..."
                     className="flex-1 bg-white border border-slate-200 text-slate-800 p-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                   />
                   <button onClick={() => {
                     // Simular añadir item
                     const newItem = { nombre: 'Repuesto Mostrador', precio: 50.00, cantidad: 1 };
                     setVentaActiva(prev => {
                       const current = prev || { cliente: 'Público General', placa: 'N/A', detalles: [], total: 0 };
                       return {
                         ...current,
                         detalles: [...current.detalles, newItem],
                         total: current.total + 50.00
                       };
                     });
                     // Actualizar pagos mixtos si ya había (simplificado)
                     setPagosMixtos([]);
                     setMontoPago((totalAPagar + 50.00).toFixed(2));
                   }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                     Añadir
                   </button>
                 </div>
               )}
            </div>

            {ventaActiva ? (
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Cliente: {ventaActiva.cliente}</h3>
                    <p className="text-slate-500">Placa Vehículo: <span className="font-mono text-blue-600 font-medium">{ventaActiva.placa}</span></p>
                  </div>
                  <div className="bg-slate-100 px-4 py-2 rounded-lg text-slate-600 font-medium border border-slate-200">
                    Ticket: <span className="text-slate-800">{ticketSearch}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="text-slate-500 border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 font-medium rounded-tl-lg">Producto / Servicio</th>
                        <th className="py-3 px-4 font-medium text-center">Cant</th>
                        <th className="py-3 px-4 font-medium text-right">Precio</th>
                        <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {ventaActiva.detalles.map((d, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-4 px-4">{d.nombre}</td>
                          <td className="py-4 px-4 text-center">{d.cantidad}</td>
                          <td className="py-4 px-4 text-right">S/ {d.precio.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-semibold text-slate-800">S/ {(d.precio * d.cantidad).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                 <FileText size={64} className="mb-4 text-slate-200" />
                 <h2 className="text-2xl font-medium text-slate-600">
                   {modoVenta === 'TICKET' ? 'Esperando Ticket' : 'Carrito Vacío'}
                 </h2>
                 <p className="mt-2 text-slate-500">
                   {modoVenta === 'TICKET' ? 'Escanee el código impreso en el kiosko.' : 'Añada repuestos manualmente para la venta directa.'}
                 </p>
              </div>
            )}
          </div>

          {/* LADO DERECHO: Pagos Mixtos y Cobro */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Resumen y Pago</h2>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 flex justify-between items-center">
               <span className="text-slate-600 text-lg">Total a Pagar</span>
               <span className="text-4xl font-bold text-blue-600">S/ {totalAPagar.toFixed(2)}</span>
            </div>

            {ventaActiva && (
              <>
                {/* Selector Comprobante */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button className="bg-blue-50 border-2 border-blue-500 text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <FileText size={20} /> BOLETA
                  </button>
                  <button className="bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                    <FileText size={20} /> FACTURA
                  </button>
                </div>

                {/* Pagos Mixtos */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Ingreso de Pagos</h3>
                  
                  <div className="flex gap-2 mb-4">
                    <select 
                      value={metodoSeleccionado}
                      onChange={(e) => setMetodoSeleccionado(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
                    >
                      {metodosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input 
                      type="number" 
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      placeholder="Monto"
                      className="flex-1 bg-white border border-slate-300 text-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                    <button 
                      onClick={agregarPago}
                      disabled={saldoPendiente <= 0}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Añadir
                    </button>
                  </div>

                  {/* Lista de pagos ingresados */}
                  <div className="space-y-2 mb-4">
                    {pagosMixtos.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          {p.metodo === 'Efectivo' ? <Banknote size={20} className="text-emerald-600" /> : <CreditCard size={20} className="text-blue-600" />}
                          <span className="text-slate-700 font-medium">{p.metodo}</span>
                        </div>
                        <span className="text-slate-800 font-bold">S/ {p.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {saldoPendiente > 0 ? (
                    <div className="text-right text-red-500 font-medium">
                      Falta cubrir: S/ {saldoPendiente.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-right text-emerald-600 font-medium flex justify-end items-center gap-2">
                      <CheckCircle size={20} /> Pago completado
                    </div>
                  )}
                </div>

                <button 
                  onClick={procesarVenta}
                  disabled={saldoPendiente > 0}
                  className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xl py-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle size={28} />
                  PROCESAR VENTA
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MUI Dialog Apertura Caja */}
      <Dialog open={openAperturaModal} onClose={() => setOpenAperturaModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Aperturar Caja</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ingrese el saldo base (sencillo) para iniciar el turno.
            </Typography>
            <TextField 
              label="Saldo Inicial (S/)" 
              type="number"
              fullWidth 
              value={saldoInicial}
              onChange={e => setSaldoInicial(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAperturaModal(false)} color="inherit">Cancelar</Button>
          <Button onClick={confirmarApertura} variant="contained" color="primary">Aperturar Turno</Button>
        </DialogActions>
      </Dialog>

      {/* MUI Dialog Cierre Caja */}
      <Dialog open={openCierreModal} onClose={() => setOpenCierreModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cierre de Caja (Reporte Z)</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Saldo Inicial:</Typography>
              <Typography fontWeight="bold">S/ 100.00</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
              <Typography>Ingresos Ventas:</Typography>
              <Typography fontWeight="bold">S/ 450.00</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'primary.main', mb: 2 }}>
              <Typography variant="h6">Total Esperado (Físico):</Typography>
              <Typography variant="h6" fontWeight="bold">S/ 550.00</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ingrese el conteo real físico en caja:
            </Typography>
            <TextField 
              label="Saldo Real Físico (S/)" 
              type="number"
              fullWidth 
              value={saldoCierre}
              onChange={e => setSaldoCierre(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCierreModal(false)} color="inherit">Cancelar</Button>
          <Button onClick={confirmarCierre} variant="contained" color="error">Confirmar Cierre</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CajaPage;
