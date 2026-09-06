import { describe, expect, it } from 'vitest';
import { createSettingsRepo } from './SettingsRepo';
import { freshDb } from '../test/helpers';

describe('SettingsRepo', () => {
  it('get devuelve undefined para una clave no guardada', async () => {
    const repo = createSettingsRepo(freshDb());
    expect(await repo.get('soundEnabled')).toBeUndefined();
  });

  it('set/get persisten un valor clave-valor', async () => {
    const repo = createSettingsRepo(freshDb());
    await repo.set('soundEnabled', true);
    expect(await repo.get('soundEnabled')).toBe(true);
  });

  it('getAll devuelve todas las claves guardadas como objeto', async () => {
    const repo = createSettingsRepo(freshDb());
    await repo.set('soundEnabled', false);
    await repo.set('aiCallsToday', 3);

    expect(await repo.getAll()).toEqual({ soundEnabled: false, aiCallsToday: 3 });
  });

  it('remove borra una clave', async () => {
    const repo = createSettingsRepo(freshDb());
    await repo.set('pinEnabled', true);
    await repo.remove('pinEnabled');
    expect(await repo.get('pinEnabled')).toBeUndefined();
  });
});
