import { describe, expect, it } from 'vitest';
import { buildExportContent, GENERATED_PROFESSIONAL_QUESTIONS } from './exportContent';
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

describe('buildExportContent (contenido compartido por PDF e Impresión, TRD §8)', () => {
  it('con un rango sin registros, produce contenido vacío coherente (no rompe)', () => {
    const content = buildExportContent([], { from: '2026-09-01', to: '2026-09-06' });

    expect(content.entryRows).toEqual([]);
    expect(content.summary.totalEntries).toBe(0);
    expect(content.summaryLines.length).toBeGreaterThan(0);
    expect(content.professionalQuestions).toEqual(GENERATED_PROFESSIONAL_QUESTIONS);
  });

  it('arma las filas de la tabla ordenadas por fecha, con los campos formateados', () => {
    const entries = [
      entry({ date: '2026-09-06', food: 'Banana', quantity: 'todo', giSymptoms: ['gases'] }),
      entry({ date: '2026-09-01', food: 'Arroz', bowelMovement: { bristolType: 4 } }),
    ];
    const content = buildExportContent(entries, { from: '2026-09-01', to: '2026-09-06' });

    expect(content.entryRows.map((r) => r.date)).toEqual(['2026-09-01', '2026-09-06']);
    expect(content.entryRows[0]).toMatchObject({ food: 'Arroz', bristol: '4' });
    expect(content.entryRows[1]).toMatchObject({ food: 'Banana', quantity: 'todo', giSymptoms: 'gases' });
  });

  it('reutiliza computeSummary() de F5 tal cual — el resumen refleja los mismos números', () => {
    const entries = [entry({ food: 'Banana', behavior: 'ansioso' }), entry({ food: 'Banana', behavior: 'ansioso' })];
    const content = buildExportContent(entries, { from: '2026-09-01', to: '2026-09-06' });

    expect(content.summary.mealsLogged).toBe(2);
    expect(content.summary.anxietyEpisodes).toBe(2);
    expect(content.summaryLines.some((l) => l.includes('Episodios de ansiedad: 2'))).toBe(true);
  });

  it('acepta preguntas profesionales personalizadas en vez de las genéricas por defecto', () => {
    const content = buildExportContent([], { from: '2026-09-01', to: '2026-09-06' }, ['¿Pregunta real del equipo?']);
    expect(content.professionalQuestions).toEqual(['¿Pregunta real del equipo?']);
  });
});
