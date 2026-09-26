import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton, InputAdornment, TablePagination 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Search as SearchIcon } from 'lucide-react';
import ProveedoresForm from '../components/ProveedoresForm';
import { useProveedores } from '../hooks/useProveedores';
import Swal from 'sweetalert2';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

const ProveedoresPage = () => {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('CONTACTOS.PROVEEDORES.CREAR');
  const puedeEditar = tienePermiso('CONTACTOS.PROVEEDORES.EDITAR');
  const puedeEliminar = tienePermiso('CONTACTOS.PROVEEDORES.ELIMINAR');

  const {
    proveedores, loading, cargarProveedores, eliminarProveedor,
    totalCount
  } = useProveedores();
  
  const [openModal, setOpenModal] = useState(false);
  const [proveedorEdit, setProveedorEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination states (MUI TablePagination uses 0-indexed pages)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Regla 1.5: Debounce para búsquedas en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    cargarProveedores(page + 1, debouncedSearch);
  }, [cargarProveedores, debouncedSearch, page]);

  const handleOpenModal = (proveedor = null) => {
    setProveedorEdit(proveedor);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setProveedorEdit(null);
  };

  const handleSuccess = () => {
    cargarProveedores(page + 1, debouncedSearch);
  };

  // Regla 5.1: Confirmación explícita para acciones destructivas
  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El proveedor se eliminará del listado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await eliminarProveedor(id);
        if (success) {
          cargarProveedores(page + 1, debouncedSearch);
        }
      }
    });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: C.text }}>
            Gestión de Proveedores
          </Typography>
          <Typography variant="body2" sx={{ color: C.textMuted, mt: 0.5 }}>
            Administra el listado de proveedores de la empresa.
          </Typography>
        </Box>
      </Box>

      {/* TOOLBAR */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
          <TextField
            size="small"
            placeholder="Buscar por DNI, RUC o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          {puedeCrear && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={() => handleOpenModal()}
            >
              Nuevo Proveedor
            </Button>
          )}
        </Box>

        {/* TABLE */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
              <TableRow>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>N° Documento</strong></TableCell>
                <TableCell><strong>Nombre/Razón Social</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Dirección</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Cargando proveedores...</TableCell>
                </TableRow>
              ) : proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron resultados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((proveedor) => (
                  <TableRow key={proveedor.id} hover>
                    <TableCell>{proveedor.tipo_documento}</TableCell>
                    <TableCell>{proveedor.numero_documento}</TableCell>
                    <TableCell>{proveedor.nombre_o_razon_social}</TableCell>
                    <TableCell>{proveedor.telefono || '-'}</TableCell>
                    <TableCell>{proveedor.direccion || '-'}</TableCell>
                    <TableCell align="center">
                      {puedeEditar && (
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenModal(proveedor)}
                          size="small"
                          sx={{ mr: 1, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}
                        >
                          <Edit size={18} />
                        </IconButton>
                      )}
                      {puedeEliminar && (
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(proveedor.id)}
                        size="small"
                        sx={{ bgcolor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}` }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount || 0}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelDisplayedRows={({ from, to, count }) => {
            return `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`;
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>
      
      {openModal && (
        <ProveedoresForm 
          open={openModal} 
          onClose={handleCloseModal} 
          onSuccess={handleSuccess}
          proveedorEdit={proveedorEdit}
        />
      )}
    </Box>
  );
};

export default ProveedoresPage;
