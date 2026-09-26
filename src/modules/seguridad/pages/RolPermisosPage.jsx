import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, CircularProgress, Chip, TextField,
  InputAdornment, LinearProgress, Checkbox, Select, MenuItem, FormControl,
  Alert, Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowLeft, Save, Search, LayoutDashboard, Users, ShieldAlert, Package,
  Wrench, ShoppingCart, Banknote, ShoppingBag, FileText, Wallet, Settings,
  CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;

// Mismo criterio de ícono/color por módulo padre que usa el sidebar, para que
// esta pantalla se sienta parte del mismo sistema visual, no una isla aparte.
const ICONO_PADRE = {
  'Dashboard': { Icon: LayoutDashboard, color: '#0ea5e9' },
  'Contactos': { Icon: Users, color: '#8b5cf6' },
  'Seguridad': { Icon: ShieldAlert, color: '#ef4444' },
  'Inventario': { Icon: Package, color: '#f59e0b' },
  'Taller': { Icon: Wrench, color: '#10b981' },
  'Ventas': { Icon: ShoppingCart, color: '#3b82f6' },
  'Cuentas': { Icon: Banknote, color: '#14b8a6' },
  'Compras': { Icon: ShoppingBag, color: '#ec4899' },
  'Reportes': { Icon: FileText, color: '#6366f1' },
  'Cajas': { Icon: Wallet, color: '#eab308' },
  'Configuración': { Icon: Settings, color: '#64748b' },
};
const ORDEN_PADRES = Object.keys(ICONO_PADRE);

const ETIQUETA_ACCION = {
  VER: 'Ver', CREAR: 'Crear', EDITAR: 'Editar', ELIMINAR: 'Eliminar',
  APROBAR: 'Aprobar', CAMBIAR_ESTADO: 'Cambiar estado', REGISTRAR_PAGO: 'Registrar pago',
  ABRIR: 'Abrir', CERRAR: 'Cerrar', RECHAZAR: 'Rechazar', TRANSFERIR: 'Transferir',
  EXPORTAR: 'Exportar',
  // "Ver" (arriba) da acceso a los datos desde cualquier pantalla (ej. los
  // desplegables de Nueva Orden); "Ver en menú" es solo si el módulo aparece
  // como opción propia en el menú lateral. Se pueden combinar de forma
  // independiente: útil para, por ejemplo, dejar que un Mecánico use el
  // desplegable de Vehículos sin que "Vehículos" le aparezca como módulo aparte.
  VER_MENU: 'Ver en menú',
  EXTENDER_VENCIMIENTO: 'Extender vencimiento',
  PROMETER_ENTREGA: 'Prometer entrega',
};

