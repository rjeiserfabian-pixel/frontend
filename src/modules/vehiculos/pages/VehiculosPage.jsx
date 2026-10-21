import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, 
  CircularProgress, TablePagination, TextField,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Plus, Edit, Trash2, Search, History, QrCode, Wrench, FileText, Image as ImageIcon, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { vehiculoService } from '../services/vehiculosService';
import VehiculosForm from '../components/VehiculosForm';
import HistorialVehiculoModal from '../components/HistorialVehiculoModal';
import QrVehiculoModal from '../components/QrVehiculoModal';
import MantenimientosVehiculoModal from '../components/MantenimientosVehiculoModal';
import DocumentosDialog from '../../documentos/components/DocumentosDialog';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';
import { getMediaUrl } from '../../../core/utils/mediaUrl';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

export default function VehiculosPage() {
  const { tienePermiso } = usePermisos();
  const puedeCrear = tienePermiso('VEHICULOS.CREAR');
  const puedeEditar = tienePermiso('VEHICULOS.EDITAR');
  const puedeEliminar = tienePermiso('VEHICULOS.ELIMINAR');

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [historialVehiculoId, setHistorialVehiculoId] = useState(null);
  const [qrVehiculoId, setQrVehiculoId] = useState(null);
  const [mantenimientoVehiculoId, setMantenimientoVehiculoId] = useState(null);
  const [documentosVehiculo, setDocumentosVehiculo] = useState(null);
  const [modalFotoOpen, setModalFotoOpen] = useState(false);
  const [modalFotoData, setModalFotoData] = useState({ url: '', titulo: '' });

  // Pagination and search
  const [page, setPage] = useState(0); // MUI TablePagination uses 0-indexed pages
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  const fetchVehiculos = useCallback(async (currentPage, currentSearch) => {
    try {
      setLoading(true);
      const res = await vehiculoService.getVehiculos(currentPage + 1, currentSearch);
      setVehiculos(res.results || res); 
      setTotalCount(res.count !== undefined ? res.count : (res.results ? res.results.length : res.length));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error al cargar los vehículos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Regla 1.3: Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehiculos(page, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search, fetchVehiculos]);

  const handleOpenModal = (vehiculo = null) => {
    setEditingVehiculo(vehiculo);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingVehiculo(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El vehículo se eliminará de forma lógica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await vehiculoService.deleteVehiculo(id);
        Swal.fire('Eliminado!', 'El vehículo ha sido eliminado.', 'success');
        fetchVehiculos(page, search);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar el vehículo', 'error');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Gestión de Vehículos</Typography>
        {puedeCrear && (
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenModal()}
          >
            Nuevo Vehículo
          </Button>
        )}
      </Box>

      {/* BARRA DE BÚSQUEDA */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(135deg, ${alpha(C.brand, 0.06)}, transparent 42%)` }}>
        <TextField 
          label="Buscar (Placa/Marca)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Volver a la primera página al buscar
          }}
          sx={{ minWidth: 300 }}
          slotProps={{ input: { endAdornment: <Search size={20} style={{ opacity: 0.5 }} /> } }}
        />
        <Box sx={{ flexGrow: 1 }} />
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: S.card, backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.045)}, transparent 32%)` }}>
        {loading && vehiculos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(C.surfaceSoft, 0.92) }}>
                <TableRow>
                  <TableCell align="center" sx={{ width: 60 }}><strong>Foto</strong></TableCell>
                  <TableCell><strong>Placa</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell><strong>Modelo</strong></TableCell>
                  <TableCell><strong>Propietario(s)</strong></TableCell>
                  <TableCell><strong>Clase</strong></TableCell>
                  <TableCell><strong>Combustible</strong></TableCell>
                  <TableCell><strong>Color</strong></TableCell>
                  <TableCell align="right"><strong>Kilometraje</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No hay vehículos registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vehiculos.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell align="center" sx={{ width: 60, py: 1 }}>
                        {row.imagen ? (
                          <Box
                            component="img"
                            src={getMediaUrl(row.imagen)}
                            alt={row.placa}
                            onClick={() => {
                              setModalFotoData({ url: getMediaUrl(row.imagen), titulo: `${row.placa} - ${row.marca} ${row.modelo}` });
                              setModalFotoOpen(true);
                            }}
                            sx={{
                              width: 44,
                              height: 34,
                              borderRadius: '6px',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: `1px solid ${C.border}`,
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: `0 0 10px ${alpha(C.brand, 0.5)}`
                              }
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 44,
                              height: 34,
                              borderRadius: '6px',
                              backgroundColor: alpha('#ffffff', 0.04),
                              border: `1px dashed ${alpha('#ffffff', 0.15)}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'text.secondary',
                              margin: '0 auto'
                            }}
                          >
                            <ImageIcon size={16} opacity={0.35} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#bae6fd' }}>{row.placa}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.marca}</TableCell>
                      <TableCell>{row.modelo}</TableCell>
                      <TableCell>
                        {row.clientes_detalle && row.clientes_detalle.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {row.clientes_detalle.map((c) => (
                              <span key={c.id} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                                {c.dni} - {c.nombres} {c.apellidos || ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin propietario</span>
                        )}
                      </TableCell>
                      <TableCell>{row.clase || '-'}</TableCell>
                      <TableCell>{row.tipo_combustible === 'GASOLINA' ? 'Gasolinero' : row.tipo_combustible === 'PETROLEO' ? 'Petrolero' : '-'}</TableCell>
                      <TableCell>{row.color || '-'}</TableCell>
                      <TableCell align="right">{row.kilometraje_actual ? `${row.kilometraje_actual} km` : '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => setMantenimientoVehiculoId(row.id)} title="Mantenimientos" aria-label="Mantenimientos" sx={{ color: C.textMuted, mr: 1 }}>
                          <Wrench size={18} />
                        </IconButton>
                        <IconButton onClick={() => setDocumentosVehiculo(row)} title="Documentos (SOAT, revisión técnica...)" aria-label="Documentos" sx={{ color: C.textMuted, mr: 1 }}>
                          <FileText size={18} />
                        </IconButton>
                        <IconButton onClick={() => setQrVehiculoId(row.id)} title="Codigo QR" sx={{ color: C.textMuted, mr: 1, bgcolor: alpha('#ffffff', 0.04), border: `1px solid ${C.border}` }}>
                          <QrCode size={18} />
                        </IconButton>
                        <IconButton onClick={() => setHistorialVehiculoId(row.id)} title="Ver historial" sx={{ color: C.textMuted, mr: 1, bgcolor: alpha('#ffffff', 0.04), border: `1px solid ${C.border}` }}>
                          <History size={18} />
                        </IconButton>
                        {puedeEditar && (
                          <IconButton color="secondary" onClick={() => handleOpenModal(row)} size="small" sx={{ mr: 1, bgcolor: alpha(C.blue, 0.08), border: `1px solid ${alpha(C.blue, 0.18)}` }}>
                            <Edit size={18} />
                          </IconButton>
                        )}
                        {puedeEliminar && (
                          <IconButton color="error" onClick={() => handleDelete(row.id)} size="small" sx={{ bgcolor: alpha(C.brand, 0.08), border: `1px solid ${alpha(C.brandLight, 0.18)}` }}>
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
        )}
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
      </Paper>

      {/* Componente Modal refactorizado */}
      <VehiculosForm
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={() => fetchVehiculos(page, search)}
        vehiculoEdit={editingVehiculo}
      />

      <HistorialVehiculoModal
        open={!!historialVehiculoId}
        onClose={() => setHistorialVehiculoId(null)}
        vehiculoId={historialVehiculoId}
      />

      {qrVehiculoId && (
        <QrVehiculoModal
          key={qrVehiculoId}
          open
          onClose={() => setQrVehiculoId(null)}
          vehiculoId={qrVehiculoId}
          puedeGestionar={puedeEditar}
        />
      )}
      {documentosVehiculo && (
        <DocumentosDialog
          open
          entidad="VEHICULO"
          entidadId={documentosVehiculo.id}
          titulo={documentosVehiculo.placa}
          puedeGestionar={puedeEditar}
          onClose={() => setDocumentosVehiculo(null)}
        />
      )}
      {mantenimientoVehiculoId && (
        <MantenimientosVehiculoModal
          key={mantenimientoVehiculoId}
          vehiculoId={mantenimientoVehiculoId}
          puedeGestionar={puedeEditar}
          onClose={() => setMantenimientoVehiculoId(null)}
        />
      )}

      {/* --- MODAL PARA VER FOTO DE VEHÍCULO EN TAMAÑO COMPLETO --- */}
      <Dialog
        open={modalFotoOpen}
        onClose={() => setModalFotoOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: '#0f172a',
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {modalFotoData.titulo || 'Fotografía del Vehículo'}
          </Typography>
          <IconButton size="small" onClick={() => setModalFotoOpen(false)} sx={{ color: 'text.secondary' }}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#020617' }}>
          {modalFotoData.url && (
            <Box
              component="img"
              src={modalFotoData.url}
              alt="Vehículo"
              sx={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
