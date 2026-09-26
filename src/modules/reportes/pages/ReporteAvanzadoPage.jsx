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
import { usePermisos } from '../../../shared/contexts/PermisosContext';

const TIPOS = [
  { value: 'rentabilidad',       label: 'Rentabilidad (Ingresos vs. Egresos)' },
  { value: 'ventas_general',     label: 'Reporte General de Ventas' },
  { value: 'ventas_sucursal',    label: 'Ventas por Sucursal' },
  { value: 'ventas_detalladas',  label: 'Ventas Detalladas' },
  { value: 'compras_detalladas', label: 'Compras Detalladas' },
  { value: 'ordenes_servicio',   label: 'Órdenes de Servicio Detalladas' },
];

const CONCEPTO_LABEL = {
  GASTO_OPERATIVO: 'Gasto Operativo',
  PAGO_PROVEEDOR: 'Pago a Proveedor',
  DEVOLUCION: 'Devolución',
  RETIRO: 'Retiro',
  OTROS_EGRESOS: 'Otros Egresos',
  EGRESO_MANUAL: 'Egreso Manual (Gasto)',
};

function useReporteAvanzado() {
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    fecha_inicio: firstDay, fecha_fin: today, tipo: 'rentabilidad', sucursal_id: '', page: 1, page_size: 50,
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

  // Cada tipo de reporte devuelve una forma de datos distinta (ventas_general
  // trae ventas_netas/utilidad_bruta, rentabilidad trae ingresado/egresado,
  // etc.). Si solo se cambiara filtros.tipo, el resultado anterior (de otro
  // tipo) se seguiría mostrando hasta el próximo "Generar", y el renderizador
  // del tipo nuevo intentaría leer campos que no existen en esa forma vieja
  // -> pantalla en blanco. Se limpia result/buscado al cambiar de tipo para
  // forzar una nueva búsqueda antes de renderizar cualquier resultado.
  const cambiarTipo = useCallback((nuevoTipo) => {
    setFiltros(f => ({ ...f, tipo: nuevoTipo, page: 1 }));
    setResult(null);
    setBuscado(false);
    setError(null);
  }, []);

  return { filtros, setFiltros, sucursales, result, loading, buscado, error, buscar, exportar, cambiarTipo };
}

// ── Renderizadores por tipo de reporte ───────────────────────────────────────

