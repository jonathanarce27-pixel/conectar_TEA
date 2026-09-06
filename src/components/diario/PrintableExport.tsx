import { createPortal } from 'react-dom';
import type { ExportContent } from '../../domain/exportContent';
import './printableExport.css';

export interface PrintableExportProps {
  content: ExportContent;
}

// Se renderiza fuera de #root (React Portal a document.body) para que la
// regla `@media print { #root { display: none; } }` pueda ocultar el resto
// de la app sin ocultarse a sí misma (Flujo de App §7.4).
export function PrintableExport({ content }: PrintableExportProps) {
  return createPortal(
    <div className="printable-export" aria-hidden="true">
      <h1>Sabores que Conectan con Amor — Reporte de Diario</h1>
      <p>
        Rango: {content.range.from} a {content.range.to}
      </p>

      <h2>Resumen</h2>
      <ul>
        {content.summaryLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <h2>Registros del período</h2>
      {content.entryRows.length === 0 ? (
        <p>Sin registros en este rango.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Alimento</th>
              <th>Cantidad</th>
              <th>Textura</th>
              <th>Conducta</th>
              <th>Síntomas</th>
              <th>Bristol</th>
            </tr>
          </thead>
          <tbody>
            {content.entryRows.map((row, i) => (
              <tr key={i}>
                <td>{row.date}</td>
                <td>{row.time}</td>
                <td>{row.food}</td>
                <td>{row.quantity}</td>
                <td>{row.texture}</td>
                <td>{row.behavior}</td>
                <td>{row.giSymptoms}</td>
                <td>{row.bristol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Preguntas sugeridas para el profesional</h2>
      <ol>
        {content.professionalQuestions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>

      <p className="page-footer">Generado el {new Date().toLocaleString('es')} — Sabores que Conectan con Amor</p>
    </div>,
    document.body,
  );
}