export default function RolPermisosPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const puedeEditar = tienePermiso('SEGURIDAD.ROLES.EDITAR');

  const [rol, setRol] = useState(null);
  const [todosPermisos, setTodosPermisos] = useState([]);
  const [permisosAsignados, setPermisosAsignados] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [padreActivo, setPadreActivo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resRol, resPermisos] = await Promise.all([
          api.get(`seguridad/roles/${id}/`),
          api.get('seguridad/permisos/'),
        ]);
        // A diferencia de la mayoría de endpoints de este backend, el detalle
        // de un rol (GET /roles/:id/) no envuelve la respuesta en {data: ...} —
        // devuelve el objeto del rol directo.
        const rolData = resRol.data;
        setRol(rolData);

        const asignados = {};
        (rolData.permisos || []).forEach(rp => {
          asignados[rp.permiso.id_permiso] = rp.alcance;
        });
        setPermisosAsignados(asignados);

        const permisosData = resPermisos.data.data;
        setTodosPermisos(permisosData.results ? permisosData.results : (Array.isArray(permisosData) ? permisosData : []));
      } catch (error) {
        console.error('Error al cargar el rol:', error);
        Swal.fire('Error', 'No se pudo cargar el rol.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const togglePermiso = (id_permiso) => {
    setPermisosAsignados(prev => {
      const nuevo = { ...prev };
      if (nuevo[id_permiso]) {
        delete nuevo[id_permiso];
      } else {
        nuevo[id_permiso] = 'PROPIO';
      }
      return nuevo;
    });
  };

  const cambiarAlcance = (id_permiso, alcance) => {
    setPermisosAsignados(prev => ({ ...prev, [id_permiso]: alcance }));
  };

  const toggleGrupoCompleto = (permisos) => {
    setPermisosAsignados(prev => {
      const nuevo = { ...prev };
      const todosActivos = permisos.every(p => !!nuevo[p.id_permiso]);
      permisos.forEach(p => {
        if (todosActivos) {
          delete nuevo[p.id_permiso];
        } else if (!nuevo[p.id_permiso]) {
          nuevo[p.id_permiso] = 'PROPIO';
        }
      });
      return nuevo;
    });
  };

  const guardarPermisos = async () => {
    setGuardando(true);
    const payload = {
      permisos: Object.entries(permisosAsignados).map(([id_permiso, alcance]) => ({ id_permiso, alcance })),
    };
    try {
      await api.post(`seguridad/roles/${id}/permisos/`, payload);
      Swal.fire({
        position: 'top-end', icon: 'success', title: 'Permisos actualizados correctamente',
        showConfirmButton: false, timer: 1500, toast: true,
      });
    } catch {
      Swal.fire('Error', 'No se pudieron guardar los permisos.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Agrupa en dos niveles: módulo padre → submódulo. grupo_padre/grupo_submodulo
  // son campos de solo-organización que da el backend; el permiso real que
  // otorga acceso sigue siendo únicamente "codigo".
  const permisosPorPadre = useMemo(() => {
    const acc = {};
    todosPermisos.forEach(p => {
      const padre = p.grupo_padre || 'General';
      const submodulo = p.grupo_submodulo || null;
      if (!acc[padre]) acc[padre] = { directos: [], submodulos: {} };
      if (submodulo) {
        if (!acc[padre].submodulos[submodulo]) acc[padre].submodulos[submodulo] = [];
        acc[padre].submodulos[submodulo].push(p);
      } else {
        acc[padre].directos.push(p);
      }
    });
    return acc;
  }, [todosPermisos]);

  const padresOrdenados = useMemo(() => {
    const claves = Object.keys(permisosPorPadre);
    return claves.sort((a, b) => {
      const ia = ORDEN_PADRES.indexOf(a);
      const ib = ORDEN_PADRES.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [permisosPorPadre]);

  const q = busqueda.trim().toLowerCase();
  const coincide = useCallback((p) => (
    !q || p.nombre?.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
  ), [q]);

  // Con búsqueda activa, un padre "coincide" si algún permiso suyo coincide —
  // así el usuario ve de inmediato en qué módulo está lo que busca.
  const padresConCoincidencia = useMemo(() => {
    if (!q) return null;
    return padresOrdenados.filter(padre => {
      const grupo = permisosPorPadre[padre];
      const todos = [...grupo.directos, ...Object.values(grupo.submodulos).flat()];
      return todos.some(coincide);
    });
  }, [q, padresOrdenados, permisosPorPadre, coincide]);

  useEffect(() => {
    if (q && padresConCoincidencia && padresConCoincidencia.length > 0 && !padresConCoincidencia.includes(padreActivo)) {
      setPadreActivo(padresConCoincidencia[0]);
    }
  }, [q, padresConCoincidencia]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rol) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">No se encontró el rol solicitado.</Alert>
      </Box>
    );
  }

  const padresVisibles = q && padresConCoincidencia ? padresConCoincidencia : padresOrdenados;
  const padreSeleccionado = padreActivo && padresVisibles.includes(padreActivo)
    ? padreActivo
    : (padresVisibles[0] || null);
  const grupoActivo = padreSeleccionado ? permisosPorPadre[padreSeleccionado] : null;

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', pb: 8 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Button
            size="small" startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/roles')}
            sx={{ color: C.textMuted, mb: 1, pl: 0, '&:hover': { color: C.text } }}
          >
            Volver a Roles
          </Button>
          <Typography variant="h4" fontWeight="850" color={C.text} sx={{ lineHeight: 1.08 }}>
            Permisos de "{rol.nombre}"
          </Typography>
          <Typography variant="body2" color={C.textMuted} sx={{ mt: 0.75 }}>
            {rol.descripcion || 'Elige qué módulos y acciones puede usar este rol.'}
          </Typography>
        </Box>
        {puedeEditar && !rol.es_sistema && (
          <Button
            variant="contained" size="large"
            startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={guardarPermisos}
            disabled={guardando}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Guardar Cambios
          </Button>
        )}
      </Box>

      {rol.es_sistema && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 1,
            bgcolor: alpha(C.blue, 0.08),
            color: C.text,
            border: `1px solid ${alpha(C.blue, 0.22)}`,
            '& .MuiAlert-icon': { color: C.blue },
          }}
        >
          Este es un rol de sistema. Sus permisos no pueden ser modificados.
        </Alert>
      )}

      {/* Buscador */}
      <TextField
        fullWidth
        placeholder="Busca un permiso por nombre o código (ej. crear clientes)..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
        }}
        sx={{ mb: 3 }}
      />

      {/* Grid de cards por módulo padre */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 2,
          mb: 4,
        }}
      >
        {padresVisibles.map((padre) => {
          const grupo = permisosPorPadre[padre];
          const todosDelPadre = [...grupo.directos, ...Object.values(grupo.submodulos).flat()];
          const activos = todosDelPadre.filter(p => !!permisosAsignados[p.id_permiso]).length;
          const total = todosDelPadre.length;
          const pct = total > 0 ? Math.round((activos / total) * 100) : 0;
          const { Icon, color } = ICONO_PADRE[padre] || { Icon: Settings, color: '#64748b' };
          const activo = padreSeleccionado === padre;

          return (
            <Paper
              key={padre}
              onClick={() => setPadreActivo(padre)}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activo ? alpha(color, 0.72) : C.border,
                bgcolor: activo ? alpha(color, 0.13) : alpha(C.surface, 0.96),
                backgroundImage: activo
                  ? `linear-gradient(180deg, ${alpha(color, 0.12)}, ${alpha(C.surface, 0.96)})`
                  : `linear-gradient(180deg, ${alpha('#ffffff', 0.035)}, transparent 44%)`,
                boxShadow: activo ? `0 18px 42px ${alpha(color, 0.14)}` : S.card,
                transition: 'all 180ms ease',
                position: 'relative', overflow: 'hidden',
                '&:hover': { borderColor: alpha(color, 0.82), boxShadow: `0 18px 36px ${alpha(color, 0.18)}`, transform: 'translateY(-2px)' },
              }}
            >
              {activos > 0 && activos === total && (
                <CheckCircle2 size={18} color="#22c55e" style={{ position: 'absolute', top: 10, right: 10 }} />
              )}
              <Box sx={{
                width: 44, height: 44, borderRadius: 1.5, bgcolor: alpha(color, 0.14),
                border: `1px solid ${alpha(color, 0.22)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
              }}>
                <Icon size={22} color={color} />
              </Box>
              <Typography variant="subtitle1" fontWeight="800" color={C.text} noWrap>
                {padre}
              </Typography>
              <Typography variant="caption" color={C.textMuted} fontWeight="700">
                {activos}/{total} permisos
              </Typography>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  mt: 1, height: 6, borderRadius: 4, bgcolor: alpha(color, 0.16),
                  '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                }}
              />
            </Paper>
          );
        })}
      </Box>

      {/* Detalle del módulo padre seleccionado */}
      {!grupoActivo ? (
        <Paper elevation={0} sx={{ p: 6, border: '1px dashed', borderColor: C.border, textAlign: 'center', bgcolor: alpha(C.surface, 0.82) }}>
          <Typography variant="body1" color={C.textMuted}>
            Selecciona un módulo arriba para ver y activar sus permisos.
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h6" fontWeight="850" color={C.text} mb={2} display="flex" alignItems="center" gap={1.5}>
            {(() => { const { Icon, color } = ICONO_PADRE[padreSeleccionado] || {}; return Icon ? <Icon size={22} color={color} /> : null; })()}
            {padreSeleccionado}
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {/* Permisos sin submódulo propio (ej. Dashboard, Compras) van en una sola card */}
            {grupoActivo.directos.length > 0 && (
              <TarjetaSubmodulo
                titulo={padreSeleccionado}
                permisos={grupoActivo.directos.filter(coincide)}
                permisosAsignados={permisosAsignados}
                togglePermiso={togglePermiso}
                cambiarAlcance={cambiarAlcance}
                toggleGrupoCompleto={toggleGrupoCompleto}
                disabled={rol.es_sistema}
              />
            )}
            {Object.keys(grupoActivo.submodulos).sort((a, b) => a.localeCompare(b)).map(submodulo => {
              const permisosSub = grupoActivo.submodulos[submodulo].filter(coincide);
              if (q && permisosSub.length === 0) return null;
              return (
                <TarjetaSubmodulo
                  key={submodulo}
                  titulo={submodulo}
                  permisos={permisosSub}
                  permisosAsignados={permisosAsignados}
                  togglePermiso={togglePermiso}
                  cambiarAlcance={cambiarAlcance}
                  toggleGrupoCompleto={toggleGrupoCompleto}
                  disabled={rol.es_sistema}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Card de un submódulo (o de un padre sin submódulos): chips para activar
// rápido cada acción, y un selector de alcance compacto solo para las que
// ya están activas.
function TarjetaSubmodulo({ titulo, permisos, permisosAsignados, togglePermiso, cambiarAlcance, toggleGrupoCompleto, disabled }) {
  if (permisos.length === 0) return null;
  const activos = permisos.filter(p => !!permisosAsignados[p.id_permiso]).length;
  const total = permisos.length;
  const checkedIds = permisos.filter(p => !!permisosAsignados[p.id_permiso]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: C.border,
        bgcolor: alpha(C.surface, 0.96),
        backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.04)}, transparent 42%)`,
        boxShadow: S.card,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Checkbox
            size="small"
            checked={total > 0 && activos === total}
            indeterminate={activos > 0 && activos < total}
            onChange={() => toggleGrupoCompleto(permisos)}
            disabled={disabled}
            sx={{ p: 0.5 }}
          />
          <Typography variant="subtitle2" fontWeight="800" color={C.text}>{titulo}</Typography>
        </Box>
        <Chip
          label={`${activos}/${total}`} size="small"
          variant={activos > 0 ? 'filled' : 'outlined'}
          sx={{
            height: 20,
            fontSize: '0.7rem',
            color: activos > 0 ? '#ffffff' : C.textMuted,
            borderColor: C.border,
            bgcolor: activos > 0 ? C.brand : 'transparent',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {permisos.map(p => {
          const activo = !!permisosAsignados[p.id_permiso];
          const etiqueta = ETIQUETA_ACCION[p.accion] || p.accion;
          return (
            <Tooltip key={p.id_permiso} title={p.nombre}>
              <Chip
                label={etiqueta}
                size="small"
                onClick={() => !disabled && togglePermiso(p.id_permiso)}
                variant={activo ? 'filled' : 'outlined'}
                disabled={disabled}
                sx={{
                  fontWeight: 700,
                  cursor: disabled ? 'default' : 'pointer',
                  color: activo ? '#ffffff' : C.textMuted,
                  borderColor: activo ? alpha(C.brandLight, 0.32) : C.border,
                  bgcolor: activo ? alpha(C.brand, 0.92) : alpha('#ffffff', 0.035),
                  '&:hover': {
                    bgcolor: activo ? C.brandDark : alpha('#ffffff', 0.07),
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {checkedIds.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: C.border, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {checkedIds.map(p => (
            <Box key={p.id_permiso} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="caption" color={C.textMuted} noWrap sx={{ flex: 1 }}>{p.nombre}</Typography>
              <FormControl size="small" sx={{ minWidth: 118 }}>
                <Select
                  value={permisosAsignados[p.id_permiso]}
                  onChange={(e) => cambiarAlcance(p.id_permiso, e.target.value)}
                  disabled={disabled}
                  sx={{ fontSize: '0.75rem', borderRadius: '8px', '& .MuiSelect-select': { py: 0.5 } }}
                >
                  <MenuItem value="GLOBAL" sx={{ fontSize: '0.8rem' }}>Global</MenuItem>
                  <MenuItem value="TALLER" sx={{ fontSize: '0.8rem' }}>Taller</MenuItem>
                  <MenuItem value="ASIGNADO" sx={{ fontSize: '0.8rem' }}>Asignado a mí</MenuItem>
                  <MenuItem value="PROPIO" sx={{ fontSize: '0.8rem' }}>Creado por mí</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
