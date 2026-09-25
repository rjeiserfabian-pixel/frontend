import { useState, useCallback, useEffect } from 'react';
import { getReporteAvanzado } from '../../reportes/services/reportes.service';

/**
 * Resumen gerencial del día (ingresos, egresos, neto, órdenes ingresadas y
 * tendencia de 7 días) para las tarjetas del Dashboard.
 * `activo` evita la petición para usuarios sin permiso de ver el reporte.
 */
export function useResumenDia(activo, sucursalId) {
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getReporteAvanzado({ tipo: 'resumen_dia', sucursal_id: sucursalId });
      setResumen(res.data);
    } catch (err) {
      console.error('Error al cargar el resumen del día:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    if (activo) {
      cargar();
    }
  }, [activo, cargar]);

  return { resumen, loading, error };
}
