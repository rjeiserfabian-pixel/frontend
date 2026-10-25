import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../core/api/axios';
import { authStorage } from '../../../core/auth/authStorage';
import { rememberedUsername } from '../../../core/auth/rememberedUsername';
import {
  Users,
  ClipboardList,
  Package,
  BarChart3,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Esquema de validación con Zod
───────────────────────────────────────────── */
const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'El correo / usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  remember: z.boolean().optional(),
});

/* ─────────────────────────────────────────────
   Datos de características (panel izquierdo)
───────────────────────────────────────────── */
const features = [
  { icon: Users,         label: 'Gestión de clientes' },
  { icon: ClipboardList, label: 'Órdenes de servicio' },
  { icon: Package,       label: 'Inventario de repuestos' },
  { icon: BarChart3,     label: 'Reportes y estadísticas' },
];

/* ─────────────────────────────────────────────
   Componente principal
───────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [savedUsername] = useState(() => rememberedUsername.get());
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    location.state?.idleTimeout
      ? 'Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.'
      : ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: savedUsername,
      password: '',
      remember: Boolean(savedUsername),
    },
  });

  /* Envío del formulario */
  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const res = await api.post('seguridad/login/', {
        username: data.username,
        password: data.password,
      });
      const { access, refresh, usuario } = res.data.data;
      authStorage.setSession({ access, refresh, user: usuario });
      if (data.remember) {
        rememberedUsername.save(data.username);
      } else {
        rememberedUsername.clear();
      }
      window.location.href = '/dashboard';
    } catch (error) {
      if (error.response?.data?.errores?.non_field_errors) {
        setErrorMsg(error.response.data.errores.non_field_errors[0]);
      } else {
        setErrorMsg(
          error.response?.data?.mensaje || 'Error al conectar con el servidor.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#0f1117] font-['Inter',system-ui,sans-serif] text-slate-100 overflow-x-hidden overflow-y-auto">
      {/* ══════════════════════════════════════
          PANEL IZQUIERDO — Solo Desktop (≥ lg)
      ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex relative flex-1 min-h-[100dvh] bg-cover bg-center items-stretch overflow-hidden"
        style={{ backgroundImage: 'url(/bg-taller.jpg)' }}
      >
        {/* Overlay oscuro con gradiente esmeralda */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#05190f]/90 via-[#0a1e14]/80 to-[#0f1117]/95 z-10 pointer-events-none" />

        {/* Contenido sobre la imagen */}
        <div className="relative z-20 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo + marca */}
          <div className="flex items-center gap-3.5">
            <img
              src="/logo-taller.jpg"
              alt="Logo Taller 360"
              className="w-12 h-12 object-contain rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-500/30"
            />
            <div>
              <p className="m-0 text-lg font-extrabold text-white tracking-wider">TALLER 360°</p>
              <p className="m-0 text-[10px] font-semibold text-emerald-400 tracking-[0.2em]">SISTEMA DE GESTIÓN</p>
            </div>
          </div>

          {/* Título principal + features */}
          <div className="my-auto py-8 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="m-0 text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-white leading-tight">
                Soluciones inteligentes<br />
                para <span className="text-emerald-400">tu taller</span>
              </h1>
              <p className="m-0 text-sm xl:text-base text-slate-300/80 leading-relaxed max-w-md">
                Controla cada detalle de tu negocio, optimiza tus tiempos y ofrece el mejor servicio a tus clientes.
              </p>
            </div>

            {/* Lista de características */}
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-200 font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dots decorativos inferiores */}
          <div className="grid grid-cols-10 gap-1.5 opacity-25 w-fit">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — Responsive Form (Mobile & Desktop)
      ══════════════════════════════════════ */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 min-h-screen min-h-[100dvh]">
        {/* Cabecera de marca en móvil (Solo visible en pantallas < lg) */}
        <div className="flex lg:hidden items-center gap-3 mb-6">
          <img
            src="/logo-taller.jpg"
            alt="Logo Taller 360"
            className="w-11 h-11 object-contain rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.5)] border border-emerald-500/30"
          />
          <div className="text-left">
            <p className="m-0 text-base font-extrabold text-white tracking-wider">TALLER 360°</p>
            <p className="m-0 text-[10px] font-semibold text-emerald-400 tracking-[0.2em]">SISTEMA DE GESTIÓN</p>
          </div>
        </div>

        {/* Tarjeta del formulario */}
        <div className="w-full max-w-[420px] bg-[#11151c] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl shadow-black/60 flex flex-col items-center">
          {/* Avatar circular */}
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <svg
              className="w-8 h-8 sm:w-9 sm:h-9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>

          <h2 className="m-0 text-2xl sm:text-3xl font-bold text-white text-center">¡Bienvenido!</h2>
          <p className="m-0 mt-1 mb-5 sm:mb-6 text-xs sm:text-sm text-slate-400 text-center">
            Inicia sesión para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full flex flex-col gap-4">
            {/* ── Error global ── */}
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm leading-snug animate-shake">
                <AlertCircle size={17} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── Campo: correo / usuario ── */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-xs sm:text-sm font-medium text-slate-300">
                Correo electrónico
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="tu@correo.com"
                  autoComplete="username"
                  disabled={isSubmitting}
                  className={`w-full h-11 sm:h-12 bg-white/[0.04] border rounded-xl pl-10 pr-3.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.username
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-white/10 focus:border-emerald-500 hover:border-white/20'
                  }`}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="m-0 text-xs text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* ── Campo: contraseña ── */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs sm:text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`w-full h-11 sm:h-12 bg-white/[0.04] border rounded-xl pl-10 pr-11 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${
                    errors.password
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-white/10 focus:border-emerald-500 hover:border-white/20'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="m-0 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* ── Recordarme + olvidé contraseña ── */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <label htmlFor="login-remember" className="flex items-center gap-2 text-xs sm:text-sm text-slate-300/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="login-remember"
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-emerald-500 cursor-pointer"
                  {...register('remember', {
                    onChange: (event) => {
                      if (!event.target.checked) rememberedUsername.clear();
                    },
                  })}
                />
                <span>Recordar mi usuario</span>
              </label>
              <button
                type="button"
                className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium bg-transparent border-0 p-0 cursor-pointer transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* ── Botón principal de login ── */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 sm:h-12 mt-1 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 size={19} className="animate-spin text-white" />
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* ── Divisor ── */}
            <div className="flex items-center gap-3 my-0.5">
              <span className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500 whitespace-nowrap">o continúa con</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>

            {/* ── Botones sociales ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google */}
              <button
                type="button"
                id="login-google"
                className="h-10 sm:h-11 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-slate-300 text-xs sm:text-sm font-medium transition-all cursor-pointer"
              >
                <svg width="17" height="17" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Google</span>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                id="login-microsoft"
                className="h-10 sm:h-11 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 text-slate-300 text-xs sm:text-sm font-medium transition-all cursor-pointer"
              >
                <svg width="17" height="17" viewBox="0 0 21 21">
                  <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                  <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                  <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
