import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import api from '../../../core/api/axios';

const TicketReciboAbono = React.forwardRef(({ pagoAbono, cuenta, cuota }, ref) => {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await api.get('/seguridad/empresa/');
        setEmpresa(res.data.data);
      } catch (error) {
        console.error("Error al obtener la configuración de la empresa", error);
      }
    };
    fetchEmpresa();
  }, []);

  if (!pagoAbono || !cuenta || !cuota) return <Box ref={ref} sx={{ display: 'none' }} />;

  const getEmpresaData = (field, fallback = '') => {
    return empresa && empresa[field] ? empresa[field] : fallback;
  };

  const empresaLogo = getEmpresaData('logo');
  const direccionFull = [
    getEmpresaData('direccion'),
    getEmpresaData('distrito'),
    getEmpresaData('provincia'),
    getEmpresaData('departamento')
  ].filter(Boolean).join(' - ');

  return (
    <Box ref={ref} sx={{ padding: '5mm', width: '80mm', backgroundColor: 'white', color: 'black', fontFamily: 'monospace', fontSize: '12px' }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #ticket-recibo, #ticket-recibo * {
              visibility: visible;
            }
            #ticket-recibo {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              margin: 0;
              padding: 5mm;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}
      </style>
      
      <Box id="ticket-recibo">
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {empresaLogo && (
            <img 
              src={empresaLogo.startsWith('http') ? empresaLogo : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${empresaLogo}`} 
              alt="Logo" 
              style={{ display: 'block', margin: '0 auto 8px auto', maxWidth: '60%', maxHeight: '80px' }} 
            />
          )}
          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
            {getEmpresaData('razon_social', 'Empresa de Prueba')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            Local: {direccionFull || 'Dirección no configurada'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            TELEFONOS: {getEmpresaData('telefono', '000-000-000')}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px' }}>
            RUC: {getEmpresaData('ruc', '00000000000')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', mt: 1 }}>
            RECIBO {pagoAbono.numero_recibo || `RI-${String(pagoAbono.id).padStart(6, '0')}`}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>CLIENTE</Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            DNI/RUC: {cuenta.cliente_dni || 'General'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', textTransform: 'uppercase' }}>
            {cuenta.cliente_nombre ? `${cuenta.cliente_nombre} ${cuenta.cliente_apellidos || ''}` : 'PÚBLICO GENERAL'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            {cuenta.cliente_direccion || ''}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            FECHA EMISION: {new Date(pagoAbono.fecha_pago).toLocaleDateString('es-PE')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            HORA: {new Date(pagoAbono.fecha_pago).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            MONEDA: SOLES
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            FORMA DE PAGO: {pagoAbono.metodo_pago_nombre}
          </Typography>
          {pagoAbono.subpagos && pagoAbono.subpagos.length > 1 ? (
            <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
              DETALLE: {pagoAbono.subpagos.map(s => `${s.metodo_pago_nombre}${s.referencia ? ` (Op:${s.referencia})` : ''}: S/ ${Number(s.monto).toFixed(2)}`).join(' | ')}
            </Typography>
          ) : pagoAbono.referencia ? (
            <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
              OPERACIÓN: {pagoAbono.referencia}
            </Typography>
          ) : null}
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            CAJERO(A): {pagoAbono.cajero_nombre || 'SISTEMA'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 'bold' }}>
            CONCEPTO: PAGO DE CUOTAS
          </Typography>
        </Box>

        <table style={{ width: '100%', fontSize: '11px', marginBottom: '10px', borderTop: '1px solid black', borderBottom: '1px solid black', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>CREDITO</th>
              <th style={{ textAlign: 'center', padding: '4px 0' }}>FECHA</th>
              <th style={{ textAlign: 'right', padding: '4px 0' }}>IMPORTE</th>
              <th style={{ textAlign: 'right', padding: '4px 0' }}>SALDO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ textAlign: 'left', padding: '4px 0' }}>{cuenta.codigo_credito}</td>
              <td style={{ textAlign: 'center', padding: '4px 0' }}>{new Date(cuenta.venta_fecha).toLocaleDateString('es-PE')}</td>
              <td style={{ textAlign: 'right', padding: '4px 0' }}>S/ {Number(cuenta.monto_financiado).toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '4px 0' }}>S/ {Number(cuenta.saldo_pendiente).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px' }}>PAGO DE CUOTAS</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px' }}>
            CUOTA PAGADA: ({cuota.numero_cuota}) CUOTA {cuota.estado === 'PARCIAL' ? 'PARCIAL' : 'PAGADA'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '11px' }}>
            F. VENCIMIENTO: {
              (() => {
                const parts = (cuota.fecha_vencimiento || '').split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '';
              })()
            }
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '18px' }}>
            Importe Total S/ {Number(pagoAbono.monto).toFixed(2)}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '11px', mt: 3, borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
          Cobro cuotas
        </Typography>
      </Box>
    </Box>
  );
});

export default TicketReciboAbono;
