import { useEffect, useState } from 'react';
import { DiaryRepo, ExportRepo } from '../../repositories';
import { buildExportContent, type ExportContent } from '../../domain/exportContent';
import { buildDiaryPdf } from '../../domain/exportPdf';
import { isoDate, lastNDaysRange } from '../../domain/dateRange';
import { PrintableExport } from './PrintableExport';
import './diario.css';

type RangeType = 'hoy' | '7dias' | '30dias' | 'personalizado';

const RANGE_OPTIONS: { id: RangeType; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7dias', label: '7 días' },
  { id: '30dias', label: '30 días' },
  { id: 'personalizado', label: 'Personalizado' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExportModalProps {
  onClose: () => void;
}

// Flujo de App §7.4: Historial -> "Exportar" -> selector de rango -> PDF /
// Imprimir / Exportar datos. El PDF y la impresión comparten el mismo
// contenido (buildExportContent, que reutiliza computeSummary de F5).
export function ExportModal({ onClose }: ExportModalProps) {
  const [rangeType, setRangeType] = useState<RangeType>('hoy');
  const today = isoDate(new Date());
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [printContent, setPrintContent] = useState<ExportContent | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const getRange = (): { from: string; to: string } => {
    if (rangeType === 'hoy') return { from: today, to: today };
    if (rangeType === '7dias') return lastNDaysRange(7);
    if (rangeType === '30dias') return lastNDaysRange(30);
    return { from: customFrom, to: customTo };
  };

  useEffect(() => {
    if (!printContent) return;
    window.print();
    // Vuelve a la vista normal apenas se cierra el diálogo de impresión
    // (o si el navegador no lo dispara, al menos no deja el portal colgado).
    const reset = () => setPrintContent(null);
    window.addEventListener('afterprint', reset, { once: true });
    return () => window.removeEventListener('afterprint', reset);
  }, [printContent]);

  const handleExportPdf = async () => {
    const range = getRange();
    const entries = await DiaryRepo.getByDateRange(range.from, range.to);
    const content = buildExportContent(entries, range);
    const bytes = await buildDiaryPdf(content);
    downloadBlob(
      new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }),
      `diario-${range.from}-a-${range.to}.pdf`,
    );
    setStatus('PDF generado.');
  };

  const handlePrint = async () => {
    const range = getRange();
    const entries = await DiaryRepo.getByDateRange(range.from, range.to);
    setPrintContent(buildExportContent(entries, range));
  };

  const handleExportData = async () => {
    const range = getRange();
    const file = await ExportRepo.exportFilteredBackup(range);
    downloadBlob(
      new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
      `sabores-datos-${range.from}-a-${range.to}.json`,
    );
    setStatus('Datos exportados.');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Exportar">
      <div className="modal-sheet">
        <h2 className="modal-sheet__title">Exportar</h2>

        <fieldset className="chip-group">
          <legend className="chip-group__label">Rango</legend>
          <div className="chip-group__options">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="chip"
                data-selected={rangeType === option.id || undefined}
                style={{ minHeight: '44px' }}
                onClick={() => setRangeType(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {rangeType === 'personalizado' && (
          <div className="diario-form__section">
            <label htmlFor="export-from">Desde</label>
            <input id="export-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <label htmlFor="export-to">Hasta</label>
            <input id="export-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}

        <div className="diario-form__actions">
          <button type="button" className="recipe-detail__action-button" onClick={handleExportPdf}>
            Exportar PDF
          </button>
          <button type="button" className="recipe-detail__action-button" onClick={handlePrint}>
            Imprimir
          </button>
          <button type="button" className="recipe-detail__action-button" onClick={handleExportData}>
            Exportar datos
          </button>
          <button type="button" className="recipe-detail__action-button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {status && <p className="modal-confirm-message">{status}</p>}
      </div>

      {printContent && <PrintableExport content={printContent} />}
    </div>
  );
}
