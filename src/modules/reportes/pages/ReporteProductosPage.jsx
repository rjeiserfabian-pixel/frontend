/**
 * ReporteProductosPage.jsx
 * Reporte de inventario: stock, precios, categorías y alertas.
 */
import { useState, useEffect, useCallback } from 'react';
import { Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteProductos, exportarProductos, getFiltrosAuxiliares } from '../services/reportes.service';

function useReporteProductos() {
  const [filtros, setFiltros] = useState({ categoria_id: '', marca_id: '', stock_estado: '', page: 1, page_size: 50 });
  const [auxiliares, setAuxiliares] = useState({ categorias: [], marcas: [] });
  const [result, setResult] = useState({ data: [], total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setAuxiliares({ categorias: r.data.categorias || [], marcas: r.data.marcas || [] }))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteProductos({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte productos:', err);
      setResult({ data: [], total: 0, total_pages: 0 });
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte de productos.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarProductos(filtros, formato), [filtros]);

  return { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar };
}

export default function ReporteProductosPage() {
  const { filtros, setFiltros, auxiliares, result, loading, buscado, error, buscar, exportar } = useReporteProductos();

  return (
    <ReporteLayout
      titulo="Reporte de Productos"
      subtitulo="Stock actual, precios y estado de inventario"
      icono={Package}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Productos" />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Categoría</label>
            <select id="prod-categoria" className="filtro-input"
              value={filtros.categoria_id}
              onChange={e => setFiltros(f => ({ ...f, categoria_id: e.target.value }))}>
              <option value="">Todas</option>
              {auxiliares.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Marca</label>
            <select id="prod-marca" className="filtro-input"
              value={filtros.marca_id}
              onChange={e => setFiltros(f => ({ ...f, marca_id: e.target.value }))}>
              <option value="">Todas</option>
              {auxiliares.marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Stock</label>
            <select id="prod-stock" className="filtro-input"
              value={filtros.stock_estado}
              onChange={e => setFiltros(f => ({ ...f, stock_estado: e.target.value }))}>
              <option value="">Todos</option>
              <option value="normal">Normal (&gt;5)</option>
              <option value="bajo">Bajo (≤5)</option>
              <option value="agotado">Agotado (0)</option>
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="prod-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Buscar
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="empty-state" style={{ color: '#b91c1c' }}><p>{error}</p></div>
      )}
      {!buscado ? (
        <div className="empty-state"><Package size={40} color="#cbd5e1" /><p>Aplica filtros y presiona Buscar.</p></div>
      ) : error ? null : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No se encontraron productos.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Código</th><th>Nombre</th><th>Categoría</th><th>Marca</th>
                  <th>Unidad</th><th>P. Compra</th><th>P. Lista</th><th>P. Cash</th>
                  <th>Stock</th><th>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.codigo}</td>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td>{p.marca}</td>
                    <td>{p.unidad}</td>
                    <td>S/ {Number(p.precio_compra).toFixed(2)}</td>
                    <td>S/ {Number(p.precio_lista).toFixed(2)}</td>
                    <td>S/ {Number(p.precio_cash).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= 5 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      {p.alerta_precio
                        ? <span className="badge badge-red">⚠ Precio</span>
                        : <span className="badge badge-green">OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paginacion">
            <button disabled={filtros.page <= 1} onClick={() => buscar(filtros.page - 1)}><ChevronLeft size={14} /></button>
            <span>Pág. {filtros.page} de {result.total_pages} — {result.total} productos</span>
            <button disabled={filtros.page >= result.total_pages} onClick={() => buscar(filtros.page + 1)}><ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </ReporteLayout>
  );
}
