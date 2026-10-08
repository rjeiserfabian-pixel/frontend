import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock3,
  Gauge,
  PackageCheck,
  ShieldCheck,
  Wrench,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Phone,
} from 'lucide-react';
import api from '../../../core/api/axios';

const formatDate = (value, includeTime = false) => {
  if (!value) return 'Por confirmar';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
};

const etapas = [
  { label: 'Recepcion', estados: ['RECEPCIONADO'] },
  { label: 'Inspeccion', estados: ['INSPECCION'] },
  { label: 'Autorizacion', estados: ['ESPERANDO_APROBACION'] },
  { label: 'Trabajos', estados: ['APROBADO'] },
  { label: 'Finalizado', estados: ['FINALIZADO', 'FACTURADO'] },
];

const listarTrabajos = (orden) => [
  ...(orden?.servicios || []).map((item) => ({ ...item, tipo: 'Servicio', listo: item.completado, icon: Wrench })),
  ...(orden?.repuestos || []).map((item) => ({ ...item, tipo: `Repuesto x${Number(item.cantidad)}`, listo: item.instalado, icon: PackageCheck })),
];

function Trabajos({ orden }) {
  const items = listarTrabajos(orden);
  return items.length ? (
    <ul className="divide-y divide-slate-800">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <li key={`${item.tipo}-${index}`} className="flex items-start gap-3 py-4">
            <Icon size={19} className={`mt-1 shrink-0 ${item.listo ? 'text-emerald-400' : 'text-amber-300'}`} />
            <div className="min-w-0 flex-1 break-words">
              <p className="font-semibold">{item.descripcion}</p>
              <p className="mt-1 text-xs text-slate-400">{item.tipo}</p>
            </div>
            <span className={`mt-1 shrink-0 text-xs ${item.listo ? 'text-emerald-400' : 'text-amber-300'}`}>
              {item.listo ? 'Terminado' : orden.estado === 'CANCELADO' ? 'No realizado' : 'Pendiente'}
            </span>
          </li>
        );
      })}
    </ul>
  ) : <p className="py-5 text-sm text-slate-400">Sin trabajos autorizados registrados.</p>;
}

const statusTone = (estado) => {
  if (['FINALIZADO', 'FACTURADO'].includes(estado)) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  }
  if (estado === 'ESPERANDO_APROBACION') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
  }
  return 'border-red-500/40 bg-red-500/10 text-red-300';
};

