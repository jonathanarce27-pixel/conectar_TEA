import { db, type SaboresDB } from '../db/schema';
import { newId } from '../db/id';
import type { FavoriteEntry, FavoriteType } from '../db/types';
import { assertEnum, FAVORITE_TYPES } from '../db/validation';
import { ExerciseRepo } from './ExerciseRepo';
import { JuiceRepo } from './JuiceRepo';
import { RecipeRepo } from './RecipeRepo';

// Integridad referencial (Esquema de Backend §8): si el refId ya no existe
// en el catálogo actual, el registro NO se borra — solo se oculta de la
// lista resuelta, por si una futura versión del build lo reincorpora.
function catalogHasEntry(type: FavoriteType, refId: string): boolean {
  switch (type) {
    case 'recipe':
      return RecipeRepo.exists(refId);
    case 'juice':
      return JuiceRepo.exists(refId);
    case 'exercise':
      return ExerciseRepo.exists(refId);
  }
}

export function createFavoriteRepo(database: SaboresDB = db) {
  return {
    async add(type: FavoriteType, refId: string): Promise<FavoriteEntry> {
      assertEnum('type', type, FAVORITE_TYPES);

      const existing = await database.favorites
        .where('[type+refId]')
        .equals([type, refId])
        .first();
      if (existing) return existing;

      const entry: FavoriteEntry = {
        id: newId(),
        type,
        refId,
        createdAt: new Date().toISOString(),
      };
      await database.favorites.add(entry);
      return entry;
    },

    async remove(id: string): Promise<void> {
      await database.favorites.delete(id);
    },

    async isFavorite(type: FavoriteType, refId: string): Promise<boolean> {
      const existing = await database.favorites
        .where('[type+refId]')
        .equals([type, refId])
        .first();
      return Boolean(existing);
    },

    /** Lista cruda, incluye entradas cuyo refId ya no exista en el catálogo. */
    async listAll(): Promise<FavoriteEntry[]> {
      return database.favorites.toArray();
    },

    /** Lista solo las entradas cuyo refId todavía resuelve contra el catálogo actual. */
    async listResolved(): Promise<FavoriteEntry[]> {
      const all = await database.favorites.toArray();
      return all.filter((f) => catalogHasEntry(f.type, f.refId));
    },
  };
}

export const FavoriteRepo = createFavoriteRepo();
