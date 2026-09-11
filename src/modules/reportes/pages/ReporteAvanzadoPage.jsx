/**
 * ReporteAvanzadoPage.jsx
 * Reporte avanzado con 5 sub-reportes gerenciales.
 * El usuario selecciona el tipo y luego aplica los filtros correspondientes.
 */
import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteAvanzado, exportarAvanzado, getFiltrosAuxiliares } from '../services/reportes.service';

const TIPOS = [
  { value: 'ventas_general',     label: 'Reporte General de Ventas' },
  { value: 'ventas_sucursal',    label: 'Ventas por Sucursal' },
  { value: 'ventas_detalladas',  label: 'Ventas Detalladas' },
  { value: 'compras_detalladas', label: 'Compras Detalladas' },
  { value: 'ordenes_servicio',   label: 'Órdenes de Servicio Detalladas' },
];

function useReporteAvanzado() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fecha_inicio: firstDay, fecha_fin: today, tipo: 'ventas_general', sucursal_id: '', page: 1, page_size: 50,
  });
  const [sucursales, setSucursales] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFiltrosAuxiliares()
      .then(r => setSucursales(r.data.sucursales || []))
      .catch(() => {});
  }, []);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteAvanzado({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte avanzado:', err);
      setResult(null);
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarAvanzado(filtros, formato), [filtros]);

  return { filtros, setFiltros, sucursales, result, loading, buscado, error, buscar, exportar };
}

// ── Renderizadores por tipo de reporte ───────────────────────────────────────

