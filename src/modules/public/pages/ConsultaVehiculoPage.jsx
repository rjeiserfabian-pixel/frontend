import React, { useState } from 'react';
import { 
  Search, Car, Wrench, CheckCircle, Clock, ShieldCheck, 
  ArrowRight, AlertCircle, FileText
} from 'lucide-react';
import api from '../../../core/api/axios';

const ConsultaVehiculoPage = () => {
  const [placa, setPlaca] = useState('');
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!placa || !dni) {
      setError('Por favor, ingrese la placa y el DNI.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/taller/public/consulta-vehiculo/', { placa, dni });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ocurrió un error al consultar. Inténtelo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden">
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex w-2/5 flex-col relative bg-black border-r border-slate-800">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: "url('/bg-taller.jpg')" }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b0f19]/80 via-transparent to-[#0b0f19]" />
        
        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3 mb-12">
            <span className="text-3xl font-black italic tracking-tighter text-white uppercase">OMEGA AUTOMATRIZ</span>
          </div>
          
          <div className="mt-12">
            <h1 className="text-4xl font-black italic mb-4 leading-tight">CONSULTA EL ESTADO <br/><span className="text-[#e50914] uppercase">DE TU VEHÍCULO</span></h1>
            <p className="text-xl text-slate-300 font-light max-w-sm">Ingresa tus datos para hacer el seguimiento en tiempo real de tu reparación o mantenimiento.</p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-6 text-sm text-slate-400">
            <div className="flex flex-col gap-2">
              <ShieldCheck className="text-[#e50914]" size={24} />
              <span className="font-bold text-white">Seguridad Garantizada</span>
              <span>Tus datos están protegidos y son confidenciales.</span>
            </div>
            <div className="flex flex-col gap-2">
              <Clock className="text-[#e50914]" size={24} />
              <span className="font-bold text-white">Seguimiento en Vivo</span>
              <span>Conoce el progreso exacto de tu vehículo al instante.</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col relative bg-[#0b0f19] p-8 lg:p-12 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Título móvil */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-black italic text-white">OMEGA AUTOMATRIZ</h2>
            <p className="text-slate-400 mt-2">Consulta de Estado de Vehículo</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* FORMULARIO */}
            <div className="bg-[#111827] rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col items-center h-fit xl:sticky xl:top-12">
              <div className="w-16 h-16 rounded-full bg-[#1f2937] flex items-center justify-center text-[#e50914] mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 text-center">Busca tu Vehículo</h3>
              <p className="text-slate-400 mb-8 text-center text-sm">Ingresa tu placa y documento de identidad</p>

              <form onSubmit={handleSearch} className="w-full flex flex-col gap-5">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Car size={20} />
                    </div>
                    <input
                      type="text"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      placeholder="Placa del Vehículo (Ej. ABC-123)"
                      className="w-full bg-[#1f2937] border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all uppercase font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck size={20} />
                    </div>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="DNI / RUC del Propietario"
                      className="w-full bg-[#1f2937] border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all font-medium"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full bg-[#e50914] hover:bg-[#b80710] text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(229,9,20,0.3)]"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <Search size={20} /> Consultar Estado
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* RESULTADOS */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-[#e50914]" size={20} />
                <h3 className="font-bold text-lg text-white">Resultado de la Consulta</h3>
              </div>

              {!result ? (
                <div className="flex-1 border border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <Search className="text-slate-500" size={32} />
                  </div>
                  <p className="text-slate-400 font-medium max-w-[200px]">Ingresa los datos para ver el detalle de tu vehículo.</p>
                </div>
              ) : (
                <div className="flex-1 bg-[#111827] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                  
                  {/* Header Resultado */}
                  <div className="bg-slate-800/50 p-6 border-b border-slate-700">
                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                      <Car size={20} className="text-[#e50914]" />
                      {result.vehiculo.marca} {result.vehiculo.modelo} 
                      <span className="text-slate-400 ml-1">({result.vehiculo.placa})</span>
                    </h4>
                    <p className="text-slate-400 text-sm mt-1">Propietario: {result.vehiculo.cliente}</p>
                  </div>

                  {/* Body Resultado */}
                  <div className="p-6 overflow-y-auto">
                    {!result.has_active_order ? (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="text-green-500" size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{result.message}</h4>
                        <p className="text-slate-400 text-sm">No tienes órdenes de trabajo pendientes en este momento.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        
                        <div className="flex items-center justify-between p-4 bg-[#1f2937] rounded-xl border border-slate-700">
                          <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Orden de Trabajo</p>
                            <p className="text-2xl font-black text-white">#{result.orden.numero}</p>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${result.orden.estado === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/50'}`}>
                            {result.orden.estado}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Wrench size={18} className="text-slate-400" /> Trabajos y Repuestos
                          </h5>
                          
                          <div className="flex flex-col gap-3">
                            {result.orden.servicios.map((s, idx) => (
                              <div key={`srv-${idx}`} className={`p-4 rounded-xl border flex justify-between items-center ${s.completado ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
                                <div>
                                  <p className="font-medium text-white">{s.descripcion}</p>
                                  <p className="text-xs text-slate-400 mt-1">Servicio • S/ {parseFloat(s.precio).toFixed(2)}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${s.completado ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                  {s.completado ? <CheckCircle size={14} /> : <Clock size={14} />}
                                  {s.completado ? 'Terminado' : 'En Proceso'}
                                </div>
                              </div>
                            ))}

                            {result.orden.repuestos.map((r, idx) => (
                              <div key={`rep-${idx}`} className={`p-4 rounded-xl border flex justify-between items-center ${r.instalado ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
                                <div>
                                  <p className="font-medium text-white">{r.descripcion}</p>
                                  <p className="text-xs text-slate-400 mt-1">Repuesto • Cant: {parseFloat(r.cantidad)} • S/ {parseFloat(r.precio).toFixed(2)}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${r.instalado ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                  {r.instalado ? <CheckCircle size={14} /> : <Clock size={14} />}
                                  {r.instalado ? 'Instalado' : 'Pendiente'}
                                </div>
                              </div>
                            ))}
                            
                            {result.orden.servicios.length === 0 && result.orden.repuestos.length === 0 && (
                               <p className="text-sm text-slate-400 text-center py-4">No hay ítems registrados aún en esta orden.</p>
                            )}
                          </div>
                        </div>
                        
                      </div>
                    )}
                  </div>

                  {/* Footer Resultado */}
                  {result.has_active_order && (
                    <div className="mt-auto bg-[#1f2937] p-5 border-t border-slate-700 flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Total Estimado</span>
                      <span className="text-2xl font-bold text-white">S/ {parseFloat(result.orden.total_estimado).toFixed(2)}</span>
                    </div>
                  )}
                  
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultaVehiculoPage;
