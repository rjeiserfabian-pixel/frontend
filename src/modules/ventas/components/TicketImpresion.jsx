import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Typography } from '@mui/material';
import api from '../../../core/api/axios';

const TicketImpresion = React.forwardRef(({ venta }, ref) => {
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

  if (!venta) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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

  // Datos para el QR
  const qrData = JSON.stringify({
    ID: venta.id,
    Total: venta.total,
    Cliente: venta.cliente_nombre || 'General',
    Fecha: venta.creado_en
  });

  return (
    <Box ref={ref} sx={{ padding: '5mm', width: '80mm', backgroundColor: 'white', color: 'black', fontFamily: 'monospace', fontSize: '12px' }}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #ticket-impresion, #ticket-impresion * {
              visibility: visible;
            }
            #ticket-impresion {
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
      
      <Box id="ticket-impresion">
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {empresaLogo && (
            <img 
              src={empresaLogo.startsWith('http') ? empresaLogo : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${empresaLogo}`} 
              alt="Logo" 
              style={{ maxWidth: '60%', maxHeight: '80px', marginBottom: '8px' }} 
            />
          )}
          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
            {getEmpresaData('razon_social', 'Empresa de Prueba')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            RUC: {getEmpresaData('ruc', '00000000000')}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            {direccionFull || 'Dirección no configurada'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            Tel: {getEmpresaData('telefono', '000-000-000')}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', my: 1, borderTop: '1px dashed black', borderBottom: '1px dashed black', py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
            TICKET DE VENTA #{venta.id}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            {formatDate(venta.creado_en)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>CLIENTE:</strong> {venta.cliente_nombre || 'Público General'}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '11px' }}>
            <strong>VEHÍCULO:</strong> {venta.vehiculo_placa || '-'}
          </Typography>
        </Box>

        <table style={{ width: '100%', fontSize: '11px', marginBottom: '10px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Cant</th>
              <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Descripción</th>
              <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles && venta.detalles.length > 0 ? (
              venta.detalles.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ verticalAlign: 'top', paddingTop: '4px' }}>{item.cantidad}</td>
                  <td style={{ verticalAlign: 'top', paddingTop: '4px' }}>{item.repuesto_nombre || 'Producto'}</td>
                  <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '4px' }}>
                    {(parseFloat(item.precio_unitario || item.precio_venta) * item.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', paddingTop: '4px' }}>Sin ítems</td>
              </tr>
            )}
          </tbody>
        </table>

        <Box sx={{ borderTop: '1px solid black', pt: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>TOTAL S/</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '13px' }}>
              {(parseFloat(venta.total) || 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 3, mb: 1 }}>
          <QRCodeSVG value={qrData} size={100} level={"L"} includeMargin={false} />
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', fontSize: '11px', mt: 2 }}>
          ¡Gracias por su compra! Vuelva pronto.
        </Typography>
      </Box>
    </Box>
  );
});

export default TicketImpresion;
