import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, MenuItem, Select, InputLabel, FormControl, Divider
} from '@mui/material';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      aplicaciones: []
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "aplicaciones"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRepuestos, resCategorias, resMarcas] = await Promise.all([
        inventarioService.getRepuestos(),
        inventarioService.getCategorias(),
        inventarioService.getMarcas()
      ]);
      setRepuestos(resRepuestos.results || resRepuestos);
      setCategorias(resCategorias.results || resCategorias);
      setMarcas(resMarcas.results || resMarcas);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (repuesto = null) => {
    if (repuesto) {
      setEditingId(repuesto.id);
      reset({ 
        codigo: repuesto.codigo,
        nombre: repuesto.nombre,
        categoria: repuesto.categoria,
        marca: repuesto.marca,
        stock: repuesto.stock,
        precio_compra: repuesto.precio_compra,
        precio_por_mayor: repuesto.precio_por_mayor,
        precio_cash: repuesto.precio_cash,
        precio_lista: repuesto.precio_lista,
        aplicaciones: repuesto.aplicaciones || []
      });
    } else {
      setEditingId(null);
      reset({ 
        codigo: '', nombre: '', categoria: '', marca: '', stock: 0,
        precio_compra: '', precio_por_mayor: '', precio_cash: '', precio_lista: '',
        aplicaciones: [] 
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await inventarioService.updateRepuesto(editingId, data);
        Swal.fire('Éxito', 'Repuesto actualizado correctamente', 'success');
      } else {
        await inventarioService.createRepuesto(data);
        Swal.fire('Éxito', 'Repuesto creado correctamente', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un error al guardar', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El repuesto se eliminará de forma lógica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await inventarioService.deleteRepuesto(id);
        Swal.fire('Eliminado!', 'El repuesto ha sido eliminado.', 'success');
        fetchData();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar el repuesto', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Catálogo de Repuestos</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />} 
          onClick={() => handleOpenModal()}
        >
          Nuevo Repuesto
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell><strong>Stock</strong></TableCell>
                  <TableCell><strong>P. Lista</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repuestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No hay repuestos registrados.</TableCell>
                  </TableRow>
                ) : (
                  repuestos.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.codigo}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.categoria_nombre}</TableCell>
                      <TableCell>{row.marca_nombre}</TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>S/ {row.precio_lista}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(row.id)}>
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

      {/* Modal Formulario Complejo */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar Repuesto' : 'Nuevo Repuesto'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Datos Generales</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={4}>
                <TextField label="Código/SKU" fullWidth {...register('codigo', { required: true })} error={!!errors.codigo} />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField label="Nombre del Repuesto" fullWidth {...register('nombre', { required: true })} error={!!errors.nombre} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.categoria}>
                  <InputLabel>Categoría</InputLabel>
                  <Select label="Categoría" defaultValue="" {...register('categoria', { required: true })}>
                    {categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.marca}>
                  <InputLabel>Marca</InputLabel>
                  <Select label="Marca" defaultValue="" {...register('marca', { required: true })}>
                    {marcas.map(m => <MenuItem key={m.id} value={m.id}>{m.nombre}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Stock" type="number" fullWidth {...register('stock')} />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Precios (S/)</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={3}>
                <TextField label="P. Compra" type="number" inputProps={{ step: "0.01" }} fullWidth {...register('precio_compra', { required: true })} error={!!errors.precio_compra} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="P. Por Mayor" type="number" inputProps={{ step: "0.01" }} fullWidth {...register('precio_por_mayor', { required: true })} error={!!errors.precio_por_mayor} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="P. Cash" type="number" inputProps={{ step: "0.01" }} fullWidth {...register('precio_cash', { required: true })} error={!!errors.precio_cash} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="P. Lista" type="number" inputProps={{ step: "0.01" }} fullWidth {...register('precio_lista', { required: true })} error={!!errors.precio_lista} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Aplicaciones Compatibles (Vehículos)</Typography>
              <Button variant="outlined" size="small" onClick={() => append({ marca_vehiculo: '', modelo_vehiculo: '', motor: '' })}>
                + Agregar Regla
              </Button>
            </Box>
            
            {fields.map((item, index) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                <TextField label="Marca (Ej. Toyota)" size="small" fullWidth {...register(`aplicaciones.${index}.marca_vehiculo`, { required: true })} error={!!errors?.aplicaciones?.[index]?.marca_vehiculo} />
                <TextField label="Modelo (Opcional)" size="small" fullWidth {...register(`aplicaciones.${index}.modelo_vehiculo`)} />
                <TextField label="Motor (Opcional)" size="small" fullWidth {...register(`aplicaciones.${index}.motor`)} />
                <IconButton color="error" onClick={() => remove(index)}>
                  <X size={20} />
                </IconButton>
              </Box>
            ))}
            {fields.length === 0 && <Typography variant="body2" color="text.secondary">No hay reglas de compatibilidad. Clic en "+ Agregar Regla" para añadir los vehículos compatibles con este repuesto.</Typography>}

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseModal} color="inherit">Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Guardar Repuesto'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
