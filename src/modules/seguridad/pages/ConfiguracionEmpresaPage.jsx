import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Divider, InputAdornment,
  IconButton, Chip, Switch, FormControlLabel
} from '@mui/material';
import { Save, Upload, Eye, EyeOff, ReceiptText, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../../core/api/axios';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { premiumTokens } from '../../../core/theme/theme';

const C = premiumTokens.colors;
const S = premiumTokens.shadow;
import { getMediaUrl } from '../../../core/utils/mediaUrl';

export const ConfiguracionEmpresaPage = () => {
  const { tienePermiso } = usePermisos();
  const puedeEditar = tienePermiso('EMPRESA.EDITAR');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Opciones desde la API
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [formData, setFormData] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    departamento: '',
    provincia: '',
    distrito: '',
    telefono: '',
    email: '',
    web: '',
    dias_validez_cotizacion: 15,
    logo: null,
    // Facturación electrónica (SUNAT / GRE)
    sunat_modo: 'BETA',
    sunat_usuario_secundario: '',
    sunat_clave_secundaria: '',
    sunat_gre_client_id: '',
    sunat_gre_client_secret: '',
  });

  // Los secretos nunca vienen del backend (son write_only); solo llega si
  // ya hay uno guardado, para mostrar "Configurado" sin exponer el valor.
  const [secretosConfigurados, setSecretosConfigurados] = useState({
    sunat_clave_secundaria: false,
    sunat_gre_client_secret: false,
  });
  const [mostrarClaveSecundaria, setMostrarClaveSecundaria] = useState(false);
  const [mostrarGreSecret, setMostrarGreSecret] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [empresaRes, deptosRes] = await Promise.all([
          api.get('/seguridad/empresa/'),
          api.get('/seguridad/departamentos/')
        ]);
        
        const data = empresaRes.data.data;
        const deptos = deptosRes.data;
        
        setDepartamentos(deptos);
        
        setFormData({
          razon_social: data.razon_social || '',
          ruc: data.ruc || '',
          direccion: data.direccion || '',
          departamento: data.departamento || '',
          provincia: data.provincia || '',
          distrito: data.distrito || '',
          telefono: data.telefono || '',
          email: data.email || '',
          web: data.web || '',
          dias_validez_cotizacion: data.dias_validez_cotizacion ?? 15,
          logo: null,
          sunat_modo: data.sunat_modo || 'BETA',
          sunat_usuario_secundario: data.sunat_usuario_secundario || '',
          sunat_clave_secundaria: '',
          sunat_gre_client_id: data.sunat_gre_client_id || '',
          sunat_gre_client_secret: '',
        });

        setSecretosConfigurados({
          sunat_clave_secundaria: !!data.sunat_clave_secundaria_configurada,
          sunat_gre_client_secret: !!data.sunat_gre_client_secret_configurada,
        });

        if (data.logo) {
          setPreviewUrl(getMediaUrl(data.logo));
        }

        // Cargar provincias y distritos iniciales si existen guardados
        if (data.departamento) {
          const deptoObj = deptos.find(d => d.nombre === data.departamento);
          if (deptoObj) {
            const provsRes = await api.get(`/seguridad/provincias/?departamento=${deptoObj.id}`);
            setProvincias(provsRes.data);
            
            if (data.provincia) {
              const provObj = provsRes.data.find(p => p.nombre === data.provincia);
              if (provObj) {
                const distsRes = await api.get(`/seguridad/distritos/?provincia=${provObj.id}`);
                setDistritos(distsRes.data);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar datos", error);
        Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'departamento') {
      // Limpiar cascada
      setFormData(prev => ({ ...prev, departamento: value, provincia: '', distrito: '' }));
      setProvincias([]);
      setDistritos([]);
      
      const deptoObj = departamentos.find(d => d.nombre === value);
      if (deptoObj) {
        try {
          const res = await api.get(`/seguridad/provincias/?departamento=${deptoObj.id}`);
          setProvincias(res.data);
        } catch (error) {
          console.error(error);
        }
      }
    }

    if (name === 'provincia') {
      setFormData(prev => ({ ...prev, provincia: value, distrito: '' }));
      setDistritos([]);

      const provObj = provincias.find(p => p.nombre === value);
      if (provObj) {
        try {
          const res = await api.get(`/seguridad/distritos/?provincia=${provObj.id}`);
          setDistritos(res.data);
        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, logo: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('razon_social', formData.razon_social);
      payload.append('ruc', formData.ruc);
      payload.append('direccion', formData.direccion);
      payload.append('departamento', formData.departamento);
      payload.append('provincia', formData.provincia);
      payload.append('distrito', formData.distrito);
      payload.append('telefono', formData.telefono);
      payload.append('email', formData.email);
      payload.append('web', formData.web);
      payload.append('dias_validez_cotizacion', formData.dias_validez_cotizacion);
      if (formData.logo) {
        payload.append('logo', formData.logo);
      }

      payload.append('sunat_modo', formData.sunat_modo);
      payload.append('sunat_usuario_secundario', formData.sunat_usuario_secundario);
      payload.append('sunat_gre_client_id', formData.sunat_gre_client_id);
      // Los secretos solo se mandan si el usuario escribió uno nuevo; en
      // blanco significa "no lo toques" (el backend también lo protege).
      if (formData.sunat_clave_secundaria) {
        payload.append('sunat_clave_secundaria', formData.sunat_clave_secundaria);
      }
      if (formData.sunat_gre_client_secret) {
        payload.append('sunat_gre_client_secret', formData.sunat_gre_client_secret);
      }

      const res = await api.put('/seguridad/empresa/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = res.data.data;
      setSecretosConfigurados({
        sunat_clave_secundaria: !!data.sunat_clave_secundaria_configurada,
        sunat_gre_client_secret: !!data.sunat_gre_client_secret_configurada,
      });
      setFormData(prev => ({ ...prev, sunat_clave_secundaria: '', sunat_gre_client_secret: '' }));
      Swal.fire('Éxito', 'Configuración de la empresa actualizada.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-6 rounded-lg" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: C.text }}>
            Configuración de Empresa
          </h1>
          <p className="text-slate-500 mt-1">Gestione los datos generales y la ubicación de su negocio.</p>
        </div>
        <div>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
            disabled={saving || !puedeEditar}
            title={!puedeEditar ? 'No tienes permiso para editar los datos de la empresa' : undefined}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-6">
        
        {/* DATOS GENERALES */}
        <div className="rounded-lg p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <p className="text-base font-bold text-blue-600 mb-1">Datos Generales</p>
          <hr className="border-slate-200 mb-6" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8">
              <TextField
                label="Razón Social"
                name="razon_social"
                fullWidth
                value={formData.razon_social}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <TextField
                label="RUC"
                name="ruc"
                fullWidth
                value={formData.ruc}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </div>
          </div>
        </div>

        {/* UBICACIÓN Y CONTACTO */}
        <div className="rounded-lg p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <p className="text-base font-bold text-blue-600 mb-1">Ubicación y Contacto</p>
          <hr className="border-slate-200 mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
            >
              <MenuItem value=""><em>Seleccione...</em></MenuItem>
              {departamentos.map(dep => <MenuItem key={dep.id} value={dep.nombre}>{dep.nombre}</MenuItem>)}
            </TextField>

            <TextField
              select
              fullWidth
              variant="outlined"
              label="Provincia"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              disabled={!formData.departamento}
            >
              <MenuItem value=""><em>Seleccione...</em></MenuItem>
              {provincias.map(prov => <MenuItem key={prov.id} value={prov.nombre}>{prov.nombre}</MenuItem>)}
            </TextField>

            <TextField
              select
              fullWidth
              variant="outlined"
              label="Distrito"
              name="distrito"
              value={formData.distrito}
              onChange={handleChange}
              disabled={!formData.provincia}
            >
              <MenuItem value=""><em>Seleccione...</em></MenuItem>
              {distritos.map(dist => <MenuItem key={dist.id} value={dist.nombre}>{dist.nombre}</MenuItem>)}
            </TextField>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-8">
              <TextField
                label="Dirección Específica (Ej: Jirón Alegría 123)"
                name="direccion"
                fullWidth
                value={formData.direccion}
                onChange={handleChange}
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <TextField
                label="Teléfono"
                name="telefono"
                fullWidth
                value={formData.telefono}
                onChange={handleChange}
                variant="outlined"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="Email de la Empresa (Ej: contacto@omega.com)"
                name="email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="Sitio Web (Ej: https://www.omega.com)"
                name="web"
                fullWidth
                value={formData.web}
                onChange={handleChange}
                variant="outlined"
              />
            </div>
          </div>
        </div>

        {/* PARÁMETROS DEL SISTEMA */}
        <div className="rounded-lg p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <p className="text-base font-bold text-blue-600 mb-1">Parámetros del Sistema</p>
          <hr className="border-slate-200 mb-6" />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <TextField
                label="Días de Validez Cotización"
                name="dias_validez_cotizacion"
                type="number"
                fullWidth
                value={formData.dias_validez_cotizacion}
                onChange={handleChange}
                required
                variant="outlined"
                helperText="Días por defecto antes de que expire una proforma"
                inputProps={{ min: 1 }}
              />
            </div>
          </div>
        </div>

        {/* FACTURACIÓN ELECTRÓNICA (SUNAT / GRE) */}
        <div className="rounded-lg p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <p className="text-base font-bold text-blue-600 flex items-center gap-2">
              <ReceiptText size={18} />
              Facturación Electrónica (SUNAT)
            </p>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.sunat_modo === 'PRODUCCION'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    sunat_modo: e.target.checked ? 'PRODUCCION' : 'BETA'
                  }))}
                  color="success"
                />
              }
              label={
                <Chip
                  label={formData.sunat_modo === 'PRODUCCION' ? 'Producción' : 'Pruebas (Beta)'}
                  size="small"
                  color={formData.sunat_modo === 'PRODUCCION' ? 'success' : 'warning'}
                  sx={{ fontWeight: 600 }}
                />
              }
              sx={{ ml: 0 }}
            />
          </div>
          <hr className="border-slate-200 mb-2" />
          <p className="text-sm text-slate-500 mb-6">
            Credenciales usadas para emitir Guías de Remisión Electrónica ante SUNAT.
            En "Pruebas (Beta)" se usa el ambiente de homologación de SUNAT; actívalo
            en "Producción" recién cuando tengas las credenciales reales.
          </p>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="Usuario Secundario SUNAT"
                name="sunat_usuario_secundario"
                fullWidth
                value={formData.sunat_usuario_secundario}
                onChange={handleChange}
                variant="outlined"
                placeholder="Ej: SISTEMA2"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="Clave del Usuario Secundario"
                name="sunat_clave_secundaria"
                type={mostrarClaveSecundaria ? 'text' : 'password'}
                fullWidth
                value={formData.sunat_clave_secundaria}
                onChange={handleChange}
                variant="outlined"
                placeholder={secretosConfigurados.sunat_clave_secundaria ? '•••••••• (dejar en blanco para no cambiar)' : 'Sin configurar'}
                helperText={secretosConfigurados.sunat_clave_secundaria ? (
                  <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={13} /> Configurada</span>
                ) : 'Aún no configurada'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setMostrarClaveSecundaria(v => !v)} edge="end" size="small">
                        {mostrarClaveSecundaria ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="GRE Client ID"
                name="sunat_gre_client_id"
                fullWidth
                value={formData.sunat_gre_client_id}
                onChange={handleChange}
                variant="outlined"
                placeholder="Ej: 4a9958d8-f4ed-46e6-9f61-06b492141a4d"
              />
            </div>
            <div className="col-span-12 md:col-span-6">
              <TextField
                label="GRE Client Secret"
                name="sunat_gre_client_secret"
                type={mostrarGreSecret ? 'text' : 'password'}
                fullWidth
                value={formData.sunat_gre_client_secret}
                onChange={handleChange}
                variant="outlined"
                placeholder={secretosConfigurados.sunat_gre_client_secret ? '•••••••• (dejar en blanco para no cambiar)' : 'Sin configurar'}
                helperText={secretosConfigurados.sunat_gre_client_secret ? (
                  <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={13} /> Configurado</span>
                ) : 'Aún no configurado'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setMostrarGreSecret(v => !v)} edge="end" size="small">
                        {mostrarGreSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
          </div>
        </div>

        {/* LOGO */}
        <div className="rounded-lg p-6" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: S.card }}>
          <p className="text-base font-bold text-blue-600 mb-1">Logo de la Empresa</p>
          <hr className="border-slate-200 mb-6" />
          <div className="flex items-center gap-6">
            <div className="w-40 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
              {previewUrl ? (
                <img src={previewUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-sm text-slate-400 font-medium">Sin Logo</span>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-3">
                Se recomienda usar una imagen cuadrada (ej: 500x500px) en formato PNG o JPG con fondo transparente.
              </p>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload size={20} />}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 'bold' }}
              >
                Subir Logo
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfiguracionEmpresaPage;
