import { describe, expect, it } from 'vitest';
import { computeSummary } from './computeSummary';
import type { DiaryEntry } from '../db/types';

function entry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    date: '2026-09-01',
    sourceModule: 'manual',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const RANGE = { from: '2026-08-01', to: '2026-09-06' };

describe('computeSummary (agregación pura, Esquema de Backend §11 / PRD §31)', () => {
  it('con cero registros en el rango, devuelve un resumen vacío/cero coherente, sin romper', () => {
    const summary = computeSummary([], RANGE);

    expect(summary.totalEntries).toBe(0);
    expect(summary.distinctFoodsCount).toBe(0);
    expect(summary.mealsLogged).toBe(0);
    expect(summary.rejections).toBe(0);
    expect(summary.symptomsRecorded).toBe(0);
    expect(summary.symptomCounts).toEqual({});
    expect(summary.anxietyEpisodes).toBe(0);
    expect(summary.texturesUsed).toEqual({});
    expect(summary.favoriteFoods).toEqual([]);
    expect(summary.rejectedFoods).toEqual([]);
    expect(summary.range).toEqual(RANGE);
  });

  it('cuenta alimentos distintos y comidas registradas', () => {
    const entries = [
      entry({ food: 'Puré de zanahoria' }),
      entry({ food: 'Puré de zanahoria' }),
      entry({ food: 'Pollo al horno' }),
      entry({}), // sin food: no debe contar como comida registrada
    ];
    const summary = computeSummary(entries, RANGE);

    expect(summary.distinctFoodsCount).toBe(2);
    expect(summary.mealsLogged).toBe(3);
  });

  it('cuenta rechazos por experienceLevel o por behavior, sin duplicar si coinciden ambos', () => {
    const entries = [
      entry({ experienceLevel: 'rechazo' }),
      entry({ behavior: 'rechazo' }),
      entry({ experienceLevel: 'rechazo', behavior: 'rechazo' }), // cuenta 1, no 2
      entry({ experienceLevel: 'comio' }),
    ];
    const summary = computeSummary(entries, RANGE);

    expect(summary.rejections).toBe(3);
  });

  it('cuenta episodios de ansiedad exactamente cuando behavior === "ansioso"', () => {
    const entries = [
      entry({ behavior: 'ansioso' }),
      entry({ behavior: 'ansioso' }),
      entry({ behavior: 'tranquilo' }),
    ];
    const summary = computeSummary(entries, RANGE);

    expect(summary.anxietyEpisodes).toBe(2);
  });

  it('agrega síntomas GI registrados y su desglose por tipo', () => {
    const entries = [
      entry({ giSymptoms: ['gases', 'reflujo'] }),
      entry({ giSymptoms: ['gases'] }),
      entry({ giSymptoms: [] }), // vacío no cuenta como "registrado"
      entry({}),
    ];
    const summary = computeSummary(entries, RANGE);

    expect(summary.symptomsRecorded).toBe(2);
    expect(summary.symptomCounts).toEqual({ gases: 2, reflujo: 1 });
  });

  it('agrega texturas utilizadas', () => {
    const entries = [entry({ texture: 'P' }), entry({ texture: 'P' }), entry({ texture: 'T' })];
    const summary = computeSummary(entries, RANGE);

    expect(summary.texturesUsed).toEqual({ P: 2, T: 1 });
  });

  it('clasifica alimentos favoritos (con aceptación, sin rechazo) y rechazados (con al menos un rechazo)', () => {
    const entries = [
      entry({ food: 'Banana', quantity: 'todo' }),
      entry({ food: 'Banana', experienceLevel: 'probo' }),
      entry({ food: 'Brócoli', experienceLevel: 'rechazo' }),
      // Un alimento con una aceptación y un rechazo cuenta como rechazado
      // (el rechazo pesa más) — decisión documentada en computeSummary.ts.
      entry({ food: 'Arroz', quantity: 'todo' }),
      entry({ food: 'Arroz', behavior: 'rechazo' }),
    ];
    const summary = computeSummary(entries, RANGE);

    expect(summary.favoriteFoods).toEqual(['Banana']);
    expect(summary.rejectedFoods).toEqual(['Arroz', 'Brócoli']);
  });

  it('maneja un volumen sintético grande (90-120 días de registros) sin romper', () => {
    const entries: DiaryEntry[] = [];
    const foods = ['Puré de calabaza', 'Pollo al horno', 'Arroz', 'Banana', 'Yogur'];
    const behaviors: DiaryEntry['behavior'][] = ['tranquilo', 'inquieto', 'ansioso', 'cooperativo', 'rechazo'];

    for (let day = 0; day < 110; day++) {
      const date = new Date(2026, 0, 1 + day).toISOString().slice(0, 10);
      entries.push(
        entry({
          date,
          food: foods[day % foods.length],
          quantity: day % 3 === 0 ? 'todo' : 'poco',
          texture: (['P', 'T', 'C', 'M'] as const)[day % 4],
          behavior: behaviors[day % behaviors.length],
          giSymptoms: day % 5 === 0 ? ['gases'] : undefined,
        }),
      );
    }

    const summary = computeSummary(entries, { from: '2026-01-01', to: '2026-04-20' });

    expect(summary.totalEntries).toBe(110);
    expect(summary.distinctFoodsCount).toBe(5);
    expect(summary.mealsLogged).toBe(110);
    expect(summary.anxietyEpisodes).toBe(22); // día % 5 === 2, cada 5 días
    expect(summary.symptomsRecorded).toBe(22); // día % 5 === 0
  });
});