export default function HistorialVehiculoQrPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [empresa, setEmpresa] = useState({ razon_social: 'OMEGA AUTOMOTRIZ' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      api.get(`/vehiculos/public/qr/${token}/`),
      api.get('/seguridad/empresa/'),
    ]).then(([qrResult, empresaResult]) => {
      if (!active) return;

      if (qrResult.status === 'fulfilled') {
        setData(qrResult.value.data);
      } else {
        setError(
          qrResult.reason?.response?.data?.error
          || 'No pudimos consultar la informacion de este codigo QR.'
        );
      }

      if (empresaResult.status === 'fulfilled' && empresaResult.value.data?.data) {
        setEmpresa(empresaResult.value.data.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [token]);

  const orden = data?.orden;
  const vehiculo = data?.vehiculo;
  const historial = data?.historial_ingresos;
  const etapaActual = etapas.findIndex((etapa) => etapa.estados.includes(orden?.estado));
  const telefono = useMemo(() => {
    const digits = String(empresa.telefono || '').replace(/\D/g, '');
    const value = digits.length === 9 ? `51${digits}` : digits;
    return value.length >= 10 && value.length <= 15 ? value : null;
  }, [empresa.telefono]);

  const cargarPagina = async (page) => {
    setHistoryBusy(true);
    setHistoryError('');
    try {
      const response = await api.get(`/vehiculos/public/qr/${token}/`, { params: { page } });
      setData(response.data);
    } catch {
      setHistoryError('No se pudo cargar esta pagina. Intenta nuevamente.');
    } finally { setHistoryBusy(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 grid place-items-center font-sans">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-[#e50914]" />
          <p className="mt-5 font-semibold text-slate-300">Consultando tu vehiculo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0f19] px-5 text-slate-100 grid place-items-center font-sans">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#111827] p-8 text-center shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-500/10 text-red-400">
            <AlertCircle size={34} />
          </div>
          <h1 className="mt-5 text-2xl font-black">QR no disponible</h1>
          <p className="mt-3 leading-relaxed text-slate-400">{error}</p>
          <p className="mt-6 text-sm text-slate-500">Solicita un nuevo codigo QR en el taller.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans">
      <header className="relative overflow-hidden border-b border-slate-800 bg-black">
        <div className="absolute inset-0 bg-[url('/bg-taller.jpg')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/90 to-[#0b0f19]/60" />
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase text-[#e50914]">Seguimiento vehicular</p>
            <h1 className="mt-1 text-xl font-black uppercase sm:text-2xl">{empresa.razon_social}</h1>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-slate-700 bg-slate-900/80 text-[#e50914]">
            <Car size={24} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 sm:py-9 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[340px_1fr] lg:gap-7">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#111827] shadow-xl">
              <div className="border-b border-slate-800 bg-slate-800/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Vehiculo</p>
                    <p className="mt-1 text-3xl font-black text-white">{vehiculo.placa}</p>
                  </div>
                  <ShieldCheck className="text-emerald-400" size={30} />
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-lg font-bold text-white">{vehiculo.marca} {vehiculo.modelo}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {[vehiculo.anio_fabricacion, vehiculo.color].filter(Boolean).join(' / ') || 'Informacion registrada'}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">Ultimo kilometraje registrado: {vehiculo.kilometraje_actual == null ? 'Sin lectura' : `${Number(vehiculo.kilometraje_actual).toLocaleString('es-PE')} km`}</p>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
                  <ShieldCheck size={15} className="text-[#e50914]" />
                  Consulta segura {data.codigo_corto}
                </div>
              </div>
            </div>

            {orden && (
              <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">{orden.atencion_activa ? 'Atencion actual' : 'Ultima atencion finalizada'}</p>
                    <p className="mt-1 text-xl font-black">#{orden.numero}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone(orden.estado)}`}>
                    {orden.estado_display}
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-slate-300"><Gauge size={17} /> Trabajos terminados</span>
                  </div>
                  <p className="font-bold">{orden.trabajos_totales ? `${orden.trabajos_terminados} de ${orden.trabajos_totales}` : 'Sin trabajos autorizados'}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
                  <div>
                    <p className="text-xs text-slate-500">Ingreso</p>
                    <p className="mt-1 text-sm font-bold text-slate-200">{formatDate(orden.fecha_ingreso)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{orden.atencion_activa ? 'Entrega estimada' : 'Finalizacion'}</p>
                    <p className="mt-1 text-sm font-bold text-slate-200">{formatDate(orden.atencion_activa ? orden.fecha_estimada_entrega : orden.fecha_finalizacion)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {orden && (
              <div className="border-b border-slate-800 pb-5">
                <h2 className="mb-4 font-bold">Etapas de atencion</h2>
                <ol className="grid grid-cols-5 gap-1 sm:gap-3">
                  {etapas.map((etapa, index) => (
                    <li key={etapa.label} aria-current={index === etapaActual ? 'step' : undefined} className="min-w-0 text-center">
                      <div className={`mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full border ${index === etapaActual ? 'border-[#e50914] bg-[#e50914] text-white' : index < etapaActual ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-500'}`}>
                        {index < etapaActual ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{index + 1}</span>}
                      </div>
                      <span className={`block break-words text-[10px] sm:text-xs ${index === etapaActual ? 'font-bold text-white' : 'text-slate-400'}`}>{etapa.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {!orden ? (
              <div className="rounded-lg border border-slate-800 bg-[#111827] p-8 text-center shadow-xl sm:p-12">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={34} />
                </div>
                <h2 className="mt-5 text-2xl font-black">Sin ordenes registradas</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-400">Este vehiculo no tiene una orden de trabajo disponible para seguimiento.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-xl sm:p-6">
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10 text-[#e50914]"><Wrench size={21} /></div>
                    <div>
                      <h2 className="font-black text-white">{orden.atencion_activa ? 'Trabajos de la atencion actual' : 'Trabajos de la ultima atencion'}</h2>
                      <p className="text-sm text-slate-400">Orden #{orden.numero}</p>
                    </div>
                  </div>

                  <div className="mt-2"><Trabajos orden={orden} /></div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-[#111827] p-5 shadow-xl sm:p-6">
                  <div className="flex items-center gap-3">
                    <CalendarClock className="text-[#e50914]" size={22} />
                    <h2 className="font-black text-white">Movimientos de esta orden</h2>
                  </div>
                  <div className="mt-5 space-y-0">
                    {(orden.historial || []).length ? orden.historial.map((item, index) => (
                      <div key={`${item.estado}-${item.fecha}`} className="grid grid-cols-[24px_1fr] gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`mt-1 h-3 w-3 rounded-full ${index === orden.historial.length - 1 ? 'bg-[#e50914]' : 'bg-emerald-400'}`} />
                          {index < orden.historial.length - 1 && <div className="min-h-10 w-px flex-1 bg-slate-700" />}
                        </div>
                        <div className="pb-5">
                          <p className="font-semibold text-slate-200">{item.estado_display}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 size={13} /> {formatDate(item.fecha, true)}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Estado actual: {orden.estado_display}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        <section className="mt-7 border-t border-slate-800 pt-6" aria-label="Historial de visitas">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-lg font-black"><History size={23} className="text-[#e50914]" /> Historial de visitas al taller</h2>
            <span className="text-sm text-slate-400">{historial?.count || 0} ingresos registrados</span>
          </div>
          {historyError && <p role="alert" className="mb-3 text-sm text-red-300">{historyError}</p>}
          <div className="space-y-3" aria-busy={historyBusy}>
            {(historial?.results || []).map((visita) => (
              <details key={visita.numero} className="group overflow-hidden rounded-lg border border-slate-800 bg-[#111827]">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">Orden #{visita.numero}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(visita.fecha_ingreso)} / {visita.kilometraje_ingreso == null ? 'Kilometraje no registrado' : `${Number(visita.kilometraje_ingreso).toLocaleString('es-PE')} km`}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(visita.estado)}`}>{visita.estado_display}</span>
                  <ChevronDown size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-slate-800 px-4 py-2 sm:px-5">
                  {visita.fecha_finalizacion && <p className="mt-3 text-xs text-slate-400">Finalizacion: {formatDate(visita.fecha_finalizacion)}</p>}
                  <Trabajos orden={visita} />
                </div>
              </details>
            ))}
            {!historial?.count && <p className="text-sm text-slate-400">Sin visitas registradas.</p>}
          </div>
          {historial?.total_pages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3">
              <button type="button" title="Pagina anterior" aria-label="Pagina anterior" disabled={historyBusy || historial.page <= 1} onClick={() => cargarPagina(historial.page - 1)} className="rounded-lg border border-slate-700 p-2 disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="text-sm text-slate-400">{historial.page} / {historial.total_pages}</span>
              <button type="button" title="Pagina siguiente" aria-label="Pagina siguiente" disabled={historyBusy || historial.page >= historial.total_pages} onClick={() => cargarPagina(historial.page + 1)} className="rounded-lg border border-slate-700 p-2 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          )}
        </section>
        <section className="mt-7 border-t border-slate-800 pt-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock size={23} className="text-[#e50914]" />
            <h2 className="text-lg font-black">Proximos mantenimientos</h2>
          </div>
          {(data.mantenimientos || []).length === 0 ? (
            <p className="text-sm text-slate-400">El taller aun no ha registrado recomendaciones de mantenimiento para este vehiculo.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.mantenimientos.map((item) => (
                <article key={item.tipo} className="rounded-lg border border-slate-800 bg-[#111827] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold">{item.tipo_display}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.estado === 'VENCIDO' ? 'bg-red-500/15 text-red-300' : item.estado === 'VERIFICAR_KILOMETRAJE' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {item.estado === 'VENCIDO' ? 'Corresponde realizar' : item.estado === 'VERIFICAR_KILOMETRAJE' ? 'Verificar kilometraje' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Ultimo cambio: {formatDate(`${item.fecha_realizado}T12:00:00`)} / {Number(item.kilometraje_realizado).toLocaleString('es-PE')} km</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {item.proximo_km != null && <div><p className="text-xs text-slate-500">Proximo kilometraje</p><p className="mt-1 font-bold">{Number(item.proximo_km).toLocaleString('es-PE')} km</p></div>}
                    {item.proxima_fecha && <div><p className="text-xs text-slate-500">Proxima fecha</p><p className="mt-1 font-bold">{formatDate(`${item.proxima_fecha}T12:00:00`)}</p></div>}
                  </div>
                  <p className="mt-4 text-sm text-slate-400">
                    {item.km_restantes == null ? (item.proximo_km != null ? 'Kilometraje pendiente de verificar.' : '') : item.km_restantes > 0 ? `Faltan ${Number(item.km_restantes).toLocaleString('es-PE')} km segun la ultima lectura.` : 'Limite de kilometraje alcanzado.'}
                    {item.vencido_fecha ? ' Fecha recomendada alcanzada.' : ''}
                  </p>
                  {item.proximo_km != null && item.proxima_fecha && <p className="mt-2 text-xs text-slate-500">Realizar al alcanzar cualquiera de los dos limites, lo que ocurra primero.</p>}
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <div><h2 className="font-bold">Tu proxima visita</h2><p className="mt-1 text-sm text-slate-400">{empresa.razon_social}</p></div>
          <div className="flex flex-wrap gap-3">
            {telefono && <a href={`tel:+${telefono}`} className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold"><Phone size={17} /> Llamar al taller</a>}
            <Link to="/reservar-cita" className="flex items-center gap-2 rounded-lg bg-[#e50914] px-4 py-3 text-sm font-bold text-white hover:bg-[#b80710]"><CalendarClock size={17} /> Reservar cita</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-5 py-5 text-center text-xs text-slate-600">
        Informacion actualizada directamente por el taller. No compartas este codigo QR publicamente.
      </footer>
    </div>
  );
}
