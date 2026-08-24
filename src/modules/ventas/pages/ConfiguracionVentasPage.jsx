import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControlLabel, Checkbox, Box,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import api from '../../../core/api/axios'; 

const ConfiguracionVentasPage = () => {
  const [activeTab, setActiveTab] = useState('metodos'); // metodos, tipos, series
  
  // States para Métodos de Pago
  const [metodos, setMetodos] = useState([]);
  
  // States para Series
  const [series, setSeries] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  // States para Tipos de Comprobante
  const [tiposComprobante, setTiposComprobante] = useState([]);

  // States para Modal MUI
  const [openModal, setOpenModal] = useState(false);
  const [modalForm, setModalForm] = useState({ 
    nombre: '', 
    requiere_referencia: false,
    tipo_comprobante: '',
    serie: '',
    correlativo_actual: 1,
    sucursal_id: '',
    codigo_sunat: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      const getArray = (data) => Array.isArray(data) ? data : (data.results || data.data || []);
      
      if (activeTab === 'metodos') {
        const res = await api.get('/ventas/metodos-pago/');
        setMetodos(getArray(res.data));
      } else if (activeTab === 'tipos') {
        const res = await api.get('/ventas/tipos-comprobante/');
        setTiposComprobante(getArray(res.data));
      } else {
        const resSeries = await api.get('/ventas/series-comprobante/');
        setSeries(getArray(resSeries.data));
        const resSuc = await api.get('/inventario/sucursales/');
        setSucursales(getArray(resSuc.data));
        const resTipos = await api.get('/ventas/tipos-comprobante/');
        setTiposComprobante(getArray(resTipos.data));
      }
    } catch (error) {
      console.error(error);
      setMetodos([]);
      setSeries([]);
    }
  };

  const handleOpenModal = () => {
    setModalForm({ 
      nombre: '', 
      requiere_referencia: false,
      tipo_comprobante: '',
      serie: '',
      correlativo_actual: 1,
      sucursal_id: '',
      codigo_sunat: ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleGuardarModal = async () => {
    try {
      if (activeTab === 'metodos') {
        await api.post('/ventas/metodos-pago/', { 
          nombre: modalForm.nombre, 
          requiere_referencia: modalForm.requiere_referencia 
        });
      } else if (activeTab === 'tipos') {
        await api.post('/ventas/tipos-comprobante/', { 
          nombre: modalForm.nombre, 
          codigo_sunat: modalForm.codigo_sunat,
          estado: true
        });
      } else {
        await api.post('/ventas/series-comprobante/', {
          tipo_comprobante_id: modalForm.tipo_comprobante,
          serie: modalForm.serie,
          correlativo_actual: parseInt(modalForm.correlativo_actual, 10) || 1,
          sucursal_id: modalForm.sucursal_id,
          estado: true
        });
      }
      Swal.fire({icon: 'success', title: 'Creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
      setOpenModal(false);
      cargarDatos();
    } catch (error) {
      Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo crear el registro'});
    }
  };

  const handleEliminar = async (id, tipo) => {
    let endpoint = '';
    if (tipo === 'metodos') endpoint = '/ventas/metodos-pago/';
    else if (tipo === 'tipos') endpoint = '/ventas/tipos-comprobante/';
    else endpoint = '/ventas/series-comprobante/';
    const result = await Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`${endpoint}${id}/`);
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
            Configuraciones de Ventas
          </h1>
          <p className="text-slate-500 mt-1">Gestione los métodos de cobro y series de facturación.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-6">
          <button 
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'metodos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('metodos')}
          >
            Métodos de Pago
          </button>
          <button 
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'tipos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('tipos')}
          >
            Tipos de Comprobante
          </button>
          <button 
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'series' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('series')}
          >
            Series de Comprobante
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              {activeTab === 'metodos' && 'Listado de Métodos de Pago'}
              {activeTab === 'tipos' && 'Tipos de Comprobante'}
              {activeTab === 'series' && 'Series de Comprobante'}
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
                  <th className="p-4 font-medium">{activeTab === 'series' ? 'Serie' : 'Nombre'}</th>
                  {activeTab === 'metodos' && <th className="p-4 font-medium">Requiere Ref.</th>}
                  {activeTab === 'tipos' && <th className="p-4 font-medium">Código SUNAT</th>}
                  {activeTab === 'series' && <th className="p-4 font-medium">Tipo / Correlativo</th>}
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
                {activeTab === 'metodos' && metodos.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-4">{m.id}</td>
                    <td className="p-4 font-medium text-slate-800">{m.nombre}</td>
                    <td className="p-4">{m.requiere_referencia ? 'Sí' : 'No'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEliminar(m.id, 'metodos')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'tipos' && tiposComprobante.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4">{t.id}</td>
                    <td className="p-4 font-medium text-slate-800">{t.nombre}</td>
                    <td className="p-4">{t.codigo_sunat || '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEliminar(t.id, 'tipos')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'series' && series.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4">{s.id}</td>
                    <td className="p-4 font-medium text-slate-800">{s.serie}</td>
                    <td className="p-4">{s.tipo_comprobante_nombre} (Act: {s.correlativo_actual})</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEliminar(s.id, 'series')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {((activeTab === 'metodos' && metodos.length === 0) || 
                  (activeTab === 'tipos' && tiposComprobante.length === 0) || 
                  (activeTab === 'series' && series.length === 0)) && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No hay registros configurados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* MUI Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Registro</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {activeTab === 'metodos' ? (
              <>
                <TextField 
                  label="Nombre" 
                  fullWidth 
                  value={modalForm.nombre}
                  onChange={e => setModalForm({...modalForm, nombre: e.target.value})}
                  placeholder="Ej. Yape"
                />
                <FormControlLabel 
                  control={
                    <Checkbox 
                      checked={modalForm.requiere_referencia} 
                      onChange={e => setModalForm({...modalForm, requiere_referencia: e.target.checked})} 
                    />
                  } 
                  label="Requiere Referencia / Nro Operación" 
                />
              </>
            ) : activeTab === 'tipos' ? (
              <>
                <TextField 
                  label="Nombre" 
                  fullWidth 
                  value={modalForm.nombre}
                  onChange={e => setModalForm({...modalForm, nombre: e.target.value})}
                  placeholder="Ej. Factura, Nota de Crédito"
                />
                <TextField 
                  label="Código SUNAT (Opcional)" 
                  fullWidth 
                  value={modalForm.codigo_sunat}
                  onChange={e => setModalForm({...modalForm, codigo_sunat: e.target.value})}
                  placeholder="Ej. 01, 03, 07"
                />
              </>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Comprobante</InputLabel>
                  <Select
                    value={modalForm.tipo_comprobante}
                    label="Tipo de Comprobante"
                    onChange={e => setModalForm({...modalForm, tipo_comprobante: e.target.value})}
                  >
                    {tiposComprobante.map(tc => (
                      <MenuItem key={tc.id} value={tc.id}>{tc.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField 
                  label="Serie" 
                  fullWidth 
                  value={modalForm.serie}
                  onChange={e => setModalForm({...modalForm, serie: e.target.value})}
                  placeholder="Ej. F001 o B001"
                />

                <TextField 
                  label="Correlativo Inicial" 
                  type="number"
                  fullWidth 
                  value={modalForm.correlativo_actual}
                  onChange={e => setModalForm({...modalForm, correlativo_actual: e.target.value})}
                />

                <FormControl fullWidth>
                  <InputLabel>Sucursal</InputLabel>
                  <Select
                    value={modalForm.sucursal_id}
                    label="Sucursal"
                    onChange={e => setModalForm({...modalForm, sucursal_id: e.target.value})}
                  >
                    {sucursales.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
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

export default ConfiguracionVentasPage;
