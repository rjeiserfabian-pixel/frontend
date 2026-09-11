/**
 * ReporteVehiculosPage.jsx
 * Historial de vehículos atendidos, propietarios y órdenes de trabajo.
 */
import { useState, useCallback } from 'react';
import { Car, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ReporteLayout from '../components/ReporteLayout';
import ExportButtons from '../components/ExportButtons';
import { getReporteVehiculos, exportarVehiculos } from '../services/reportes.service';

function useReporteVehiculos() {
  const [filtros, setFiltros] = useState({ placa: '', cliente_id: '', page: 1, page_size: 50 });
  const [result, setResult] = useState({ data: [], total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState(null);

  const buscar = useCallback(async (page = 1) => {
    setLoading(true);
    setBuscado(true);
    setError(null);
    try {
      const res = await getReporteVehiculos({ ...filtros, page });
      setResult(res.data);
      setFiltros(f => ({ ...f, page }));
    } catch (err) {
      console.error('Error reporte vehículos:', err);
      setResult({ data: [], total: 0, total_pages: 0 });
      setError(err.response?.data?.errores?.[0] || err.response?.data?.mensaje || 'No se pudo cargar el reporte de vehículos.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const exportar = useCallback(async (formato) => exportarVehiculos(filtros, formato), [filtros]);

  return { filtros, setFiltros, result, loading, buscado, error, buscar, exportar };
}

export default function ReporteVehiculosPage() {
  const { filtros, setFiltros, result, loading, buscado, error, buscar, exportar } = useReporteVehiculos();

  return (
    <ReporteLayout
      titulo="Reporte de Vehículos"
      subtitulo="Padrón de vehículos atendidos, propietarios y frecuencia de visitas"
      icono={Car}
      loading={loading}
      exportar={buscado && result.data.length > 0 && (
        <ExportButtons onExport={exportar} filename="Reporte_Vehiculos" />
      )}
      filtros={
        <div className="filtro-row">
          <div className="filtro-group">
            <label className="filtro-label">Placa</label>
            <input
              id="veh-placa"
              type="text"
              className="filtro-input"
              placeholder="Ej: ABC123"
              value={filtros.placa}
              onChange={e => setFiltros(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
              onKeyDown={e => e.key === 'Enter' && buscar(1)}
            />
          </div>
          <div className="filtro-group">
            <label className="filtro-label">&nbsp;</label>
            <button id="veh-btn-buscar" className="btn-buscar" onClick={() => buscar(1)} disabled={loading}>
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
        <div className="empty-state">
          <Car size={40} color="#cbd5e1" />
          <p>Ingresa una placa o presiona Buscar para ver todos los vehículos.</p>
        </div>
      ) : error ? null : result.data.length === 0 && !loading ? (
        <div className="empty-state"><p>No se encontraron vehículos con esos criterios.</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="reporte-table">
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Propietario(s)</th>
                  <th>Total OT</th>
                  <th>Último Ingreso</th>
                  <th>Último Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem',
                        background: '#1e293b', color: 'white', padding: '2px 8px', borderRadius: '6px',
                      }}>
                        {v.placa}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{v.marca}</td>
                    <td>{v.modelo}</td>
                    <td>{v.anio}</td>
                    <td>{v.propietarios}</td>
                    <td>
                      <span className={`badge ${v.total_ordenes > 5 ? 'badge-blue' : v.total_ordenes > 0 ? 'badge-green' : 'badge-gray'}`}>
                        {v.total_ordenes} OT
                      </span>
                    </td>
                    <td>{v.ultimo_ingreso}</td>
                    <td>
                      {v.ultimo_estado !== '—' && (
                        <span className={`badge ${
                          v.ultimo_estado === 'FACTURADO' || v.ultimo_estado === 'FINALIZADO' ? 'badge-green'
                          : v.ultimo_estado === 'CANCELADO' ? 'badge-red'
                          : 'badge-yellow'
                        }`}>{v.ultimo_estado}</span>
                      )}
                      {v.ultimo_estado === '—' && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="paginacion">
            <button disabled={filtros.page <= 1} onClick={() => buscar(filtros.page - 1)}><ChevronLeft size={14} /></button>
            <span>Pág. {filtros.page} de {result.total_pages} — {result.total} vehículos</span>
            <button disabled={filtros.page >= result.total_pages} onClick={() => buscar(filtros.page + 1)}><ChevronRight size={14} /></button>
          </div>
        </>
      )}
    </ReporteLayout>
  );
}
