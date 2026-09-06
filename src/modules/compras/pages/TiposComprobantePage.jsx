import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { Plus, Edit2, Trash2, FileText, Edit } from 'lucide-react';
import { comprasService } from '../services/comprasApi';

const TiposComprobantePage = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTipo, setCurrentTipo] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', estado_activo: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const data = await comprasService.getTiposComprobante();
      setTipos(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching tipos comprobante:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tipo = null) => {
    if (tipo) {
      setCurrentTipo(tipo);
      setFormData({ nombre: tipo.nombre, estado_activo: tipo.estado_activo });
    } else {
      setCurrentTipo(null);
      setFormData({ nombre: '', estado_activo: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return;
    try {
      setSaving(true);
      if (currentTipo) {
        await comprasService.updateTipoComprobante(currentTipo.id, formData);
      } else {
        await comprasService.createTipoComprobante(formData);
      }
      handleCloseDialog();
      fetchTipos();
    } catch (error) {
      console.error('Error saving tipo comprobante:', error);
      alert('Error al guardar el tipo de comprobante.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tipo) => {
    if (window.confirm(`¿Estás seguro de que deseas ${tipo.estado_activo ? 'desactivar' : 'activar'} este tipo de comprobante?`)) {
      try {
        await comprasService.updateTipoComprobante(tipo.id, { ...tipo, estado_activo: !tipo.estado_activo });
        fetchTipos();
      } catch (error) {
        console.error('Error toggling tipo comprobante:', error);
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <FileText className="text-blue-600" size={32} />
            Tipos de Comprobante
          </h1>
          <p className="text-slate-500 mt-1">Administra los tipos de comprobante de compras.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Listado de Comprobantes
          </h2>
          <Button 
            variant="contained" 
            startIcon={<Plus size={20} />} 
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            Nuevo Tipo
          </Button>
        </div>

        <div className="w-full overflow-hidden border border-slate-200 rounded-xl shadow-none">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <CircularProgress />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200 w-16">Nº</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-slate-600 border-b border-slate-200">Nombre</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-600 border-b border-slate-200">Estado</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-slate-600 border-b border-slate-200">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tipos.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No hay tipos de comprobante registrados.</td></tr>
                  ) : tipos.map((tipo, index) => (
                    <tr key={tipo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">{tipo.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          tipo.estado_activo 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {tipo.estado_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenDialog(tipo)} className="text-blue-600 hover:text-blue-800 mx-3 transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(tipo)} className={tipo.estado_activo ? "text-red-500 hover:text-red-700 transition-colors" : "text-emerald-500 hover:text-emerald-700 transition-colors"} title={tipo.estado_activo ? "Desactivar" : "Activar"}>
                          {tipo.estado_activo ? <Trash2 size={18} /> : <Plus size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: '1rem' } }}>
        <DialogTitle className="font-semibold text-slate-900">
          {currentTipo ? 'Editar Tipo de Comprobante' : 'Nuevo Tipo de Comprobante'}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 mt-2 pt-2">
          <TextField
            label="Nombre"
            fullWidth
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            autoFocus
            required
            InputProps={{ size: 'small' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.estado_activo}
                onChange={(e) => setFormData({ ...formData, estado_activo: e.target.checked })}
                color="primary"
              />
            }
            label={formData.estado_activo ? "Activo (Visible en compras)" : "Inactivo (Oculto)"}
          />
        </DialogContent>
        <DialogActions className="p-4 bg-slate-50 border-t border-slate-200">
          <Button onClick={handleCloseDialog} color="inherit" className="text-slate-600 hover:bg-slate-200">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={saving || !formData.nombre.trim()}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TiposComprobantePage;
