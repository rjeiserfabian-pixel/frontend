import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export default function CuentasBancariasPage() {
  const [activeTab, setActiveTab] = useState('cuentas'); // 'cuentas' o 'tipos'
  
  // Data states
  const [cuentas, setCuentas] = useState([]);
  const [tiposCuenta, setTiposCuenta] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form hooks
  const { 
    register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } 
  } = useForm();

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'cuentas') {
        const res = await api.get('/seguridad/cuentas-bancarias/');
        setCuentas(res.data.results || res.data || []);
        // Si entramos a cuentas, también necesitamos cargar los tipos para el select del modal
        const resTipos = await api.get('/seguridad/tipos-cuenta-bancaria/');
        setTiposCuenta(resTipos.data.results || resTipos.data || []);
      } else {
        const res = await api.get('/seguridad/tipos-cuenta-bancaria/');
        setTiposCuenta(res.data.results || res.data || []);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Modal handlers
  const handleOpenModal = (item = null) => {
    setEditingId(item ? item.id : null);
    
    if (activeTab === 'cuentas') {
      reset({
        banco: item?.banco || '',
        tipo_cuenta: item?.tipo_cuenta || '',
        numero_cuenta: item?.numero_cuenta || '',
        cci: item?.cci || '',
        moneda: item?.moneda || 'PEN',
        titular: item?.titular || ''
      });
    } else {
      reset({ nombre: item?.nombre || '' });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const endpoint = activeTab === 'cuentas' 
        ? '/seguridad/cuentas-bancarias/' 
        : '/seguridad/tipos-cuenta-bancaria/';

      if (editingId) {
        await api.put(`${endpoint}${editingId}/`, data);
        Swal.fire('Éxito', 'Registro actualizado correctamente', 'success');
      } else {
        await api.post(endpoint, data);
        Swal.fire('Éxito', 'Registro creado correctamente', 'success');
      }
      
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      let errorMessage = 'Hubo un error al guardar el registro.';
      
      if (error.response && error.response.data && (error.response.data.errores || error.response.data)) {
        const errData = error.response.data.errores || error.response.data;
        if (errData.nombre) {
          errorMessage = 'Ya existe un registro con este nombre.';
        } else if (errData.numero_cuenta) {
          errorMessage = 'Ya existe este número de cuenta.';
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
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El registro se eliminará de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const endpoint = activeTab === 'cuentas' 
          ? '/seguridad/cuentas-bancarias/' 
          : '/seguridad/tipos-cuenta-bancaria/';
          
        await api.delete(`${endpoint}${id}/`);
        Swal.fire('Eliminado!', 'El registro ha sido eliminado.', 'success');
        fetchData();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar (probablemente está en uso)', 'error');
      }
    }
  };

  return (
    <Box className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <Box className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <Box>
          <Typography variant="h4" className="font-bold text-slate-800 flex items-center gap-3">
            <CreditCard className="text-blue-600" size={32} />
            Cuentas Bancarias
          </Typography>
          <Typography className="text-slate-500 mt-1">
            Gestione las cuentas bancarias de la empresa y sus tipos.
          </Typography>
        </Box>
      </Box>

      <Box className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
        {/* TABS */}
        <Box className="flex border-b border-slate-200 mb-6">
          <button 
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'cuentas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('cuentas')}
          >
            Cuentas Bancarias
          </button>
          <button 
            className={`px-6 py-3 font-medium transition-colors ${activeTab === 'tipos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('tipos')}
          >
            Tipos de Cuenta
          </button>
        </Box>

        {/* CONTENT */}
        <Box className="flex-1">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-semibold text-slate-800">
              {activeTab === 'cuentas' ? 'Listado de Cuentas' : 'Tipos de Cuenta Bancaria'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Plus size={20} />} 
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              Nuevo Registro
            </Button>
          </Box>

          <Paper className="w-full overflow-hidden border border-slate-200 rounded-xl shadow-none">
            {loading ? (
              <Box className="flex justify-center p-8">
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead className="bg-slate-50">
                    <TableRow>
                      <TableCell className="font-medium text-slate-600">ID</TableCell>
                      
                      {activeTab === 'cuentas' ? (
                        <>
                          <TableCell className="font-medium text-slate-600">Banco</TableCell>
                          <TableCell className="font-medium text-slate-600">Tipo</TableCell>
                          <TableCell className="font-medium text-slate-600">Nº Cuenta</TableCell>
                          <TableCell className="font-medium text-slate-600">Moneda</TableCell>
                          <TableCell className="font-medium text-slate-600">Titular</TableCell>
                        </>
                      ) : (
                        <TableCell className="font-medium text-slate-600">Nombre</TableCell>
                      )}
                      
                      <TableCell align="right" className="font-medium text-slate-600">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y divide-slate-100">
                    {(activeTab === 'cuentas' ? cuentas : tiposCuenta).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={activeTab === 'cuentas' ? 7 : 3} align="center" className="text-slate-500 p-8">
                          No hay registros disponibles.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (activeTab === 'cuentas' ? cuentas : tiposCuenta).map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-slate-800">{row.id}</TableCell>
                          
                          {activeTab === 'cuentas' ? (
                            <>
                              <TableCell className="font-medium text-slate-800">{row.banco}</TableCell>
                              <TableCell className="text-slate-700">{row.tipo_cuenta_nombre || '-'}</TableCell>
                              <TableCell className="text-slate-700">
                                <div>{row.numero_cuenta}</div>
                                {row.cci && <div className="text-xs text-slate-500 mt-0.5">CCI: {row.cci}</div>}
                              </TableCell>
                              <TableCell className="text-slate-700">{row.moneda}</TableCell>
                              <TableCell className="text-slate-700">{row.titular}</TableCell>
                            </>
                          ) : (
                            <TableCell className="font-medium text-slate-800">{row.nombre}</TableCell>
                          )}

                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleOpenModal(row)} className="hover:bg-blue-50">
                              <Edit size={18} />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDelete(row.id)} className="hover:bg-red-50">
                              <Trash2 size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Modal Formulario */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-slate-800">
          {editingId ? 'Editar Registro' : 'Nuevo Registro'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers className="flex flex-col gap-4 pt-4">
            
            {activeTab === 'tipos' ? (
              <TextField
                autoFocus
                label="Nombre del Tipo (ej. Corriente)"
                fullWidth
                variant="outlined"
                size="small"
                {...register('nombre', { required: 'El nombre es obligatorio' })}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />
            ) : (
              <>
                <TextField
                  autoFocus
                  label="Banco"
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Ej. BCP, BBVA, Interbank"
                  {...register('banco', { required: 'El banco es obligatorio' })}
                  error={!!errors.banco}
                  helperText={errors.banco?.message}
                />

                <FormControl fullWidth size="small" error={!!errors.tipo_cuenta}>
                  <InputLabel>Tipo de Cuenta</InputLabel>
                  <Select
                    label="Tipo de Cuenta"
                    defaultValue=""
                    {...register('tipo_cuenta', { required: 'Seleccione un tipo' })}
                  >
                    <MenuItem value="" disabled>Seleccione...</MenuItem>
                    {tiposCuenta.map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                    ))}
                  </Select>
                  {errors.tipo_cuenta && <FormHelperText>{errors.tipo_cuenta.message}</FormHelperText>}
                </FormControl>

                <TextField
                  label="Número de Cuenta"
                  fullWidth
                  variant="outlined"
                  size="small"
                  {...register('numero_cuenta', { required: 'El número de cuenta es obligatorio' })}
                  error={!!errors.numero_cuenta}
                  helperText={errors.numero_cuenta?.message}
                />

                <TextField
                  label="CCI (Opcional)"
                  fullWidth
                  variant="outlined"
                  size="small"
                  {...register('cci')}
                />

                <FormControl fullWidth size="small" error={!!errors.moneda}>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    label="Moneda"
                    defaultValue="PEN"
                    {...register('moneda', { required: 'Seleccione la moneda' })}
                  >
                    <MenuItem value="PEN">Soles (S/)</MenuItem>
                    <MenuItem value="USD">Dólares ($)</MenuItem>
                  </Select>
                  {errors.moneda && <FormHelperText>{errors.moneda.message}</FormHelperText>}
                </FormControl>

                <TextField
                  label="Titular de la Cuenta"
                  fullWidth
                  variant="outlined"
                  size="small"
                  {...register('titular', { required: 'El titular es obligatorio' })}
                  error={!!errors.titular}
                  helperText={errors.titular?.message}
                />
              </>
            )}

          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={handleCloseModal} color="inherit" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
