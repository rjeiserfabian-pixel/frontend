import React, { useEffect, useState } from 'react';
import { 
  Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  TextField, Box, CircularProgress, TablePagination 
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';
import ClientesForm from '../components/ClientesForm';
import Swal from 'sweetalert2';

const ClientesPage = () => {
  const { clientes, loading, totalCount, cargarClientes } = useClientes();
  const [page, setPage] = useState(0); // 0-indexed para TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEdit, setClienteEdit] = useState(null);

  // Regla 1.3: Debounce en búsquedas
  useEffect(() => {
    const timer = setTimeout(() => {
      // DRF paginates 1-indexed
      cargarClientes(page + 1, search);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [page, search, cargarClientes]);

  const handleOpenModal = (cliente = null) => {
    setClienteEdit(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setClienteEdit(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestión de Clientes</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenModal()}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* BARRA DE BÚSQUEDA */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', boxShadow: 1 }}>
        <TextField
          label="Buscar (DNI/Nombre)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 300 }}
          InputProps={{ endAdornment: <SearchIcon style={{ opacity: 0.5 }} /> }}
        />
        <Box sx={{ flexGrow: 1 }} />
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
        {loading && clientes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>DNI</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Teléfono</strong></TableCell>
                    <TableCell><strong>Dirección</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          No se encontraron clientes
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.dni}</TableCell>
                        <TableCell>{`${row.nombres} ${row.apellidos}`}</TableCell>
                        <TableCell>{row.telefono || '-'}</TableCell>
                        <TableCell>{row.direccion || '-'}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" onClick={() => handleOpenModal(row)}>
                            <Edit2 size={18} />
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
            count={totalCount}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
          </>
        )}
      </Paper>

      <ClientesForm 
        open={modalOpen} 
        onClose={handleCloseModal} 
        onSuccess={() => cargarClientes(page + 1, search)}
        clienteEdit={clienteEdit}
      />
    </Box>
  );
};

export default ClientesPage;
