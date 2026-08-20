import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, IconButton, Typography, Drawer, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Avatar, Menu, MenuItem, Box, Divider, useTheme, Collapse, CircularProgress
} from '@mui/material';
import { 
  Menu as MenuIcon, ChevronLeft, LogOut, CarFront, ChevronDown, ChevronRight, Settings
} from 'lucide-react';
import * as Icons from 'lucide-react';
import api from '../../core/api/axios';

const DRAWER_WIDTH = 280;

// Componente para renderizar iconos dinámicamente
const DynamicIcon = ({ name, size = 22 }) => {
  const iconMapping = {
    'dashboard': Icons.LayoutDashboard,
    'shield': Icons.ShieldAlert,
    'users': Icons.Users,
    'settings': Icons.Settings,
    'car': Icons.Car,
    'wrench': Icons.Wrench,
    'package': Icons.Package,
    'tags': Icons.Tags,
    'list': Icons.List,
    'tool': Icons.PenTool,
  };
  const IconComponent = iconMapping[name.toLowerCase()] || Icons.Circle;
  return <IconComponent size={size} />;
};

export default function DashboardLayout() {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [openModules, setOpenModules] = useState({});

  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const response = await api.get('seguridad/modulos/');
        const modulosDb = response.data.data || [];
        
        // Nos aseguramos que Dashboard siempre esté primero por si no está en la DB
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
        
        // Abrir módulos padre por defecto
        const initialOpen = {};
        finalMenu.forEach(m => {
          if (m.submodulos && m.submodulos.length > 0) {
            initialOpen[m.id_modulo] = true;
          }
        });
        setOpenModules(initialOpen);
        
      } catch (error) {
        console.error("Error cargando menú dinámico:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchModulos();
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleModule = (moduleId) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

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
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: DRAWER_WIDTH,
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
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
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}>
                {user?.nombre?.charAt(0) || 'A'}
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
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  borderRadius: '12px',
                  minWidth: '200px'
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="600">{user?.nombre} {user?.apellidos}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleClose} sx={{ py: 1.5 }}>
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
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
            }),
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: '#0f172a', // slate-900
            color: 'white'
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', ...theme.mixins.toolbar }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#60a5fa' }}>
            <CarFront size={28} />
            <Typography variant="h6" fontWeight="700" sx={{ color: 'white' }}>
              TallerApp
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <ChevronLeft />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <List sx={{ px: 2, py: 3 }}>
          {loadingMenu ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.5)' }} />
            </Box>
          ) : menuItems.map((item) => {
            const hasChildren = item.submodulos && item.submodulos.length > 0;
            
            if (hasChildren) {
              const isOpen = openModules[item.id_modulo];
              return (
                <Box key={item.id_modulo} sx={{ mb: 1 }}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => {
                        if (!open) setOpen(true);
                        toggleModule(item.id_modulo);
                      }}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: '10px',
                        color: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                        <DynamicIcon name={item.icono} />
                      </ListItemIcon>
                      <ListItemText primary={item.nombre} sx={{ opacity: open ? 1 : 0, '& .MuiTypography-root': { fontWeight: 600 } }} />
                      {open && (isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                    </ListItemButton>
                  </ListItem>
                  
                  <Collapse in={isOpen && open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ mt: 0.5 }}>
                      {item.submodulos.map((child) => {
                        const isSelected = location.pathname.startsWith(child.ruta);
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
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: 'inherit' }}>
                              <DynamicIcon name={child.icono || 'circle'} size={18} />
                            </ListItemIcon>
                            <ListItemText primary={child.nombre} sx={{ '& .MuiTypography-root': { fontSize: '0.875rem', fontWeight: isSelected ? 500 : 400 } }} />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            const isSelected = item.ruta && location.pathname.startsWith(item.ruta);
            return (
              <ListItem key={item.id_modulo} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.ruta)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: '10px',
                    bgcolor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                    <DynamicIcon name={item.icono} />
                  </ListItemIcon>
                  <ListItemText primary={item.nombre} sx={{ opacity: open ? 1 : 0, '& .MuiTypography-root': { fontWeight: isSelected ? 600 : 400 } }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f8fafc', minHeight: '100vh', width: `calc(100% - ${open ? DRAWER_WIDTH : 0}px)` }}>
        <Toolbar /> {/* Spacer */}
        <Outlet />
      </Box>
    </Box>
  );
}
