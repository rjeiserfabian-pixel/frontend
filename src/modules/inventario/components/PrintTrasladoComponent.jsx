import React from 'react';
import { Package, Calendar, User, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';

const PrintTrasladoComponent = React.forwardRef(({ traslado }, ref) => {
  if (!traslado) return null;

  return (
    <div ref={ref} className="bg-white text-slate-800 font-sans p-8" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">NOTA DE TRASLADO</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm m-0">Comprobante Interno de Movimiento de Inventario</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm mb-2">
            <CheckCircle2 size={16} /> Completado
          </div>
          <p className="text-slate-900 font-bold text-lg m-0">TR-{String(traslado.id).padStart(6, '0')}</p>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Almacén Origen</span>
          </div>
          <p className="font-bold text-slate-900 text-base m-0 pl-6">{traslado.almacen_origen_nombre}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ArrowRightLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Almacén Destino</span>
          </div>
          <p className="font-bold text-slate-900 text-base m-0 pl-6">{traslado.almacen_destino_nombre}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <User size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Registrado Por</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">{traslado.usuario_nombre}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Fecha y Hora</span>
          </div>
          <p className="font-bold text-slate-900 text-sm m-0 pl-6">
            {new Date(traslado.fecha_traslado).toLocaleDateString()} a las {new Date(traslado.fecha_traslado).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* OBSERVACIONES */}
      {traslado.observaciones && (
        <div className="mb-8">
          <div className="flex items-center gap-2 text-slate-700 mb-2 font-semibold">
            <FileText size={18} />
            Observaciones Adicionales
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-slate-700">
            {traslado.observaciones}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="mb-12">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          Productos Trasladados <span className="text-sm font-normal text-slate-500">({traslado.detalles?.length || 0} ítems)</span>
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Código</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Producto</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Ubi. Origen</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs">Ubi. Destino</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-center">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {traslado.detalles?.map((det, idx) => (
                <tr key={det.id || idx} className="bg-white">
                  <td className="py-3 px-4 font-medium text-slate-600">{det.repuesto_codigo}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{det.repuesto_nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{det.ubicacion_origen_nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{det.ubicacion_destino_nombre}</td>
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

      {/* FIRMAS */}
      <div className="mt-24 grid grid-cols-2 gap-12 px-12">
        <div className="text-center">
          <div className="border-t border-slate-400 pt-3">
            <p className="font-bold text-slate-800 text-sm m-0">Firma Entregado</p>
            <p className="text-xs text-slate-500 m-0 mt-1">Almacén Origen</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-slate-400 pt-3">
            <p className="font-bold text-slate-800 text-sm m-0">Firma Recibido</p>
            <p className="text-xs text-slate-500 m-0 mt-1">Almacén Destino</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-400">
        Documento generado por TallerApp
      </div>
    </div>
  );
});

export default PrintTrasladoComponent;
