import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box 
} from '@mui/material';
import api from '../../../core/api/axios';

const ConfiguracionIgvPage = () => {
  const [impuestos, setImpuestos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalForm, setModalForm] = useState({ nombre: '', tasa: '', codigo_sunat: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const getArray = (data) => Array.isArray(data) ? data : (data.results || data.data || []);
      const res = await api.get('/ventas/impuestos/');
      setImpuestos(getArray(res.data));
    } catch (error) {
      console.error(error);
      setImpuestos([]);
    }
  };

  const handleOpenModal = () => {
    setModalForm({ nombre: '', tasa: '', codigo_sunat: '' });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleGuardarModal = async () => {
    try {
      await api.post('/ventas/impuestos/', {
        nombre: modalForm.nombre,
        tasa: modalForm.tasa,
        codigo_sunat: modalForm.codigo_sunat
      });
      Swal.fire({icon: 'success', title: 'Creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
      setOpenModal(false);
      cargarDatos();
    } catch (error) {
      Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo crear el registro'});
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/ventas/impuestos/${id}/`);
        Swal.fire({icon: 'success', title: 'Eliminado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
        cargarDatos();
      } catch (error) {
        Swal.fire({icon: 'error', title: 'Error', text: 'El registro está en uso'});
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            Configuración de Impuestos (IGV)
          </h1>
          <p className="text-slate-500 mt-1">Gestione los impuestos que aplican a los repuestos y servicios del inventario.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Listado de Impuestos
          </h2>
          <button 
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> Nuevo Registro
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Tasa (%)</th>
                <th className="p-4 font-medium">Código SUNAT</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
              {impuestos.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="p-4">{i.id}</td>
                  <td className="p-4 font-medium text-slate-800">{i.nombre}</td>
                  <td className="p-4">{i.tasa}%</td>
                  <td className="p-4">{i.codigo_sunat || '-'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleEliminar(i.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              
              {impuestos.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No hay impuestos configurados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MUI Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Impuesto</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Nombre" 
              fullWidth 
              value={modalForm.nombre}
              onChange={e => setModalForm({...modalForm, nombre: e.target.value})}
              placeholder="Ej. IGV 18%"
            />
            <TextField 
              label="Tasa (%)" 
              type="number"
              fullWidth 
              value={modalForm.tasa}
              onChange={e => setModalForm({...modalForm, tasa: e.target.value})}
              placeholder="Ej. 18.00"
            />
            <TextField 
              label="Código SUNAT" 
              fullWidth 
              value={modalForm.codigo_sunat}
              onChange={e => setModalForm({...modalForm, codigo_sunat: e.target.value})}
              placeholder="Ej. 1000"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
          <Button onClick={handleGuardarModal} variant="contained" color="primary">Guardar</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ConfiguracionIgvPage;
