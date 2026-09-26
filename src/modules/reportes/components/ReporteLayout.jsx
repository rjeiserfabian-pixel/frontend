/**
 * ReporteLayout.jsx
 * Layout base para todas las páginas de reportes.
 * Incluye encabezado con título e icono, zona de filtros y zona de contenido.
 */
export default function ReporteLayout({ titulo, subtitulo, icono: Icono, filtros, exportar, children, loading }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.34)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {Icono && <Icono size={22} color="#7dd3fc" />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
              {titulo}
            </h1>
            {subtitulo && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>{subtitulo}</p>
            )}
          </div>
        </div>
        {exportar && <div>{exportar}</div>}
      </div>

      {/* Filtros */}
      {filtros && (
        <div style={{
          background: '#101928',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
        }}>
          {filtros}
        </div>
      )}

      {/* Contenido principal */}
      <div style={{
        background: '#101928',
        borderRadius: '8px',
        boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        overflow: 'hidden',
        minHeight: '200px',
        position: 'relative',
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(7,11,18,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, borderRadius: '12px',
          }}>
            <div style={{
              width: '32px', height: '32px', border: '3px solid rgba(148,163,184,0.2)',
              borderTopColor: '#38bdf8', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        )}
        {children}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .reporte-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .reporte-table thead tr { background: #162235; color: #bae6fd; }
        .reporte-table thead th { padding: 10px 12px; text-align: left; font-weight: 800; white-space: nowrap; }
        .reporte-table tbody tr:nth-child(even) { background: rgba(22,34,53,0.42); }
        .reporte-table tbody td { padding: 9px 12px; color: #f8fafc; border-bottom: 1px solid rgba(148,163,184,0.16); }
        .reporte-table tbody tr:hover { background: rgba(56,189,248,0.08); }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; }
        .badge-green  { background:rgba(16,185,129,.15); color:#6ee7b7; }
        .badge-red    { background:rgba(225,29,46,.15); color:#fda4af; }
        .badge-yellow { background:rgba(245,158,11,.16); color:#fcd34d; }
        .badge-blue   { background:rgba(56,189,248,.15); color:#7dd3fc; }
        .badge-gray   { background:rgba(148,163,184,.14); color:#cbd5e1; }
        .filtro-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .filtro-group { display: flex; flex-direction: column; gap: 4px; }
        .filtro-label { font-size: 0.75rem; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.04em; }
        .filtro-input { padding: 8px 12px; border: 1px solid rgba(148,163,184,.22); border-radius: 8px; font-size: 0.85rem; color: #f8fafc; background: #162235; outline: none; min-width: 140px; color-scheme: dark; }
        .filtro-input:focus { border-color: #38bdf8; background: #162235; box-shadow: 0 0 0 3px rgba(56,189,248,0.12); }
        .btn-buscar { padding: 8px 18px; background: #e11d2e; color: white; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .btn-buscar:hover { background: #9f1020; }
        .btn-buscar:disabled { opacity: 0.6; cursor: not-allowed; }
        .empty-state { padding: 48px; text-align: center; color: #cbd5e1; }
        .empty-state svg { margin-bottom: 12px; }
        .paginacion { display:flex; align-items:center; gap:8px; padding:12px 16px; border-top:1px solid rgba(148,163,184,.16); font-size:0.82rem; color:#cbd5e1; }
        .paginacion button { padding:4px 10px; border:1px solid rgba(148,163,184,.22); border-radius:6px; background:#162235; color:#e2e8f0; cursor:pointer; }
        .paginacion button:disabled { opacity:0.4; cursor:not-allowed; }
        .total-card { display:inline-flex; flex-direction:column; background:#162235; border:1px solid rgba(148,163,184,.16); border-radius:8px; padding:10px 16px; min-width:130px; }
        .total-card-label { font-size:0.72rem; color:#cbd5e1; font-weight:700; text-transform:uppercase; }
        .total-card-value { font-size:1.1rem; font-weight:700; color:#f8fafc; margin-top:2px; }
      `}</style>
    </div>
  );
}
