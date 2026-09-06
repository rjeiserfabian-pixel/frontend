import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, Button, Chip, CircularProgress 
} from '@mui/material';
import { AlertTriangle, Check, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios'; // Or inventarioService if we add it there

const RevisionPreciosPage = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRepuestosConAlerta();
  }, []);

  const fetchRepuestosConAlerta = async () => {
    try {
      setLoading(true);
      // Asumimos que podemos filtrar repuestos por alerta_precio=True
      // O crear un endpoint custom. Usaremos el estandar de DRF.
      const response = await api.get('/inventario/repuestos/?alerta_precio=true');
      setRepuestos(response.data.results || response.data);
    } catch (error) {
      console.error("Error al cargar alertas de precios", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index, field, value) => {
    const newRepuestos = [...repuestos];
    newRepuestos[index][field] = value;
    setRepuestos(newRepuestos);
  };

  const saveRepuesto = async (index) => {
    const repuesto = repuestos[index];
    try {
      setSaving(true);
      // Limpiar la alerta y guardar nuevos precios
      await api.patch(`/inventario/repuestos/${repuesto.id}/`, {
        precio_lista: repuesto.precio_lista,
        precio_cash: repuesto.precio_cash,
        precio_por_mayor: repuesto.precio_por_mayor,
        alerta_precio: false
      });
      
      Swal.fire({ icon: 'success', title: 'Precios actualizados', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      
      // Remover de la lista
      const newRepuestos = [...repuestos];
      newRepuestos.splice(index, 1);
      setRepuestos(newRepuestos);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron guardar los precios.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <AlertTriangle color="#ed6c02" size={32} />
        <Typography variant="h4" fontWeight="bold">Revisión de Precios</Typography>
      </Box>
      <Typography color="text.secondary" mb={3}>
        Estos repuestos requieren tu atención porque su costo de compra subió recientemente y tu margen de ganancia ha caído por debajo del mínimo esperado.
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: '70vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Código</b></TableCell>
                <TableCell><b>Nombre / Categoría</b></TableCell>
                <TableCell align="center"><b>Costo Actual</b></TableCell>
                <TableCell align="center" sx={{ bgcolor: 'rgba(237, 108, 2, 0.1)' }}><b>Precio Venta (Lista)</b></TableCell>
                <TableCell align="center" sx={{ bgcolor: 'rgba(237, 108, 2, 0.1)' }}><b>Precio Cash</b></TableCell>
                <TableCell align="center" sx={{ bgcolor: 'rgba(237, 108, 2, 0.1)' }}><b>Precio Mayor</b></TableCell>
                <TableCell align="center"><b>Acción</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : repuestos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Check color="green" size={48} style={{ marginBottom: 10 }} />
                    <Typography variant="h6">¡Todo en orden!</Typography>
                    <Typography color="text.secondary">No hay repuestos con alertas de margen bajo.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                repuestos.map((repuesto, index) => {
                   const margen = ((repuesto.precio_lista - repuesto.precio_compra) / repuesto.precio_lista) * 100;
                   return (
                  <TableRow key={repuesto.id} hover>
                    <TableCell>{repuesto.codigo}</TableCell>
                    <TableCell>
                      {repuesto.nombre}<br/>
                      <Typography variant="caption" color="text.secondary">{repuesto.categoria_nombre}</Typography>
                    </TableCell>
                    <TableCell align="center">
                       <Typography fontWeight="bold" color="error">S/ {repuesto.precio_compra}</Typography>
                       {margen < 0 ? (
                         <Chip label={`Perdiendo ${Math.abs(margen).toFixed(1)}%`} color="error" size="small" sx={{ mt: 1 }} />
                       ) : (
                         <Chip label={`Margen: ${margen.toFixed(1)}%`} color="warning" size="small" sx={{ mt: 1 }} />
                       )}
                    </TableCell>
                    
                    <TableCell align="center">
                      <TextField 
                         type="number" size="small" sx={{ width: 100 }}
                         value={repuesto.precio_lista}
                         onChange={(e) => handlePriceChange(index, 'precio_lista', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                         type="number" size="small" sx={{ width: 100 }}
                         value={repuesto.precio_cash}
                         onChange={(e) => handlePriceChange(index, 'precio_cash', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                         type="number" size="small" sx={{ width: 100 }}
                         value={repuesto.precio_por_mayor}
                         onChange={(e) => handlePriceChange(index, 'precio_por_mayor', e.target.value)}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Button 
                         variant="contained" color="success" size="small"
                         startIcon={<Save size={16}/>}
                         onClick={() => saveRepuesto(index)}
                         disabled={saving}
                      >
                         Aprobar
                      </Button>
                    </TableCell>
                  </TableRow>
                   );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default RevisionPreciosPage;
