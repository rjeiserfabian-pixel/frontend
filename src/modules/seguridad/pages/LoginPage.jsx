import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api/axios';
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  /* Envío del formulario */
  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const res = await api.post('seguridad/login/', {
        username: data.username,
        password: data.password,
      });
      const { access, refresh, usuario } = res.data.data;
      localStorage.setItem('accessToken',  access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user',         JSON.stringify(usuario));
      navigate('/dashboard');
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
    <div style={styles.root}>
      {/* ══════════════════════════════════════
          PANEL IZQUIERDO — imagen + features
      ══════════════════════════════════════ */}
      <div style={styles.leftPanel}>
        {/* Overlay oscuro con gradiente */}
        <div style={styles.overlay} />

        {/* Contenido sobre la imagen */}
        <div style={styles.leftContent}>
          {/* Logo + marca */}
          <div style={styles.brand}>
            <img
              src="/logo-taller.jpg"
              alt="Logo Taller 360"
              style={styles.logoImg}
            />
            <div>
              <p style={styles.brandName}>TALLER 360°</p>
              <p style={styles.brandSub}>SISTEMA DE GESTIÓN</p>
            </div>
          </div>

          {/* Título principal */}
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              Soluciones inteligentes<br />
              para{' '}
              <span style={styles.heroAccent}>tu taller</span>
            </h1>
            <p style={styles.heroSub}>
              Controla cada detalle de tu negocio<br />
              y ofrece el mejor servicio.
            </p>
          </div>

          {/* Lista de características */}
          <ul style={styles.featureList}>
            {features.map(({ icon: Icon, label }) => (
              <li key={label} style={styles.featureItem}>
                <div style={styles.featureIconWrap}>
                  <Icon size={18} color="#10b981" />
                </div>
                <span style={styles.featureLabel}>{label}</span>
              </li>
            ))}
          </ul>

          {/* Dots decorativos */}
          <div style={styles.dotsGrid}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={styles.dot} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — formulario
      ══════════════════════════════════════ */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          {/* Avatar */}
          <div style={styles.avatarWrap}>
            <svg
              width="36" height="36" viewBox="0 0 24 24"
              fill="none" stroke="#10b981" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>

          <h2 style={styles.formTitle}>¡Bienvenido!</h2>
          <p style={styles.formSub}>Inicia sesión para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
            {/* ── Error global ── */}
            {errorMsg && (
              <div style={styles.errorBanner}>
                <AlertCircle size={16} color="#f87171" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ── Campo: correo / usuario ── */}
            <div style={styles.fieldWrap}>
              <label style={styles.label} htmlFor="login-username">
                Correo electrónico
              </label>
              <div style={styles.inputWrap}>
                <Mail size={16} color="#6b7280" style={styles.inputIcon} />
                <input
                  id="login-username"
                  type="text"
                  placeholder="tu@correo.com"
                  autoComplete="username"
                  disabled={isSubmitting}
                  style={{
                    ...styles.input,
                    ...(errors.username ? styles.inputError : {}),
                  }}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p style={styles.fieldError}>{errors.username.message}</p>
              )}
            </div>

            {/* ── Campo: contraseña ── */}
            <div style={styles.fieldWrap}>
              <label style={styles.label} htmlFor="login-password">
                Contraseña
              </label>
              <div style={styles.inputWrap}>
                <Lock size={16} color="#6b7280" style={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  style={{
                    ...styles.input,
                    paddingRight: '44px',
                    ...(errors.password ? styles.inputError : {}),
                  }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword
                    ? <EyeOff size={18} color="#6b7280" />
                    : <Eye    size={18} color="#6b7280" />}
                </button>
              </div>
              {errors.password && (
                <p style={styles.fieldError}>{errors.password.message}</p>
              )}
            </div>

            {/* ── Recordarme + olvidé contraseña ── */}
            <div style={styles.rowBetween}>
              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  id="login-remember"
                  style={styles.checkbox}
                  {...register('remember')}
                />
                Recordarme
              </label>
              <button type="button" style={styles.forgotBtn}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* ── Botón principal ── */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitBtn,
                ...(isSubmitting ? styles.submitBtnDisabled : {}),
              }}
            >
              {isSubmitting ? (
                <span style={styles.spinner} />
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                </>
              )}
            </button>

            {/* ── Divisor ── */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>o continúa con</span>
              <span style={styles.dividerLine} />
            </div>

            {/* ── Botones sociales ── */}
            <div style={styles.socialRow}>
              {/* Google */}
              <button type="button" style={styles.socialBtn} id="login-google">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Google</span>
              </button>

              {/* Microsoft */}
              <button type="button" style={styles.socialBtn} id="login-microsoft">
                <svg width="18" height="18" viewBox="0 0 21 21">
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

/* ─────────────────────────────────────────────
   Estilos inline (sin dependencia de Tailwind)
   Paleta: fondo oscuro #0f1117 / verde #10b981
───────────────────────────────────────────── */
const styles = {
  /* ── Layout raíz ── */
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#0f1117',
    overflow: 'hidden',
  },

  /* ── Panel izquierdo ── */
  leftPanel: {
    position: 'relative',
    flex: 1,
    minHeight: '100vh',
    backgroundImage: 'url(/bg-taller.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'stretch',
    // Ocultar en pantallas muy pequeñas se maneja con media queries, pero
    // para este contexto lo dejamos siempre visible.
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(135deg, rgba(5,25,15,0.88) 0%, rgba(10,30,20,0.75) 60%, rgba(15,17,23,0.92) 100%)',
    zIndex: 1,
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '48px 56px',
    gap: '36px',
    width: '100%',
  },

  /* Brand */
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoImg: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '10px',
    filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.6))',
  },
  brandName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '0.08em',
  },
  brandSub: {
    margin: 0,
    fontSize: '10px',
    fontWeight: 500,
    color: '#10b981',
    letterSpacing: '0.2em',
  },

  /* Hero */
  heroText: { display: 'flex', flexDirection: 'column', gap: '12px' },
  heroTitle: {
    margin: 0,
    fontSize: 'clamp(26px, 3vw, 40px)',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.2,
  },
  heroAccent: { color: '#10b981' },
  heroSub: {
    margin: 0,
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.6,
  },

  /* Features */
  featureList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    animation: 'fadeInLeft 0.5s ease both',
  },
  featureIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid rgba(16,185,129,0.3)',
    background: 'rgba(16,185,129,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.82)',
    fontWeight: 500,
  },

  /* Dots decorativos */
  dotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 8px)',
    gap: '6px',
    opacity: 0.25,
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },

  /* ── Panel derecho ── */
  rightPanel: {
    width: 'clamp(340px, 38%, 480px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
  },
  formCard: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    /* ── Contorno añadido (estilo tarjeta) ── */
    padding: '40px 32px',
    backgroundColor: '#11151c',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },

  /* Avatar círculo */
  avatarWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '2px solid rgba(16,185,129,0.4)',
    background: 'rgba(16,185,129,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  formTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  formSub: {
    margin: '0 0 16px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },

  /* Form */
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  /* Error banner */
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)',
    fontSize: '13px',
    color: '#f87171',
  },

  /* Field */
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.75)',
  },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '11px 12px 11px 38px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: 'rgba(248,113,113,0.5)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px',
  },
  fieldError: {
    margin: 0,
    fontSize: '12px',
    color: '#f87171',
  },

  /* Recordarme row */
  rowBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#10b981',
    width: '15px',
    height: '15px',
    cursor: 'pointer',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    fontSize: '13px',
    color: '#10b981',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },

  /* Botón principal */
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '13px 24px',
    borderRadius: '9px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
    fontFamily: 'inherit',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },

  /* Spinner */
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  /* Divisor */
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    whiteSpace: 'nowrap',
  },

  /* Botones sociales */
  socialRow: {
    display: 'flex',
    gap: '12px',
  },
  socialBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    fontFamily: 'inherit',
  },
};
