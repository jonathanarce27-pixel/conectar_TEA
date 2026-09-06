export { RecipeRepo } from './RecipeRepo';
export { JuiceRepo } from './JuiceRepo';
export { ExerciseRepo } from './ExerciseRepo';
export { CommunicationRepo, createCommunicationRepo } from './CommunicationRepo';
export { ProfileRepo, createProfileRepo } from './ProfileRepo';
export { FavoriteRepo, createFavoriteRepo } from './FavoriteRepo';
export { PlannerRepo, createPlannerRepo, type ShoppingListItem } from './PlannerRepo';
export { DiaryRepo, createDiaryRepo } from './DiaryRepo';
export { SettingsRepo, createSettingsRepo } from './SettingsRepo';
export { ExportRepo, createExportRepo } from './ExportRepo';

import { db, type SaboresDB } from '../db/schema';

// RNF-007: "Borrar todos los datos" — limpia todas las tablas de usuario,
// nunca el contenido del producto (Esquema de Backend §8).
export async function clearAllUserData(database: SaboresDB = db): Promise<void> {
  await database.transaction(
    'rw',
    [
      database.profile,
      database.customPictograms,
      database.favorites,
      database.plannerWeeks,
      database.diaryEntries,
      database.communicationEvents,
      database.settings,
    ],
    async () => {
      await database.profile.clear();
      await database.customPictograms.clear();
      await database.favorites.clear();
      await database.plannerWeeks.clear();
      await database.diaryEntries.clear();
      await database.communicationEvents.clear();
      await database.settings.clear();
    },
  );
}
