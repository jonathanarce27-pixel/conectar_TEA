import { describe, expect, it } from 'vitest';
import { clearAllUserData } from './index';
import { createProfileRepo } from './ProfileRepo';
import { createFavoriteRepo } from './FavoriteRepo';
import { createSettingsRepo } from './SettingsRepo';
import { freshDb } from '../test/helpers';

describe('clearAllUserData (RNF-007)', () => {
  it('borra todas las tablas de datos del usuario', async () => {
    const database = freshDb();
    const profileRepo = createProfileRepo(database);
    const favoriteRepo = createFavoriteRepo(database);
    const settingsRepo = createSettingsRepo(database);

    await profileRepo.createOrUpdate({ primaryUser: 'nino' });
    await favoriteRepo.add('recipe', 'R-01');
    await settingsRepo.set('soundEnabled', true);

    await clearAllUserData(database);

    expect(await profileRepo.get()).toBeUndefined();
    expect((await favoriteRepo.listAll()).length).toBe(0);
    expect(await settingsRepo.get('soundEnabled')).toBeUndefined();
  });

  it('nunca toca el contenido del producto (JSON estático, fuera de Dexie)', async () => {
    const database = freshDb();
    await clearAllUserData(database);

    // El contenido del producto ni siquiera vive en esta base de datos —
    // esta prueba documenta explícitamente esa garantía de diseño
    // (Esquema de Backend §2: "no se incluye en el backup/export", "no se borra").
    const { RecipeRepo } = await import('./RecipeRepo');
    expect(RecipeRepo.getAll().length).toBeGreaterThan(0);
  });
});
