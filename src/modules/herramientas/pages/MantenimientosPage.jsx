import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { premiumTokens } from '../../../core/theme/theme';
import PlanesTab from '../components/PlanesTab';
import RegistrosTab from '../components/RegistrosTab';

const C = premiumTokens.colors;

export default function MantenimientosPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 750, color: C.text, mb: 2 }}>
        Mantenimiento de Herramientas
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Planes y vencimientos" />
        <Tab label="Trabajos realizados" />
      </Tabs>
      {tab === 0 ? <PlanesTab /> : <RegistrosTab />}
    </Box>
  );
}
