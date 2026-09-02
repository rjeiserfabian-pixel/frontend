import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, CircularProgress, MenuItem, Select, FormControl, InputLabel, FormHelperText
} from '@mui/material';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export const UbigeoPage = () => {
  const [activeTab, setActiveTab] = useState('departamentos');

  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'dep', 'prov', 'dist'
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', departamento_id: '', provincia_id: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal Provinces for dropdown (when creating district)
  const [modalProvincias, setModalProvincias] = useState([]);

  // Fetch lists unconditionally on tab switch
  useEffect(() => {
    if (activeTab === 'departamentos' && departamentos.length === 0) {
      fetchDepartamentos();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'provincias' && provincias.length === 0) {
      fetchAllProvincias();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'distritos' && distritos.length === 0) {
      fetchAllDistritos();
    }
  }, [activeTab]);

  // Fetch provinces for modal when departamento changes in modal (for creating/editing districts)
  useEffect(() => {
    if (modalOpen && modalType === 'dist' && formData.departamento_id) {
      fetchProvinciasByDep(formData.departamento_id, setModalProvincias);
    }
  }, [modalOpen, formData.departamento_id, modalType]);

  // Pre-load departamentos if modal opens for prov/dist and they aren't loaded
  useEffect(() => {
    if (modalOpen && modalType !== 'dep' && departamentos.length === 0) {
      fetchDepartamentos();
    }
  }, [modalOpen, modalType]);

  const fetchDepartamentos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/seguridad/departamentos/');
      setDepartamentos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProvincias = async () => {
    try {
      setLoading(true);
      const res = await api.get('/seguridad/provincias/');
      setProvincias(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinciasByDep = async (depId, setter) => {
    try {
      const res = await api.get(`/seguridad/provincias/?departamento=${depId}`);
      setter(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllDistritos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/seguridad/distritos/');
      setDistritos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    setEditData(data);
    
    let defaultDepId = '';
    let defaultProvId = '';
    
    if (data) {
      if (type === 'prov') {
        defaultDepId = data.departamento;
      } else if (type === 'dist') {
        defaultProvId = data.provincia;
        // Asume que el backend envia 'departamento' en el JSON del distrito, de lo contrario esto queda vacio 
        // y el usuario tiene que elegir.
        defaultDepId = data.departamento || ''; 
      }
    }

    setFormData({ 
      nombre: data ? data.nombre : '',
      departamento_id: defaultDepId,
      provincia_id: defaultProvId
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    
    if (modalType === 'prov' && !formData.departamento_id) {
      errors.departamento_id = 'Debe seleccionar un departamento';
    }
    
    if (modalType === 'dist' && !formData.provincia_id) {
      errors.provincia_id = 'Debe seleccionar una provincia';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    try {
      let endpoint = '';
      let payload = { nombre: formData.nombre };

      if (modalType === 'dep') {
        endpoint = '/seguridad/departamentos/';
      } else if (modalType === 'prov') {
        endpoint = '/seguridad/provincias/';
        payload.departamento = formData.departamento_id;
      } else if (modalType === 'dist') {
        endpoint = '/seguridad/distritos/';
        payload.provincia = formData.provincia_id;
      }

      if (editData) {
        await api.put(`${endpoint}${editData.id}/`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setModalOpen(false);
      
      // Refresh lists unconditionally to ensure they are up to date
      if (modalType === 'dep') fetchDepartamentos();
      if (modalType === 'prov') fetchAllProvincias();
      if (modalType === 'dist') fetchAllDistritos();

      Swal.fire('Éxito', 'Guardado correctamente', 'success');
    } catch (error) {
      console.error(error);
      let errorMessage = 'Hubo un error al guardar.';
      
      if (error.response && error.response.data) {
        // Soporta formato {errores: {...}} o directamente el array de errores
        const errData = error.response.data.errores || error.response.data;
        
        if (errData.nombre) {
          errorMessage = 'Ya existe un registro con este nombre.';
        } else if (errData.non_field_errors) {
          errorMessage = errData.non_field_errors[0];
        } else if (typeof errData === 'object') {
          const firstKey = Object.keys(errData)[0];
          if (firstKey && Array.isArray(errData[firstKey])) {
            errorMessage = errData[firstKey][0];
          }
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: errorMessage,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        let endpoint = '';
        if (type === 'dep') endpoint = '/seguridad/departamentos/';
        if (type === 'prov') endpoint = '/seguridad/provincias/';
        if (type === 'dist') endpoint = '/seguridad/distritos/';

        await api.delete(`${endpoint}${id}/`);
        Swal.fire('Eliminado', 'El registro ha sido eliminado', 'success');
        
        if (type === 'dep') fetchDepartamentos();
        if (type === 'prov') fetchAllProvincias();
        if (type === 'dist') fetchAllDistritos();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se puede eliminar (probablemente está en uso)', 'error');
      }
    }
  };

  const renderTable = (items, type) => (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="p-4 font-medium text-slate-600 w-16">Nº</th>
            <th className="p-4 font-medium text-slate-600">Nombre</th>
            <th className="p-4 font-medium text-slate-600 text-right w-32">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <tr>
              <td colSpan="3" className="p-4 text-center text-slate-500">
                {loading ? 'Cargando...' : 'No hay registros para mostrar.'}
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-800">{index + 1}</td>
                <td className="p-4 text-slate-800">{item.nombre}</td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => openModal(type, item)} 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(type, item.id)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <MapPin className="text-blue-600" size={32} />
            Gestión de Ubigeo
          </h1>
          <p className="text-slate-500 mt-1">Gestione los departamentos, provincias y distritos del sistema.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
          <button 
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'departamentos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('departamentos')}
          >
            Departamentos
          </button>
          <button 
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'provincias' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('provincias')}
          >
            Provincias
          </button>
          <button 
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'distritos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('distritos')}
          >
            Distritos
          </button>
        </div>

        {/* CONTENIDO TABS */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'departamentos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700">Listado de Departamentos</h2>
                <button 
                  onClick={() => openModal('dep')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={18} /> Nuevo Registro
                </button>
              </div>
              {renderTable(departamentos, 'dep')}
            </div>
          )}

          {activeTab === 'provincias' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700">Listado de Provincias</h2>
                <button 
                  onClick={() => openModal('prov')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={18} /> Nuevo Registro
                </button>
              </div>
              {renderTable(provincias, 'prov')}
            </div>
          )}

          {activeTab === 'distritos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-700">Listado de Distritos</h2>
                <button 
                  onClick={() => openModal('dist')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={18} /> Nuevo Registro
                </button>
              </div>
              {renderTable(distritos, 'dist')}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editData ? 'Editar ' : 'Nuevo '} 
          {modalType === 'dep' ? 'Departamento' : modalType === 'prov' ? 'Provincia' : 'Distrito'}
        </DialogTitle>
        <DialogContent dividers className="flex flex-col gap-5 pt-4">
          
          {modalType !== 'dep' && (
            <FormControl fullWidth size="small" error={!!formErrors.departamento_id}>
              <InputLabel>Departamento</InputLabel>
              <Select
                value={formData.departamento_id}
                label="Departamento"
                onChange={(e) => {
                  setFormData({ ...formData, departamento_id: e.target.value, provincia_id: '' });
                  if (formErrors.departamento_id) setFormErrors({ ...formErrors, departamento_id: null });
                }}
              >
                {departamentos.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>
                ))}
              </Select>
              {formErrors.departamento_id && <FormHelperText>{formErrors.departamento_id}</FormHelperText>}
            </FormControl>
          )}

          {modalType === 'dist' && (
            <FormControl fullWidth size="small" disabled={!formData.departamento_id} error={!!formErrors.provincia_id}>
              <InputLabel>Provincia</InputLabel>
              <Select
                value={formData.provincia_id}
                label="Provincia"
                onChange={(e) => {
                  setFormData({ ...formData, provincia_id: e.target.value });
                  if (formErrors.provincia_id) setFormErrors({ ...formErrors, provincia_id: null });
                }}
              >
                {modalProvincias.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                ))}
              </Select>
              {formErrors.provincia_id && <FormHelperText>{formErrors.provincia_id}</FormHelperText>}
            </FormControl>
          )}

          <TextField
            autoFocus
            margin="none"
            label="Nombre"
            fullWidth
            size="small"
            variant="outlined"
            value={formData.nombre}
            onChange={(e) => {
              setFormData({ ...formData, nombre: e.target.value });
              if (e.target.value.trim() && formErrors.nombre) {
                setFormErrors({ ...formErrors, nombre: null });
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            error={!!formErrors.nombre}
            helperText={formErrors.nombre}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UbigeoPage;
