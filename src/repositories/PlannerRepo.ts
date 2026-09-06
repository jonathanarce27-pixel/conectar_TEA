import { db, type SaboresDB } from '../db/schema';
import type { DayOfWeek, MealSlot, PlannerSlot, PlannerWeek } from '../db/types';
import { assertEnum, PLANNER_ACCEPTANCE } from '../db/validation';
import { RecipeRepo } from './RecipeRepo';
import { JuiceRepo } from './JuiceRepo';

export interface ShoppingListItem {
  name: string;
  unit: string;
  /** Suma numérica si todas las cantidades son números; si no, se listan
   * juntas tal cual (ej. una receta pide "Una pizca" y no se puede sumar
   * con "2"). Flujo de App §6: "sin input manual", cálculo puro. */
  quantityDisplay: string;
}

function emptyDays(): PlannerWeek['days'] {
  return {
    lunes: {},
    martes: {},
    miercoles: {},
    jueves: {},
    viernes: {},
    sabado: {},
    domingo: {},
  };
}

export function createPlannerRepo(database: SaboresDB = db) {
  return {
    async getWeek(id: string): Promise<PlannerWeek | undefined> {
      return database.plannerWeeks.get(id);
    },

    async createWeek(id: string): Promise<PlannerWeek> {
      const now = new Date().toISOString();
      const week: PlannerWeek = { id, days: emptyDays(), createdAt: now, updatedAt: now };
      await database.plannerWeeks.add(week);
      return week;
    },

    async assignSlot(
      weekId: string,
      day: DayOfWeek,
      meal: MealSlot,
      slot: PlannerSlot,
    ): Promise<PlannerWeek> {
      if (slot.acceptance) {
        assertEnum('acceptance', slot.acceptance, PLANNER_ACCEPTANCE);
      }

      let week = await database.plannerWeeks.get(weekId);
      if (!week) {
        week = { id: weekId, days: emptyDays(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }

      week.days[day] = { ...week.days[day], [meal]: slot };
      week.updatedAt = new Date().toISOString();

      await database.plannerWeeks.put(week);
      return week;
    },

    /** Clona una semana previa a un nuevo id (Flujo de App §6, "Reutilizar semana anterior"). */
    async cloneWeek(fromId: string, newId: string): Promise<PlannerWeek | undefined> {
      const source = await database.plannerWeeks.get(fromId);
      if (!source) return undefined;

      const now = new Date().toISOString();
      const clone: PlannerWeek = {
        id: newId,
        days: JSON.parse(JSON.stringify(source.days)),
        createdAt: now,
        updatedAt: now,
      };
      await database.plannerWeeks.put(clone);
      return clone;
    },

    async deleteWeek(id: string): Promise<void> {
      await database.plannerWeeks.delete(id);
    },

    /** "Quitar" (Flujo de App §6): limpia un slot puntual, no toda la semana. */
    async clearSlot(weekId: string, day: DayOfWeek, meal: MealSlot): Promise<void> {
      const week = await database.plannerWeeks.get(weekId);
      if (!week) return;

      const days = { ...week.days[day] };
      delete days[meal];
      week.days[day] = days;
      week.updatedAt = new Date().toISOString();

      await database.plannerWeeks.put(week);
    },

    /** Deriva la lista de la compra sumando ingredients[] de las recetas y
     * jugos asignados en la semana (Flujo de App §6) — cálculo puro sobre
     * contenido ya existente, sin input manual. */
    async getShoppingList(weekId: string): Promise<ShoppingListItem[]> {
      const week = await database.plannerWeeks.get(weekId);
      if (!week) return [];

      const grouped = new Map<string, { name: string; unit: string; quantities: string[] }>();

      for (const day of Object.values(week.days)) {
        for (const slot of Object.values(day)) {
          if (!slot || !slot.refId || slot.refType === 'custom') continue;

          const content =
            slot.refType === 'recipe' ? RecipeRepo.getById(slot.refId) : JuiceRepo.getById(slot.refId);
          if (!content) continue;

          for (const ing of content.ingredients) {
            const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`;
            const entry = grouped.get(key) ?? { name: ing.name, unit: ing.unit, quantities: [] };
            if (ing.quantity) entry.quantities.push(ing.quantity);
            grouped.set(key, entry);
          }
        }
      }

      return Array.from(grouped.values())
        .map((entry) => {
          const allNumeric =
            entry.quantities.length > 0 && entry.quantities.every((q) => q.trim() !== '' && !Number.isNaN(Number(q)));
          const quantityDisplay = allNumeric
            ? String(entry.quantities.reduce((sum, q) => sum + Number(q), 0))
            : entry.quantities.join(' + ');
          return { name: entry.name, unit: entry.unit, quantityDisplay };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },
  };
}

export const PlannerRepo = createPlannerRepo();
