import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Box 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import api from '../../../core/api/axios';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const ConfiguracionIgvPage = () => {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('INVENTARIO.IMPUESTOS.CREAR');
  const puedeEditar = tienePermiso('INVENTARIO.IMPUESTOS.EDITAR');
  const puedeEliminar = tienePermiso('INVENTARIO.IMPUESTOS.ELIMINAR');

  const [impuestos, setImpuestos] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalForm, setModalForm] = useState({ nombre: '', tasa: '', codigo_sunat: '' });
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setEditId(null);
    setModalForm({ nombre: '', tasa: '', codigo_sunat: '' });
    setOpenModal(true);
  };

  const handleOpenEditModal = (impuesto) => {
    setEditId(impuesto.id);
    setModalForm({
      nombre: impuesto.nombre,
      tasa: impuesto.tasa,
      codigo_sunat: impuesto.codigo_sunat || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleGuardarModal = async () => {
    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/ventas/impuestos/${editId}/`, {
          nombre: modalForm.nombre,
          tasa: modalForm.tasa,
          codigo_sunat: modalForm.codigo_sunat
        });
        Swal.fire({icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
      } else {
        await api.post('/ventas/impuestos/', {
          nombre: modalForm.nombre,
          tasa: modalForm.tasa,
          codigo_sunat: modalForm.codigo_sunat
        });
        Swal.fire({icon: 'success', title: 'Creado', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500});
      }
      setOpenModal(false);
      cargarDatos();
    } catch (error) {
      Swal.fire({icon: 'error', title: 'Error', text: 'No se pudo guardar el registro'});
    } finally {
      setIsSubmitting(false);
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
      <div className="flex justify-between items-center p-6" style={{ border: `1px solid ${C.border}`, borderRadius: '8px', boxShadow: S.card, backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.1)}, transparent 46%), linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 68%)` }}>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: C.text }}>
            <Settings style={{ color: C.brandLight }} size={32} />
            Configuración de Impuestos (IGV)
          </h1>
          <p className="mt-1" style={{ color: C.textMuted }}>Gestione los impuestos que aplican a los repuestos y servicios del inventario.</p>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col" style={{ border: `1px solid ${C.border}`, borderRadius: '8px', boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: C.text }}>
            Listado de Impuestos
          </h2>
          {puedeCrear && (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 font-medium flex items-center gap-2 transition-colors"
              style={{ color: '#ffffff', borderRadius: '8px', background: `linear-gradient(135deg, ${C.brandLight}, ${C.brand})`, boxShadow: `0 12px 28px ${alpha(C.brand, 0.24)}` }}
            >
              <Plus size={20} /> Nuevo Registro
            </button>
          )}
        </div>

        <div className="overflow-x-auto" style={{ border: `1px solid ${C.border}`, borderRadius: '8px' }}>
          <table className="w-full text-left">
            <thead style={{ color: C.textMuted, backgroundColor: alpha(C.surfaceSoft, 0.92), borderBottom: `1px solid ${C.border}` }}>
              <tr>
                <th className="p-4 font-medium">Nº</th>
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Tasa (%)</th>
                <th className="p-4 font-medium">Código SUNAT</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody style={{ color: C.text, backgroundColor: C.surface }}>
              {impuestos.map((i, index) => (
                <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4 font-medium">{i.nombre}</td>
                  <td className="p-4">{i.tasa}%</td>
                  <td className="p-4">{i.codigo_sunat || '-'}</td>
                  <td className="p-4 text-right">
                    {puedeEditar && (
                      <button
                        onClick={() => handleOpenEditModal(i)}
                        className="p-2"
                        style={{ color: C.blue, backgroundColor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}`, borderRadius: '8px', marginRight: '8px' }}
                      ><Edit size={18} /></button>
                    )}
                    {puedeEliminar && (
                      <button
                        onClick={() => handleEliminar(i.id)}
                        className="p-2"
                        style={{ color: C.brandLight, backgroundColor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}`, borderRadius: '8px' }}
                      ><Trash2 size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}
              
              {impuestos.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center" style={{ color: C.textMuted }}>No hay impuestos configurados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MUI Dialog Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Editar Impuesto' : 'Nuevo Impuesto'}</DialogTitle>
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
          <Button onClick={handleCloseModal} color="inherit" disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleGuardarModal} variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ConfiguracionIgvPage;
