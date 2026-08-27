import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, CircularProgress, Avatar 
} from '@mui/material';
import { Save, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';

export const PerfilPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    documento: '',
    password: '',
    confirmPassword: '',
    avatar: null
  });

  const [usuario, setUsuario] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/seguridad/mi-perfil/');
        const data = res.data.data;
        setUsuario(data);
        setFormData({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          telefono: data.telefono || '',
          documento: data.documento || '',
          password: '',
          confirmPassword: '',
          avatar: null
        });
        
        if (data.avatar_url) {
          setPreviewUrl(data.avatar_url.startsWith('http') ? data.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${data.avatar_url}`);
        }
      } catch (error) {
        console.error("Error al cargar perfil", error);
        Swal.fire('Error', 'No se pudo cargar la información del perfil.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, avatar: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden.', 'warning');
      return;
    }
    if (formData.password && formData.password.length < 8) {
      Swal.fire('Error', 'La contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('nombres', formData.nombres);
      payload.append('apellidos', formData.apellidos);
      payload.append('email', formData.email);
      payload.append('telefono', formData.telefono || '');
      payload.append('documento', formData.documento || '');
      
      if (formData.password) {
        payload.append('password', formData.password);
      }
      
      if (formData.avatar) {
        payload.append('avatar', formData.avatar);
      }

      const res = await api.put('/seguridad/mi-perfil/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const resData = res.data.data;
      
      // Update local storage user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.nombre = resData.nombres;
      userData.apellidos = resData.apellidos;
      userData.email = resData.email;
      if (resData.avatar_url) {
        userData.avatar_url = resData.avatar_url;
      }
      localStorage.setItem('user', JSON.stringify(userData));

      Swal.fire('Éxito', 'Perfil actualizado correctamente.', 'success');
      
      // Clear passwords after save
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Reload page to reflect changes in header
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.mensaje || 'Hubo un problema al actualizar el perfil.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-12"><CircularProgress /></div>;
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            Mi Perfil
          </h1>
          <p className="text-slate-500 mt-1">Gestione su información personal y credenciales de acceso.</p>
        </div>
        <div>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            disabled={saving}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6 pb-6">
        
        {/* RESUMEN DEL PERFIL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-6">
          <div className="relative group cursor-pointer inline-block">
            <Avatar 
              src={previewUrl} 
              sx={{ width: 80, height: 80, bgcolor: '#2563eb', fontSize: '2rem' }}
            >
              {!previewUrl && (formData.nombres?.charAt(0) || 'U')}
            </Avatar>
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
              <span className="text-xs font-semibold text-center leading-tight">Cambiar<br/>Foto</span>
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{usuario?.username}</h2>
            <p className="text-slate-500">Rol: Usuario</p>
          </div>
        </div>

        {/* DATOS PERSONALES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-base font-bold text-blue-600 mb-1">Datos Personales</p>
          <hr className="border-slate-200 mb-6" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <TextField 
                label="Nombres" 
                name="nombres"
                fullWidth 
                value={formData.nombres} 
                onChange={handleChange} 
                required 
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField 
                label="Apellidos" 
                name="apellidos"
                fullWidth 
                value={formData.apellidos} 
                onChange={handleChange} 
                required 
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField 
                label="Correo Electrónico" 
                name="email"
                type="email"
                fullWidth 
                value={formData.email} 
                onChange={handleChange} 
                required 
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField 
                label="Teléfono" 
                name="telefono"
                fullWidth 
                value={formData.telefono} 
                onChange={handleChange} 
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField 
                label="Documento (DNI/CE)" 
                name="documento"
                fullWidth 
                value={formData.documento} 
                onChange={handleChange} 
                variant="outlined"
              />
            </div>
          </div>
        </div>

        {/* CAMBIAR CONTRASEÑA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-base font-bold text-blue-600 mb-1">Cambiar Contraseña</p>
          <p className="text-sm text-slate-500 mb-4">
            Déjalo en blanco si no deseas cambiar la contraseña actual.
          </p>
          <hr className="border-slate-200 mb-6" />
          <div className="grid grid-cols-12 gap-4">
            {/* Campo: Nueva Contraseña */}
            <div className="col-span-12 md:col-span-6">
              <div style={{ position: 'relative' }}>
                <TextField 
                  label="Nueva Contraseña" 
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth 
                  value={formData.password} 
                  onChange={handleChange} 
                  variant="outlined"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b',
                    zIndex: 1,
                  }}
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Campo: Confirmar Nueva Contraseña */}
            <div className="col-span-12 md:col-span-6">
              <div style={{ position: 'relative' }}>
                <TextField 
                  label="Confirmar Nueva Contraseña" 
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  variant="outlined"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b',
                    zIndex: 1,
                  }}
                  aria-label="toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PerfilPage;
