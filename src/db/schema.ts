import Dexie, { type Table } from 'dexie';
import type {
  UserProfile,
  CustomPictogram,
  FavoriteEntry,
  PlannerWeek,
  DiaryEntry,
  CommunicationEvent,
  SettingEntry,
} from './types';

// Esquema de Dexie v1 — Esquema-de-Backend-Miniapp-Sabores.md §6.
// Regla obligatoria (TRD §4.3 / Esquema de Backend §9): ningún cambio de
// esquema futuro puede ser silencioso — toda modificación va en una nueva
// versión con `.upgrade()` explícito, nunca editando la versión 1 in-place.
export class SaboresDB extends Dexie {
  profile!: Table<UserProfile, string>;
  customPictograms!: Table<CustomPictogram, string>;
  favorites!: Table<FavoriteEntry, string>;
  plannerWeeks!: Table<PlannerWeek, string>;
  diaryEntries!: Table<DiaryEntry, string>;
  communicationEvents!: Table<CommunicationEvent, string>;
  settings!: Table<SettingEntry, string>;

  constructor(name = 'sabores-db') {
    super(name);

    this.version(1).stores({
      profile: 'id',
      customPictograms: 'id, categoryId, isActive, sortOrder',
      favorites: 'id, type, refId, &[type+refId], createdAt',
      plannerWeeks: 'id, createdAt',
      diaryEntries: 'id, date, foodRef, [date+behavior], [date+giSymptoms], createdAt',
      communicationEvents: 'id, pictogramId, timestamp',
      settings: 'key',
    });
  }
}

export const db = new SaboresDB();
