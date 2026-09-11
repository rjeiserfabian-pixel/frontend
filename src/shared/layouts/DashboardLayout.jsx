import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, IconButton, Typography, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Avatar, Menu, MenuItem, Box, Divider, useTheme, Collapse, CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, ChevronLeft, LogOut, CarFront, ChevronDown, ChevronRight, Settings, MapPin
} from 'lucide-react';
import * as Icons from 'lucide-react';
import api from '../../core/api/axios';
import { useSucursal } from '../contexts/SucursalContext';
import { Select, FormControl } from '@mui/material';

const DRAWER_WIDTH = 280;
const DRAWER_MINI_WIDTH = 80;

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

  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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
            logo: empresaInfo.logo
              ? (empresaInfo.logo.startsWith('http')
                  ? empresaInfo.logo
                  : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${empresaInfo.logo}`)
              : null,
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // useCallback para estabilizar la referencia de la función
  const toggleModule = useCallback((moduleId) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'slate.50' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
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
        <Toolbar>
          {/* Botón para expandir el sidebar - siempre visible en barra superior */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setOpen(true)}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'slate.800' }}>
            {getCurrentTitle()}
          </Typography>

          {/* Selector de Sucursal */}
          {!loadingContext && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, bgcolor: '#f1f5f9', px: 2, py: 0.5, borderRadius: '20px' }}>
              <MapPin size={18} color="#3b82f6" style={{ marginRight: '8px' }} />
              <FormControl variant="standard" sx={{ minWidth: 120 }}>
                <Select
                  value={activeSucursalId || ''}
                  onChange={(e) => changeSucursal(e.target.value)}
                  disableUnderline
                  displayEmpty
                  sx={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#1e293b',
                    '& .MuiSelect-select': { py: 0.5 }
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

          {/* User Profile Menu */}
          <div>
            <IconButton
              size="large"
              aria-label="cuenta actual del usuario"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar 
                src={user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${user.avatar_url}`) : undefined}
                sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}
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
                    filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: '12px',
                    minWidth: '200px'
                  }
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="600">{user?.nombre} {user?.apellidos}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleClose(); navigate('/seguridad/perfil'); }} sx={{ py: 1.5 }}>
                <ListItemIcon><Settings size={20} /></ListItemIcon>
                Configuración
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                <ListItemIcon><LogOut size={20} color={theme.palette.error.main} /></ListItemIcon>
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
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: open
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: '#0f172a', // slate-900
            color: 'white',
          },
        }}
      >
        {/* Encabezado del Sidebar: Logo + Nombre de empresa dinámicos */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            padding: open ? '0 16px' : '0',
            ...theme.mixins.toolbar,
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
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                }}
              />
            ) : (
              <Box sx={{ color: '#60a5fa', flexShrink: 0 }}>
                <CarFront size={28} />
              </Box>
            )}
            <Typography 
              variant="subtitle1" 
              fontWeight="700" 
              sx={{ 
                color: 'white', 
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
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
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
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                  }}
                />
              ) : (
                <Box sx={{ color: '#60a5fa' }}>
                  <CarFront size={28} />
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: open ? 2 : 1, py: 3, transition: 'padding 300ms ease' }}>
          {loadingMenu ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.5)' }} />
            </Box>
          ) : menuItems.map((item) => {
            const hasChildren = item.submodulos && item.submodulos.length > 0;
            
            if (hasChildren) {
              const isOpen = openModules[item.id_modulo];
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
                          borderRadius: '10px',
                          color: 'rgba(255,255,255,0.9)',
                          transition: 'all 200ms ease',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
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
                                borderRadius: '10px',
                                bgcolor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                                transition: 'all 200ms ease',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
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
                      borderRadius: '10px',
                      bgcolor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                      transition: 'all 200ms ease',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: 'white' },
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
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 4,
          py: 3,
          bgcolor: '#f8fafc',
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
