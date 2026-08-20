import { Typography, Grid, Card, CardContent, Box } from '@mui/material';
import { Users, ShieldAlert, Activity, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const stats = [
    { title: 'Usuarios Activos', value: '12', icon: <Users size={32} className="text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Roles Definidos', value: '4', icon: <ShieldAlert size={32} className="text-amber-500" />, bg: 'bg-amber-50' },
    { title: 'Operaciones Hoy', value: '45', icon: <Activity size={32} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { title: 'Eficiencia', value: '98%', icon: <TrendingUp size={32} className="text-indigo-500" />, bg: 'bg-indigo-50' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="slate.800">
          Bienvenido, {user?.nombre} 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Aquí tienes un resumen de la actividad del sistema.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={0} 
              sx={{ 
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'slate.800' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box className={`p-3 rounded-xl ${stat.bg}`}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Widget Placeholder */}
      <Box sx={{ mt: 4 }}>
        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', minHeight: 300 }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Activity size={48} className="text-slate-300 mb-4" />
            <Typography variant="h6" color="text.secondary">
              Gráficos de actividad próximamente
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
