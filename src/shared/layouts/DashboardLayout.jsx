import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, IconButton, Typography, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Avatar, Menu, MenuItem, Box, Divider, useTheme, Collapse, CircularProgress,
  Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  Menu as MenuIcon, ChevronLeft, LogOut, CarFront, ChevronDown, ChevronRight, Settings, MapPin
} from 'lucide-react';
import * as Icons from 'lucide-react';
import api from '../../core/api/axios';
import { authStorage } from '../../core/auth/authStorage';
import { getMediaUrl } from '../../core/utils/mediaUrl';
import { useSucursal } from '../contexts/SucursalContext';
import { useIdleLogout } from '../hooks/useIdleLogout';
import { usePermisos } from '../contexts/PermisosContext';
import { Select, FormControl } from '@mui/material';
import OverdueAccountsBell from '../components/OverdueAccountsBell';
import { comprasService } from '../../modules/compras/services/comprasApi';
import { EVENTO_COBRAR_VENCIDAS_CAMBIO, EVENTO_PAGAR_VENCIDAS_CAMBIO } from '../utils/vencidasEvents';
import { premiumTokens } from '../../core/theme/theme';

const DRAWER_WIDTH = 280;
const DRAWER_MINI_WIDTH = 80;
const C = premiumTokens.colors;
const S = premiumTokens.shadow;
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // Cierra sesión tras 15 min sin actividad

// Componente para renderizar iconos dinámicamente
const DynamicIcon = ({ name, size = 22 }) => {
  const iconMapping = {
    'dashboard': Icons.LayoutDashboard,
    'layoutdashboard': Icons.LayoutDashboard,
    'shield': Icons.ShieldAlert,
    'users': Icons.Users,
    'settings': Icons.Settings,
    'car': Icons.Car,
    'wrench': Icons.Wrench,
    'package': Icons.Package,
    'tags': Icons.Tags,
    'list': Icons.List,
    'tool': Icons.PenTool,
    'banknote': Icons.Banknote,
    'store': Icons.Store,
    'filetext': Icons.FileText,
    'map-pin': Icons.MapPin,
    'clipboard-list': Icons.ClipboardList,
    'list-checks': Icons.ListChecks,
    'credit-card': Icons.CreditCard,
    'truck': Icons.Truck,
    'shopping-cart': Icons.ShoppingCart,
    'shopping-bag': Icons.ShoppingBag,
    'plus-circle': Icons.PlusCircle,
    'history': Icons.History,
    'circle': Icons.Circle,
    'shoppingcart': Icons.ShoppingCart,
    'arrowrightleft': Icons.ArrowRightLeft,
    'wallet': Icons.Wallet,
    'building': Icons.Building2,
    'tag': Icons.Tag,
    'ruler': Icons.Ruler,
  };
  const IconComponent = iconMapping[name?.toLowerCase()] || Icons.Circle;
  return <IconComponent size={size} />;
};

