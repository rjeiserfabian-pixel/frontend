import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControlLabel, Checkbox, Box,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import api from '../../../core/api/axios'; 

const ConfiguracionVentasPage = () => {
  const [activeTab, setActiveTab] = useState('metodos'); // metodos, tipos, series, cajas
  
  // States para Métodos de Pago
  const [metodos, setMetodos] = useState([]);
  
  // States para Series y Cajas
  const [series, setSeries] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [cajas, setCajas] = useState([]);
  
  // States para Tipos de Comprobante
  const [tiposComprobante, setTiposComprobante] = useState([]);

  // States para Modal MUI
  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [modalForm, setModalForm] = useState({ 
    nombre: '', 
    requiere_referencia: false,
    tipo_comprobante: '',
    serie: '',
    correlativo_actual: 1,
    sucursal_id: '',
    codigo_sunat: '',
    almacen_defecto_id: ''
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
      } else if (activeTab === 'cajas') {
        const resCajas = await api.get('/ventas/cajas/');
        setCajas(getArray(resCajas.data));
        const resSuc = await api.get('/inventario/sucursales/');
        setSucursales(getArray(resSuc.data));
        const resAlm = await api.get('/inventario/almacenes/');
        setAlmacenes(getArray(resAlm.data));
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
    setEditId(null);
    setModalForm({ 
      nombre: '', 
      requiere_referencia: false,
      tipo_comprobante: '',
      serie: '',
      correlativo_actual: 0,
      sucursal_id: '',
      codigo_sunat: '',
      almacen_defecto_id: ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleEditar = (item, tipo) => {
    setEditId(item.id);
    if (tipo === 'metodos') {
      setModalForm({ ...modalForm, nombre: item.nombre, requiere_referencia: item.requiere_referencia });
    } else if (tipo === 'tipos') {
      setModalForm({ ...modalForm, nombre: item.nombre, codigo_sunat: item.codigo_sunat || '' });
    } else if (tipo === 'cajas') {
      setModalForm({ 
        ...modalForm, 
        nombre: item.nombre, 
        sucursal_id: item.sucursal,
        almacen_defecto_id: item.almacen_defecto || ''
      });
    } else if (tipo === 'series') {
      setModalForm({ 
        ...modalForm, 
        tipo_comprobante: item.tipo_comprobante, 
        serie: item.serie, 
        correlativo_actual: item.correlativo_actual,
        sucursal_id: item.sucursal
      });
    }
    setOpenModal(true);
  };

  const handleGuardarModal = async () => {
    try {
      let savedId = editId;
      if (activeTab === 'metodos') {
        const payload = { 
          nombre: modalForm.nombre, 
          requiere_referencia: modalForm.requiere_referencia 
        };
        if (editId) await api.put(`/ventas/metodos-pago/${editId}/`, payload);
        else { const res = await api.post('/ventas/metodos-pago/', payload); savedId = res.data.id; }
      } else if (activeTab === 'tipos') {
        const payload = { 
          nombre: modalForm.nombre, 
          codigo_sunat: modalForm.codigo_sunat,
          estado: true
        };
        if (editId) await api.put(`/ventas/tipos-comprobante/${editId}/`, payload);
        else { const res = await api.post('/ventas/tipos-comprobante/', payload); savedId = res.data.id; }
      } else if (activeTab === 'cajas') {
        const payload = { 
          nombre: modalForm.nombre, 
          sucursal: modalForm.sucursal_id,
          almacen_defecto: modalForm.almacen_defecto_id || null,
          estado: true
        };
        if (editId) await api.put(`/ventas/cajas/${editId}/`, payload);
        else { const res = await api.post('/ventas/cajas/', payload); savedId = res.data.id; }
      } else {
        const payload = {
          tipo_comprobante: modalForm.tipo_comprobante,
          serie: modalForm.serie,
          correlativo_actual: modalForm.correlativo_actual !== '' ? parseInt(modalForm.correlativo_actual, 10) : 0,
          sucursal: modalForm.sucursal_id,
          estado: true
        };
        if (editId) await api.put(`/ventas/series-comprobante/${editId}/`, payload);
        else { const res = await api.post('/ventas/series-comprobante/', payload); savedId = res.data.id; }
      }
      Swal.fire({icon: 'success', title: editId ? 'Actualizado' : 'Creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
      setOpenModal(false);
      await cargarDatos();
      
      if (savedId) {
        setHighlightId(savedId);
        setTimeout(() => {
          const el = document.getElementById(`row-${savedId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => setHighlightId(null), 3000);
      }
    } catch (error) {
      Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo guardar el registro'});
    }
  };

  const handleEliminar = async (id, tipo) => {
    let endpoint = '';
    if (tipo === 'metodos') endpoint = '/ventas/metodos-pago/';
    else if (tipo === 'tipos') endpoint = '/ventas/tipos-comprobante/';
    else if (tipo === 'cajas') endpoint = '/ventas/cajas/';
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
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'cajas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('cajas')}
          >
            Cajas
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
              {activeTab === 'cajas' && 'Cajas Registradoras'}
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
                  <th className="p-4 font-medium">Nº</th>
                  <th className="p-4 font-medium">{activeTab === 'series' ? 'Serie' : 'Nombre'}</th>
                  {activeTab === 'metodos' && <th className="p-4 font-medium">Requiere Ref.</th>}
                  {activeTab === 'tipos' && <th className="p-4 font-medium">Código SUNAT</th>}
                  {activeTab === 'cajas' && <th className="p-4 font-medium">Sucursal</th>}
                  {activeTab === 'cajas' && <th className="p-4 font-medium">Almacén por Defecto</th>}
                  {activeTab === 'series' && <th className="p-4 font-medium">Tipo / Correlativo</th>}
                  {activeTab === 'series' && <th className="p-4 font-medium">Sucursal</th>}
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-100 bg-white">
                {activeTab === 'metodos' && metodos.map((m, index) => (
                  <tr key={m.id} id={`row-${m.id}`} className={`transition-colors duration-1000 ${highlightId === m.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{m.nombre}</td>
                    <td className="p-4">{m.requiere_referencia ? 'Sí' : 'No'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditar(m, 'metodos')} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => handleEliminar(m.id, 'metodos')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'tipos' && tiposComprobante.map((t, index) => (
                  <tr key={t.id} id={`row-${t.id}`} className={`transition-colors duration-1000 ${highlightId === t.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{t.nombre}</td>
                    <td className="p-4">{t.codigo_sunat || '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditar(t, 'tipos')} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => handleEliminar(t.id, 'tipos')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'series' && series.map((s, index) => (
                  <tr key={s.id} id={`row-${s.id}`} className={`transition-colors duration-1000 ${highlightId === s.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{s.serie}</td>
                    <td className="p-4">{s.tipo_comprobante_nombre} (Act: {s.correlativo_actual})</td>
                    <td className="p-4">{s.sucursal_nombre || 'Sede Principal / Global'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditar(s, 'series')} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => handleEliminar(s.id, 'series')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'cajas' && cajas.map((c, index) => (
                  <tr key={c.id} id={`row-${c.id}`} className={`transition-colors duration-1000 ${highlightId === c.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}>
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{c.nombre}</td>
                    <td className="p-4">{c.sucursal_nombre}</td>
                    <td className="p-4">{c.almacen_nombre || '-'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditar(c, 'cajas')} className="text-blue-500 hover:text-blue-700 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => handleEliminar(c.id, 'cajas')} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}

                {((activeTab === 'metodos' && metodos.length === 0) || 
                  (activeTab === 'tipos' && tiposComprobante.length === 0) || 
                  (activeTab === 'cajas' && cajas.length === 0) ||
                  (activeTab === 'series' && series.length === 0)) && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No hay registros configurados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* MUI Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar Registro' : 'Nuevo Registro'}</DialogTitle>
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
            ) : activeTab === 'cajas' ? (
              <>
                <TextField 
                  label="Nombre de la Caja" 
                  fullWidth 
                  value={modalForm.nombre}
                  onChange={e => setModalForm({...modalForm, nombre: e.target.value})}
                  placeholder="Ej. Caja Principal, Caja Taller"
                />
                <FormControl fullWidth>
                  <InputLabel>Sucursal</InputLabel>
                  <Select
                    value={modalForm.sucursal_id}
                    label="Sucursal"
                    onChange={e => {
                      setModalForm({
                        ...modalForm, 
                        sucursal_id: e.target.value,
                        almacen_defecto_id: ''
                      });
                    }}
                  >
                    {sucursales.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth disabled={!modalForm.sucursal_id}>
                  <InputLabel>Almacén por Defecto</InputLabel>
                  <Select
                    value={modalForm.almacen_defecto_id}
                    label="Almacén por Defecto"
                    onChange={e => setModalForm({...modalForm, almacen_defecto_id: e.target.value})}
                  >
                    <MenuItem value=""><em>Ninguno (Toma almacén principal al vender)</em></MenuItem>
                    {almacenes.filter(a => a.sucursal === modalForm.sucursal_id).map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
