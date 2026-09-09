import React from 'react';
import { Package, Calendar, User, Truck, FileText, CheckCircle2, MapPin } from 'lucide-react';

const PrintGuiaRemisionA4 = React.forwardRef(({ guia }, ref) => {
  if (!guia) return null;

  return (
    <div ref={ref} className="bg-white text-slate-800 font-sans p-8" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">GUÍA DE REMISIÓN</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm m-0">Comprobante Interno de Traslado</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm mb-2">
            <CheckCircle2 size={16} /> {guia.estado}
          </div>
          <p className="text-slate-900 font-bold text-lg m-0">{guia.serie_prefijo}-{String(guia.correlativo).padStart(6, '0')}</p>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Punto de Partida</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{guia.ubigeo_partida_nombre}</p>
          <p className="text-slate-600 text-xs m-0 pl-6">{guia.punto_partida}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Punto de Llegada</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{guia.ubigeo_llegada_nombre}</p>
          <p className="text-slate-600 text-xs m-0 pl-6">{guia.punto_llegada}</p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <User size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Cliente / Destinatario</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{guia.cliente_nombre}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Fechas</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">Emisión: {new Date(guia.fecha_emision).toLocaleDateString()}</p>
          <p className="text-slate-600 text-xs m-0 pl-6">Traslado: {new Date(guia.fecha_traslado + 'T00:00').toLocaleDateString()}</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Truck size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Transportista</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{guia.transportista_nombre}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Vehículo / Placa</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{guia.vehiculo_placa}</p>
        </div>
      </div>

      {/* MOTIVO Y OBSERVACIONES */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-700 mb-2 font-semibold">
            <FileText size={18} /> Motivo del Traslado
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-slate-700">
            {guia.motivo_traslado}
          </div>
        </div>
        {guia.observaciones && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 mb-2 font-semibold">
              <FileText size={18} /> Observaciones
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
              {guia.observaciones}
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="mb-12">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          Bienes a Transportar <span className="text-sm font-normal text-slate-500">({guia.detalles?.length || 0} ítems)</span>
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Código</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Descripción</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-center">U.M.</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-center">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guia.detalles?.map((det, idx) => (
                <tr key={det.id || idx} className="bg-white">
                  <td className="py-3 px-4 font-medium text-slate-600">{det.repuesto_codigo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{det.repuesto_nombre}</td>
                  <td className="py-3 px-4 text-center text-slate-600 text-xs font-medium">
                    {det.repuesto_unidad || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-blue-600 bg-blue-50 py-1 px-3 rounded-md">
                      {parseFloat(det.cantidad)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OBSERVACIONES */}
      {guia.observaciones && (
        <div className="mb-12">
          <h3 className="font-bold text-slate-900 text-sm mb-2">Observaciones</h3>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
            {guia.observaciones}
          </div>
        </div>
      )}

      {/* FIRMAS */}
      <div className="mt-24 grid grid-cols-2 gap-12 px-12">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-3">
            <p className="font-bold text-slate-800 text-sm m-0">Firma Remitente</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-400 pt-3">
            <p className="font-bold text-slate-800 text-sm m-0">Firma Destinatario / Transportista</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-400">
        Documento generado por TallerApp
      </div>
    </div>
  );
});

export default PrintGuiaRemisionA4;