function RenderVentasGeneral({ data }) {
  if (!data) return null;
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '24px', flexWrap: 'wrap' }}>
      {[
        { label: 'Ventas Netas', value: data.ventas_netas, color: '#1e40af' },
        { label: 'Costo de Ventas', value: data.costo_ventas, color: '#dc2626' },
        { label: 'Utilidad Bruta', value: data.utilidad_bruta, color: '#16a34a' },
        { label: 'Margen %', value: `${data.margen_porcentaje}%`, color: '#7c3aed', noPrefix: true },
      ].map(({ label, value, color, noPrefix }) => (
        <div key={label} className="total-card" style={{ minWidth: '180px', borderLeft: `4px solid ${color}` }}>
          <span className="total-card-label">{label}</span>
          <span className="total-card-value" style={{ color, fontSize: '1.4rem' }}>
            {noPrefix ? value : `S/ ${Number(value).toFixed(2)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function RenderTabla({ data, columns, filtros, total, onPage }) {
  if (!data || data.length === 0) return <div className="empty-state"><p>Sin resultados.</p></div>;
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table className="reporte-table">
          <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map(c => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > filtros.page_size && (
        <div className="paginacion">
          <button disabled={filtros.page <= 1} onClick={() => onPage(filtros.page - 1)}><ChevronLeft size={14} /></button>
          <span>Pág. {filtros.page} — {total} registros</span>
          <button onClick={() => onPage(filtros.page + 1)}><ChevronRight size={14} /></button>
        </div>
      )}
    </>
  );
}

export default function ReporteAvanzadoPage() {
  const { filtros, setFiltros, sucursales, result, loading, buscado, error, buscar, exportar } = useReporteAvanzado();

  const renderContenido = () => {
    if (!result) return null;
    const tipo = filtros.tipo;

    if (tipo === 'ventas_general') return <RenderVentasGeneral data={result} />;

    if (tipo === 'ventas_sucursal') {
      const cols = [
        { key: 'sucursal', label: 'Sucursal' },
        { key: 'cantidad', label: 'N° Ventas' },
        { key: 'total', label: 'Total S/', render: v => `S/ ${Number(v).toFixed(2)}` },
      ];
      // Este sub-reporte no pagina en el backend: es una tabla acotada por
      // el número de sucursales, siempre trae el listado completo.
      return <RenderTabla data={result.data} columns={cols} filtros={filtros} />;
    }

    if (tipo === 'ventas_detalladas') {
      const cols = [
        { key: 'fecha', label: 'Fecha' },
        { key: 'comprobante', label: 'Comprobante' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'producto', label: 'Producto/Servicio' },
        { key: 'cantidad', label: 'Cant.' },
        { key: 'precio_unitario', label: 'P. Unit.', render: v => `S/ ${Number(v).toFixed(2)}` },
        { key: 'subtotal', label: 'Subtotal', render: v => `S/ ${Number(v).toFixed(2)}` },
        { key: 'sucursal', label: 'Sucursal' },
      ];
      return <RenderTabla data={result.data} columns={cols} filtros={filtros} total={result.total} onPage={buscar} />;
    }

    if (tipo === 'compras_detalladas') {
      const cols = [
        { key: 'fecha', label: 'Fecha' },
        { key: 'proveedor', label: 'Proveedor' },
        { key: 'comprobante', label: 'Comprobante' },
        { key: 'repuesto', label: 'Repuesto' },
        { key: 'cantidad', label: 'Cant.' },
        { key: 'precio_unitario', label: 'P. Unit.', render: v => `S/ ${Number(v).toFixed(2)}` },
        { key: 'subtotal', label: 'Subtotal', render: v => `S/ ${Number(v).toFixed(2)}` },
      ];
      return <RenderTabla data={result.data} columns={cols} filtros={filtros} total={result.total} onPage={buscar} />;
    }

    if (tipo === 'ordenes_servicio') {
      const cols = [
        { key: 'numero', label: 'N° Orden' },
        { key: 'fecha_ingreso', label: 'Fecha' },
        { key: 'placa', label: 'Placa' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'mecanico', label: 'Mecánico' },
        { key: 'tipo_servicio', label: 'Tipo Servicio' },
        { key: 'estado', label: 'Estado', render: v => {
          const map = { FINALIZADO: 'badge-green', FACTURADO: 'badge-blue', CANCELADO: 'badge-red', APROBADO: 'badge-yellow' };
          return <span className={`badge ${map[v] || 'badge-gray'}`}>{v}</span>;
        }},
        { key: 'fecha_finalizacion', label: 'Fecha Fin' },
      ];
      return <RenderTabla data={result.data} columns={cols} filtros={filtros} total={result.total} onPage={buscar} />;
    }

    return null;
  };

  return (
    <ReporteLayout
      titulo="Reporte Avanzado"
      subtitulo="Análisis gerencial y reportes cruzados de operaciones"
      icono={BarChart2}
      loading={loading}
      exportar={buscado && result && (
        <ExportButtons onExport={exportar} filename={`Reporte_Avanzado_${filtros.tipo}`} />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Tipo de Reporte</label>
            <select id="av-tipo" className="filtro-input" style={{ minWidth: 220 }}
              value={filtros.tipo}
              onChange={e => { setFiltros(f => ({ ...f, tipo: e.target.value, page: 1 })); }}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Inicio</label>
            <input id="av-fecha-inicio" type="date" className="filtro-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Fecha Fin</label>
            <input id="av-fecha-fin" type="date" className="filtro-input"
              value={filtros.fecha_fin}
              onChange={e => setFiltros(f => ({ ...f, fecha_fin: e.target.value }))} />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">Sucursal</label>
            <select id="av-sucursal" className="filtro-input"
              value={filtros.sucursal_id}
              onChange={e => setFiltros(f => ({ ...f, sucursal_id: e.target.value }))}>
              <option value="">Todas</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="av-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
              <Search size={14} style={{ marginRight: 4 }} />Generar
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="empty-state" style={{ color: '#b91c1c' }}><p>{error}</p></div>
      )}
      {!buscado ? (
        <div className="empty-state">
          <BarChart2 size={40} color="#cbd5e1" />
          <p>Selecciona el tipo de reporte, aplica el rango de fechas y presiona Generar.</p>
        </div>
      ) : error ? null : renderContenido()}
    </ReporteLayout>
  );
}
