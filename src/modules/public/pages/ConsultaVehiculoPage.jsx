import React, { useEffect, useState } from 'react';
import { 
  Search, Car, Wrench, CheckCircle, Clock, ShieldCheck, 
  ArrowRight, AlertCircle, FileText
} from 'lucide-react';
import api from '../../../core/api/axios';

const ConsultaVehiculoPage = () => {
  const sucursalId = new URLSearchParams(window.location.search).get('sucursal');
  const [placa, setPlaca] = useState('');
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState('OMEGA AUTOMOTRIZ');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState([]);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await api.get('/seguridad/empresa/');
        const razonSocial = res.data?.data?.razon_social;
        if (razonSocial) {
          setEmpresaNombre(razonSocial);
        }
      } catch (err) {
        console.error('Error al obtener la configuracion de empresa', err);
      }
    };

    fetchEmpresa();
  }, []);

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
      const payload = { placa, dni };
      if (sucursalId) payload.sucursal_id = sucursalId;
      const res = await api.post('/taller/public/consulta-vehiculo/', payload);
      const data = res.data;
      setResult(data);
      if (data.orden?.cotizacion_pendiente) {
        setServiciosSeleccionados((data.orden.servicios || []).map((item) => item.id));
        setRepuestosSeleccionados((data.orden.repuestos || []).map((item) => item.id));
      } else {
        setServiciosSeleccionados([]);
        setRepuestosSeleccionados([]);
      }
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

  const toggleServicio = (id) => {
    setServiciosSeleccionados((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  };

  const toggleRepuesto = (id) => {
    setRepuestosSeleccionados((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  };

  const handleAprobarCotizacion = async () => {
    if (serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0) {
      setError('Selecciona al menos un servicio o repuesto para aprobar.');
      return;
    }

    setApproving(true);
    setError('');

    try {
      const payload = {
        placa,
        dni,
        servicios_aprobados: serviciosSeleccionados,
        repuestos_aprobados: repuestosSeleccionados,
      };
      if (sucursalId) payload.sucursal_id = sucursalId;
      await api.post('/taller/public/aprobar-cotizacion/', payload);

      const consultaPayload = { placa, dni };
      if (sucursalId) consultaPayload.sucursal_id = sucursalId;
      const res = await api.post('/taller/public/consulta-vehiculo/', consultaPayload);
      setResult(res.data);
      setServiciosSeleccionados([]);
      setRepuestosSeleccionados([]);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('No se pudo registrar la aprobación. Inténtelo de nuevo.');
      }
    } finally {
      setApproving(false);
    }
  };

  const totalSeleccionado = result?.orden?.cotizacion_pendiente
    ? [
      ...(result.orden.servicios || [])
        .filter((item) => serviciosSeleccionados.includes(item.id))
        .map((item) => parseFloat(item.precio || 0)),
      ...(result.orden.repuestos || [])
        .filter((item) => repuestosSeleccionados.includes(item.id))
        .map((item) => parseFloat(item.precio || 0) * parseFloat(item.cantidad || 0)),
    ].reduce((sum, value) => sum + value, 0)
    : 0;
  const cotizacionPendiente = result?.orden?.cotizacion_pendiente;
  const cotizacionVencida = result?.orden?.cotizacion_vencida;
  const hallazgos = result?.orden?.hallazgos || [];
  const severityClasses = {
    ALTA: 'bg-red-500/15 text-red-300 border-red-500/40',
    MEDIA: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
    BAJA: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden">
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex w-2/5 flex-col relative bg-black border-r border-slate-800">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: "url('/bg-taller.jpg')" }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b0f19]/80 via-transparent to-[#0b0f19]" />
        
        <div className="relative z-10 flex flex-col h-full p-12 2xl:p-14">
          <div className="flex items-center gap-3 mb-12 2xl:mb-14">
            <span className="text-3xl 2xl:text-4xl font-black italic tracking-tighter text-white uppercase">{empresaNombre}</span>
          </div>
          
          <div className="mt-12 2xl:mt-16">
            <h1 className="text-4xl 2xl:text-5xl font-black italic mb-4 2xl:mb-5 leading-tight">CONSULTA EL ESTADO <br/><span className="text-[#e50914] uppercase">DE TU VEHÍCULO</span></h1>
            <p className="text-xl 2xl:text-2xl text-slate-300 font-light max-w-sm 2xl:max-w-lg">Ingresa tus datos para hacer el seguimiento en tiempo real de tu reparación o mantenimiento.</p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-6 2xl:gap-8 text-sm 2xl:text-base text-slate-400">
            <div className="flex flex-col gap-2 2xl:gap-3">
              <ShieldCheck className="text-[#e50914] w-6 h-6 2xl:w-8 2xl:h-8" />
              <span className="font-bold text-white">Seguridad Garantizada</span>
              <span>Tus datos están protegidos y son confidenciales.</span>
            </div>
            <div className="flex flex-col gap-2 2xl:gap-3">
              <Clock className="text-[#e50914] w-6 h-6 2xl:w-8 2xl:h-8" />
              <span className="font-bold text-white">Seguimiento en Vivo</span>
              <span>Conoce el progreso exacto de tu vehículo al instante.</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col relative bg-[#0b0f19] p-8 lg:p-12 2xl:p-14 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-4xl 2xl:max-w-[1180px] mx-auto w-full">
          
          {/* Título móvil */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-black italic text-white uppercase">{empresaNombre}</h2>
            <p className="text-slate-400 mt-2">Consulta de Estado de Vehículo</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-[390px_1fr] gap-8 2xl:gap-9">
            
            {/* FORMULARIO */}
            <div className="bg-[#111827] rounded-3xl p-8 2xl:p-9 border border-slate-800 shadow-2xl flex flex-col items-center h-fit xl:sticky xl:top-12 2xl:top-14">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-full bg-[#1f2937] flex items-center justify-center text-[#e50914] mb-6 2xl:mb-7">
                <Search className="w-8 h-8 2xl:w-10 2xl:h-10" />
              </div>
              <h3 className="text-2xl 2xl:text-3xl font-bold text-white mb-2 2xl:mb-3 text-center">Busca tu Vehículo</h3>
              <p className="text-slate-400 mb-8 2xl:mb-9 text-center text-sm 2xl:text-base">Ingresa tu placa y documento de identidad</p>

              <form onSubmit={handleSearch} className="w-full flex flex-col gap-5 2xl:gap-6">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 2xl:pl-5 flex items-center pointer-events-none text-slate-400">
                      <Car className="w-5 h-5 2xl:w-6 2xl:h-6" />
                    </div>
                    <input
                      type="text"
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                      placeholder="Placa del Vehículo (Ej. ABC-123)"
                      className="w-full bg-[#1f2937] border border-slate-700 rounded-xl py-4 2xl:py-5 pl-12 2xl:pl-14 pr-4 2xl:pr-5 text-white placeholder-slate-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all uppercase font-medium 2xl:text-lg"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 2xl:pl-5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-5 h-5 2xl:w-6 2xl:h-6" />
                    </div>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="DNI / RUC del Propietario"
                      className="w-full bg-[#1f2937] border border-slate-700 rounded-xl py-4 2xl:py-5 pl-12 2xl:pl-14 pr-4 2xl:pr-5 text-white placeholder-slate-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all font-medium 2xl:text-lg"
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
                  className="mt-4 w-full bg-[#e50914] hover:bg-[#b80710] text-white py-4 2xl:py-5 rounded-xl font-bold flex justify-center items-center gap-2 2xl:gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(229,9,20,0.3)] 2xl:text-lg"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <Search className="w-5 h-5 2xl:w-6 2xl:h-6" /> Consultar Estado
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* RESULTADOS */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="text-[#e50914] w-5 h-5 2xl:w-7 2xl:h-7" />
                <h3 className="font-bold text-lg 2xl:text-2xl text-white">Resultado de la Consulta</h3>
              </div>

              {!result ? (
                <div className="flex-1 border border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center p-8 2xl:p-10 text-center min-h-[280px] 2xl:min-h-[330px]">
                  <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 2xl:mb-5">
                    <Search className="text-slate-500 w-8 h-8 2xl:w-10 2xl:h-10" />
                  </div>
                  <p className="text-slate-400 font-medium max-w-[200px] 2xl:max-w-xs 2xl:text-lg">Ingresa los datos para ver el detalle de tu vehículo.</p>
                </div>
              ) : (
                <div className="flex-1 bg-[#111827] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
                  
                  {/* Header Resultado */}
                  <div className="bg-slate-800/50 p-6 2xl:p-7 border-b border-slate-700">
                    <h4 className="text-xl 2xl:text-2xl font-bold text-white flex items-center gap-2 2xl:gap-3">
                      <Car className="text-[#e50914] w-5 h-5 2xl:w-7 2xl:h-7" />
                      {result.vehiculo.marca} {result.vehiculo.modelo} 
                      <span className="text-slate-400 ml-1">({result.vehiculo.placa})</span>
                    </h4>
                    <p className="text-slate-400 text-sm 2xl:text-base mt-1">Propietario: {result.vehiculo.cliente}</p>
                  </div>

                  {/* Body Resultado */}
                  <div className="p-6 2xl:p-7 overflow-y-auto">
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
                          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${result.orden.estado === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : cotizacionPendiente ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/50'}`}>
                            {result.orden.estado}
                          </span>
                        </div>

                        {hallazgos.length > 0 && (
                          <div>
                            <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                              <AlertCircle size={18} className="text-[#e50914]" /> Inspeccion y Hallazgos
                            </h5>
                            <div className="flex flex-col gap-3">
                              {hallazgos.map((h) => (
                                <div key={h.id} className="p-4 rounded-xl border bg-slate-800/30 border-slate-700">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="font-medium text-white leading-relaxed">{h.descripcion}</p>
                                    <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${severityClasses[h.severidad] || severityClasses.MEDIA}`}>
                                      {h.severidad || 'MEDIA'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Wrench size={18} className="text-slate-400" /> {cotizacionPendiente ? 'Cotización Pendiente' : 'Trabajos y Repuestos'}
                          </h5>

                          {cotizacionPendiente && (
                            <div className={`mb-4 rounded-xl border p-4 ${cotizacionVencida ? 'bg-red-500/10 border-red-500/40' : 'bg-amber-500/10 border-amber-500/40'}`}>
                              <p className={`font-bold ${cotizacionVencida ? 'text-red-300' : 'text-amber-200'}`}>
                                {cotizacionVencida ? 'Cotización vencida' : 'Selecciona lo que autorizas realizar'}
                              </p>
                              <p className="text-sm text-slate-300 mt-1">
                                Total seleccionado: <span className="font-bold text-white">S/ {totalSeleccionado.toFixed(2)}</span>
                              </p>
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-3">
                            {result.orden.servicios.map((s, idx) => (
                              <div key={`srv-${idx}`} className={`p-4 rounded-xl border flex justify-between items-center gap-4 ${cotizacionPendiente ? 'bg-slate-800/30 border-slate-700' : s.completado ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
                                <div>
                                  <p className="font-medium text-white">{s.descripcion}</p>
                                  <p className="text-xs text-slate-400 mt-1">Servicio • S/ {parseFloat(s.precio).toFixed(2)}</p>
                                </div>
                                {cotizacionPendiente ? (
                                  <input
                                    type="checkbox"
                                    checked={serviciosSeleccionados.includes(s.id)}
                                    disabled={cotizacionVencida}
                                    onChange={() => toggleServicio(s.id)}
                                    className="h-5 w-5 shrink-0 accent-[#e50914]"
                                    aria-label={`Aprobar ${s.descripcion}`}
                                  />
                                ) : (
                                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${s.completado ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                    {s.completado ? <CheckCircle size={14} /> : <Clock size={14} />}
                                    {s.completado ? 'Terminado' : 'En Proceso'}
                                  </div>
                                )}
                              </div>
                            ))}

                            {result.orden.repuestos.map((r, idx) => (
                              <div key={`rep-${idx}`} className={`p-4 rounded-xl border flex justify-between items-center gap-4 ${cotizacionPendiente ? 'bg-slate-800/30 border-slate-700' : r.instalado ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
                                <div>
                                  <p className="font-medium text-white">{r.descripcion}</p>
                                  <p className="text-xs text-slate-400 mt-1">Repuesto • Cant: {parseFloat(r.cantidad)} • S/ {parseFloat(r.precio).toFixed(2)}</p>
                                </div>
                                {cotizacionPendiente ? (
                                  <input
                                    type="checkbox"
                                    checked={repuestosSeleccionados.includes(r.id)}
                                    disabled={cotizacionVencida}
                                    onChange={() => toggleRepuesto(r.id)}
                                    className="h-5 w-5 shrink-0 accent-[#e50914]"
                                    aria-label={`Aprobar ${r.descripcion}`}
                                  />
                                ) : (
                                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md ${r.instalado ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                                    {r.instalado ? <CheckCircle size={14} /> : <Clock size={14} />}
                                    {r.instalado ? 'Instalado' : 'Pendiente'}
                                  </div>
                                )}
                              </div>
                            ))}

                            {cotizacionPendiente && (
                              <button
                                type="button"
                                disabled={approving || cotizacionVencida || (serviciosSeleccionados.length === 0 && repuestosSeleccionados.length === 0)}
                                onClick={handleAprobarCotizacion}
                                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {approving ? (
                                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-950"></span>
                                ) : (
                                  <>
                                    <CheckCircle size={20} /> Confirmar Aprobación
                                  </>
                                )}
                              </button>
                            )}
                            
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
                      <span className="text-slate-400 font-medium">{cotizacionPendiente ? 'Total Seleccionado' : 'Total Estimado'}</span>
                      <span className="text-2xl font-bold text-white">
                        S/ {(cotizacionPendiente ? totalSeleccionado : parseFloat(result.orden.total_estimado || 0)).toFixed(2)}
                      </span>
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
