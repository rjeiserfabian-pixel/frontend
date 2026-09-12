import React, { useEffect, useState } from 'react';
import api from '../../../core/api/axios';

const ESTADO_LABELS = {
  CREADA: 'Creada',
  EN_TRASLADO: 'En Traslado',
  COMPLETADA: 'Completada',
};

const Campo = ({ label, children, className = '' }) => (
  <td className={`align-top py-2 px-3 border border-slate-300 ${className}`}>
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 m-0 mb-0.5">{label}</p>
    <p className="text-[12px] font-semibold text-slate-900 m-0">{children || '-'}</p>
  </td>
);

const PrintGuiaRemisionA4 = React.forwardRef(({ guia }, ref) => {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    api.get('/seguridad/empresa/')
      .then((res) => setEmpresa(res.data.data))
      .catch((error) => console.error('Error al obtener la configuración de la empresa', error));
  }, []);

  if (!guia) return null;

  const empresaLogo = empresa?.logo
    ? (empresa.logo.startsWith('http') ? empresa.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${empresa.logo}`)
    : null;
  const direccionEmpresa = [empresa?.direccion, empresa?.distrito, empresa?.provincia, empresa?.departamento]
    .filter(Boolean).join(' - ');
  const numeroDocumento = `${guia.serie_prefijo || 'GR'}-${String(guia.correlativo).padStart(6, '0')}`;

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
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 m-0">RUC {empresa?.ruc || '-'}</p>
          <p className="text-[13px] font-extrabold uppercase text-slate-900 m-0 mt-1">Guía de Remisión</p>
          <p className="text-[11px] font-semibold uppercase text-slate-500 m-0">Remitente</p>
          <p className="text-[22px] font-extrabold text-blue-700 m-0 mt-1">{numeroDocumento}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t-2 border-b-2 border-slate-800 py-1.5 mb-4">
        <p className="text-[9px] italic text-slate-500 m-0">Comprobante interno de traslado. No es una Guía de Remisión Electrónica ante SUNAT.</p>
        <span className="text-[10px] font-bold uppercase text-slate-700 m-0">
          Estado: {ESTADO_LABELS[guia.estado] || guia.estado}
        </span>
      </div>

      {/* DATOS DEL TRASLADO */}
      <table className="w-full border-collapse mb-5" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <Campo label="Destinatario / Cliente" className="w-1/2">{guia.cliente_nombre}</Campo>
            <Campo label="Motivo del traslado" className="w-1/2">{guia.motivo_traslado}</Campo>
          </tr>
          <tr>
            <Campo label="Fecha de emisión">{new Date(guia.fecha_emision).toLocaleDateString()}</Campo>
            <Campo label="Fecha de inicio de traslado">{new Date(guia.fecha_traslado + 'T00:00').toLocaleDateString()}</Campo>
          </tr>
          <tr>
            <Campo label="Punto de partida">{guia.ubigeo_partida_nombre} — {guia.punto_partida}</Campo>
            <Campo label="Punto de llegada">{guia.ubigeo_llegada_nombre} — {guia.punto_llegada}</Campo>
          </tr>
          <tr>
            <Campo label="Transportista">{guia.transportista_nombre}</Campo>
            <Campo label="Vehículo / Placa">{guia.vehiculo_placa}</Campo>
          </tr>
        </tbody>
      </table>

      {/* ITEMS */}
      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
        Bienes a Transportar <span className="font-normal text-slate-500 normal-case">({guia.detalles?.length || 0} ítems)</span>
      </p>
      <table className="w-full border-collapse text-[12px] mb-6">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="py-2 px-3 text-left font-semibold border border-slate-800" style={{ width: '15%' }}>Código</th>
            <th className="py-2 px-3 text-left font-semibold border border-slate-800">Descripción</th>
            <th className="py-2 px-3 text-center font-semibold border border-slate-800" style={{ width: '12%' }}>U.M.</th>
            <th className="py-2 px-3 text-center font-semibold border border-slate-800" style={{ width: '15%' }}>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {guia.detalles?.map((det, idx) => (
            <tr key={det.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="py-2 px-3 border border-slate-300 text-slate-600">{det.repuesto_codigo}</td>
              <td className="py-2 px-3 border border-slate-300 font-semibold text-slate-900">{det.repuesto_nombre}</td>
              <td className="py-2 px-3 border border-slate-300 text-center text-slate-600">{det.repuesto_unidad || '-'}</td>
              <td className="py-2 px-3 border border-slate-300 text-center font-bold text-slate-900">{parseFloat(det.cantidad)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* OBSERVACIONES */}
      {guia.observaciones && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Observaciones</p>
          <p className="text-[12px] text-slate-700 border border-slate-300 rounded-md p-3 whitespace-pre-wrap m-0">
            {guia.observaciones}
          </p>
        </div>
      )}

      {/* FIRMAS */}
      <div className="grid grid-cols-2 gap-12 px-12" style={{ marginTop: '90px' }}>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Remitente</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Destinatario / Transportista</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-slate-400 m-0" style={{ marginTop: '48px' }}>
        Impreso el {new Date().toLocaleString()}
      </p>
    </div>
  );
});

export default PrintGuiaRemisionA4;
