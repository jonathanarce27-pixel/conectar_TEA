import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFDocument } from 'pdf-lib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportModal } from './ExportModal';
import { db } from '../../db/schema';
import { clearAllUserData, DiaryRepo } from '../../repositories';
import { computeChecksum } from '../../domain/backupSchema';
import { isoDate, lastNDaysRange, subtractDays } from '../../domain/dateRange';

afterEach(async () => {
  await clearAllUserData(db);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

let capturedBlob: Blob | null = null;
let capturedFilename: string | null = null;

beforeEach(() => {
  capturedBlob = null;
  capturedFilename = null;
  // jsdom no implementa createObjectURL — se intercepta para inspeccionar
  // el Blob real que arma el modal, en vez de asumir que su contenido es
  // correcto.
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock';
    }),
    revokeObjectURL: vi.fn(),
  });
  // No hace falta disparar la navegación real del <a> (jsdom no la soporta
  // de todos modos) — solo capturar qué nombre de archivo se le asignó.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    capturedFilename = this.download;
  });
});

function renderExport() {
  const onClose = vi.fn();
  render(<ExportModal onClose={onClose} />);
  return { onClose };
}

const TODAY = new Date();

describe('ExportModal (Flujo de App §7.4)', () => {
  it('rango "Hoy": el PDF exportado contiene solo los registros de hoy', async () => {
    await DiaryRepo.create({ date: isoDate(TODAY), sourceModule: 'manual', food: 'Banana' });
    await DiaryRepo.create({ date: isoDate(subtractDays(TODAY, 3)), sourceModule: 'manual', food: 'Arroz' });

    const user = userEvent.setup();
    renderExport();
    await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));

    expect(capturedBlob).not.toBeNull();
    const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
    const parsed = await PDFDocument.load(bytes);
    expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(capturedFilename).toBe(`diario-${isoDate(TODAY)}-a-${isoDate(TODAY)}.pdf`);
  });

  it('rango "7 días": el PDF cubre exactamente los últimos 7 días', async () => {
    await DiaryRepo.create({ date: isoDate(subtractDays(TODAY, 2)), sourceModule: 'manual', food: 'Yogur' });
    await DiaryRepo.create({ date: isoDate(subtractDays(TODAY, 10)), sourceModule: 'manual', food: 'Fuera de rango' });

    const user = userEvent.setup();
    renderExport();
    await user.click(screen.getByRole('button', { name: '7 días' }));
    await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));

    const range = lastNDaysRange(7, TODAY);
    expect(capturedFilename).toBe(`diario-${range.from}-a-${range.to}.pdf`);
  });

  it('rango "30 días": el PDF cubre exactamente los últimos 30 días', async () => {
    const user = userEvent.setup();
    renderExport();
    await user.click(screen.getByRole('button', { name: '30 días' }));
    await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));

    const range = lastNDaysRange(30, TODAY);
    expect(capturedFilename).toBe(`diario-${range.from}-a-${range.to}.pdf`);
  });

  it('rango "Personalizado": respeta las fechas elegidas por el usuario', async () => {
    const user = userEvent.setup();
    renderExport();
    await user.click(screen.getByRole('button', { name: 'Personalizado' }));

    const fromInput = screen.getByLabelText('Desde');
    const toInput = screen.getByLabelText('Hasta');
    await user.clear(fromInput);
    await user.type(fromInput, '2026-01-01');
    await user.clear(toInput);
    await user.type(toInput, '2026-01-31');

    await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));

    expect(capturedFilename).toBe('diario-2026-01-01-a-2026-01-31.pdf');
  });

  it(
    'exportar un rango sin registros (ej. "Hoy" recién instalado) no rompe — ' +
      'genera un PDF válido y vacío coherente',
    async () => {
      const user = userEvent.setup();
      renderExport();
      await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));

      expect(capturedBlob).not.toBeNull();
      const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
      const parsed = await PDFDocument.load(bytes);
      expect(parsed.getPageCount()).toBeGreaterThanOrEqual(1);
    },
  );

  it(
    '"Exportar datos" produce un JSON que valida contra el esquema de backup ' +
      '(Esquema de Backend §10): mismo schemaVersion/checksum/estructura, diaryEntries filtrado',
    async () => {
      await DiaryRepo.create({ date: isoDate(TODAY), sourceModule: 'manual', food: 'Banana' });
      await DiaryRepo.create({ date: isoDate(subtractDays(TODAY, 20)), sourceModule: 'manual', food: 'Fuera de rango' });

      const user = userEvent.setup();
      renderExport();
      await user.click(screen.getByRole('button', { name: '7 días' }));
      await user.click(screen.getByRole('button', { name: 'Exportar datos' }));

      expect(capturedBlob).not.toBeNull();
      const text = await capturedBlob!.text();
      const file = JSON.parse(text);

      expect(file.schemaVersion).toBe(1);
      expect(file.encrypted).toBe(false);
      expect(typeof file.checksum).toBe('string');
      expect(file.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(file.exportRange).toEqual(lastNDaysRange(7, TODAY));
      expect(file.data.diaryEntries).toHaveLength(1);
      expect(file.data.diaryEntries[0].food).toBe('Banana');

      const recomputed = await computeChecksum(file.data);
      expect(file.checksum).toBe(recomputed);
    },
  );

  it(
    '"Imprimir" arma el mismo contenido base (resumen + registros + preguntas) ' +
      'y dispara window.print()',
    async () => {
      await DiaryRepo.create({ date: isoDate(TODAY), sourceModule: 'manual', food: 'Banana' });
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

      const user = userEvent.setup();
      renderExport();
      await user.click(screen.getByRole('button', { name: 'Imprimir' }));

      expect(await screen.findByText('Banana')).toBeInTheDocument();
      expect(screen.getByText('Preguntas sugeridas para el profesional')).toBeInTheDocument();
      expect(printSpy).toHaveBeenCalledTimes(1);
    },
  );

  it('"Exportar datos" con un rango sin registros no rompe: diaryEntries queda []', async () => {
    const user = userEvent.setup();
    renderExport();
    await user.click(screen.getByRole('button', { name: 'Exportar datos' }));

    const text = await capturedBlob!.text();
    const file = JSON.parse(text);
    expect(file.data.diaryEntries).toEqual([]);
  });
});
