import React, { useEffect, useState } from 'react';
import api from '../../../core/api/axios';
import { getMediaUrl } from '../../../core/utils/mediaUrl';

const Campo = ({ label, children, className = '' }) => (
  <td className={`align-top py-2 px-3 border border-slate-300 ${className}`}>
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 m-0 mb-0.5">{label}</p>
    <p className="text-[12px] font-semibold text-slate-900 m-0">{children || '-'}</p>
  </td>
);

const PrintTransferenciaComponent = React.forwardRef(({ transferencia }, ref) => {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    api.get('/seguridad/empresa/')
      .then((res) => setEmpresa(res.data.data))
      .catch((error) => console.error('Error al obtener la configuración de la empresa', error));
  }, []);

  if (!transferencia) return null;

  const empresaLogo = getMediaUrl(empresa?.logo);
  const direccionEmpresa = [empresa?.direccion, empresa?.distrito, empresa?.provincia, empresa?.departamento]
    .filter(Boolean).join(' - ');
  const numeroDocumento = transferencia.numero_documento || `TC-${String(transferencia.id).padStart(6, '0')}`;
  const fecha = transferencia.fecha ? new Date(transferencia.fecha) : new Date();

  return (
    <div ref={ref} className="bg-white text-slate-800 font-sans p-10" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      {/* ENCABEZADO: EMPRESA + RECUADRO DE DOCUMENTO */}
      <div className="flex justify-between items-start gap-6 mb-4">
        <div className="flex items-center gap-3">
          {empresaLogo && (
            <img src={empresaLogo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain' }} />
          )}
          <div>
            <p className="font-bold text-slate-900 text-[15px] m-0 leading-tight">{empresa?.razon_social || 'Empresa no configurada'}</p>
            <p className="text-slate-600 text-[11px] m-0">RUC: {empresa?.ruc || '-'}</p>
            <p className="text-slate-600 text-[11px] m-0">{direccionEmpresa || 'Dirección no configurada'}</p>
            {empresa?.telefono && <p className="text-slate-600 text-[11px] m-0">Tel: {empresa.telefono}</p>}
          </div>
        </div>
        <div className="border-2 border-slate-800 rounded-md px-6 py-3 text-center" style={{ minWidth: '230px' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 m-0">Movimiento interno de tesorería</p>
          <p className="text-[13px] font-extrabold uppercase text-slate-900 m-0 mt-1">Comprobante de Transferencia</p>
          <p className="text-[11px] font-semibold uppercase text-slate-500 m-0">Entre Cajas</p>
          <p className="text-[22px] font-extrabold text-blue-700 m-0 mt-1">{numeroDocumento}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t-2 border-b-2 border-slate-800 py-1.5 mb-4">
        <p className="text-[9px] italic text-slate-500 m-0">Comprobante interno de movimiento de efectivo entre cajas propias. No constituye comprobante de pago tributario.</p>
        <span className="text-[10px] font-bold uppercase text-slate-700 m-0">
          Estado: {transferencia.estado_display || transferencia.estado}
        </span>
      </div>

      {/* DATOS DE LA TRANSFERENCIA */}
      <table className="w-full border-collapse mb-5" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <Campo label="Caja Origen (Entrega)" className="w-1/2">{transferencia.caja_origen_nombre}</Campo>
            <Campo label="Caja Destino (Recibe)" className="w-1/2">{transferencia.caja_destino_nombre}</Campo>
          </tr>
          <tr>
            <Campo label="Cajero Origen">{transferencia.cajero_origen_nombre}</Campo>
            <Campo label="Cajero Destino">{transferencia.cajero_destino_nombre}</Campo>
          </tr>
          <tr>
            <Campo label="Registrado por">{transferencia.usuario_nombre}</Campo>
            <Campo label="Fecha y hora de registro">
              {fecha.toLocaleDateString()} {fecha.toLocaleTimeString()}
            </Campo>
          </tr>
        </tbody>
      </table>

      {/* MONTO DESTACADO */}
      <div className="border-2 border-slate-800 rounded-md py-4 px-6 mb-5 flex justify-between items-center bg-slate-50">
        <p className="text-[13px] font-bold uppercase tracking-wide text-slate-700 m-0">Monto Transferido</p>
        <p className="text-[26px] font-extrabold text-blue-700 m-0">S/ {parseFloat(transferencia.monto).toFixed(2)}</p>
      </div>

      {/* MOTIVO */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Motivo / Descripción</p>
        <p className="text-[12px] text-slate-700 border border-slate-300 rounded-md p-3 whitespace-pre-wrap m-0" style={{ minHeight: '48px' }}>
          {transferencia.motivo || '-'}
        </p>
      </div>

      {/* FIRMAS */}
      <div className="grid grid-cols-2 gap-12 px-12" style={{ marginTop: '90px' }}>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Entrega</p>
            <p className="text-[10px] text-slate-500 m-0 mt-0.5">Caja Origen</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Recibe</p>
            <p className="text-[10px] text-slate-500 m-0 mt-0.5">Caja Destino</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-slate-400 m-0" style={{ marginTop: '48px' }}>
        Impreso el {new Date().toLocaleString()}
      </p>
    </div>
  );
});

export default PrintTransferenciaComponent;
