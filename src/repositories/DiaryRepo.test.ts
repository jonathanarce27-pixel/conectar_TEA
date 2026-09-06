import { describe, expect, it } from 'vitest';
import { createDiaryRepo } from './DiaryRepo';
import { freshDb } from '../test/helpers';

describe('DiaryRepo', () => {
  it('create persiste un registro válido', async () => {
    const repo = createDiaryRepo(freshDb());
    const entry = await repo.create({
      date: '2026-09-05',
      sourceModule: 'manual',
      behavior: 'tranquilo',
    });

    expect(entry.id).toBeTruthy();
    expect(await repo.getById(entry.id)).toMatchObject({ date: '2026-09-05' });
  });

  it(
    'integridad referencial (Esquema de Backend §8): un registro creado con ' +
      'foodRef debe incluir también "food" como respaldo en texto plano',
    async () => {
      const repo = createDiaryRepo(freshDb());
      await expect(
        repo.create({ date: '2026-09-05', sourceModule: 'recetario', foodRef: 'R-01' }),
      ).rejects.toThrow();

      const entry = await repo.create({
        date: '2026-09-05',
        sourceModule: 'recetario',
        foodRef: 'R-01',
        food: 'Puré de calabaza y manzana',
      });
      expect(entry.food).toBe('Puré de calabaza y manzana');
    },
  );

  it('rechaza valores de enum fuera de lista (behavior, giSymptoms, bristolType)', async () => {
    const repo = createDiaryRepo(freshDb());

    // @ts-expect-error -- valor inválido a propósito
    await expect(repo.create({ date: '2026-09-05', sourceModule: 'manual', behavior: 'raro' })).rejects.toThrow();

    await expect(
      // @ts-expect-error -- valor inválido a propósito
      repo.create({ date: '2026-09-05', sourceModule: 'manual', giSymptoms: ['dolor_de_cabeza'] }),
    ).rejects.toThrow();

    await expect(
      repo.create({
        date: '2026-09-05',
        sourceModule: 'manual',
        // @ts-expect-error -- valor inválido a propósito
        bowelMovement: { bristolType: 9 },
      }),
    ).rejects.toThrow();
  });

  it('getByDate filtra por el índice de fecha', async () => {
    const repo = createDiaryRepo(freshDb());
    await repo.create({ date: '2026-09-05', sourceModule: 'manual' });
    await repo.create({ date: '2026-09-06', sourceModule: 'manual' });

    const results = await repo.getByDate('2026-09-05');
    expect(results.length).toBe(1);
    expect(results[0].date).toBe('2026-09-05');
  });

  it('getByDateRange devuelve un rango inclusivo', async () => {
    const repo = createDiaryRepo(freshDb());
    await repo.create({ date: '2026-09-01', sourceModule: 'manual' });
    await repo.create({ date: '2026-09-05', sourceModule: 'manual' });
    await repo.create({ date: '2026-09-10', sourceModule: 'manual' });

    const results = await repo.getByDateRange('2026-09-01', '2026-09-05');
    expect(results.map((r) => r.date).sort()).toEqual(['2026-09-01', '2026-09-05']);
  });

  it('update modifica un registro existente y remove lo borra', async () => {
    const repo = createDiaryRepo(freshDb());
    const entry = await repo.create({ date: '2026-09-05', sourceModule: 'manual' });

    await repo.update(entry.id, { observations: 'Comió sin dificultad' });
    expect((await repo.getById(entry.id))?.observations).toBe('Comió sin dificultad');

    await repo.remove(entry.id);
    expect(await repo.getById(entry.id)).toBeUndefined();
  });

  it('update no rompe los índices compuestos [date+behavior] al editar esos campos', async () => {
    const repo = createDiaryRepo(freshDb());
    const entry = await repo.create({ date: '2026-09-05', sourceModule: 'manual', behavior: 'tranquilo' });

    await repo.update(entry.id, { date: '2026-09-06', behavior: 'ansioso' });

    expect(await repo.getByDate('2026-09-05')).toEqual([]);
    const moved = await repo.getByDate('2026-09-06');
    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatchObject({ id: entry.id, behavior: 'ansioso' });
  });

  describe('getPaginated (Historial completo, Flujo de App §7.3)', () => {
    it('devuelve la página pedida y el total, más reciente primero', async () => {
      const repo = createDiaryRepo(freshDb());
      for (let i = 1; i <= 5; i++) {
        await repo.create({ date: `2026-09-0${i}`, sourceModule: 'manual' });
      }

      const page0 = await repo.getPaginated({ page: 0, pageSize: 2 });
      expect(page0.total).toBe(5);
      expect(page0.entries.map((e) => e.date)).toEqual(['2026-09-05', '2026-09-04']);

      const page1 = await repo.getPaginated({ page: 1, pageSize: 2 });
      expect(page1.entries.map((e) => e.date)).toEqual(['2026-09-03', '2026-09-02']);
    });

    it('con dateFrom/dateTo, acota el total y la página al rango (usa el índice date, no toda la tabla)', async () => {
      const repo = createDiaryRepo(freshDb());
      await repo.create({ date: '2026-08-01', sourceModule: 'manual' });
      await repo.create({ date: '2026-09-05', sourceModule: 'manual' });
      await repo.create({ date: '2026-09-06', sourceModule: 'manual' });

      const result = await repo.getPaginated({ page: 0, pageSize: 10, dateFrom: '2026-09-01', dateTo: '2026-09-30' });
      expect(result.total).toBe(2);
      expect(result.entries.map((e) => e.date).sort()).toEqual(['2026-09-05', '2026-09-06']);
    });
  });
});
