import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  TablePagination, Chip
} from '@mui/material';
import { ArrowRightLeft, Printer, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../core/api/axios';
import Swal from 'sweetalert2';
import ModalNuevoTraslado from '../components/ModalNuevoTraslado';
import ModalDetalleTraslado from '../components/ModalDetalleTraslado';
import { useReactToPrint } from 'react-to-print';
import PrintTrasladoComponent from '../components/PrintTrasladoComponent';

export default function TrasladosPage() {
  const [traslados, setTraslados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedTraslado, setSelectedTraslado] = useState(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTraslados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventario/traslados/', {
        params: {
          page: page + 1,
          page_size: rowsPerPage
        }
      });
      if (res.data.results) {
        setTraslados(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setTraslados(res.data);
        setTotalCount(res.data.length);
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los traslados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraslados();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [trasladoParaImprimir, setTrasladoParaImprimir] = useState(null);
  const printRef = React.useRef();

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Nota_de_Traslado',
    onAfterPrint: () => setTrasladoParaImprimir(null),
  });

  useEffect(() => {
    if (trasladoParaImprimir) {
      handlePrintAction();
    }
  }, [trasladoParaImprimir, handlePrintAction]);

  const handlePrint = (traslado) => {
    setTrasladoParaImprimir(traslado);
  };

  const getStatusChip = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return <Chip label="Pendiente" color="warning" size="small" />;
      case 'COMPLETADO': return <Chip label="Completado" color="success" size="small" />;
      case 'RECHAZADO': return <Chip label="Rechazado" color="error" size="small" />;
      default: return <Chip label={estado} size="small" />;
    }
  };

  const handleConfirmar = async (traslado) => {
    const confirm = await Swal.fire({
      title: '¿Confirmar recepción?',
      text: `Se sumará el stock al almacén ${traslado.almacen_destino_nombre}. Asegúrate de haber contado la mercadería físicamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.post(`/inventario/traslados/${traslado.id}/confirmar/`);
      Swal.fire({ icon: 'success', title: 'Recepción confirmada', showConfirmButton: false, timer: 1500 });
      fetchTraslados();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo confirmar la recepción.', 'error');
    }
  };

  const handleRechazar = async (traslado) => {
    const { value: motivo } = await Swal.fire({
      title: '¿Rechazar traslado?',
      input: 'text',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Ej. La mercadería nunca llegó al destino',
      text: `El stock volverá al almacén ${traslado.almacen_origen_nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      inputValidator: (value) => !value && 'Debes indicar el motivo del rechazo.',
    });
    if (!motivo) return;
    try {
      await api.post(`/inventario/traslados/${traslado.id}/rechazar/`, { motivo });
      Swal.fire({ icon: 'success', title: 'Traslado rechazado', showConfirmButton: false, timer: 1500 });
      fetchTraslados();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo rechazar el traslado.', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Movimientos de Almacén
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ArrowRightLeft size={18} />}
          onClick={() => setOpenModal(true)}
        >
          Nuevo Movimiento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell><b>N° Documento</b></TableCell>
              <TableCell><b>Fecha</b></TableCell>
              <TableCell><b>Origen</b></TableCell>
              <TableCell><b>Destino</b></TableCell>
              <TableCell><b>Usuario</b></TableCell>
              <TableCell><b>Observaciones</b></TableCell>
              <TableCell align="center"><b>Estado</b></TableCell>
              <TableCell align="center"><b>Acciones</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
              </TableRow>
            ) : traslados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>No hay traslados registrados</TableCell>
              </TableRow>
            ) : (
              traslados.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.numero_documento || `TR-${String(item.id).padStart(6, '0')}`}</TableCell>
                  <TableCell>
                    {new Date(item.fecha_traslado).toLocaleDateString()} {new Date(item.fecha_traslado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{item.almacen_origen_nombre}</TableCell>
                  <TableCell>{item.almacen_destino_nombre}</TableCell>
                  <TableCell>{item.usuario_nombre}</TableCell>
                  <TableCell>{item.observaciones || '-'}</TableCell>
                  <TableCell align="center">{getStatusChip(item.estado)}</TableCell>
                  <TableCell align="center">
                    {item.estado === 'PENDIENTE' && (
                      <>
                        <IconButton color="success" onClick={() => handleConfirmar(item)} title="Confirmar recepción" sx={{ mr: 1 }}>
                          <CheckCircle size={18} />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleRechazar(item)} title="Rechazar" sx={{ mr: 1 }}>
                          <XCircle size={18} />
                        </IconButton>
                      </>
                    )}
                    <IconButton color="info" onClick={() => setSelectedTraslado(item)} title="Ver Detalle" sx={{ mr: 1 }}>
                      <Eye size={18} />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handlePrint(item)} title="Imprimir Nota">
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
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
      />

      {openModal && (
        <ModalNuevoTraslado 
          open={openModal} 
          onClose={() => setOpenModal(false)} 
          onSuccess={() => {
            setOpenModal(false);
            fetchTraslados();
          }} 
        />
      )}

      <ModalDetalleTraslado 
        open={!!selectedTraslado}
        onClose={() => setSelectedTraslado(null)}
        traslado={selectedTraslado}
      />

      <div style={{ display: 'none' }}>
        <PrintTrasladoComponent ref={printRef} traslado={trasladoParaImprimir} />
      </div>
    </Box>
  );
}
