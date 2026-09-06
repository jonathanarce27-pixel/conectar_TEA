import { describe, expect, it } from 'vitest';
import { buildBackupFile, buildFilteredBackupFile, computeChecksum, type BackupData } from './backupSchema';

function emptyData(): BackupData {
  return {
    profile: null,
    customPictograms: [],
    favorites: [],
    plannerWeeks: [],
    diaryEntries: [],
    communicationEvents: [],
    settings: {},
  };
}

describe('backupSchema (Esquema de Backend §10)', () => {
  it('buildBackupFile arma la envoltura exacta del esquema documentado', async () => {
    const file = await buildBackupFile(emptyData(), '1.2.3');

    expect(file.schemaVersion).toBe(1);
    expect(file.appVersion).toBe('1.2.3');
    expect(file.encrypted).toBe(false);
    expect(file.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(new Date(file.exportedAt).toString()).not.toBe('Invalid Date');
    expect(file.data).toEqual(emptyData());
  });

  it('el checksum es determinista para los mismos datos y cambia si los datos cambian', async () => {
    const data = emptyData();
    const checksumA = await computeChecksum(data);
    const checksumB = await computeChecksum(data);
    expect(checksumA).toBe(checksumB);

    const otherData = { ...data, favorites: [{ id: 'f1', type: 'recipe' as const, refId: 'R-01', createdAt: 'x' }] };
    const checksumC = await computeChecksum(otherData);
    expect(checksumC).not.toBe(checksumA);
  });

  it(
    'buildFilteredBackupFile agrega exportRange sin cambiar el resto del ' +
      'esquema (mismo formato que un backup completo)',
    async () => {
      const data = emptyData();
      const full = await buildBackupFile(data, '1.0.0');
      const filtered = await buildFilteredBackupFile(data, '1.0.0', { from: '2026-09-01', to: '2026-09-06' });

      expect(filtered.exportRange).toEqual({ from: '2026-09-01', to: '2026-09-06' });
      expect(filtered.schemaVersion).toBe(full.schemaVersion);
      expect(filtered.encrypted).toBe(full.encrypted);
      // Mismos datos de entrada -> mismo checksum (la envoltura no filtra
      // por sí sola; quien llama es responsable de pasar diaryEntries ya
      // acotado, como hace ExportRepo.exportFilteredBackup).
      expect(filtered.checksum).toBe(full.checksum);
    },
  );
});
