/**
 * ReporteClientesPage.jsx
 * Reporte de clientes con totales de compra y saldos pendientes.
 */
import { useState, useEffect, useCallback } from 'react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteClientes, exportarClientes } from '../services/reportes.service';

function useReporteClientes() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({ fecha_inicio: firstDay, fecha_fin: today, deuda_estado: '', page: 1, page_size: 50 });
  const [result, setResult] = useState({ data: [], total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    try {
      const res = await getReporteClientes({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte clientes:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarClientes(filtros, formato), [filtros]);

  return { filtros, setFiltros, result, loading, buscado, buscar, exportar };
}

export default function ReporteClientesPage() {
  const { filtros, setFiltros, result, loading, buscado, buscar, exportar } = useReporteClientes();

  return (
    <ReporteLayout
      titulo="Reporte de Clientes"
      subtitulo="Ranking de clientes, saldos pendientes y volumen de compras"
      icono={Users}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Clientes" />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Fecha Inicio</label>
            <input id="cli-fecha-inicio" type="date" className="filtro-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Fin</label>
            <input id="cli-fecha-fin" type="date" className="filtro-input"
              value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Estado de Deuda</label>
            <select id="cli-deuda" className="filtro-input"
              value={filtros.deuda_estado}
              onChange={e => setFiltros(f => ({ ...f, deuda_estado: e.target.value }))}>
              <option value="">Todos</option>
              <option value="con_saldo">Con Saldo Pendiente</option>
              <option value="al_dia">Al Día</option>
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="cli-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Buscar
            </button>
          </div>
        </div>
      }
    >
      {!buscado ? (
        <div className="empty-state"><Users size={40} color="#cbd5e1" /><p>Aplica filtros y presiona Buscar.</p></div>
      ) : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No se encontraron clientes con esos filtros.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>#</th><th>DNI</th><th>Nombre</th><th>Teléfono</th><th>Email</th>
                  <th>Total Comprado</th><th>Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: '#94a3b8' }}>{(filtros.page - 1) * filtros.page_size + i + 1}</td>
                    <td style={{ fontFamily: 'monospace' }}>{c.dni}</td>
                    <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                    <td>{c.telefono}</td>
                    <td>{c.email}</td>
                    <td style={{ fontWeight: 700, color: '#16a34a' }}>S/ {Number(c.total_comprado).toFixed(2)}</td>
                    <td>
                      {c.saldo_pendiente > 0
                        ? <span className="badge badge-red">S/ {Number(c.saldo_pendiente).toFixed(2)}</span>
                        : <span className="badge badge-green">Al día</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paginacion">
            <button disabled={filtros.page <= 1} onClick={() => buscar(filtros.page - 1)}><ChevronLeft size={14} /></button>
            <span>Pág. {filtros.page} de {result.total_pages} — {result.total} clientes</span>
            <button disabled={filtros.page >= result.total_pages} onClick={() => buscar(filtros.page + 1)}><ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </ReporteLayout>
  );
}
