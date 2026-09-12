import React, { useEffect, useState } from 'react';
import api from '../../../core/api/axios';

const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente de confirmación',
  COMPLETADO: 'Completado',
  RECHAZADO: 'Rechazado',
};

const Campo = ({ label, children, className = '' }) => (
  <td className={`align-top py-2 px-3 border border-slate-300 ${className}`}>
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 m-0 mb-0.5">{label}</p>
    <p className="text-[12px] font-semibold text-slate-900 m-0">{children || '-'}</p>
  </td>
);

const PrintTrasladoComponent = React.forwardRef(({ traslado }, ref) => {
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    api.get('/seguridad/empresa/')
      .then((res) => setEmpresa(res.data.data))
      .catch((error) => console.error('Error al obtener la configuración de la empresa', error));
  }, []);

  if (!traslado) return null;

  const empresaLogo = empresa?.logo
    ? (empresa.logo.startsWith('http') ? empresa.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${empresa.logo}`)
    : null;
  const direccionEmpresa = [empresa?.direccion, empresa?.distrito, empresa?.provincia, empresa?.departamento]
    .filter(Boolean).join(' - ');
  const numeroDocumento = traslado.numero_documento || `TR-${String(traslado.id).padStart(6, '0')}`;

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
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 m-0">Movimiento interno</p>
          <p className="text-[13px] font-extrabold uppercase text-slate-900 m-0 mt-1">Nota de Traslado</p>
          <p className="text-[11px] font-semibold uppercase text-slate-500 m-0">Entre Almacenes</p>
          <p className="text-[22px] font-extrabold text-blue-700 m-0 mt-1">{numeroDocumento}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t-2 border-b-2 border-slate-800 py-1.5 mb-4">
        <p className="text-[9px] italic text-slate-500 m-0">Comprobante interno de movimiento de inventario entre almacenes propios.</p>
        <span className="text-[10px] font-bold uppercase text-slate-700 m-0">
          Estado: {ESTADO_LABELS[traslado.estado] || traslado.estado}
        </span>
      </div>

      {/* DATOS DEL TRASLADO */}
      <table className="w-full border-collapse mb-5" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <Campo label="Almacén Origen" className="w-1/2">{traslado.almacen_origen_nombre}</Campo>
            <Campo label="Almacén Destino" className="w-1/2">{traslado.almacen_destino_nombre}</Campo>
          </tr>
          <tr>
            <Campo label="Registrado por">{traslado.usuario_nombre}</Campo>
            <Campo label="Fecha y hora de registro">
              {new Date(traslado.fecha_traslado).toLocaleDateString()} {new Date(traslado.fecha_traslado).toLocaleTimeString()}
            </Campo>
          </tr>
          {traslado.estado === 'COMPLETADO' && traslado.confirmado_por_nombre && (
            <tr>
              <Campo label="Confirmado por" className="w-1/2">{traslado.confirmado_por_nombre}</Campo>
              <Campo label="Fecha de confirmación" className="w-1/2">
                {traslado.fecha_confirmacion ? new Date(traslado.fecha_confirmacion).toLocaleString() : '-'}
              </Campo>
            </tr>
          )}
          {traslado.estado === 'RECHAZADO' && (
            <tr>
              <Campo label="Motivo del rechazo" className="w-1/2">{traslado.motivo_rechazo}</Campo>
              <Campo label="Fecha de rechazo" className="w-1/2">
                {traslado.fecha_confirmacion ? new Date(traslado.fecha_confirmacion).toLocaleString() : '-'}
              </Campo>
            </tr>
          )}
        </tbody>
      </table>

      {/* ITEMS */}
      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-700 mb-1.5">
        Productos Trasladados <span className="font-normal text-slate-500 normal-case">({traslado.detalles?.length || 0} ítems)</span>
      </p>
      <table className="w-full border-collapse text-[12px] mb-6">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="py-2 px-3 text-left font-semibold border border-slate-800" style={{ width: '12%' }}>Código</th>
            <th className="py-2 px-3 text-left font-semibold border border-slate-800">Producto</th>
            <th className="py-2 px-3 text-center font-semibold border border-slate-800" style={{ width: '9%' }}>U.M.</th>
            <th className="py-2 px-3 text-left font-semibold border border-slate-800" style={{ width: '18%' }}>Ubi. Origen</th>
            <th className="py-2 px-3 text-left font-semibold border border-slate-800" style={{ width: '18%' }}>Ubi. Destino</th>
            <th className="py-2 px-3 text-center font-semibold border border-slate-800" style={{ width: '10%' }}>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {traslado.detalles?.map((det, idx) => (
            <tr key={det.id || idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="py-2 px-3 border border-slate-300 text-slate-600">{det.repuesto_codigo}</td>
              <td className="py-2 px-3 border border-slate-300 font-semibold text-slate-900">{det.repuesto_nombre}</td>
              <td className="py-2 px-3 border border-slate-300 text-center text-slate-600">{det.repuesto_unidad || '-'}</td>
              <td className="py-2 px-3 border border-slate-300 text-slate-600">{det.ubicacion_origen_nombre}</td>
              <td className="py-2 px-3 border border-slate-300 text-slate-600">{det.ubicacion_destino_nombre}</td>
              <td className="py-2 px-3 border border-slate-300 text-center font-bold text-slate-900">{parseFloat(det.cantidad)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* OBSERVACIONES */}
      {traslado.observaciones && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Observaciones</p>
          <p className="text-[12px] text-slate-700 border border-slate-300 rounded-md p-3 whitespace-pre-wrap m-0">
            {traslado.observaciones}
          </p>
        </div>
      )}

      {/* FIRMAS */}
      <div className="grid grid-cols-2 gap-12 px-12" style={{ marginTop: '90px' }}>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Entregado</p>
            <p className="text-[10px] text-slate-500 m-0 mt-0.5">Almacén Origen</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-500 pt-2">
            <p className="font-semibold text-slate-800 text-[11px] m-0">Firma Recibido</p>
            <p className="text-[10px] text-slate-500 m-0 mt-0.5">Almacén Destino</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-slate-400 m-0" style={{ marginTop: '48px' }}>
        Impreso el {new Date().toLocaleString()}
      </p>
    </div>
  );
});

export default PrintTrasladoComponent;
