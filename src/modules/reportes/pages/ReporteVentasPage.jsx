/**
 * ReporteVentasPage.jsx
 * Reporte de ventas con filtros por cliente, vendedor, producto y sucursal.
 * Incluye paginación y totales agregados.
 */
import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteVentas, exportarVentas, getFiltrosAuxiliares } from '../services/reportes.service';

// ── Custom Hook ──────────────────────────────────────────────────────────────
function useReporteVentas() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fecha_inicio: firstDay, fecha_fin: today,
    sucursal_id: '', cliente_id: '', vendedor_id: '',
    page: 1, page_size: 50,
  });
  const [auxiliares, setAuxiliares] = useState({ sucursales: [], clientes: [] });
  const [result, setResult] = useState({ data: [], total: 0, total_pages: 0, totales: {} });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setAuxiliares({ sucursales: r.data.sucursales || [], clientes: r.data.clientes || [] }))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteVentas({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte ventas:', err);
      setResult({ data: [], total: 0, total_pages: 0, totales: {} });
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte de ventas.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) =>
    exportarVentas(filtros, formato), [filtros]);

  return { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar };
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function ReporteVentasPage() {
  const { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar } = useReporteVentas();

  const estadoBadge = (estado) => {
    const map = { PAGADA: 'badge-green', AL_CREDITO: 'badge-blue', ANULADA: 'badge-red', PENDIENTE_PAGO: 'badge-yellow' };
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado?.replace('_', ' ')}</span>;
  };

  return (
    <ReporteLayout
      titulo="Reporte de Ventas"
      subtitulo="Historial de comprobantes emitidos con totales y estado"
      icono={ShoppingCart}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Ventas" />
      )}
      filtros={
        <div>
          <div className="filtro-row" style={{ marginBottom: '10px' }}>
            <div className="filtro-group">
              <label className="filtro-label">Fecha Inicio</label>
              <input id="ventas-fecha-inicio" type="date" className="filtro-input"
                value={filtros.fecha_inicio}
                onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
            </div>
            <div className="filtro-group">
              <label className="filtro-label">Fecha Fin</label>
              <input id="ventas-fecha-fin" type="date" className="filtro-input"
                value={filtros.fecha_fin}
                onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
            </div>
            <div className="filtro-group">
              <label className="filtro-label">Sucursal</label>
              <select id="ventas-sucursal" className="filtro-input"
                value={filtros.sucursal_id}
                onChange={e => setFiltros(f => ({ ...f, sucursal_id: e.target.value }))}>
                <option value="">Todas</option>
                {auxiliares.sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="filtro-group">
              <label className="filtro-label">Cliente</label>
              <select id="ventas-cliente" className="filtro-input"
                value={filtros.cliente_id}
                onChange={e => setFiltros(f => ({ ...f, cliente_id: e.target.value }))}>
                <option value="">Todos</option>
                {auxiliares.clientes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="filtro-group">
              <label className="filtro-label">&nbsp;</label>
              <button id="ventas-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
                <Search size={14} style={{ marginRight: 4 }} />Buscar
              </button>
            </div>
          </div>
        </div>
      }
    >
      {/* Totales */}
      {buscado && result.totales && (
        <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <div className="total-card">
            <span className="total-card-label">Registros</span>
            <span className="total-card-value">{result.total}</span>
          </div>
          <div className="total-card">
            <span className="total-card-label">Subtotal</span>
            <span className="total-card-value">S/ {Number(result.totales.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="total-card">
            <span className="total-card-label">IGV</span>
            <span className="total-card-value">S/ {Number(result.totales.igv || 0).toFixed(2)}</span>
          </div>
          <div className="total-card">
            <span className="total-card-label" style={{ color: '#1e40af' }}>Total</span>
            <span className="total-card-value" style={{ color: '#1e40af' }}>S/ {Number(result.totales.total || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state" style={{ color: '#b91c1c' }}><p>{error}</p></div>
      )}
      {!buscado ? (
        <div className="empty-state">
          <ShoppingCart size={40} color="#cbd5e1" />
          <p>Aplica los filtros y presiona Buscar para ver el reporte.</p>
        </div>
      ) : error ? null : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No hay ventas para los filtros seleccionados.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo Comp.</th>
                  <th>Serie-Correlativo</th>
                  <th>DNI</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Moneda</th>
                  <th>Subtotal</th>
                  <th>IGV</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Sucursal</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(v => (
                  <tr key={v.id}>
                    <td>{v.fecha_emision}</td>
                    <td>{v.tipo_comprobante}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.serie_correlativo}</td>
                    <td>{v.cliente_dni}</td>
                    <td>{v.cliente_nombre}</td>
                    <td>{v.vendedor || '—'}</td>
                    <td><span className="badge badge-blue">{v.moneda}</span></td>
                    <td>{Number(v.subtotal).toFixed(2)}</td>
                    <td>{Number(v.igv).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: '#1e40af' }}>{Number(v.total).toFixed(2)}</td>
                    <td>{estadoBadge(v.estado)}</td>
                    <td>{v.sucursal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          <div className="paginacion">
            <button disabled={filtros.page <= 1} onClick={() => buscar(filtros.page - 1)}>
              <ChevronLeft size={14} />
            </button>
            <span>Pág. {filtros.page} de {result.total_pages}</span>
            <button disabled={filtros.page >= result.total_pages} onClick={() => buscar(filtros.page + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </ReporteLayout>
  );
}
