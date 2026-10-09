/**
 * ReporteGestionPage.jsx
 * Reportes de gestión para el dueño del taller. Una sola pantalla genérica:
 * el backend devuelve { titulo, columnas, filas, resumen } para cada tipo.
 */
import { useCallback, useState } from 'react';
import { BarChart3, Search } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import FiltroBusqueda from '../../../shared/components/FiltroBusqueda';
import { usePermisos } from '../../../shared/contexts/PermisosContext';
import { getReporteGestion, exportarGestion } from '../services/reportes.service';

const REPORTES = [
  { id: 'ticket_promedio', nombre: 'Ticket promedio por sucursal', filtro: 'fechas' },
  { id: 'servicios_mas_vendidos', nombre: 'Servicios más vendidos', filtro: 'fechas' },
  { id: 'productividad_mecanicos', nombre: 'Productividad por mecánico', filtro: 'fechas' },
  { id: 'ordenes_perdidas', nombre: 'Órdenes perdidas por motivo', filtro: 'fechas' },
  { id: 'clientes_inactivos', nombre: 'Clientes inactivos', filtro: 'dias', dias: 180, ayuda: 'Clientes sin comprar hace más de' },
  { id: 'sin_movimiento', nombre: 'Repuestos sin movimiento', filtro: 'dias', dias: 90, ayuda: 'Repuestos sin salidas en los últimos' },
];

const nf = (v, d = 2) => Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

const formatear = (valor, formato) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  switch (formato) {
    case 'entero': return nf(valor, 0);
    case 'decimal': return nf(valor, 2);
    case 'dinero': return `S/ ${nf(valor)}`;
    case 'porcentaje': return `${nf(valor)}%`;
    case 'fecha': return String(valor).split('-').reverse().join('/');
    default: return String(valor);
  }
};

const alinear = (formato) => (['entero', 'decimal', 'dinero', 'porcentaje'].includes(formato) ? 'right' : 'left');

function useReporteGestion() {
  const hoy = new Date().toISOString().split('T')[0];
  const primerDia = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [tipo, setTipo] = useState('ticket_promedio');
  const [filtros, setFiltros] = useState({ fecha_inicio: primerDia, fecha_fin: hoy, dias: 90 });
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const definicion = REPORTES.find((r) => r.id === tipo);

  const parametros = useCallback(() => (
    definicion.filtro === 'dias'
      ? { tipo, dias: filtros.dias }
      : { tipo, fecha_inicio: filtros.fecha_inicio, fecha_fin: filtros.fecha_fin }
  ), [tipo, filtros, definicion]);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReporteGestion(parametros());
      setReporte(res.data);
    } catch (err) {
      setReporte(null);
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [parametros]);

  const exportar = useCallback((formato) => exportarGestion(parametros(), formato), [parametros]);

  const cambiarTipo = (nuevo) => {
    if (!nuevo) return;
    setTipo(nuevo);
    setReporte(null);
    setError(null);
    const def = REPORTES.find((r) => r.id === nuevo);
    if (def.dias) setFiltros((f) => ({ ...f, dias: def.dias }));
  };

  return { tipo, cambiarTipo, filtros, setFiltros, definicion, reporte, loading, error, buscar, exportar };
}

export default function ReporteGestionPage() {
  const { tienePermiso } = usePermisos();
  const puedeExportar = tienePermiso('REPORTES.GESTION.EXPORTAR');
  const r = useReporteGestion();
  const filas = r.reporte?.filas || [];

  return (
    <ReporteLayout
      titulo="Reportes de Gestión"
      subtitulo="Ticket promedio, servicios, productividad, órdenes perdidas, clientes inactivos e inventario inmovilizado"
      icono={BarChart3}
      loading={r.loading}
      exportar={filas.length > 0 && puedeExportar && (
        <ExportButtons onExport={r.exportar} filename={`Gestion_${r.tipo}`} />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group" style={{ minWidth: 300 }}>
            <label className="filtro-label">Reporte</label>
            <FiltroBusqueda
              label="" options={REPORTES} value={r.tipo} clearable={false}
              onChange={(e) => r.cambiarTipo(e.target.value)}
            />
          </div>
          {r.definicion.filtro === 'fechas' ? (
            <>
              <div className="filtro-group">
                <label className="filtro-label">Fecha Inicio</label>
                <input id="ges-fecha-inicio" type="date" className="filtro-input" value={r.filtros.fecha_inicio}
                  onChange={(e) => r.setFiltros((f) => ({ ...f, fecha_inicio: e.target.value }))} />
              </div>
              <div className="filtro-group">
                <label className="filtro-label">Fecha Fin</label>
                <input id="ges-fecha-fin" type="date" className="filtro-input" value={r.filtros.fecha_fin}
                  onChange={(e) => r.setFiltros((f) => ({ ...f, fecha_fin: e.target.value }))} />
              </div>
            </>
          ) : (
            <div className="filtro-group">
              <label className="filtro-label">{r.definicion.ayuda} (días)</label>
              <input id="ges-dias" type="number" min="1" max="3650" className="filtro-input" value={r.filtros.dias}
                onChange={(e) => r.setFiltros((f) => ({ ...f, dias: e.target.value }))} />
            </div>
          )}
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="ges-btn-buscar" className="btn-buscar" onClick={r.buscar} disabled={r.loading}>
              <Search size={14} style={{ marginRight: 4 }} />Generar
            </button>
          </div>
        </div>
      }
    >
      {r.error && <div className="empty-state" style={{ color: '#fda4af' }}>{r.error}</div>}

      {!r.error && !r.reporte && (
        <div className="empty-state">
          <BarChart3 size={40} color="#475569" />
          <p>Elija un reporte y pulse &quot;Generar&quot;.</p>
        </div>
      )}

      {r.reporte && (
        <>
          <div style={{ padding: '16px 20px 4px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc' }}>{r.reporte.titulo}</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 20px' }}>
            {r.reporte.resumen.map((item) => (
              <div key={item.label} className="total-card">
                <span className="total-card-label">{item.label}</span>
                <span className="total-card-value">{formatear(item.valor, item.formato)}</span>
              </div>
            ))}
          </div>
          {filas.length === 0 ? (
            <div className="empty-state"><p>No hay datos para este reporte con los filtros elegidos.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="reporte-table">
                <thead>
                  <tr>
                    {r.reporte.columnas.map((c) => (
                      <th key={c.key} style={{ textAlign: alinear(c.formato) }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, i) => (
                    <tr key={i}>
                      {r.reporte.columnas.map((c) => (
                        <td key={c.key} style={{ textAlign: alinear(c.formato) }}>{formatear(fila[c.key], c.formato)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ReporteLayout>
  );
}
