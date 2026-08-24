import React, { useState } from 'react';
import { MonitorPlay, CheckCircle, Lock, DoorOpen, Banknote, List as ListIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box, Typography, Divider 
} from '@mui/material';

export const CajaPage = () => {
  const [isCajaAbierta, setIsCajaAbierta] = useState(false);
  
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

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500 bg-slate-50 min-h-[calc(100vh-64px)]">
      
      {/* HEADER DE CAJA */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Banknote className="text-emerald-600" size={32} />
            Gestión de Caja
          </h1>
          <p className="text-slate-500 mt-1">Apertura, cierre y control de movimientos de efectivo.</p>
        </div>
        
        <div>
          {!isCajaAbierta ? (
            <button 
              onClick={aperturarCaja}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
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
           <p className="mt-2 text-slate-500">Debe aperturar el turno para poder registrar movimientos.</p>
        </div>
      ) : (
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <ListIcon size={20} className="text-slate-500" /> Historial de Movimientos
            </h2>
          </div>
          
          <div className="flex-1 overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-medium">Hora</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium">Concepto</th>
                  <th className="p-4 font-medium">Método</th>
                  <th className="p-4 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100">
                {/* Mocks de Movimientos */}
                <tr className="hover:bg-slate-50">
                  <td className="p-4">10:45 AM</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">INGRESO</span></td>
                  <td className="p-4">Venta (Ticket TK-048)</td>
                  <td className="p-4">Efectivo</td>
                  <td className="p-4 text-right font-semibold text-slate-800">S/ 150.00</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4">11:20 AM</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">INGRESO</span></td>
                  <td className="p-4">Venta (Ticket TK-049)</td>
                  <td className="p-4">Yape</td>
                  <td className="p-4 text-right font-semibold text-slate-800">S/ 45.00</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4">01:15 PM</td>
                  <td className="p-4"><span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">EGRESO</span></td>
                  <td className="p-4">Egreso Manual (Pago proveedor)</td>
                  <td className="p-4">Efectivo</td>
                  <td className="p-4 text-right font-semibold text-slate-800">-S/ 50.00</td>
                </tr>
              </tbody>
            </table>
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
          <Button onClick={confirmarApertura} variant="contained" color="success">Aperturar Turno</Button>
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
              <Typography>Ingresos Efectivo:</Typography>
              <Typography fontWeight="bold">S/ 150.00</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
              <Typography>Egresos Efectivo:</Typography>
              <Typography fontWeight="bold">-S/ 50.00</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'primary.main', mb: 2 }}>
              <Typography variant="h6">Total Esperado (Efectivo):</Typography>
              <Typography variant="h6" fontWeight="bold">S/ 200.00</Typography>
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
