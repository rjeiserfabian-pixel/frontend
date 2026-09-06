import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import { Plus, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { comprasService } from '../services/comprasApi';

const ComprasPage = () => {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompras();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const data = await comprasService.getCompras();
      setCompras(data);
    } catch (error) {
      console.error("Error al cargar compras", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Listado de Compras</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus />}
          onClick={() => navigate('/compras/nueva')}
        >
          Nueva Compra
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><b>Fecha</b></TableCell>
                <TableCell><b>Comprobante</b></TableCell>
                <TableCell><b>Proveedor</b></TableCell>
                <TableCell><b>Tipo Pago</b></TableCell>
                <TableCell align="right"><b>Total</b></TableCell>
                <TableCell align="center"><b>Estado</b></TableCell>
                <TableCell align="center"><b>Acciones</b></TableCell>
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
                      {compra.tipo_comprobante} {compra.serie}-{compra.numero_comprobante}
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
      </Paper>
    </Box>
  );
};

export default ComprasPage;
