import { Users, ShieldAlert, Activity, TrendingUp, TrendingDown, Wallet, ClipboardList, AlertCircle } from 'lucide-react';
import { authStorage } from '../../../core/auth/authStorage';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { useSucursal } from '../../../shared/contexts/SucursalContext';
import { useResumenDia } from '../hooks/useResumenDia';

const formatSoles = (valor) => `S/ ${Number(valor || 0).toFixed(2)}`;

const formatDiaCorto = (fechaIso) => {
  const [, mes, dia] = fechaIso.split('-');
  return `${dia}/${mes}`;
};

function TendenciaChart({ tendencia }) {
  const maxValor = Math.max(1, ...tendencia.flatMap((d) => [d.ingresos, d.egresos]));

  return (
    <div className="flex items-end justify-between gap-2 h-48 w-full px-2">
      {tendencia.map((d) => (
        <div key={d.fecha} className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-end gap-1 h-40">
            <div
              className="w-3 sm:w-4 bg-emerald-500 rounded-t transition-all"
              style={{ height: `${Math.max(2, (d.ingresos / maxValor) * 100)}%` }}
              title={`Ingresos: ${formatSoles(d.ingresos)}`}
            />
            <div
              className="w-3 sm:w-4 bg-rose-400 rounded-t transition-all"
              style={{ height: `${Math.max(2, (d.egresos / maxValor) * 100)}%` }}
              title={`Egresos: ${formatSoles(d.egresos)}`}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{formatDiaCorto(d.fecha)}</span>
        </div>
      ))}
    </div>
  );
}

function ResumenGerencial({ resumen, loading, error }) {
  if (loading && !resumen) {
    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[104px] rounded-2xl bg-slate-100 border border-slate-200/60" />
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-sm">
        <AlertCircle size={18} />
        No se pudo cargar el resumen del día. Intenta recargar la página.
      </div>
    );
  }

  if (!resumen) return null;

  const netoPositivo = resumen.neto_hoy >= 0;

  const stats = [
    {
      title: 'Ingresado hoy',
      value: formatSoles(resumen.ingresado_hoy),
      icon: <Wallet size={24} />,
      isPrimary: true,
      caption: resumen.generado_credito_hoy > 0
        ? `+ ${formatSoles(resumen.generado_credito_hoy)} generado a crédito (no incluido)`
        : null,
    },
    {
      title: 'Egresado hoy',
      value: formatSoles(resumen.egresado_hoy),
      icon: <TrendingDown size={24} />,
      isPrimary: false,
    },
    {
      title: 'Neto del día',
      value: formatSoles(resumen.neto_hoy),
      icon: <TrendingUp size={24} />,
      isPrimary: false,
      valueClass: netoPositivo ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      title: 'Órdenes ingresadas hoy',
      value: String(resumen.ordenes_ingresadas_hoy),
      icon: <ClipboardList size={24} />,
      isPrimary: false,
    },
  ];

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`
              relative overflow-hidden p-6 rounded-2xl border transition-all duration-300
              hover:-translate-y-1 hover:shadow-lg
              ${stat.isPrimary
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-200/60 text-slate-900 shadow-sm'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className={`text-sm font-medium ${stat.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.title}
                </span>
                <span className={`text-3xl font-bold tracking-tight ${stat.valueClass || (stat.isPrimary ? 'text-white' : 'text-slate-900')}`}>
                  {stat.value}
                </span>
              </div>
              <div className={`
                p-3 rounded-xl
                ${stat.isPrimary ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-400'}
              `}>
                {stat.icon}
              </div>
            </div>
            {stat.caption && (
              <p className="text-xs text-slate-400 mt-3">{stat.caption}</p>
            )}
            {stat.isPrimary && (
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            )}
          </div>
        ))}
      </section>

      <section className="mt-2">
        <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Ingresos vs. egresos (últimos 7 días)</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Egresos</span>
            </div>
          </div>
          <TendenciaChart tendencia={resumen.tendencia_7_dias} />
        </div>
      </section>
    </>
  );
}

export default function DashboardPage() {
  const user = authStorage.getUser();
  const { tienePermiso } = usePermisos();
  const { activeSucursalId } = useSucursal();
  const puedeVerResumen = tienePermiso('REPORTES.AVANZADO.VER');
  const { resumen, loading, error } = useResumenDia(puedeVerResumen, activeSucursalId);

  const statsGenericas = [
    { title: 'Usuarios Activos', value: '12', icon: <Users size={24} />, isPrimary: true },
    { title: 'Roles Definidos', value: '4', icon: <ShieldAlert size={24} />, isPrimary: false },
    { title: 'Operaciones Hoy', value: '45', icon: <Activity size={24} />, isPrimary: false },
    { title: 'Eficiencia', value: '98%', icon: <TrendingUp size={24} />, isPrimary: false },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Bienvenido, {user?.nombre || 'Usuario'} <span className="animate-pulse inline-block">👋</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Aquí tienes un resumen de la actividad del sistema.
        </p>
      </header>

      {puedeVerResumen ? (
        <ResumenGerencial resumen={resumen} loading={loading} error={error} />
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsGenericas.map((stat, index) => (
            <div
              key={index}
              className={`
                relative overflow-hidden p-6 rounded-2xl border transition-all duration-300
                hover:-translate-y-1 hover:shadow-lg
                ${stat.isPrimary
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-white border-slate-200/60 text-slate-900 shadow-sm'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className={`text-sm font-medium ${stat.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stat.title}
                  </span>
                  <span className={`text-3xl font-bold tracking-tight ${stat.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                    {stat.value}
                  </span>
                </div>
                <div className={`
                  p-3 rounded-xl
                  ${stat.isPrimary ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-400'}
                `}>
                  {stat.icon}
                </div>
              </div>
              {stat.isPrimary && (
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
