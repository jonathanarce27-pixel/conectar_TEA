import { db, type SaboresDB } from '../db/schema';
import type { SettingsMap } from '../db/types';

export function createSettingsRepo(database: SaboresDB = db) {
  return {
    async get<K extends keyof SettingsMap>(key: K): Promise<SettingsMap[K] | undefined> {
      const entry = await database.settings.get(key);
      return entry?.value as SettingsMap[K] | undefined;
    },

    async set<K extends keyof SettingsMap>(key: K, value: SettingsMap[K]): Promise<void> {
      await database.settings.put({ key, value });
    },

    async getAll(): Promise<Partial<SettingsMap>> {
      const entries = await database.settings.toArray();
      return Object.fromEntries(entries.map((e) => [e.key, e.value])) as Partial<SettingsMap>;
    },

    async remove(key: keyof SettingsMap): Promise<void> {
      await database.settings.delete(key);
    },
  };
}

export const SettingsRepo = createSettingsRepo();
