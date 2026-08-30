import { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, MenuItem, Select, InputLabel, FormControl, Divider,
  Drawer, Chip, Tooltip, Popover, List, ListItem, ListItemText,
  TablePagination, TableSortLabel, Autocomplete
} from '@mui/material';
import { Plus, Edit2, Trash2, X, Warehouse, Tag, Download, FileText, Search } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Swal from 'sweetalert2';
import { inventarioService } from '../services/inventarioService';

export default function RepuestosPage() {
  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [tiposIgv, setTiposIgv] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Estados de tabla (Nuevos)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');

  // --- Estado para el Drawer de Stock ---
  const [stockDrawerOpen, setStockDrawerOpen] = useState(false);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [ajusteModal, setAjusteModal] = useState({ open: false, stockItem: null });
  const [ajusteValor, setAjusteValor] = useState({ cantidad: 0, stock_minimo: 5, motivo: '' });
  
  // Estado para asignar nueva ubicación
  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [todasUbicaciones, setTodasUbicaciones] = useState([]);
  const [asignarForm, setAsignarForm] = useState({ ubicacion: '', cantidad: 0, motivo: 'Asignación inicial' });
  
  // Estado para el Popover de Precios (Simulación RBAC)
  const [preciosAnchorEl, setPreciosAnchorEl] = useState(null);
  const [repuestoPrecios, setRepuestoPrecios] = useState(null);
  const isOwner = true; // TODO: En el futuro esto vendrá del AuthContext (true para Admin/Dueño, false para Vendedores)

  const handleOpenPrecios = (event, repuesto) => {
    setPreciosAnchorEl(event.currentTarget);
    setRepuestoPrecios(repuesto);
  };

  const handleClosePrecios = () => {
    setPreciosAnchorEl(null);
    setRepuestoPrecios(null);
  };

  const openPrecios = Boolean(preciosAnchorEl);
  
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
      const params = {
        page: page + 1,
        search: searchQuery,
        categoria: filterCategoria,
        marca: filterMarca,
        ubicacion: filterUbicacion,
        ordering: orderBy ? (order === 'desc' ? `-${orderBy}` : orderBy) : undefined
      };
      
      const resRepuestos = await inventarioService.getRepuestos(params);
      setRepuestos(resRepuestos.results || resRepuestos);
      setTotalCount(resRepuestos.count || (resRepuestos.results ? resRepuestos.results.length : resRepuestos.length) || 0);

      // Cargar categorias, marcas, impuestos y unidades de medida solo si no se han cargado
      if (categorias.length === 0 || marcas.length === 0 || tiposIgv.length === 0 || unidadesMedida.length === 0) {
        const [resCategorias, resMarcas, resTiposIgv, resUnidades] = await Promise.all([
          inventarioService.getCategorias(),
          inventarioService.getMarcas(),
          inventarioService.getTiposIgv(),
          inventarioService.getUnidadesMedida()
        ]);
        setCategorias(resCategorias.results || resCategorias);
        setMarcas(resMarcas.results || resMarcas);
        setTiposIgv(resTiposIgv.results || resTiposIgv);
        setUnidadesMedida(resUnidades.results || resUnidades);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 400); // debounce para no saturar al buscar
    return () => clearTimeout(delayDebounceFn);
  }, [page, searchQuery, filterCategoria, filterMarca, filterUbicacion, orderBy, order]);

  const handleOpenModal = (repuesto = null) => {
    if (repuesto) {
      setEditingId(repuesto.id);
      reset({ 
        codigo: repuesto.codigo,
        nombre: repuesto.nombre,
        categoria: repuesto.categoria,
        marca: repuesto.marca,
        unidad_medida: repuesto.unidad_medida || '',
        viscosidad: repuesto.viscosidad || '',
        tipo_igv: repuesto.tipo_igv || '',
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
        codigo: '', nombre: '', categoria: '', marca: '', unidad_medida: '', viscosidad: '', tipo_igv: '', stock: 0,
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
      // Limpiar campos vacíos de aplicaciones para evitar error 400 en enteros
      const payload = { ...data };
      if (payload.aplicaciones && payload.aplicaciones.length > 0) {
        payload.aplicaciones = payload.aplicaciones.map(app => ({
          ...app,
          anio_desde: app.anio_desde === '' ? null : app.anio_desde,
          anio_hasta: app.anio_hasta === '' ? null : app.anio_hasta,
        }));
      }

      if (editingId) {
        await inventarioService.updateRepuesto(editingId, payload);
        Swal.fire('Éxito', 'Repuesto actualizado correctamente', 'success');
      } else {
        await inventarioService.createRepuesto(payload);
        Swal.fire('Éxito', 'Repuesto creado correctamente', 'success');
      }
      handleCloseModal();
      fetchData();
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

  // --- Lógica del Drawer de Stock ---
  const handleVerStock = async (repuesto) => {
    setRepuestoSeleccionado(repuesto);
    setStockDrawerOpen(true);
    setLoadingStock(true);
    try {
      const data = await inventarioService.getStock(repuesto.id);
      setStockData(data.results || data);
    } catch (error) {
      console.error('Error al cargar stock:', error);
      Swal.fire('Error', 'No se pudo cargar el stock del repuesto.', 'error');
    } finally {
      setLoadingStock(false);
    }
  };

  const handleAbrirAjuste = (stockItem) => {
    setAjusteModal({ open: true, stockItem });
    setAjusteValor({ cantidad: stockItem.stock_disponible, stock_minimo: stockItem.stock_minimo !== undefined ? stockItem.stock_minimo : 5, motivo: '' });
  };

  const handleGuardarAjuste = async () => {
    const { stockItem } = ajusteModal;
    if (!ajusteValor.motivo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Requerido',
        text: 'Debes ingresar un motivo para el ajuste.',
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      return;
    }
    try {
      await inventarioService.updateStock(stockItem.id, {
        stock_disponible: Number(ajusteValor.cantidad),
        stock_minimo: Number(ajusteValor.stock_minimo),
        motivo: ajusteValor.motivo,
      });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Stock ajustado',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      setAjusteModal({ open: false, stockItem: null });
      // Refresca el stock en el drawer sin cerrar
      const data = await inventarioService.getStock(repuestoSeleccionado.id);
      setStockData(data.results || data);
      fetchData(); // Refresca la tabla principal
    } catch (error) {
      console.error('Error al ajustar stock:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo ajustar el stock.',
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
  };

  const handleAbrirAsignar = async () => {
    try {
      const data = await inventarioService.getUbicaciones();
      setTodasUbicaciones(data.results || data);
      setAsignarForm({ ubicacion: '', cantidad: 0, motivo: 'Asignación inicial' });
      setAsignarModalOpen(true);
    } catch (error) {
      console.error('Error al cargar ubicaciones:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las ubicaciones disponibles.',
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
  };

  const handleGuardarAsignar = async () => {
    if (!asignarForm.ubicacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Requerido',
        text: 'Debes seleccionar una ubicación.',
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      return;
    }
    try {
      await inventarioService.createStock({
        repuesto: repuestoSeleccionado.id,
        ubicacion: asignarForm.ubicacion,
        stock_disponible: Number(asignarForm.cantidad),
        motivo: asignarForm.motivo,
      });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Asignado correctamente',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      setAsignarModalOpen(false);
      
      // Refresca el Drawer de stock actual
      const data = await inventarioService.getStock(repuestoSeleccionado.id);
      setStockData(data.results || data);
      fetchData(); // Refresca la tabla principal
    } catch (error) {
      console.error('Error al asignar ubicación:', error);
      Swal.fire({
        icon: 'error',
        title: 'Ya existe',
        text: 'El repuesto ya está registrado en esta ubicación. Si deseas modificar su stock, usa el botón "Ajustar".',
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = { search: searchQuery, categoria: filterCategoria, marca: filterMarca, ordering: orderBy ? (order === 'desc' ? `-${orderBy}` : orderBy) : undefined };
      const blob = await inventarioService.exportarExcel(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'repuestos.xlsx';
      a.click();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo exportar a Excel', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = { search: searchQuery, categoria: filterCategoria, marca: filterMarca, ordering: orderBy ? (order === 'desc' ? `-${orderBy}` : orderBy) : undefined };
      const blob = await inventarioService.exportarPDF(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_repuestos.pdf';
      a.click();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo exportar a PDF', 'error');
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
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

      {/* --- BARRA DE HERRAMIENTAS (BUSCADOR Y FILTROS) --- */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', boxShadow: 1 }}>
        <TextField
          label="Buscar (Código/Nombre)"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{ endAdornment: <Search size={20} style={{ opacity: 0.5 }} /> }}
        />
        <TextField
          label="Filtrar por Ubicación"
          placeholder="Ej. Pasillo A, Estante 2..."
          variant="outlined"
          size="small"
          value={filterUbicacion}
          onChange={(e) => setFilterUbicacion(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          size="small"
          options={categorias}
          getOptionLabel={(option) => option.nombre}
          value={categorias.find(c => c.id === filterCategoria) || null}
          onChange={(event, newValue) => setFilterCategoria(newValue ? newValue.id : '')}
          sx={{ minWidth: 200 }}
          renderInput={(params) => <TextField {...params} label="Categoría" variant="outlined" />}
          noOptionsText="No se encontraron categorías"
        />
        <Autocomplete
          size="small"
          options={marcas}
          getOptionLabel={(option) => option.nombre}
          value={marcas.find(m => m.id === filterMarca) || null}
          onChange={(event, newValue) => setFilterMarca(newValue ? newValue.id : '')}
          sx={{ minWidth: 200 }}
          renderInput={(params) => <TextField {...params} label="Marca" variant="outlined" />}
          noOptionsText="No se encontraron marcas"
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button variant="outlined" color="success" startIcon={<Download size={18} />} onClick={handleExportExcel}>Excel</Button>
        <Button variant="outlined" color="error" startIcon={<FileText size={18} />} onClick={handleExportPDF}>PDF</Button>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'codigo'} direction={orderBy === 'codigo' ? order : 'asc'} onClick={() => handleRequestSort('codigo')}>
                      <strong>Código</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'nombre'} direction={orderBy === 'nombre' ? order : 'asc'} onClick={() => handleRequestSort('nombre')}>
                      <strong>Nombre</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell><strong>Categoría</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell><strong>Ubicación</strong></TableCell>
                  <TableCell><strong>Stock</strong></TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'precio_lista'} direction={orderBy === 'precio_lista' ? order : 'asc'} onClick={() => handleRequestSort('precio_lista')}>
                      <strong>P. Lista</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repuestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No hay repuestos registrados.</TableCell>
                  </TableRow>
                ) : (
                  repuestos.map((row) => {
                    const stockNum = row.stock_total_disponible || 0;
                    const stockColor = (row.stock_minimo_global !== undefined && stockNum <= row.stock_minimo_global) ? "error" : "success";
                    return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.codigo}</TableCell>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.categoria_nombre}</TableCell>
                      <TableCell>{row.marca_nombre}</TableCell>
                      <TableCell>
                        {(() => {
                          const inv = row.inventario_stock || [];
                          if (inv.length === 0) return <span style={{color: 'gray'}}>—</span>;
                          const sorted = [...inv].sort((a, b) => b.stock_disponible - a.stock_disponible);
                          const primary = sorted[0];
                          const ubi = primary.ubicacion_detalle || primary.ubicacion_codigo;
                          
                          const tooltipContent = (
                            <Box sx={{ p: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, borderBottom: '1px solid #ffffff55' }}>Distribución de Stock:</Typography>
                              {sorted.map(i => (
                                <Box key={i.id} sx={{ mb: 1.5 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', lineHeight: 1.2, mb: 0.5 }}>
                                    {i.sucursal_nombre} › {i.almacen_nombre}
                                  </Typography>
                                  <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                                    <span>{i.ubicacion_detalle || i.ubicacion_codigo}</span>
                                    <strong>{i.stock_disponible} und</strong>
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          );

                          return (
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2, mb: 0.5 }}>
                                {primary.sucursal_nombre} › {primary.almacen_nombre}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{ubi}</span>
                                {inv.length > 1 && (
                                  <Tooltip title={tooltipContent} arrow placement="top">
                                    <Chip label={`+${inv.length - 1}`} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }} />
                                  </Tooltip>
                                )}
                              </Box>
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip label={stockNum} color={stockColor} size="small" variant={stockColor === 'error' ? 'filled' : 'outlined'} />
                      </TableCell>
                      <TableCell>S/ {row.precio_lista}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver Precios / Descuentos">
                          <IconButton color="secondary" onClick={(e) => handleOpenPrecios(e, row)}>
                            <Tag size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Stock por Ubicación">
                          <IconButton color="success" onClick={() => handleVerStock(row)}>
                            <Warehouse size={18} />
                          </IconButton>
                        </Tooltip>
                        <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
          </>
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
              <Grid item xs={12} md={4} sx={{ minWidth: 200 }}>
                <Controller
                  name="categoria"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={categorias}
                      getOptionLabel={(option) => option.nombre}
                      value={categorias.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Categoría" 
                          error={!!errors.categoria} 
                        />
                      )}
                      noOptionsText="No se encontraron categorías"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ minWidth: 200 }}>
                <Controller
                  name="marca"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={marcas}
                      getOptionLabel={(option) => option.nombre}
                      value={marcas.find(m => m.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Marca" 
                          error={!!errors.marca} 
                        />
                      )}
                      noOptionsText="No se encontraron marcas"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ minWidth: 200 }}>
                <Controller
                  name="unidad_medida"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      options={unidadesMedida}
                      getOptionLabel={(option) => `${option.nombre} (${option.abreviatura})`}
                      value={unidadesMedida.find(u => u.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Unidad de Medida" 
                          error={!!errors.unidad_medida} 
                          helperText={errors.unidad_medida ? "Requerido" : ""}
                        />
                      )}
                      noOptionsText="No se encontraron unidades"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ minWidth: 200 }}>
                <Controller
                  name="tipo_igv"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={tiposIgv}
                      getOptionLabel={(option) => option.nombre}
                      value={tiposIgv.find(t => t.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue ? newValue.id : '')}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Tipo de IGV" 
                          error={!!errors.tipo_igv} 
                        />
                      )}
                      noOptionsText="No se encontraron tipos de IGV"
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Especificaciones (Opcional)</Typography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Viscosidad (Ej. 5W-30)" 
                  fullWidth 
                  {...register('viscosidad')} 
                  helperText="Para lubricantes y aceites"
                />
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
              <Button variant="outlined" size="small" onClick={() => append({ marca_vehiculo: '', modelo_vehiculo: '', motor: '', anio_desde: '', anio_hasta: '' })}>
                + Agregar Regla
              </Button>
            </Box>
            
            {fields.map((item, index) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start', p: 2, border: '1px dashed #ccc', borderRadius: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                  <TextField label="Marca Vehículo (Ej. FIAT)" size="small" sx={{ flex: '1 1 150px' }} {...register(`aplicaciones.${index}.marca_vehiculo`, { required: true })} error={!!errors?.aplicaciones?.[index]?.marca_vehiculo} helperText="Obligatorio" />
                  <TextField label="Modelo (Opcional)" size="small" sx={{ flex: '1 1 150px' }} {...register(`aplicaciones.${index}.modelo_vehiculo`)} helperText="Vacío = toda la marca" />
                  <TextField label="Motor (Opcional)" size="small" sx={{ flex: '1 1 120px' }} {...register(`aplicaciones.${index}.motor`)} />
                  <TextField label="Año Desde" size="small" type="number" sx={{ flex: '0 1 100px' }} inputProps={{ min: 1900, max: 2099 }} {...register(`aplicaciones.${index}.anio_desde`, { min: 1900, max: 2099 })} helperText="Vacío = sin límite" />
                  <TextField label="Año Hasta" size="small" type="number" sx={{ flex: '0 1 100px' }} inputProps={{ min: 1900, max: 2099 }} {...register(`aplicaciones.${index}.anio_hasta`, { min: 1900, max: 2099 })} helperText="Vacío = sin límite" />
                  <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 1 }}>
                    <X size={20} />
                  </IconButton>
                </Box>
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

      {/* ─── Drawer de Stock por Ubicación ─── */}
      <Drawer
        anchor="right"
        open={stockDrawerOpen}
        onClose={() => setStockDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">Stock por Ubicación</Typography>
            {repuestoSeleccionado && (
              <Typography variant="body2" color="text.secondary">
                {repuestoSeleccionado.codigo} — {repuestoSeleccionado.nombre}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setStockDrawerOpen(false)}><X size={20} /></IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Button 
          variant="contained" 
          fullWidth 
          startIcon={<Plus size={18} />} 
          sx={{ mb: 3 }}
          onClick={handleAbrirAsignar}
          disabled={loadingStock}
        >
          Asignar a nueva ubicación
        </Button>

        {loadingStock ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress />
          </Box>
        ) : stockData.length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 4, color: 'text.secondary' }}>
            <Warehouse size={40} style={{ opacity: 0.3 }} />
            <Typography variant="body2" sx={{ mt: 1 }}>Este repuesto no tiene stock asignado a ninguna ubicación.</Typography>
          </Box>
        ) : (
          stockData.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">{item.ubicacion_codigo}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.sucursal_nombre} › {item.almacen_nombre}
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={() => handleAbrirAjuste(item)}>Ajustar</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`Disponible: ${item.stock_disponible}`} color="success" size="small" />
                <Chip label={`Mínimo: ${item.stock_minimo}`} color="info" size="small" variant="outlined" />
                <Chip label={`Reservado: ${item.stock_reservado}`} color="warning" size="small" />
                <Chip label={`Merma: ${item.stock_merma}`} color="error" size="small" variant="outlined" />
              </Box>
            </Paper>
          ))
        )}
      </Drawer>

      {/* ─── Modal de Ajuste de Stock ─── */}
      <Dialog open={ajusteModal.open} onClose={() => setAjusteModal({ open: false, stockItem: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Ajustar Stock Disponible</DialogTitle>
        <DialogContent dividers>
          {ajusteModal.stockItem && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ubicación: <strong>{ajusteModal.stockItem.ubicacion_codigo}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Stock actual: <strong>{ajusteModal.stockItem.stock_disponible}</strong> unidades
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nueva cantidad disponible *"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 'any' }}
              value={ajusteValor.cantidad}
              onChange={(e) => setAjusteValor((prev) => ({ ...prev, cantidad: e.target.value }))}
            />
            <TextField
              label="Stock Mínimo (Alerta)"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 'any' }}
              value={ajusteValor.stock_minimo}
              onChange={(e) => setAjusteValor((prev) => ({ ...prev, stock_minimo: e.target.value }))}
            />
            <TextField
              label="Motivo del ajuste *"
              fullWidth
              placeholder="Ej: Conteo físico mensual"
              value={ajusteValor.motivo}
              onChange={(e) => setAjusteValor((prev) => ({ ...prev, motivo: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAjusteModal({ open: false, stockItem: null })} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarAjuste}>Guardar Ajuste</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Modal para Asignar Nueva Ubicación ─── */}
      <Dialog open={asignarModalOpen} onClose={() => setAsignarModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar a Nueva Ubicación</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selecciona una ubicación física para almacenar el repuesto 
              <strong> {repuestoSeleccionado?.codigo}</strong>.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Ubicación *</InputLabel>
              <Select
                label="Ubicación *"
                value={asignarForm.ubicacion}
                onChange={(e) => setAsignarForm((prev) => ({ ...prev, ubicacion: e.target.value }))}
              >
                {todasUbicaciones.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.sucursal_nombre} › {u.almacen_nombre} › <strong>{u.codigo}</strong>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Stock inicial disponible *"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, step: 'any' }}
                  value={asignarForm.cantidad}
                  onChange={(e) => setAsignarForm((prev) => ({ ...prev, cantidad: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Motivo *"
                  fullWidth
                  value={asignarForm.motivo}
                  onChange={(e) => setAsignarForm((prev) => ({ ...prev, motivo: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAsignarModalOpen(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarAsignar}>Asignar Ubicación</Button>
        </DialogActions>
      </Dialog>
      {/* Popover de Precios */}
      <Popover
        open={openPrecios}
        anchorEl={preciosAnchorEl}
        onClose={handleClosePrecios}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {repuestoPrecios && (
          <Box sx={{ p: 2, minWidth: 220 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
              Márgenes de Negociación
            </Typography>
            <Divider sx={{ mb: 1 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">P. Lista (Público):</Typography>
              <Typography variant="body2" fontWeight="bold">S/ {repuestoPrecios.precio_lista}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">P. Cash (Descuento):</Typography>
              <Typography variant="body2" fontWeight="bold">S/ {repuestoPrecios.precio_cash}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">P. Por Mayor (Mínimo):</Typography>
              <Typography variant="body2" fontWeight="bold">S/ {repuestoPrecios.precio_por_mayor}</Typography>
            </Box>

            {isOwner && (
              <>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#ffebee', p: 0.5, borderRadius: 1 }}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">Costo (Compra):</Typography>
                  <Typography variant="body2" color="error.main" fontWeight="bold">S/ {repuestoPrecios.precio_compra}</Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </Popover>

    </Box>
  );
}
