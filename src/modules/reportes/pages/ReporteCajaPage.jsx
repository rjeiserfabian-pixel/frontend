/**
 * ReporteCajaPage.jsx
 * Reporte de movimientos y cierres de caja.
 * Custom Hook separa lógica de UI (skill react-secure).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Landmark, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteCaja, exportarCaja, getFiltrosAuxiliares } from '../services/reportes.service';

// ── Custom Hook ──────────────────────────────────────────────────────────────
function useReporteCaja() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({ fecha_inicio: firstDay, fecha_fin: today, caja_id: '' });
  const [cajas, setCajas] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Carga selectores — solo 1 request
  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setCajas(r.data.cajas || []))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async () => {
    setLoading(true);
    setBuscado(true);
    try {
      const res = await getReporteCaja(filtros);
      setData(res.data.data || []);
    } catch (err) {
      console.error('Error reporte caja:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) =>
    exportarCaja(filtros, formato), [filtros]);

  return { filtros, setFiltros, cajas, data, loading, buscado, buscar, exportar };
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function ReporteCajaPage() {
  const { filtros, setFiltros, cajas, data, loading, buscado, buscar, exportar } = useReporteCaja();

  const estadoBadge = (estado) => {
    const map = { ABIERTA: 'badge-green', CERRADA: 'badge-gray' };
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado}</span>;
  };

  return (
    <ReporteLayout
      titulo="Reporte de Caja"
      subtitulo="Sesiones de apertura y cierre con detalle por método de pago"
      icono={Landmark}
      loading={loading}
      exportar={buscado && data.length > 0 && (
        <ExportButtons
          onExport={exportar}
          filename="Reporte_Caja"
        />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Fecha Inicio</label>
            <input id="caja-fecha-inicio" type="date" className="filtro-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Fin</label>
            <input id="caja-fecha-fin" type="date" className="filtro-input"
              value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Caja</label>
            <select id="caja-selector" className="filtro-input"
              value={filtros.caja_id}
              onChange={e => setFiltros(f => ({ ...f, caja_id: e.target.value }))}>
              <option value="">Todas las cajas</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — {c['sucursal__nombre']}</option>
              ))}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="caja-btn-buscar" className="btn-buscar" onClick={buscar} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Buscar
            </button>
          </div>
        </div>
      }
    >
      {!buscado ? (
        <div className="empty-state">
          <Landmark size={40} color="#cbd5e1" />
          <p>Selecciona el rango de fechas y presiona Buscar.</p>
        </div>
      ) : data.length === 0 && !loading ? (
        <div className="empty-state">
          <p>No se encontraron sesiones de caja para los filtros seleccionados.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="reporte-table">
            <thead>
              <tr>
                <th>Caja</th>
                <th>Sucursal</th>
                <th>Usuario</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Saldo Inicial</th>
                <th>Saldo Cierre</th>
                <th>Efectivo</th>
                <th>Tarjeta</th>
                <th>Yape</th>
                <th>Plin</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id_sesion}>
                  <td style={{ fontWeight: 600 }}>{row.caja}</td>
                  <td>{row.sucursal}</td>
                  <td>{row.usuario}</td>
                  <td>{row.fecha_apertura}</td>
                  <td>{row.fecha_cierre}</td>
                  <td>S/ {Number(row.saldo_inicial).toFixed(2)}</td>
                  <td>S/ {Number(row.saldo_cierre_real).toFixed(2)}</td>
                  <td style={{ color: '#16a34a', fontWeight: 600 }}>S/ {Number(row.efectivo).toFixed(2)}</td>
                  <td>S/ {Number(row.tarjeta).toFixed(2)}</td>
                  <td>S/ {Number(row.yape).toFixed(2)}</td>
                  <td>S/ {Number(row.plin).toFixed(2)}</td>
                  <td>{estadoBadge(row.estado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReporteLayout>
  );
}
