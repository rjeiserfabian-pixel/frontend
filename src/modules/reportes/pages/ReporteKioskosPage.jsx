/**
 * ReporteKioskosPage.jsx
 * Ventas generadas por cada terminal de kiosko, agrupadas por kiosko/sucursal.
 */
import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Search } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteKioskos, exportarKioskos, getFiltrosAuxiliares } from '../services/reportes.service';

function useReporteKioskos() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fecha_inicio: firstDay, fecha_fin: today, sucursal_id: '',
  });
  const [auxiliares, setAuxiliares] = useState({ sucursales: [] });
  const [result, setResult] = useState({ data: [], resumen: { total_tickets: 0, total_vendido: 0 } });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setAuxiliares({ sucursales: r.data.sucursales || [] }))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async () => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteKioskos(filtros);
      setResult(res.data);
    } catch (err) {
      console.error('Error reporte kioskos:', err);
      setResult({ data: [], resumen: { total_tickets: 0, total_vendido: 0 } });
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte de kioskos.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarKioskos(filtros, formato), [filtros]);

  return { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar };
}

export default function ReporteKioskosPage() {
  const { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar } = useReporteKioskos();

  return (
    <ReporteLayout
      titulo="Reporte de Kioskos"
      subtitulo="Ventas generadas por cada terminal de autoservicio"
      icono={LayoutDashboard}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Kioskos" />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Fecha Inicio</label>
            <input id="kioskos-fecha-inicio" type="date" className="filtro-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Fin</label>
            <input id="kioskos-fecha-fin" type="date" className="filtro-input"
              value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Sucursal</label>
            <select id="kioskos-sucursal" className="filtro-input"
              value={filtros.sucursal_id}
              onChange={e => setFiltros(f => ({ ...f, sucursal_id: e.target.value }))}>
              <option value="">Todas</option>
              {auxiliares.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="kioskos-btn-buscar" className="btn-buscar" onClick={buscar} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Buscar
            </button>
          </div>
        </div>
      }
    >
      {buscado && result.resumen && (
        <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div className="total-card">
            <span className="total-card-label">Kioskos con ventas</span>
            <span className="total-card-value">{result.data.length}</span>
          </div>
          <div className="total-card">
            <span className="total-card-label">Tickets cobrados</span>
            <span className="total-card-value">{result.resumen.total_tickets}</span>
          </div>
          <div className="total-card">
            <span className="total-card-label" style={{ color: '#1e40af' }}>Total Vendido</span>
            <span className="total-card-value" style={{ color: '#1e40af' }}>S/ {Number(result.resumen.total_vendido || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state" style={{ color: '#b91c1c' }}><p>{error}</p></div>
      )}
      {!buscado ? (
        <div className="empty-state">
          <LayoutDashboard size={40} color="#cbd5e1" />
          <p>Aplica los filtros y presiona Buscar para ver el reporte.</p>
        </div>
      ) : error ? null : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No hay ventas de kioskos para los filtros seleccionados.</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="reporte-table">
            <thead>
              <tr>
                <th>Kiosko</th>
                <th>Sucursal</th>
                <th>Tickets Cobrados</th>
                <th>Total Vendido</th>
                <th>Ticket Promedio</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map(k => (
                <tr key={k.kiosko_id}>
                  <td style={{ fontWeight: 600 }}>{k.kiosko_nombre}</td>
                  <td>{k.sucursal}</td>
                  <td><span className="badge badge-blue">{k.total_tickets}</span></td>
                  <td style={{ fontWeight: 700, color: '#1e40af' }}>S/ {Number(k.total_vendido).toFixed(2)}</td>
                  <td>S/ {Number(k.ticket_promedio).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReporteLayout>
  );
}
