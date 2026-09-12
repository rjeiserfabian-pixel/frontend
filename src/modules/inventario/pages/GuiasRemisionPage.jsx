import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  TablePagination, Chip
} from '@mui/material';
import { Truck, Printer, Play, CheckCircle, Eye } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import ModalNuevoguia from '../components/ModalNuevaGuiaRemision';
import ModalSalidaGuia from '../components/ModalSalidaGuia';
import ModalDetalleGuiaRemision from '../components/ModalDetalleGuiaRemision';
import PrintGuiaRemisionA4 from '../components/PrintGuiaRemisionA4';
import { useReactToPrint } from 'react-to-print';

export default function GuiasRemisionPage() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModalNueva, setOpenModalNueva] = useState(false);
  const [openModalSalida, setOpenModalSalida] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [guiaDetalle, setGuiaDetalle] = useState(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGuias = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/guias-remision/', {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      if (res.data.results) {
        setGuias(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setGuias(res.data);
        setTotalCount(res.data.length);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar las guías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuias();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [guiaParaImprimir, setGuiaParaImprimir] = useState(null);
  const printRef = useRef();

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Guia_de_Remision',
    onAfterPrint: () => setGuiaParaImprimir(null),
  });

  useEffect(() => {
    if (guiaParaImprimir) {
      handlePrintAction();
    }
  }, [guiaParaImprimir, handlePrintAction]);

  const handleDarSalida = (guia) => {
    setSelectedGuia(guia);
    setOpenModalSalida(true);
  };

  const handleCompletarTraslado = async (guia) => {
    const confirm = await Swal.fire({
      title: '¿Confirmar llegada?',
      text: `¿La guía ${guia.serie_prefijo}-${String(guia.correlativo).padStart(6,'0')} ya llegó a su destino?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.post(`/inventario/guias-remision/${guia.id}/completar/`);
      Swal.fire('¡Completado!', 'La guía ha sido marcada como completada.', 'success');
      fetchGuias();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.detail || 'Error al completar', 'error');
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'CREADA': return <Chip label="Creada" color="default" size="small" />;
      case 'EN_TRASLADO': return <Chip label="En Traslado" color="warning" size="small" />;
      case 'COMPLETADA': return <Chip label="Completada" color="success" size="small" />;
      default: return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Guías de Remisión
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Truck size={18} />}
          onClick={() => setOpenModalNueva(true)}
        >
          Nueva Guía
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>Nº Guía</b></TableCell>
              <TableCell><b>Emisión</b></TableCell>
              <TableCell><b>Cliente</b></TableCell>
              <TableCell><b>Destino</b></TableCell>
              <TableCell><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : guias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>No hay guías registradas</TableCell>
              </TableRow>
            ) : (
              guias.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.serie_prefijo}-{String(item.correlativo).padStart(6, '0')}</TableCell>
                  <TableCell>
                    {new Date(item.fecha_emision).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.cliente_nombre}</TableCell>
                  <TableCell>{item.ubigeo_llegada_nombre}</TableCell>
                  <TableCell>{getStatusChip(item.estado)}</TableCell>
                  <TableCell align="center">
                    {item.estado === 'CREADA' && (
                      <IconButton color="success" onClick={() => handleDarSalida(item)} title="Dar Salida" sx={{ mr: 1 }}>
                        <Play size={18} />
                      </IconButton>
                    )}
                    {item.estado === 'EN_TRASLADO' && (
                      <IconButton color="primary" onClick={() => handleCompletarTraslado(item)} title="Confirmar llegada / Completar" sx={{ mr: 1 }}>
                        <CheckCircle size={18} />
                      </IconButton>
                    )}
                    <IconButton color="info" onClick={() => setGuiaDetalle(item)} title="Ver Detalle" sx={{ mr: 1 }}>
                      <Eye size={18} />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => setGuiaParaImprimir(item)}
                      title="Imprimir Guía"
                      disabled={item.estado === 'CREADA'} // Solo imprime si ya dio salida
                    >
                      <Printer size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
      />

      {openModalNueva && (
        <ModalNuevoguia 
          open={openModalNueva} 
          onClose={() => setOpenModalNueva(false)} 
          onSuccess={() => {
            setOpenModalNueva(false);
            fetchGuias();
          }} 
        />
      )}

      {openModalSalida && (
        <ModalSalidaGuia
          open={openModalSalida}
          onClose={() => setOpenModalSalida(false)}
          guia={selectedGuia}
          onSuccess={() => {
            setOpenModalSalida(false);
            fetchGuias();
          }}
        />
      )}

      <ModalDetalleGuiaRemision
        open={!!guiaDetalle}
        onClose={() => setGuiaDetalle(null)}
        guia={guiaDetalle}
      />

      <div style={{ display: 'none' }}>
        <PrintGuiaRemisionA4 ref={printRef} guia={guiaParaImprimir} />
      </div>
    </Box>
  );
}

