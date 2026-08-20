import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api/axios';
import { ShieldAlert, CarFront } from 'lucide-react';
import { 
  TextField, Button, CircularProgress, Alert, 
  IconButton, InputAdornment 
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const res = await api.post('seguridad/login/', data);
      const { access, refresh, usuario } = res.data.data;
      
      // Guardar tokens y datos básicos
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(usuario));

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.errores?.non_field_errors) {
        setErrorMsg(error.response.data.errores.non_field_errors[0]);
      } else {
        setErrorMsg(error.response?.data?.mensaje || 'Error al conectar con el servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorativo Moderno (Glassmorphism) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center text-blue-600">
          <CarFront size={48} strokeWidth={1.5} />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Sistema Taller
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Ingrese sus credenciales para acceder
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-blue-900/5 sm:rounded-2xl sm:px-10 border border-white/50">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {errorMsg && (
              <Alert severity="error" icon={<ShieldAlert size={20} />} className="rounded-lg">
                {errorMsg}
              </Alert>
            )}

            <div>
              <TextField
                fullWidth
                label="Usuario"
                variant="outlined"
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isSubmitting}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </div>

            <div>
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isSubmitting}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isSubmitting}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              className="!h-12 !rounded-lg !text-base shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Ingresar al Sistema'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
