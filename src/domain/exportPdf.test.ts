import { PDFDocument } from 'pdf-lib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDiaryPdf } from './exportPdf';
import { buildExportContent } from './exportContent';
import type { DiaryEntry } from '../db/types';

function entry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    date: '2026-09-05',
    sourceModule: 'manual',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const RANGE = { from: '2026-09-01', to: '2026-09-06' };

describe('buildDiaryPdf (TRD §8, generación de PDF 100% en cliente)', () => {
  it('genera un PDF válido y legible (parseable) para un rango con registros', async () => {
    const content = buildExportContent(
      [entry({ food: 'Banana', quantity: 'todo' }), entry({ date: '2026-09-06', food: 'Arroz' })],
      RANGE,
    );
    const bytes = await buildDiaryPdf(content);

    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('un rango sin registros ("Hoy" en un dispositivo recién instalado) genera un PDF válido, no un error', async () => {
    const content = buildExportContent([], RANGE);
    const bytes = await buildDiaryPdf(content);

    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('un volumen grande de registros pagina a más de una hoja sin romper', async () => {
    const entries = Array.from({ length: 80 }, (_, i) =>
      entry({ id: `e${i}`, date: '2026-09-05', food: `Alimento ${i}`, observations: 'Observación de prueba' }),
    );
    const content = buildExportContent(entries, RANGE);
    const bytes = await buildDiaryPdf(content);

    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThan(1);
  });

  describe('RNF-003 — cero dependencia de red (criterio de aceptación a)', () => {
    const originalFetch = globalThis.fetch;
    const originalXhr = globalThis.XMLHttpRequest;

    afterEach(() => {
      globalThis.fetch = originalFetch;
      globalThis.XMLHttpRequest = originalXhr;
    });

    it('la generación del PDF nunca llama a fetch ni a XMLHttpRequest', async () => {
      const fetchSpy = vi.fn();
      const xhrSpy = vi.fn();
      globalThis.fetch = fetchSpy as unknown as typeof fetch;
      globalThis.XMLHttpRequest = xhrSpy as unknown as typeof XMLHttpRequest;

      const content = buildExportContent(
        [entry({ food: 'Banana' }), entry({ date: '2026-09-06', giSymptoms: ['gases'] })],
        RANGE,
      );
      await buildDiaryPdf(content);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
    });
  });
});
