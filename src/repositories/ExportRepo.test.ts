import { describe, expect, it } from 'vitest';
import { createExportRepo } from './ExportRepo';
import { createDiaryRepo } from './DiaryRepo';
import { createProfileRepo } from './ProfileRepo';
import { createSettingsRepo } from './SettingsRepo';
import { computeChecksum } from '../domain/backupSchema';
import { freshDb } from '../test/helpers';

describe('ExportRepo (Flujo de App §7.4 / Esquema de Backend §10)', () => {
  it('exportFullBackup arma el esquema completo con las 7 tablas y checksum válido', async () => {
    const database = freshDb();
    await createProfileRepo(database).createOrUpdate({
      primaryUser: 'ambos',
      acceptedFoods: ['Banana'],
      rejectedFoods: [],
      acceptedTextures: [],
      onboardingStep: 7,
    });
    await createSettingsRepo(database).set('soundEnabled', true);
    await createDiaryRepo(database).create({ date: '2026-09-05', sourceModule: 'manual' });

    const file = await createExportRepo(database).exportFullBackup();

    expect(file.schemaVersion).toBe(1);
    expect(file.data.profile).toMatchObject({ primaryUser: 'ambos', acceptedFoods: ['Banana'] });
    expect(file.data.settings).toEqual({ soundEnabled: true });
    expect(file.data.diaryEntries).toHaveLength(1);

    const recomputed = await computeChecksum(file.data);
    expect(file.checksum).toBe(recomputed);
  });

  it('exportFullBackup con una base recién creada (sin profile) no rompe: profile queda null', async () => {
    const file = await createExportRepo(freshDb()).exportFullBackup();
    expect(file.data.profile).toBeNull();
    expect(file.data.diaryEntries).toEqual([]);
  });

  it(
    'exportFilteredBackup acota diaryEntries al rango (vía índice date, no ' +
      'toArray() completo) y agrega exportRange, sin tocar el resto de los datos',
    async () => {
      const database = freshDb();
      await createProfileRepo(database).createOrUpdate({
        primaryUser: 'nino',
        acceptedFoods: [],
        rejectedFoods: [],
        acceptedTextures: [],
        onboardingStep: 7,
      });
      const diary = createDiaryRepo(database);
      await diary.create({ date: '2026-08-01', sourceModule: 'manual' });
      await diary.create({ date: '2026-09-05', sourceModule: 'manual' });
      await diary.create({ date: '2026-09-06', sourceModule: 'manual' });

      const filtered = await createExportRepo(database).exportFilteredBackup({
        from: '2026-09-01',
        to: '2026-09-30',
      });

      expect(filtered.exportRange).toEqual({ from: '2026-09-01', to: '2026-09-30' });
      expect(filtered.data.diaryEntries.map((e) => e.date).sort()).toEqual(['2026-09-05', '2026-09-06']);
      expect(filtered.data.profile).toMatchObject({ primaryUser: 'nino' });

      const recomputed = await computeChecksum(filtered.data);
      expect(filtered.checksum).toBe(recomputed);
    },
  );

  it('exportFilteredBackup con un rango sin registros no rompe: diaryEntries queda []', async () => {
    const database = freshDb();
    await createDiaryRepo(database).create({ date: '2026-01-01', sourceModule: 'manual' });

    const filtered = await createExportRepo(database).exportFilteredBackup({
      from: '2026-09-01',
      to: '2026-09-06',
    });

    expect(filtered.data.diaryEntries).toEqual([]);
  });
});
