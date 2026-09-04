import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton, InputAdornment, TablePagination 
} from '@mui/material';
import { Plus, Edit, Trash2, Search as SearchIcon } from 'lucide-react';
import TransportistasForm from '../components/TransportistasForm';
import { useTransportistas } from '../hooks/useTransportistas';
import Swal from 'sweetalert2';

const TransportistasPage = () => {
  const { 
    transportistas, loading, cargarTransportistas, eliminarTransportista, 
    totalCount 
  } = useTransportistas();
  
  const [openModal, setOpenModal] = useState(false);
  const [transportistaEdit, setTransportistaEdit] = useState(null);
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
    cargarTransportistas(page + 1, debouncedSearch);
  }, [cargarTransportistas, debouncedSearch, page]);

  const handleOpenModal = (transportista = null) => {
    setTransportistaEdit(transportista);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setTransportistaEdit(null);
  };

  const handleSuccess = () => {
    cargarTransportistas(page + 1, debouncedSearch);
  };

  // Regla 5.1: Confirmación explícita para acciones destructivas
  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "El transportista se eliminará del listado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await eliminarTransportista(id);
        if (success) {
          cargarTransportistas(page + 1, debouncedSearch);
        }
      }
    });
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Gestión de Transportistas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Administra el listado de transportistas de la empresa.
          </Typography>
        </Box>
      </Box>

      {/* TOOLBAR */}
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'grey.200' }}>
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
          <Button 
            variant="contained" 
            startIcon={<Plus size={20} />} 
            onClick={() => handleOpenModal()}
          >
            Nuevo Transportista
          </Button>
        </Box>

        {/* TABLE */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>N° Documento</strong></TableCell>
                <TableCell><strong>Nombre/Razón Social</strong></TableCell>
                <TableCell><strong>Licencia</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Cargando transportistas...</TableCell>
                </TableRow>
              ) : transportistas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No se encontraron resultados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transportistas.map((transportista) => (
                  <TableRow key={transportista.id} hover>
                    <TableCell>{transportista.tipo_documento}</TableCell>
                    <TableCell>{transportista.numero_documento}</TableCell>
                    <TableCell>{transportista.nombre_o_razon_social}</TableCell>
                    <TableCell>{transportista.licencia_conducir || '-'} {transportista.categoria_licencia ? `(${transportista.categoria_licencia})` : ''}</TableCell>
                    <TableCell>{transportista.telefono || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenModal(transportista)}>
                        <Edit size={18} />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(transportista.id)}>
                        <Trash2 size={18} />
                      </IconButton>
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
        <TransportistasForm 
          open={openModal} 
          onClose={handleCloseModal} 
          onSuccess={handleSuccess}
          transportistaEdit={transportistaEdit}
        />
      )}
    </Box>
  );
};

export default TransportistasPage;
