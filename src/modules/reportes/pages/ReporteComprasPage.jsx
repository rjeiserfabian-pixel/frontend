/**
 * ReporteComprasPage.jsx
 * Reporte de compras con filtros por proveedor y estado de pago.
 */
import { useState, useEffect, useCallback } from 'react';
import { Truck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteCompras, exportarCompras, getFiltrosAuxiliares } from '../services/reportes.service';

function useReporteCompras() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fecha_inicio: firstDay, fecha_fin: today, proveedor_id: '', estado_pago: '', page: 1, page_size: 50,
  });
  const [proveedores, setProveedores] = useState([]);
  const [result, setResult] = useState({ data: [], total: 0, total_pages: 0, totales: {} });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setProveedores(r.data.proveedores || []))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteCompras({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte compras:', err);
      setResult({ data: [], total: 0, total_pages: 0, totales: {} });
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte de compras.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarCompras(filtros, formato), [filtros]);

  return { filtros, setFiltros, proveedores, result, loading, buscado, error, buscar, exportar };
}

export default function ReporteComprasPage() {
  const { filtros, setFiltros, proveedores, result, loading, buscado, error, buscar, exportar } = useReporteCompras();

  const estadoPagoBadge = (estado) => {
    const map = { 'Pagada': 'badge-green', 'Parcial': 'badge-yellow', 'Pendiente': 'badge-red' };
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado}</span>;
  };

  return (
    <ReporteLayout
      titulo="Reporte de Compras"
      subtitulo="Historial de compras a proveedores y estado de pago"
      icono={Truck}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Compras" />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Fecha Inicio</label>
            <input id="comp-fecha-inicio" type="date" className="filtro-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Fin</label>
            <input id="comp-fecha-fin" type="date" className="filtro-input"
              value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Proveedor</label>
            <select id="comp-proveedor" className="filtro-input"
              value={filtros.proveedor_id}
              onChange={e => setFiltros(f => ({ ...f, proveedor_id: e.target.value }))}>
              <option value="">Todos</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Estado Pago</label>
            <select id="comp-estado-pago" className="filtro-input"
              value={filtros.estado_pago}
              onChange={e => setFiltros(f => ({ ...f, estado_pago: e.target.value }))}>
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Parcial">Parcial</option>
              <option value="Pagada">Pagada</option>
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="comp-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Buscar
            </button>
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
            <span className="total-card-label" style={{ color: '#991b1b' }}>Total</span>
            <span className="total-card-value" style={{ color: '#991b1b' }}>S/ {Number(result.totales.total || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state" style={{ color: '#b91c1c' }}><p>{error}</p></div>
      )}
      {!buscado ? (
        <div className="empty-state"><Truck size={40} color="#cbd5e1" /><p>Aplica filtros y presiona Buscar.</p></div>
      ) : error ? null : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No hay compras para los filtros seleccionados.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Fecha</th><th>RUC/DNI</th><th>Proveedor</th><th>Comprobante</th>
                  <th>Tipo Pago</th><th>Subtotal</th><th>IGV</th><th>Total</th>
                  <th>Est. Compra</th><th>Est. Pago</th><th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(c => (
                  <tr key={c.id}>
                    <td>{c.fecha}</td>
                    <td style={{ fontFamily: 'monospace' }}>{c.proveedor_doc}</td>
                    <td style={{ fontWeight: 600 }}>{c.proveedor}</td>
                    <td style={{ fontFamily: 'monospace' }}>{c.tipo_comprobante} {c.serie}-{c.numero}</td>
                    <td><span className={`badge ${c.tipo_pago === 'Contado' ? 'badge-green' : 'badge-blue'}`}>{c.tipo_pago}</span></td>
                    <td>{Number(c.subtotal).toFixed(2)}</td>
                    <td>{Number(c.igv).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>{Number(c.total).toFixed(2)}</td>
                    <td><span className={`badge ${c.estado === 'Completada' ? 'badge-green' : 'badge-red'}`}>{c.estado}</span></td>
                    <td>{estadoPagoBadge(c.estado_pago)}</td>
                    <td>{c.saldo_pendiente > 0 ? <span style={{ color: '#dc2626', fontWeight: 700 }}>S/ {Number(c.saldo_pendiente).toFixed(2)}</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paginacion">
            <button disabled={filtros.page <= 1} onClick={() => buscar(filtros.page - 1)}><ChevronLeft size={14} /></button>
            <span>Pág. {filtros.page} de {result.total_pages} — {result.total} compras</span>
            <button disabled={filtros.page >= result.total_pages} onClick={() => buscar(filtros.page + 1)}><ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </ReporteLayout>
  );
}
