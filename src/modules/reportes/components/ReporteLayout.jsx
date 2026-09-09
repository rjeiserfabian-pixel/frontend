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
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {Icono && <Icono size={22} color="white" />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
              {titulo}
            </h1>
            {subtitulo && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{subtitulo}</p>
            )}
          </div>
        </div>
        {exportar && <div>{exportar}</div>}
      </div>

      {/* Filtros */}
      {filtros && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
          border: '1px solid #e2e8f0',
        }}>
          {filtros}
        </div>
      )}

      {/* Contenido principal */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        minHeight: '200px',
        position: 'relative',
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, borderRadius: '12px',
          }}>
            <div style={{
              width: '32px', height: '32px', border: '3px solid #e2e8f0',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        )}
        {children}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .reporte-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
        .reporte-table thead tr { background: #0f172a; color: white; }
        .reporte-table thead th { padding: 10px 12px; text-align: left; font-weight: 600; white-space: nowrap; }
        .reporte-table tbody tr:nth-child(even) { background: #f8fafc; }
        .reporte-table tbody td { padding: 9px 12px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        .reporte-table tbody tr:hover { background: #eff6ff; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }
        .badge-green  { background:#dcfce7; color:#166534; }
        .badge-red    { background:#fee2e2; color:#991b1b; }
        .badge-yellow { background:#fef9c3; color:#854d0e; }
        .badge-blue   { background:#dbeafe; color:#1e40af; }
        .badge-gray   { background:#f1f5f9; color:#475569; }
        .filtro-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
        .filtro-group { display: flex; flex-direction: column; gap: 4px; }
        .filtro-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .filtro-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; color: #1e293b; background: #f8fafc; outline: none; min-width: 140px; }
        .filtro-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .btn-buscar { padding: 8px 18px; background: #1e40af; color: white; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-buscar:hover { background: #1d4ed8; }
        .btn-buscar:disabled { opacity: 0.6; cursor: not-allowed; }
        .empty-state { padding: 48px; text-align: center; color: #94a3b8; }
        .empty-state svg { margin-bottom: 12px; }
        .paginacion { display:flex; align-items:center; gap:8px; padding:12px 16px; border-top:1px solid #f1f5f9; font-size:0.82rem; color:#64748b; }
        .paginacion button { padding:4px 10px; border:1px solid #cbd5e1; border-radius:6px; background:white; cursor:pointer; }
        .paginacion button:disabled { opacity:0.4; cursor:not-allowed; }
        .total-card { display:inline-flex; flex-direction:column; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 16px; min-width:130px; }
        .total-card-label { font-size:0.72rem; color:#64748b; font-weight:600; text-transform:uppercase; }
        .total-card-value { font-size:1.1rem; font-weight:700; color:#0f172a; margin-top:2px; }
      `}</style>
    </div>
  );
}
