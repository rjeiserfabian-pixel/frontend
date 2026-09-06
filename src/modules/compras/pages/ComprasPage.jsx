import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, TablePagination } from '@mui/material';
import { Plus, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { comprasService } from '../services/comprasApi';

const ComprasPage = () => {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCompras();
  }, [page, rowsPerPage]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const data = await comprasService.getCompras({ 
        page: page + 1, 
        page_size: rowsPerPage 
      });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCompras(list);
      setTotalCount(data.count !== undefined ? data.count : list.length);
    } catch (error) {
      console.error("Error al cargar compras", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a' }}>
          Listado de Compras
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/compras/nueva')}
          sx={{
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
            textTransform: 'none',
            borderRadius: 2
          }}
        >
          Nueva Compra
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Comprobante</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Proveedor</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tipo Pago</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Total</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Estado</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#475569' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No hay compras registradas.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id} hover>
                    <TableCell>{compra.fecha_emision}</TableCell>
                    <TableCell>
                      {compra.tipo_comprobante_nombre} {compra.serie}-{compra.numero_comprobante}
                    </TableCell>
                    <TableCell>{compra.proveedor_detalle?.nombre_o_razon_social}</TableCell>
                    <TableCell>
                      <Chip 
                        label={compra.tipo_pago} 
                        color={compra.tipo_pago === 'Contado' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">S/ {parseFloat(compra.total).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={compra.estado} 
                        color={compra.estado === 'Completada' ? 'primary' : 'error'} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" startIcon={<FileText size={16} />}>
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>
    </Box>
  );
};

export default ComprasPage;
