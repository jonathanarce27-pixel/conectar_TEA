import { afterEach, describe, expect, it } from 'vitest';
import { executeAiTool } from './aiTools';
import { db } from '../db/schema';
import { clearAllUserData, DiaryRepo } from '../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

describe('executeAiTool (F7 — tools ejecutados del lado del cliente, nunca por el modelo)', () => {
  it('search_recipes: devuelve resultados reales del catálogo, con ingredient mapeado a la búsqueda', async () => {
    const result = JSON.parse(await executeAiTool('search_recipes', { ingredient: 'plátano' }));
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
  });

  it(
    'search_recipes: criterio (a) — una búsqueda de algo inexistente devuelve ' +
      'una lista vacía, nunca una receta inventada',
    async () => {
      const result = JSON.parse(await executeAiTool('search_recipes', { ingredient: 'caviar' }));
      expect(result).toEqual([]);
    },
  );

  it('search_exercises: devuelve resultados reales filtrados por grupo y duración', async () => {
    const result = JSON.parse(await executeAiTool('search_exercises', { group: 'respiracion' }));
    expect(Array.isArray(result)).toBe(true);
    expect(result.every((e: { group: string }) => e.group === 'respiracion')).toBe(true);
  });

  it('search_exercises: un grupo/duración inexistente devuelve lista vacía, no inventa', async () => {
    const result = JSON.parse(await executeAiTool('search_exercises', { maxDuration: -1 }));
    expect(result).toEqual([]);
  });

  it(
    'get_diary_summary: el resultado es un agregado — el string serializado ' +
      'NUNCA contiene los campos de un DiaryEntry individual sin agregar (ej. ' +
      '"observations" u "id" de un registro puntual)',
    async () => {
      await DiaryRepo.create({
        date: '2026-09-05',
        sourceModule: 'manual',
        food: 'Banana',
        observations: 'Dato sensible puntual que la IA nunca debería ver',
      });

      const raw = await executeAiTool('get_diary_summary', { from: '2026-09-01', to: '2026-09-06' });
      const parsed = JSON.parse(raw);

      // Es el resultado de computeSummary(): tiene forma de agregado...
      expect(parsed).toHaveProperty('mealsLogged');
      expect(parsed).toHaveProperty('totalEntries', 1);
      // ...y el texto de observaciones de un registro puntual nunca aparece
      // en el payload agregado que recibe el modelo.
      expect(raw).not.toContain('Dato sensible puntual');
      expect(parsed).not.toHaveProperty('entries');
      expect(parsed).not.toHaveProperty('observations');
    },
  );

  it('get_diary_summary con un rango sin registros no rompe: agregado en cero', async () => {
    const raw = await executeAiTool('get_diary_summary', { from: '2026-01-01', to: '2026-01-07' });
    const parsed = JSON.parse(raw);
    expect(parsed.totalEntries).toBe(0);
  });

  it('una herramienta desconocida no lanza — devuelve un error serializado', async () => {
    const raw = await executeAiTool('herramienta_inventada', {});
    expect(JSON.parse(raw)).toHaveProperty('error');
  });
});
