import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import api from '../../../core/api/axios'; 

const SeriesInternasPage = () => {
  const [series, setSeries] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  
  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalForm, setModalForm] = useState({ 
    sucursal: '',
    tipo_documento: '',
    prefijo: '',
    correlativo_actual: 0,
    longitud_correlativo: 6
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const getArray = (data) => Array.isArray(data) ? data : (data.results || data.data || []);
      
      const [resSeries, resSucursales] = await Promise.all([
        api.get('/ventas/series-internas/'),
        api.get('/inventario/sucursales/')
      ]);
      setSeries(getArray(resSeries.data));
      setSucursales(getArray(resSucursales.data));
    } catch (error) {
      console.error("Error al cargar datos", error);
      Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
    }
  };

  const handleOpenModal = (serie = null) => {
    if (serie) {
      setEditId(serie.id);
      setModalForm({
        sucursal: serie.sucursal,
        tipo_documento: serie.tipo_documento,
        prefijo: serie.prefijo,
        correlativo_actual: serie.correlativo_actual,
        longitud_correlativo: serie.longitud_correlativo
      });
    } else {
      setEditId(null);
      setModalForm({
        sucursal: sucursales.length > 0 ? sucursales[0].id : '',
        tipo_documento: 'RECIBO_INGRESO',
        prefijo: 'RI',
        correlativo_actual: 0,
        longitud_correlativo: 6
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await api.put(`/ventas/series-internas/${editId}/`, modalForm);
        Swal.fire('Actualizado', 'La serie ha sido actualizada.', 'success');
      } else {
        await api.post('/ventas/series-internas/', modalForm);
        Swal.fire('Creado', 'La serie ha sido creada.', 'success');
      }
      handleCloseModal();
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar:", error.response?.data || error);
      let errorMsg = 'Error al guardar la serie.';
      if (error.response?.data?.non_field_errors) {
        errorMsg = error.response.data.non_field_errors.join(' ');
      }
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/ventas/series-internas/${id}/`);
        Swal.fire('Eliminado', 'La serie ha sido eliminada.', 'success');
        cargarDatos();
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la serie.', 'error');
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            Configuración de Series Internas
          </h1>
          <p className="text-slate-500 mt-1">Administra los correlativos internos para Recibos y Créditos.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Listado de Series
          </h2>
          <Button 
            variant="contained" 
            startIcon={<Plus size={20} />} 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            Nueva Serie
          </Button>
        </div>

        <div className="w-full overflow-hidden border border-slate-200 rounded-xl shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Sucursal</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Documento</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Prefijo</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Correlativo</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Ejemplo</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-slate-600 border-b border-slate-200">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {series.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No hay series registradas</td></tr>
                ) : series.map((serie) => (
                  <tr key={serie.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{serie.sucursal_nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {serie.tipo_documento === 'RECIBO_INGRESO' ? 'Recibo de Ingreso' : 'Código de Crédito'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{serie.prefijo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{serie.correlativo_actual}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-blue-100">
                        {serie.prefijo}-{String(serie.correlativo_actual + 1).padStart(serie.longitud_correlativo, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleOpenModal(serie)} className="text-blue-600 hover:text-blue-800 mx-3 transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(serie.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          style: { borderRadius: '12px' }
        }}
      >
        <DialogTitle className="font-bold text-slate-800">
          {editId ? 'Editar Serie' : 'Nueva Serie'}
        </DialogTitle>
        <DialogContent dividers className="flex flex-col gap-5 pt-5 pb-5">
          <FormControl fullWidth size="small">
            <InputLabel>Sucursal</InputLabel>
            <Select
              label="Sucursal"
              value={modalForm.sucursal}
              onChange={(e) => setModalForm({...modalForm, sucursal: e.target.value})}
            >
              {sucursales.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Documento</InputLabel>
            <Select
              label="Tipo de Documento"
              value={modalForm.tipo_documento}
              onChange={(e) => setModalForm({...modalForm, tipo_documento: e.target.value})}
            >
              <MenuItem value="RECIBO_INGRESO">Recibo de Ingreso (RI)</MenuItem>
              <MenuItem value="CREDITO">Código de Crédito (CRED)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Prefijo"
            size="small"
            variant="outlined"
            value={modalForm.prefijo}
            onChange={(e) => setModalForm({...modalForm, prefijo: e.target.value.toUpperCase()})}
            placeholder="Ej. RI o CR"
          />
          
          <TextField
            fullWidth
            type="number"
            label="Correlativo Actual"
            size="small"
            variant="outlined"
            value={modalForm.correlativo_actual}
            onChange={(e) => setModalForm({...modalForm, correlativo_actual: parseInt(e.target.value) || 0})}
            helperText="El próximo se generará con este número + 1"
          />

          <TextField
            fullWidth
            type="number"
            label="Longitud (Ceros)"
            size="small"
            variant="outlined"
            value={modalForm.longitud_correlativo}
            onChange={(e) => setModalForm({...modalForm, longitud_correlativo: parseInt(e.target.value) || 6})}
            helperText="Cantidad de dígitos para el número. Ej. 6 para 000001"
          />
        </DialogContent>
        <DialogActions className="p-4 bg-slate-50 border-t border-slate-200">
          <Button onClick={handleCloseModal} color="inherit" className="text-slate-600 hover:bg-slate-200">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SeriesInternasPage;
