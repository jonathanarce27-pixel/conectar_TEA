import { db, type SaboresDB } from '../db/schema';
import { newId } from '../db/id';
import type { DiaryEntry } from '../db/types';
import {
  assertEnum,
  assertEnumArray,
  BRISTOL_TYPES,
  DIARY_BEHAVIORS,
  DIARY_QUANTITIES,
  DIARY_SOURCE_MODULES,
  DIARY_TEXTURES,
  EMOTIONS,
  EXPERIENCE_LEVELS,
  GI_SYMPTOMS,
} from '../db/validation';

function validateEntry(entry: Partial<DiaryEntry>): void {
  assertEnum('quantity', entry.quantity, DIARY_QUANTITIES);
  assertEnum('texture', entry.texture, DIARY_TEXTURES);
  assertEnum('behavior', entry.behavior, DIARY_BEHAVIORS);
  assertEnumArray('giSymptoms', entry.giSymptoms, GI_SYMPTOMS);
  assertEnum('emotionBefore', entry.emotionBefore, EMOTIONS);
  assertEnum('emotionAfter', entry.emotionAfter, EMOTIONS);
  assertEnum('experienceLevel', entry.experienceLevel, EXPERIENCE_LEVELS);
  assertEnum('sourceModule', entry.sourceModule, DIARY_SOURCE_MODULES);
  if (entry.bowelMovement) {
    assertEnum('bowelMovement.bristolType', entry.bowelMovement.bristolType, BRISTOL_TYPES);
  }
  // Regla de integridad (Esquema de Backend §8): todo registro con foodRef
  // debe conservar también el nombre en texto plano como respaldo, para no
  // depender de que la receta siga existiendo en una versión futura del build.
  if (entry.foodRef && !entry.food) {
    throw new Error(
      'DiaryEntry con foodRef debe incluir también "food" (texto de respaldo) — Esquema de Backend §8.',
    );
  }
}

export function createDiaryRepo(database: SaboresDB = db) {
  return {
    async create(input: Omit<DiaryEntry, 'id' | 'createdAt'>): Promise<DiaryEntry> {
      validateEntry(input);
      const entry: DiaryEntry = {
        ...input,
        id: newId(),
        createdAt: new Date().toISOString(),
      };
      await database.diaryEntries.add(entry);
      return entry;
    },

    async getById(id: string): Promise<DiaryEntry | undefined> {
      return database.diaryEntries.get(id);
    },

    async update(id: string, changes: Partial<Omit<DiaryEntry, 'id'>>): Promise<void> {
      validateEntry(changes);
      await database.diaryEntries.update(id, changes);
    },

    async remove(id: string): Promise<void> {
      await database.diaryEntries.delete(id);
    },

    async getByDate(date: string): Promise<DiaryEntry[]> {
      return database.diaryEntries.where('date').equals(date).toArray();
    },

    /** Rango inclusivo [from, to] de fechas ISO YYYY-MM-DD (Esquema de Backend §7). */
    async getByDateRange(from: string, to: string): Promise<DiaryEntry[]> {
      return database.diaryEntries.where('date').between(from, to, true, true).toArray();
    },

    async getAll(): Promise<DiaryEntry[]> {
      return database.diaryEntries.toArray();
    },

    /**
     * Historial completo paginado (Flujo de App §7.3). Recorre el índice
     * `date` con un cursor (orderBy + offset/limit de Dexie), nunca
     * `toArray()` + slice en memoria — con meses de historial, offset/limit
     * sobre un índice sigue leyendo solo la página pedida del store, no la
     * tabla entera. Si se pasa `dateFilter`, usa `[date+behavior]`-style
     * `between()` acotado en vez de recorrer todo el índice.
     */
    async getPaginated(options: {
      page: number;
      pageSize: number;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{ entries: DiaryEntry[]; total: number }> {
      const { page, pageSize, dateFrom, dateTo } = options;
      const offset = page * pageSize;

      const collection =
        dateFrom && dateTo
          ? database.diaryEntries.where('date').between(dateFrom, dateTo, true, true)
          : database.diaryEntries.orderBy('date');

      const total = await collection.count();
      const entries = await collection.reverse().offset(offset).limit(pageSize).toArray();

      return { entries, total };
    },
  };
}

export const DiaryRepo = createDiaryRepo();