export default function DashboardLayout() {
  // Sidebar inicia ESTIRADO por defecto como se solicitó
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [openModules, setOpenModules] = useState({});

  // Estado para los datos dinámicos de la empresa (logo y razón social)
  const [empresaData, setEmpresaData] = useState(null);

  const { sucursales, activeSucursalId, changeSucursal, loadingContext } = useSucursal();
  const { tienePermiso } = usePermisos();

  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Campanitas de alertas de vencimiento (Cuentas por Cobrar / Pagar)
  const fetchCuotasCobrarVencidas = useCallback(async () => {
    const params = activeSucursalId ? { sucursal_id: activeSucursalId } : {};
    const res = await api.get('/ventas/cuentas-por-cobrar/cuotas-vencidas/', { params });
    const { total, results } = res.data;
    return {
      total,
      results: results.map(r => ({
        id: r.id,
        titulo: r.cliente_nombre,
        subtitulo: `${r.codigo_credito} · Cuota ${r.numero_cuota}`,
        monto: r.saldo_pendiente,
        diasVencido: r.dias_vencido,
        to: `/cuentas/por-cobrar/credito/${r.cuenta_cobrar_id}`,
      })),
    };
  }, [activeSucursalId]);

  const fetchCuentasPagarVencidas = useCallback(async () => {
    const data = await comprasService.getCuentasPorPagarVencidas();
    return {
      total: data.total,
      results: data.results.map(r => ({
        id: r.id,
        titulo: r.proveedor_nombre,
        subtitulo: 'Cuenta por pagar',
        monto: r.saldo_pendiente,
        diasVencido: r.dias_vencido,
        to: `/compras/cuentas-por-pagar/proveedor/${r.proveedor_id}`,
      })),
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController(); // AbortController para evitar memory leaks

    const fetchInitialData = async () => {
      try {
        // Cargamos el menú y los datos de la empresa en paralelo para mayor rendimiento
        const [modulosRes, empresaRes] = await Promise.all([
          api.get('seguridad/modulos/', { signal: controller.signal }),
          api.get('/seguridad/empresa/', { signal: controller.signal }),
        ]);

        // --- Procesar datos del menú ---
        const modulosDb = modulosRes.data.data || [];
        const hasDashboard = modulosDb.find(m => m.ruta === '/dashboard' || m.codigo === 'DASHBOARD');
        
        let finalMenu = [];
        if (!hasDashboard) {
          finalMenu.push({
            id_modulo: 'dash',
            nombre: 'Dashboard',
            icono: 'dashboard',
            ruta: '/dashboard',
            submodulos: []
          });
        }
        finalMenu = [...finalMenu, ...modulosDb];
        setMenuItems(finalMenu);

        // Iniciar con módulos padre cerrados (comprimidos) por defecto
        const initialOpen = {};
        finalMenu.forEach(m => {
          if (m.submodulos && m.submodulos.length > 0) {
            initialOpen[m.id_modulo] = false;
          }
        });
        setOpenModules(initialOpen);

        // --- Procesar datos de la empresa ---
        const empresaInfo = empresaRes.data.data;
        if (empresaInfo) {
          setEmpresaData({
            razon_social: empresaInfo.razon_social || 'Sistema',
            logo: getMediaUrl(empresaInfo.logo),
          });
        }

      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error("Error cargando datos iniciales del layout:", error);
        }
      } finally {
        setLoadingMenu(false);
      }
    };

    fetchInitialData();

    // Cancelar peticiones si el componente se desmonta (evita memory leaks)
    return () => controller.abort();
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = useCallback((idle = false) => {
    authStorage.clear();
    navigate('/login', idle ? { state: { idleTimeout: true } } : undefined);
  }, [navigate]);

  useIdleLogout(IDLE_TIMEOUT_MS, () => handleLogout(true));

  // useCallback para estabilizar la referencia de la función
  const toggleModule = useCallback((moduleId) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  const user = authStorage.getUser();

  const getCurrentTitle = () => {
    for (const item of menuItems) {
      if (item.ruta && item.ruta === location.pathname) return item.nombre;
      if (item.submodulos && item.submodulos.length > 0) {
        const child = item.submodulos.find(c => c.ruta === location.pathname);
        if (child) return `${item.nombre} / ${child.nombre}`;
      }
    }
    return 'Dashboard';
  };

  const getActiveState = () => {
    let globalActiveChildId = null;
    let globalActiveParentId = null;
    let maxMatchLength = -1;

    menuItems.forEach(item => {
      if (item.submodulos && item.submodulos.length > 0) {
        item.submodulos.forEach(child => {
          if (child.ruta && location.pathname.startsWith(child.ruta)) {
            if (location.pathname === child.ruta || location.pathname.charAt(child.ruta.length) === '/') {
              if (child.ruta.length > maxMatchLength) {
                maxMatchLength = child.ruta.length;
                globalActiveChildId = child.id_modulo;
                globalActiveParentId = null;
              }
            }
          }
        });
      } else {
        if (item.ruta && location.pathname.startsWith(item.ruta)) {
          if (location.pathname === item.ruta || location.pathname.charAt(item.ruta.length) === '/') {
            if (item.ruta.length > maxMatchLength) {
              maxMatchLength = item.ruta.length;
              globalActiveParentId = item.id_modulo;
              globalActiveChildId = null;
            }
          }
        }
      }
    });

    return { globalActiveChildId, globalActiveParentId };
  };

  const { globalActiveChildId, globalActiveParentId } = getActiveState();

  // Ancho efectivo del drawer según su estado
  const drawerWidth = open ? DRAWER_WIDTH : DRAWER_MINI_WIDTH;
  const activeSucursal = sucursales?.find(sucursal => sucursal.id.toString() === activeSucursalId?.toString());

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: C.bg,
        color: C.text,
      }}
    >
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: alpha(C.bgElevated, 0.88),
          color: C.text,
          backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.055)}, transparent)`,
          borderBottom: `1px solid ${C.border}`,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.24)',
          backdropFilter: 'blur(18px)',
          // Transición suave sincronizada con el drawer
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          ...(open && {
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', gap: 1 }}>
          {/* Botón para expandir el sidebar - siempre visible en barra superior */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{
              mr: 1,
              color: C.textMuted,
              bgcolor: alpha('#ffffff', 0.04),
              border: `1px solid ${C.border}`,
              ...(open && { display: 'none' }),
              '&:hover': { color: C.text, bgcolor: alpha(C.brand, 0.12) },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: 800, color: C.text, lineHeight: 1.1 }}
            >
              {getCurrentTitle()}
            </Typography>
          </Box>

          {/* Selector de Sucursal */}
          {!loadingContext && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                bgcolor: alpha('#ffffff', 0.045),
                border: `1px solid ${C.border}`,
                px: 1.5,
                py: 0.5,
                borderRadius: '999px',
                boxShadow: `inset 0 1px 0 ${alpha('#ffffff', 0.06)}`,
              }}
            >
              <MapPin size={18} color={C.brandLight} style={{ marginRight: '8px' }} />
              <FormControl variant="standard" sx={{ minWidth: 120 }}>
                <Select
                  value={activeSucursalId || ''}
                  onChange={(e) => changeSucursal(e.target.value)}
                  disableUnderline
                  displayEmpty
                  sx={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: C.text,
                    '& .MuiSelect-select': { py: 0.5 },
                    '& .MuiSelect-icon': { color: C.textMuted },
                  }}
                >
                  {sucursales && sucursales.length > 0 ? (
                    sucursales.map(sucursal => (
                      <MenuItem key={sucursal.id} value={sucursal.id.toString()}>
                        {sucursal.nombre}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      Sin sucursales
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Campanitas de alertas: cuentas vencidas */}
          {tienePermiso('CUENTAS.POR_COBRAR.VER') && (
            <OverdueAccountsBell
              label="Cuotas por Cobrar vencidas"
              color="error"
              fetchVencidas={fetchCuotasCobrarVencidas}
              refreshKey={activeSucursalId}
              refreshEvent={EVENTO_COBRAR_VENCIDAS_CAMBIO}
            />
          )}
          {tienePermiso('CUENTAS.POR_PAGAR.VER') && (
            <OverdueAccountsBell
              label="Cuentas por Pagar vencidas"
              color="warning"
              fetchVencidas={fetchCuentasPagarVencidas}
              refreshEvent={EVENTO_PAGAR_VENCIDAS_CAMBIO}
            />
          )}

          {/* User Profile Menu */}
          <div>
            <IconButton
              size="large"
              aria-label="cuenta actual del usuario"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{
                ml: 0.5,
                p: 0.6,
                border: `1px solid ${C.border}`,
                bgcolor: alpha('#ffffff', 0.045),
                '&:hover': { bgcolor: alpha(C.brand, 0.12) },
              }}
            >
              <Avatar 
                src={getMediaUrl(user?.avatar_url)}
                sx={{
                  bgcolor: C.brand,
                  width: 36,
                  height: 36,
                  border: `2px solid ${alpha('#ffffff', 0.18)}`,
                  boxShadow: `0 0 0 3px ${alpha(C.brand, 0.16)}`,
                }}
              >
                {!user?.avatar_url && (user?.nombre?.charAt(0) || 'A')}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    bgcolor: C.surface,
                    border: `1px solid ${C.border}`,
                    boxShadow: S.floating,
                    mt: 1.5,
                    borderRadius: '8px',
                    minWidth: '200px'
                  }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="600">{user?.nombre} {user?.apellidos}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider sx={{ borderColor: C.border }} />
              <MenuItem onClick={() => { handleClose(); navigate('/seguridad/perfil'); }} sx={{ py: 1.5 }}>
                <ListItemIcon><Settings size={20} color={C.textMuted} /></ListItemIcon>
                Configuración
              </MenuItem>
              <MenuItem onClick={() => handleLogout()} sx={{ py: 1.5, color: C.brandLight }}>
                <ListItemIcon><LogOut size={20} color={C.brandLight} /></ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      {/* Sidebar / Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            // El ancho ahora nunca es 0: comprimido usa 80px para seguir mostrando iconos
            width: drawerWidth,
            height: '100vh',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: open
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
            overflow: 'hidden',
            // Mantiene la navegacion visible cuando una pagina larga desplaza el documento.
            position: 'fixed',
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${C.border}`,
            bgcolor: C.bg,
            color: C.text,
            backgroundImage: `
              linear-gradient(180deg, ${alpha(C.brand, 0.12)} 0%, transparent 28%),
              linear-gradient(145deg, ${C.bgElevated} 0%, ${C.bg} 72%)
            `,
            boxShadow: '18px 0 55px rgba(0, 0, 0, 0.36)',
          },
        }}
      >
        {/* Encabezado del Sidebar: Logo + Nombre de empresa dinámicos */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            padding: open ? '0 16px' : '0',
            ...theme.mixins.toolbar,
            borderBottom: `1px solid ${C.border}`,
            transition: theme.transitions.create(['padding', 'justify-content'], {
              duration: theme.transitions.duration.standard,
            }),
          }}
        >
          {/* Logo + nombre de empresa (solo visibles cuando está expandido) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              overflow: 'hidden',
              opacity: open ? 1 : 0,
              width: open ? 'auto' : 0,
              transition: theme.transitions.create(['opacity', 'width'], {
                duration: theme.transitions.duration.standard,
              }),
            }}
          >
            {/* Logo de empresa o ícono fallback */}
            {empresaData?.logo ? (
              <Box
                component="img"
                src={empresaData.logo}
                alt="Logo empresa"
                sx={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                  borderRadius: '8px',
                  flexShrink: 0,
                  // Pequeño borde/sombra para que el logo destaque sobre el fondo oscuro
                  backgroundColor: alpha('#ffffff', 0.06),
                  border: `1px solid ${C.border}`,
                  filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
                }}
              />
            ) : (
              <Box sx={{ color: C.brandLight, flexShrink: 0 }}>
                <CarFront size={28} />
              </Box>
            )}
            <Typography 
              variant="subtitle1" 
              fontWeight="700" 
              sx={{ 
                color: C.text, 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                maxWidth: '150px' // Evita que choque con el botón de cerrar
              }}
            >
              {empresaData?.razon_social || 'TallerApp'}
            </Typography>
          </Box>

          {/* Botón cerrar (solo visible cuando está expandido) */}
          {open && (
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                color: C.textMuted,
                flexShrink: 0,
                bgcolor: alpha('#ffffff', 0.04),
                border: `1px solid ${C.border}`,
                '&:hover': { color: C.text, bgcolor: alpha(C.brand, 0.12) },
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {/* Mini logo centrado cuando está comprimido */}
          {!open && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {empresaData?.logo ? (
                <Box
                  component="img"
                  src={empresaData.logo}
                  alt="Logo empresa"
                  sx={{
                    width: 38,
                    height: 38,
                    objectFit: 'contain',
                    borderRadius: '8px',
                    backgroundColor: alpha('#ffffff', 0.06),
                    border: `1px solid ${C.border}`,
                    filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
                  }}
                />
              ) : (
                <Box sx={{ color: C.brandLight }}>
                  <CarFront size={28} />
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: C.border, position: 'relative', zIndex: 2 }} />
        
        <List
          sx={{
            flex: '1 1 auto',
            height: 0,
            minHeight: 0,
            maxHeight: 'calc(100vh - 65px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            px: open ? 1.5 : 1,
            pt: 2.5,
            pb: open ? 23 : 2.5,
            position: 'relative',
            zIndex: 2,
            transition: 'padding 300ms ease',
          }}
        >
          {loadingMenu ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: C.brandLight }} />
            </Box>
          ) : menuItems.map((item) => {
            const hasChildren = item.submodulos && item.submodulos.length > 0;
            
            if (hasChildren) {
              const isOpen = openModules[item.id_modulo];
              const hasActiveChild = item.submodulos.some(child => child.id_modulo === globalActiveChildId);
              return (
                <Box key={item.id_modulo} sx={{ mb: 0.5 }}>
                  {/* En modo comprimido, envolverlo en Tooltip para accesibilidad */}
                  <Tooltip
                    title={!open ? item.nombre : ''}
                    placement="right"
                    arrow
                  >
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (!open) {
                            setOpen(true);
                          }
                          toggleModule(item.id_modulo);
                        }}
                        sx={{
                          minHeight: 48,
                          justifyContent: open ? 'initial' : 'center',
                          px: open ? 2.5 : 1.5,
                          borderRadius: '8px',
                          border: `1px solid ${hasActiveChild ? alpha(C.brandLight, 0.24) : 'transparent'}`,
                          bgcolor: hasActiveChild ? alpha(C.brand, 0.14) : 'transparent',
                          color: hasActiveChild ? C.text : alpha(C.text, 0.82),
                          transition: 'all 200ms ease',
                          '&:hover': {
                            bgcolor: hasActiveChild ? alpha(C.brand, 0.18) : alpha('#ffffff', 0.055),
                            color: C.text,
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 0,
                            mr: open ? 2 : 'auto',
                            justifyContent: 'center',
                            color: 'inherit',
                          }}
                        >
                          {/* Iconos más grandes (24px) cuando está comprimido para mayor presencia visual */}
                          <DynamicIcon name={item.icono} size={open ? 22 : 24} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.nombre}
                          sx={{
                            opacity: open ? 1 : 0,
                            width: open ? 'auto' : 0,
                            overflow: 'hidden',
                            transition: 'opacity 200ms ease',
                            '& .MuiTypography-root': { fontWeight: 600 },
                          }}
                        />
                        {open && (isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                  
                  <Collapse in={isOpen && open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ mt: 0.5 }}>
                      {item.submodulos.map((child) => {
                          const isSelected = child.id_modulo === globalActiveChildId;
                          return (
                            <ListItemButton
                              key={child.id_modulo}
                              onClick={() => navigate(child.ruta)}
                              sx={{
                                minHeight: 42,
                                pl: 6.5,
                                pr: 2.5,
                                borderRadius: '8px',
                                border: `1px solid ${isSelected ? alpha(C.brandLight, 0.22) : 'transparent'}`,
                                bgcolor: isSelected ? alpha(C.brand, 0.18) : 'transparent',
                                color: isSelected ? C.brandLight : alpha(C.text, 0.6),
                                transition: 'all 200ms ease',
                                '&:hover': {
                                  bgcolor: isSelected ? alpha(C.brand, 0.22) : alpha('#ffffff', 0.045),
                                  color: C.text,
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                                <DynamicIcon name={child.icono || 'circle'} size={18} />
                              </ListItemIcon>
                              <ListItemText
                                primary={child.nombre}
                                sx={{ '& .MuiTypography-root': { fontSize: '0.875rem', fontWeight: isSelected ? 500 : 400 } }}
                              />
                            </ListItemButton>
                          );
                        })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            const isSelected = item.id_modulo === globalActiveParentId;
            return (
              <Tooltip
                key={item.id_modulo}
                title={!open ? item.nombre : ''}
                placement="right"
                arrow
              >
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.ruta)}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2.5 : 1.5,
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? alpha(C.brandLight, 0.24) : 'transparent'}`,
                      bgcolor: isSelected ? alpha(C.brand, 0.18) : 'transparent',
                      color: isSelected ? C.brandLight : alpha(C.text, 0.72),
                      transition: 'all 200ms ease',
                      '&:hover': {
                        bgcolor: isSelected ? alpha(C.brand, 0.22) : alpha('#ffffff', 0.055),
                        color: C.text,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {/* Iconos más grandes (24px) cuando está comprimido para mayor presencia visual */}
                      <DynamicIcon name={item.icono} size={open ? 22 : 24} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.nombre}
                      sx={{
                        opacity: open ? 1 : 0,
                        width: open ? 'auto' : 0,
                        overflow: 'hidden',
                        transition: 'opacity 200ms ease',
                        '& .MuiTypography-root': { fontWeight: isSelected ? 600 : 400 },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>

        <Box
          sx={{
            display: open ? 'block' : 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 230,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1,
            borderTop: 'none',
            backgroundImage: `
              linear-gradient(180deg, ${C.bg} 0%, ${alpha(C.bg, 0.62)} 18%, ${alpha(C.bg, 0.08)} 58%, ${alpha(C.bg, 0.86)} 100%),
              linear-gradient(90deg, ${alpha(C.bg, 0.86)} 0%, transparent 42%, ${alpha(C.bg, 0.12)} 100%),
              url('/sidebar-car-premium.png')
            `,
            backgroundSize: '118% auto',
            backgroundPosition: 'center bottom',
            boxShadow: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '44px 0 auto',
              height: 76,
              background: `
                linear-gradient(110deg, transparent 8%, ${alpha(C.brandLight, 0.16)} 44%, transparent 66%),
                linear-gradient(110deg, transparent 18%, ${alpha(C.brand, 0.28)} 48%, transparent 62%)
              `,
              filter: 'blur(2px)',
              transform: 'skewY(-8deg)',
              opacity: 0.78,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 72% 66%, ${alpha(C.brandLight, 0.22)} 0, transparent 34%),
                linear-gradient(180deg, ${alpha(C.bg, 0.42)} 0%, transparent 24%, ${alpha(C.bg, 0.58)} 100%)
              `,
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: 14,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 1,
              borderRadius: '8px',
              border: `1px solid ${alpha(C.brandLight, 0.22)}`,
              bgcolor: alpha(C.bgElevated, 0.72),
              backdropFilter: 'blur(10px)',
              boxShadow: `0 12px 28px ${alpha('#000000', 0.34)}, inset 0 1px 0 ${alpha('#ffffff', 0.06)}`,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(C.brand, 0.92),
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <MapPin size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: C.text,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeSucursal?.nombre || 'Sucursal Principal'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: C.textMuted,
                  fontSize: '0.68rem',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Taller 360 | San Martin
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 4,
          py: 3,
          bgcolor: C.bg,
          color: C.text,
          backgroundImage: `
            radial-gradient(circle at 16% 12%, ${alpha(C.brand, 0.1)} 0, transparent 30%),
            radial-gradient(circle at 86% 6%, ${alpha(C.blue, 0.09)} 0, transparent 26%),
            linear-gradient(180deg, ${C.bgElevated} 0%, ${C.bg} 46%)
          `,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          // El ancho del main se ajusta al drawer correctamente (nunca a 0px)
          width: `calc(100% - ${drawerWidth}px)`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: open
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer */}
        <Outlet />
      </Box>
    </Box>
  );
}
