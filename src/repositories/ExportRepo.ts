import { version as appVersion } from '../../package.json';
import { db, type SaboresDB } from '../db/schema';
import {
  buildBackupFile,
  buildFilteredBackupFile,
  type BackupData,
  type BackupFile,
  type FilteredBackupFile,
} from '../domain/backupSchema';

async function readAllData(database: SaboresDB): Promise<BackupData> {
  const [profile, customPictograms, favorites, plannerWeeks, diaryEntries, communicationEvents, settingsRows] =
    await Promise.all([
      database.profile.toArray(),
      database.customPictograms.toArray(),
      database.favorites.toArray(),
      database.plannerWeeks.toArray(),
      database.diaryEntries.toArray(),
      database.communicationEvents.toArray(),
      database.settings.toArray(),
    ]);

  const settings: Record<string, unknown> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  return {
    profile: profile[0] ?? null,
    customPictograms,
    favorites,
    plannerWeeks,
    diaryEntries,
    communicationEvents,
    settings,
  };
}

export function createExportRepo(database: SaboresDB = db) {
  return {
    /** Backup completo (Esquema de Backend §10) — sin filtrar. */
    async exportFullBackup(): Promise<BackupFile> {
      const data = await readAllData(database);
      return buildBackupFile(data, appVersion);
    },

    /** "Exportar datos" de Historial (Flujo de App §7.4): mismo esquema,
     * `diaryEntries` acotado al rango vía el índice `date` (no toArray()
     * completo filtrado en memoria), más `exportRange`. */
    async exportFilteredBackup(range: { from: string; to: string }): Promise<FilteredBackupFile> {
      const [data, diaryEntries] = await Promise.all([
        readAllData(database),
        database.diaryEntries.where('date').between(range.from, range.to, true, true).toArray(),
      ]);

      return buildFilteredBackupFile({ ...data, diaryEntries }, appVersion, range);
    },
  };
}

export const ExportRepo = createExportRepo();