function RenderVentasGeneral({ data }) {
  // Guarda extra (además de limpiar result al cambiar de tipo en el hook):
  // si por una petición en curso llega data de OTRO tipo de reporte mientras
  // este ya está seleccionado, no truena leyendo un campo que no existe.
  if (!data || !data.repuestos_vs_mano_obra) return null;
  const rvm = data.repuestos_vs_mano_obra;
  const totalUtilidad = rvm.utilidad_total || 0;
  const pctRepuestos = totalUtilidad > 0 ? Math.max(0, (rvm.utilidad_repuestos / totalUtilidad) * 100) : 0;
  const pctManoObra = totalUtilidad > 0 ? Math.max(0, (rvm.utilidad_mano_obra / totalUtilidad) * 100) : 0;

  return (
    <>
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

      <div style={{ padding: '0 24px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ flex: '2 1 420px', border: '1px solid rgba(148,163,184,.16)', borderRadius: '8px', padding: '16px', background: '#162235' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '2px', marginTop: 0 }}>Repuestos más rentables</h4>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '12px' }}>Top 10 del periodo, ordenado por utilidad generada (no por ventas)</p>
          {data.top_repuestos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#cbd5e1', padding: '24px 0' }}>Sin ventas de repuestos en este periodo.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="reporte-table">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th style={{ textAlign: 'right' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Ventas</th>
                    <th style={{ textAlign: 'right' }}>Utilidad</th>
                    <th style={{ textAlign: 'right' }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_repuestos.map((r, i) => (
                    <tr key={i}>
                      <td>{r.repuesto}</td>
                      <td style={{ textAlign: 'right' }}>{r.cantidad_vendida}</td>
                      <td style={{ textAlign: 'right' }}>S/ {Number(r.ventas).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>S/ {Number(r.utilidad).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{r.margen_porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 260px', border: '1px solid rgba(148,163,184,.16)', borderRadius: '8px', padding: '16px', background: '#162235' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', marginBottom: '2px', marginTop: 0 }}>Repuestos vs. mano de obra</h4>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '14px' }}>De dónde viene la utilidad</p>

          <div style={{ display: 'flex', height: '10px', width: '100%', borderRadius: '99px', overflow: 'hidden', background: '#0b1220', marginBottom: '16px' }}>
            <div style={{ width: `${pctRepuestos}%`, background: '#0ea5e9' }} />
            <div style={{ width: `${pctManoObra}%`, background: '#f59e0b' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#0ea5e9', display: 'inline-block' }} /> Repuestos
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>S/ {Number(rvm.utilidad_repuestos).toFixed(2)}</span>
            <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>de S/ {Number(rvm.ventas_repuestos).toFixed(2)} vendido</p>
          </div>
          <div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '2px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b', display: 'inline-block' }} /> Mano de Obra
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>S/ {Number(rvm.utilidad_mano_obra).toFixed(2)}</span>
            <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: 0 }}>100% margen (sin costo)</p>
          </div>
        </div>
      </div>
    </>
  );
}

function RenderRentabilidad({ data, filtros }) {
  // Misma guarda que RenderVentasGeneral: evita leer un campo inexistente
  // si llega data de otro tipo de reporte por una petición en curso.
  if (!data || !data.desglose_ingresos) return null;
  const netoPositivo = data.neto >= 0;

  const columnasSerie = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'ingresos', label: 'Ingresos', render: v => `S/ ${Number(v).toFixed(2)}` },
    { key: 'egresos', label: 'Egresos', render: v => `S/ ${Number(v).toFixed(2)}` },
    {
      key: 'neto', label: 'Neto', render: v => (
        <span style={{ color: Number(v) >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
          S/ {Number(v).toFixed(2)}
        </span>
      )
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: '16px', padding: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Ingresado', value: data.ingresado, color: '#16a34a' },
          { label: 'Egresado', value: data.egresado, color: '#dc2626' },
          { label: 'Neto', value: data.neto, color: netoPositivo ? '#16a34a' : '#dc2626' },
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

      {data.generado_credito > 0 && (
        <div style={{ margin: '-12px 24px 12px', padding: '8px 14px', background: 'rgba(245,158,11,0.13)', border: '1px solid rgba(245,158,11,0.42)', borderRadius: '8px', fontSize: '0.82rem', color: '#fde68a' }}>
          + S/ {Number(data.generado_credito).toFixed(2)} generado a crédito en el periodo (aún no cobrado, no incluido en el ingreso).
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', padding: '0 24px 24px', flexWrap: 'wrap' }}>
        <div className="total-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <span className="total-card-label">Ventas de Taller</span>
          <span className="total-card-value">S/ {Number(data.desglose_ingresos.ventas_taller).toFixed(2)}</span>
        </div>
        <div className="total-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <span className="total-card-label">Ventas de Mostrador</span>
          <span className="total-card-value">S/ {Number(data.desglose_ingresos.ventas_mostrador).toFixed(2)}</span>
        </div>
        <div className="total-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
          <span className="total-card-label">Cobros de Crédito Anterior</span>
          <span className="total-card-value">S/ {Number(data.desglose_ingresos.cobros_credito).toFixed(2)}</span>
        </div>
        <div className="total-card" style={{ borderLeft: '4px solid #64748b' }}>
          <span className="total-card-label">Órdenes Ingresadas</span>
          <span className="total-card-value">{data.ordenes_ingresadas}</span>
        </div>
      </div>

      {data.egresos_por_concepto.length > 0 && (
        <div style={{ padding: '0 24px 20px' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px' }}>Egresos por concepto</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead><tr><th>Concepto</th><th>Total</th></tr></thead>
              <tbody>
                {data.egresos_por_concepto.map(e => (
                  <tr key={e.concepto}>
                    <td>{CONCEPTO_LABEL[e.concepto] || e.concepto}</td>
                    <td>S/ {Number(e.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>
        <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px' }}>Tendencia diaria</h4>
        <RenderTabla data={data.serie_diaria} columns={columnasSerie} filtros={filtros} />
      </div>
    </>
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
  const { tienePermiso } = usePermisos();
  const puedeExportar = tienePermiso('REPORTES.AVANZADO.EXPORTAR');
  const { filtros, setFiltros, sucursales, result, loading, buscado, error, buscar, exportar, cambiarTipo } = useReporteAvanzado();

  const renderContenido = () => {
    if (!result) return null;
    const tipo = filtros.tipo;

    if (tipo === 'rentabilidad') return <RenderRentabilidad data={result} filtros={filtros} />;

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
      exportar={buscado && result && puedeExportar && (
        <ExportButtons onExport={exportar} filename={`Reporte_Avanzado_${filtros.tipo}`} />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Tipo de Reporte</label>
            <select id="av-tipo" className="filtro-input" style={{ minWidth: 220 }}
              value={filtros.tipo}
              onChange={e => cambiarTipo(e.target.value)}>
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
