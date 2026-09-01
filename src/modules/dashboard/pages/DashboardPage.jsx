import { Users, ShieldAlert, Activity, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const stats = [
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

      <section className="mt-2">
        <div className="relative w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center min-h-[320px] transition-colors hover:bg-slate-50">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            {/* Subtle grid pattern background */}
            <svg className="absolute inset-0 h-full w-full stroke-slate-200/50" fill="none">
              <defs>
                <pattern id="pattern-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M.5 20V.5H20" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" strokeWidth="0" fill="url(#pattern-grid)" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-white shadow-sm border border-slate-100">
              <Activity size={32} className="text-slate-400 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-slate-900">Gráficos de actividad</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Esta sección está en desarrollo. Pronto podrás visualizar las métricas y tendencias de operaciones.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
