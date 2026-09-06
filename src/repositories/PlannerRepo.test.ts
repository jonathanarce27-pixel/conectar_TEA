import { describe, expect, it } from 'vitest';
import { createPlannerRepo } from './PlannerRepo';
import { freshDb } from '../test/helpers';

describe('PlannerRepo', () => {
  it('createWeek crea una semana con los 7 días vacíos', async () => {
    const repo = createPlannerRepo(freshDb());
    const week = await repo.createWeek('2026-W37');

    expect(Object.keys(week.days).sort()).toEqual(
      ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].sort(),
    );
  });

  it('assignSlot crea la semana si no existe y escribe el slot pedido', async () => {
    const repo = createPlannerRepo(freshDb());
    const week = await repo.assignSlot('2026-W38', 'martes', 'almuerzo', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });

    expect(week.days.martes.almuerzo?.refId).toBe('R-01');
  });

  it('assignSlot no pisa otros momentos del mismo día', async () => {
    const repo = createPlannerRepo(freshDb());
    await repo.assignSlot('2026-W39', 'lunes', 'desayuno', {
      refType: 'juice',
      refId: 'J-01',
      done: false,
    });
    const week = await repo.assignSlot('2026-W39', 'lunes', 'almuerzo', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });

    expect(week.days.lunes.desayuno?.refId).toBe('J-01');
    expect(week.days.lunes.almuerzo?.refId).toBe('R-01');
  });

  it('rechaza un valor de acceptance fuera del enum cerrado', async () => {
    const repo = createPlannerRepo(freshDb());
    await expect(
      repo.assignSlot('2026-W40', 'lunes', 'cena', {
        refType: 'recipe',
        refId: 'R-01',
        done: true,
        // @ts-expect-error -- valor inválido a propósito
        acceptance: 'comio-regular',
      }),
    ).rejects.toThrow();
  });

  it('cloneWeek clona los slots de una semana previa con nuevo id', async () => {
    const repo = createPlannerRepo(freshDb());
    await repo.assignSlot('2026-W41', 'miercoles', 'cena', {
      refType: 'recipe',
      refId: 'R-02',
      done: true,
      acceptance: 'comio-todo',
    });

    const clone = await repo.cloneWeek('2026-W41', '2026-W42');

    expect(clone?.id).toBe('2026-W42');
    expect(clone?.days.miercoles.cena?.refId).toBe('R-02');

    // Debe ser una copia independiente, no una referencia compartida.
    await repo.assignSlot('2026-W42', 'miercoles', 'cena', {
      refType: 'recipe',
      refId: 'R-03',
      done: false,
    });
    const original = await repo.getWeek('2026-W41');
    expect(original?.days.miercoles.cena?.refId).toBe('R-02');
  });

  it('cloneWeek devuelve undefined si la semana origen no existe', async () => {
    const repo = createPlannerRepo(freshDb());
    expect(await repo.cloneWeek('2026-W00', '2026-W01')).toBeUndefined();
  });

  it('deleteWeek borra la semana completa', async () => {
    const repo = createPlannerRepo(freshDb());
    await repo.createWeek('2026-W43');
    await repo.deleteWeek('2026-W43');
    expect(await repo.getWeek('2026-W43')).toBeUndefined();
  });

  it('clearSlot ("Quitar", F3) limpia un slot puntual sin afectar los demás', async () => {
    const repo = createPlannerRepo(freshDb());
    await repo.assignSlot('2026-W44', 'jueves', 'cena', { refType: 'recipe', refId: 'R-01', done: false });
    await repo.assignSlot('2026-W44', 'jueves', 'desayuno', { refType: 'juice', refId: 'J-01', done: false });

    await repo.clearSlot('2026-W44', 'jueves', 'cena');

    const week = await repo.getWeek('2026-W44');
    expect(week?.days.jueves.cena).toBeUndefined();
    expect(week?.days.jueves.desayuno?.refId).toBe('J-01');
  });

  it('clearSlot no rompe si la semana no existe todavía', async () => {
    const repo = createPlannerRepo(freshDb());
    await expect(repo.clearSlot('2026-W99', 'lunes', 'cena')).resolves.toBeUndefined();
  });

  describe('getShoppingList (F3, Flujo de App §6)', () => {
    it('devuelve [] para una semana sin asignaciones', async () => {
      const repo = createPlannerRepo(freshDb());
      await repo.createWeek('2026-W45');
      expect(await repo.getShoppingList('2026-W45')).toEqual([]);
    });

    it('se recalcula al AGREGAR una asignación', async () => {
      const repo = createPlannerRepo(freshDb());
      await repo.assignSlot('2026-W46', 'lunes', 'almuerzo', {
        refType: 'recipe',
        refId: 'R-01',
        done: false,
      });

      const list = await repo.getShoppingList('2026-W46');
      const patatas = list.find((i) => i.name === 'patatas medianas');
      expect(patatas).toMatchObject({ quantityDisplay: '2' });
    });

    it('se recalcula al MODIFICAR una asignación (cambia la receta del mismo slot)', async () => {
      const repo = createPlannerRepo(freshDb());
      await repo.assignSlot('2026-W47', 'lunes', 'almuerzo', {
        refType: 'recipe',
        refId: 'R-01',
        done: false,
      });
      // "Modificar": se reasigna el mismo día/momento a otra receta.
      await repo.assignSlot('2026-W47', 'lunes', 'almuerzo', {
        refType: 'recipe',
        refId: 'R-02',
        done: false,
      });

      const list = await repo.getShoppingList('2026-W47');
      expect(list.find((i) => i.name === 'patatas medianas')).toBeUndefined();
      expect(list.find((i) => i.name === 'huevo')).toBeTruthy();
    });

    it('se recalcula al QUITAR una asignación', async () => {
      const repo = createPlannerRepo(freshDb());
      await repo.assignSlot('2026-W48', 'lunes', 'almuerzo', {
        refType: 'recipe',
        refId: 'R-01',
        done: false,
      });
      await repo.clearSlot('2026-W48', 'lunes', 'almuerzo');

      expect(await repo.getShoppingList('2026-W48')).toEqual([]);
    });

    it('suma cantidades numéricas de la misma unidad entre distintas comidas', async () => {
      const repo = createPlannerRepo(freshDb());
      // R-01 y R-05 (Jugo Piña y Manzana no aplica, uso dos recetas reales
      // que comparten "manzanas" no es el caso — probamos con dos slots de
      // la misma receta en días distintos, que sí deben sumar 2+2=4 patatas.
      await repo.assignSlot('2026-W49', 'lunes', 'almuerzo', { refType: 'recipe', refId: 'R-01', done: false });
      await repo.assignSlot('2026-W49', 'martes', 'cena', { refType: 'recipe', refId: 'R-01', done: false });

      const list = await repo.getShoppingList('2026-W49');
      const patatas = list.find((i) => i.name === 'patatas medianas');
      expect(patatas?.quantityDisplay).toBe('4');
    });
  });
});
