/**
 * ExportButtons.jsx
 * Botones reutilizables de exportar a Excel y PDF.
 * Se deshabilitan durante la petición para evitar doble clic (skill react-secure).
 */
import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { descargarBlob } from '../services/reportes.service';

/**
 * @param {function} onExport  async (formato: 'excel'|'pdf') => AxiosResponse
 * @param {string}   filename  nombre base del archivo (sin extensión)
 */
export default function ExportButtons({ onExport, filename = 'Reporte' }) {
  const [loading, setLoading] = useState(null); // 'excel' | 'pdf' | null

  const handleExport = async (formato) => {
    setLoading(formato);
    try {
      const res = await onExport(formato);
      const ext = formato === 'excel' ? 'xlsx' : 'pdf';
      descargarBlob(res, `${filename}.${ext}`);
    } catch (err) {
      console.error(`Error exportando ${formato}:`, err);
      alert(`Error al exportar el archivo. Intente de nuevo.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        id="btn-export-excel"
        onClick={() => handleExport('excel')}
        disabled={loading !== null}
        title="Exportar a Excel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: loading === 'excel' ? '#166534' : '#16a34a',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading !== null ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          opacity: loading !== null ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        <FileSpreadsheet size={16} />
        {loading === 'excel' ? 'Generando...' : 'Excel'}
      </button>

      <button
        id="btn-export-pdf"
        onClick={() => handleExport('pdf')}
        disabled={loading !== null}
        title="Exportar a PDF"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: loading === 'pdf' ? '#991b1b' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading !== null ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          opacity: loading !== null ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        <FileText size={16} />
        {loading === 'pdf' ? 'Generando...' : 'PDF'}
      </button>
    </div>
  );
}
