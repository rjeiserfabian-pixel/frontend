import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress, Autocomplete, Typography,
  Box, Paper, IconButton
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';
import { premiumTokens } from '../../../core/theme/theme';
import { compressImage } from '../../../utils/imageCompressor';

const C = premiumTokens.colors;

const defaultForm = {
  codigo: '',
  codigo_barra: '',
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

  // Estados de Imagen del Repuesto
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [comprimiendoImagen, setComprimiendoImagen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData(defaultForm);
    setErrors({});
    setImagenFile(null);
    setImagenPreview(null);
    setComprimiendoImagen(false);

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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire('Imagen muy pesada', 'La imagen no debe superar los 10MB.', 'warning');
      return;
    }

    try {
      setComprimiendoImagen(true);
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setImagenFile(compressed);
      setImagenPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    } finally {
      setComprimiendoImagen(false);
    }
  };

  const handleRemoveImage = () => {
    setImagenFile(null);
    setImagenPreview(null);
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
    const codigoBarraIngresado = formData.codigo_barra.trim();

    try {
      setLoading(true);

      // Regla del negocio: si el código ya existe, no se debe crear un
      // repuesto duplicado. Se verifica antes de enviar, y el backend
      // (codigo unique=True) queda como respaldo ante una carrera de datos.
      const busquedas = await Promise.all([
        inventarioService.getRepuestos({ search: codigoIngresado, page_size: 20 }),
        codigoBarraIngresado
          ? inventarioService.getRepuestos({ search: codigoBarraIngresado, page_size: 20 })
          : Promise.resolve({ results: [] }),
      ]);
      const listaExistente = busquedas.flatMap(res => res.results || res);
      const duplicado = listaExistente.find(
        r => r.codigo.trim().toLowerCase() === codigoIngresado.toLowerCase() ||
          (codigoBarraIngresado && (r.codigo_barra || '').trim().toLowerCase() === codigoBarraIngresado.toLowerCase())
      );
      if (duplicado) {
        const campoDuplicado = duplicado.codigo.trim().toLowerCase() === codigoIngresado.toLowerCase()
          ? `código "${duplicado.codigo}"`
          : `código de barras "${duplicado.codigo_barra}"`;
        Swal.fire({
          icon: 'warning',
          title: 'Repuesto ya registrado',
          text: `Ya existe un repuesto con el ${campoDuplicado} (${duplicado.nombre}). Selecciónalo desde el buscador en vez de crear uno nuevo.`,
        });
        setLoading(false);
        return;
      }

      const payload = {
        codigo: codigoIngresado,
        codigo_barra: codigoBarraIngresado || null,
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

      let requestData;
      if (imagenFile) {
        const formDataToSend = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formDataToSend.append(key, payload[key]);
          }
        });
        formDataToSend.append('imagen', imagenFile);
        requestData = formDataToSend;
      } else {
        requestData = payload;
      }

      const nuevoRepuesto = await inventarioService.createRepuesto(requestData);

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
        } else if (data.codigo_barra) {
          errorMessage = 'Ya existe un repuesto registrado con este código de barras.';
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
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth label="Código de barras" size="medium"
              value={formData.codigo_barra} onChange={handleChange('codigo_barra')}
              InputProps={{ sx: { py: 0.5 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
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
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Fotografía del Repuesto (Opcional)
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                border: `1px dashed ${alpha(C.border, 0.8)}`,
                backgroundColor: alpha(C.surfaceSoft, 0.4),
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                flexWrap: 'wrap'
              }}
            >
              {imagenPreview ? (
                <Box sx={{ position: 'relative', width: 84, height: 84 }}>
                  <Box
                    component="img"
                    src={imagenPreview}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: `1px solid ${C.border}`
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      '&:hover': { backgroundColor: '#dc2626' },
                      width: 22,
                      height: 22
                    }}
                  >
                    <X size={14} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 84,
                    height: 84,
                    borderRadius: '8px',
                    border: `1px dashed ${alpha('#ffffff', 0.2)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha('#ffffff', 0.02),
                    color: 'text.secondary'
                  }}
                >
                  <ImageIcon size={26} opacity={0.35} />
                </Box>
              )}

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  startIcon={<UploadCloud size={16} />}
                  disabled={comprimiendoImagen}
                  sx={{ mb: 0.8 }}
                >
                  {imagenPreview ? 'Cambiar Foto' : 'Subir Foto'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {comprimiendoImagen && (
                  <Typography variant="caption" sx={{ display: 'block', color: C.brand, fontWeight: 'bold' }}>
                    Optimizando imagen...
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Formatos: JPG, PNG, WEBP. Se optimiza y comprime automáticamente.
                </Typography>
              </Box>
            </Paper>
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
        <Button onClick={onClose} color="inherit" disabled={loading || comprimiendoImagen}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading || comprimiendoImagen}>
          {loading ? <CircularProgress size={24} /> : 'Guardar Repuesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalNuevoRepuesto;
