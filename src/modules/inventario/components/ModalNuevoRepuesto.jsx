import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Autocomplete, Typography
} from '@mui/material';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

const defaultForm = {
  codigo: '',
  nombre: '',
  categoria: null,
  marca: null,
  unidad_medida: null,
  tipo_igv: null,
  precio_compra: '',
  precio_lista: '',
};

// Registro rápido de repuesto, pensado para usarse desde otros módulos (ej.
// Compras) cuando el repuesto que se necesita todavía no existe en el
// catálogo. Deja fuera lo que no es indispensable para crear el registro
// (viscosidad, aplicaciones compatibles, asignación de stock por ubicación)
// -- eso se completa luego desde Inventario > Repuestos si hace falta.
const ModalNuevoRepuesto = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [tiposIgv, setTiposIgv] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setFormData(defaultForm);
    setErrors({});

    const cargarCatalogos = async () => {
      setCatalogosLoading(true);
      try {
        const [resCategorias, resMarcas, resUnidades, resIgv] = await Promise.all([
          inventarioService.getCategorias(),
          inventarioService.getMarcas(),
          inventarioService.getUnidadesMedida(),
          inventarioService.getTiposIgv(),
        ]);
        setCategorias(resCategorias.results || resCategorias);
        setMarcas(resMarcas.results || resMarcas);
        setUnidadesMedida(resUnidades.results || resUnidades);
        setTiposIgv(resIgv.results || resIgv.data || []);
      } catch (error) {
        console.error('Error cargando catálogos de repuestos:', error);
      } finally {
        setCatalogosLoading(false);
      }
    };
    cargarCatalogos();
  }, [open]);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!formData.codigo.trim()) nuevosErrores.codigo = 'Obligatorio';
    if (!formData.nombre.trim()) nuevosErrores.nombre = 'Obligatorio';
    if (!formData.categoria) nuevosErrores.categoria = 'Obligatorio';
    if (!formData.marca) nuevosErrores.marca = 'Obligatorio';
    if (!formData.unidad_medida) nuevosErrores.unidad_medida = 'Obligatorio';
    if (formData.precio_compra === '' || Number(formData.precio_compra) < 0) nuevosErrores.precio_compra = 'Obligatorio';
    if (formData.precio_lista === '' || Number(formData.precio_lista) < 0) nuevosErrores.precio_lista = 'Obligatorio';
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;

    const codigoIngresado = formData.codigo.trim();

    try {
      setLoading(true);

      // Regla del negocio: si el código ya existe, no se debe crear un
      // repuesto duplicado. Se verifica antes de enviar, y el backend
      // (codigo unique=True) queda como respaldo ante una carrera de datos.
      const busqueda = await inventarioService.getRepuestos({ search: codigoIngresado, page_size: 20 });
      const listaExistente = busqueda.results || busqueda;
      const duplicado = listaExistente.find(
        r => r.codigo.trim().toLowerCase() === codigoIngresado.toLowerCase()
      );
      if (duplicado) {
        Swal.fire({
          icon: 'warning',
          title: 'Repuesto ya registrado',
          text: `Ya existe un repuesto con el código "${duplicado.codigo}" (${duplicado.nombre}). Selecciónalo desde el buscador en vez de crear uno nuevo.`,
        });
        setLoading(false);
        return;
      }

      const payload = {
        codigo: codigoIngresado,
        nombre: formData.nombre.trim(),
        categoria: formData.categoria.id,
        marca: formData.marca.id,
        unidad_medida: formData.unidad_medida.id,
        tipo_igv: formData.tipo_igv ? formData.tipo_igv.id : null,
        precio_compra: Number(formData.precio_compra),
        // Registro rápido: por mayor y cash arrancan igual al precio de
        // lista; se pueden diferenciar luego desde Inventario > Repuestos.
        precio_por_mayor: Number(formData.precio_lista),
        precio_cash: Number(formData.precio_lista),
        precio_lista: Number(formData.precio_lista),
      };

      const nuevoRepuesto = await inventarioService.createRepuesto(payload);

      Swal.fire({
        icon: 'success',
        title: 'Repuesto registrado',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });

      onSuccess(nuevoRepuesto);
    } catch (error) {
      console.error(error);
      let errorMessage = 'Hubo un error al guardar el repuesto.';
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.codigo) {
          errorMessage = 'Ya existe un repuesto registrado con este código/SKU.';
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          if (firstKey && Array.isArray(data[firstKey])) {
            errorMessage = data[firstKey][0];
          }
        }
      }
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight="bold" sx={{ fontSize: '1.35rem', pb: 1 }}>Nuevo Repuesto Rápido</DialogTitle>
      <DialogContent dividers sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth label="Código/SKU" required size="medium"
              value={formData.codigo} onChange={handleChange('codigo')}
              error={!!errors.codigo} helperText={errors.codigo}
              InputProps={{ sx: { py: 0.5 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth label="Nombre del Repuesto" required size="medium"
              value={formData.nombre} onChange={handleChange('nombre')}
              error={!!errors.nombre} helperText={errors.nombre}
              InputProps={{ sx: { py: 0.5 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              options={categorias}
              loading={catalogosLoading}
              getOptionLabel={(option) => option.nombre}
              value={formData.categoria}
              onChange={(e, val) => {
                setFormData(prev => ({ ...prev, categoria: val }));
                if (errors.categoria) setErrors(prev => ({ ...prev, categoria: undefined }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Categoría" required error={!!errors.categoria} helperText={errors.categoria} />
              )}
              noOptionsText="No se encontraron categorías"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              options={marcas}
              loading={catalogosLoading}
              getOptionLabel={(option) => option.nombre}
              value={formData.marca}
              onChange={(e, val) => {
                setFormData(prev => ({ ...prev, marca: val }));
                if (errors.marca) setErrors(prev => ({ ...prev, marca: undefined }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Marca" required error={!!errors.marca} helperText={errors.marca} />
              )}
              noOptionsText="No se encontraron marcas"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              options={unidadesMedida}
              loading={catalogosLoading}
              getOptionLabel={(option) => `${option.nombre} (${option.abreviatura})`}
              value={formData.unidad_medida}
              onChange={(e, val) => {
                setFormData(prev => ({ ...prev, unidad_medida: val }));
                if (errors.unidad_medida) setErrors(prev => ({ ...prev, unidad_medida: undefined }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Unidad de Medida" required error={!!errors.unidad_medida} helperText={errors.unidad_medida} />
              )}
              noOptionsText="No se encontraron unidades"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              fullWidth
              options={tiposIgv}
              loading={catalogosLoading}
              getOptionLabel={(option) => option.nombre}
              value={formData.tipo_igv}
              onChange={(e, val) => setFormData(prev => ({ ...prev, tipo_igv: val }))}
              renderInput={(params) => <TextField {...params} label="Tipo de IGV (Opcional)" />}
              noOptionsText="No se encontraron tipos de IGV"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="Precio de Compra" type="number" required size="medium"
              inputProps={{ step: '0.01', min: 0 }}
              value={formData.precio_compra} onChange={handleChange('precio_compra')}
              error={!!errors.precio_compra} helperText={errors.precio_compra}
              InputProps={{ sx: { py: 0.5 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="Precio de Venta (Lista)" type="number" required size="medium"
              inputProps={{ step: '0.01', min: 0 }}
              value={formData.precio_lista} onChange={handleChange('precio_lista')}
              InputProps={{ sx: { py: 0.5 } }}
              error={!!errors.precio_lista} helperText={errors.precio_lista}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">
              Los precios "Por Mayor" y "Cash" se registran igual al precio de lista;
              puedes diferenciarlos luego desde Inventario &gt; Repuestos.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Guardar Repuesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNuevoRepuesto;
