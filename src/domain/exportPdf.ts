import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ExportContent } from './exportContent';

// TRD §8: PDF generado 100% en cliente con pdf-lib. Regla no negociable
// (RNF-003): CERO llamadas de red — por eso solo se usan las fuentes
// estándar embebidas de pdf-lib (StandardFonts), nunca una fuente o
// imagen cargada por URL.
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 en puntos
const MARGIN = 40;
const LINE_HEIGHT = 16;

class PdfCursor {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.page = doc.addPage(PAGE_SIZE);
    this.y = PAGE_SIZE[1] - MARGIN;
  }

  private ensureSpace() {
    if (this.y < MARGIN + LINE_HEIGHT) {
      this.page = this.doc.addPage(PAGE_SIZE);
      this.y = PAGE_SIZE[1] - MARGIN;
    }
  }

  writeLine(text: string, options: { bold?: boolean; size?: number; gap?: number } = {}) {
    this.ensureSpace();
    const font = options.bold ? this.bold : this.font;
    const size = options.size ?? 11;
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font, color: rgb(0.1, 0.1, 0.1) });
    this.y -= (options.gap ?? LINE_HEIGHT);
  }

  spacer(amount = LINE_HEIGHT / 2) {
    this.y -= amount;
  }
}

/** Genera el PDF del rango (resumen + tabla de registros + preguntas para
 * el profesional) — TRD §8. Reutiliza el contenido ya calculado por
 * buildExportContent(), no recalcula nada acá. Un rango sin registros
 * produce igual un PDF válido y legible, con la tabla vacía marcada como
 * tal en vez de romper. */
export async function buildDiaryPdf(content: ExportContent): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cursor = new PdfCursor(doc, font, bold);

  cursor.writeLine('Sabores que Conectan con Amor — Reporte de Diario', { bold: true, size: 16, gap: 24 });
  cursor.writeLine(`Rango: ${content.range.from} a ${content.range.to}`, { size: 12, gap: 20 });

  cursor.writeLine('Resumen', { bold: true, size: 13, gap: 18 });
  for (const line of content.summaryLines) {
    cursor.writeLine(line);
  }
  cursor.spacer();

  cursor.writeLine('Registros del período', { bold: true, size: 13, gap: 18 });
  if (content.entryRows.length === 0) {
    cursor.writeLine('Sin registros en este rango.');
  } else {
    cursor.writeLine('Fecha · Hora · Alimento · Cant. · Textura · Conducta · Síntomas · Bristol', {
      bold: true,
      size: 9,
    });
    for (const row of content.entryRows) {
      const line = [
        row.date,
        row.time,
        row.food,
        row.quantity,
        row.texture,
        row.behavior,
        row.giSymptoms,
        row.bristol,
      ]
        .filter(Boolean)
        .join(' · ');
      cursor.writeLine(line || '(sin datos)', { size: 9 });
    }
  }
  cursor.spacer();

  cursor.writeLine('Preguntas sugeridas para el profesional', { bold: true, size: 13, gap: 18 });
  content.professionalQuestions.forEach((question, i) => {
    cursor.writeLine(`${i + 1}. ${question}`, { size: 10 });
  });

  return doc.save();
}
