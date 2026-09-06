import { describe, expect, it } from 'vitest';
import { createProfileRepo } from './ProfileRepo';
import { freshDb } from '../test/helpers';

describe('ProfileRepo', () => {
  it('get() devuelve undefined cuando no hay perfil creado', async () => {
    const repo = createProfileRepo(freshDb());
    expect(await repo.get()).toBeUndefined();
  });

  it('createOrUpdate crea el perfil singleton con valores por defecto', async () => {
    const repo = createProfileRepo(freshDb());
    const profile = await repo.createOrUpdate({ primaryUser: 'nino' });

    expect(profile.id).toBe('local-profile');
    expect(profile.primaryUser).toBe('nino');
    expect(profile.acceptedFoods).toEqual([]);
    expect(profile.createdAt).toBe(profile.updatedAt);
  });

  it('createOrUpdate actualiza campos sin perder los ya guardados', async () => {
    const repo = createProfileRepo(freshDb());
    const created = await repo.createOrUpdate({ primaryUser: 'nino', name: 'Ana' });
    const updated = await repo.createOrUpdate({ acceptedTextures: ['pure'] });

    expect(updated.name).toBe('Ana');
    expect(updated.acceptedTextures).toEqual(['pure']);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
  });

  it('rechaza un primaryUser fuera del enum cerrado', async () => {
    const repo = createProfileRepo(freshDb());
    // @ts-expect-error -- valor inválido a propósito para probar la validación
    await expect(repo.createOrUpdate({ primaryUser: 'abuela' })).rejects.toThrow();
  });

  it('rechaza una textura fuera del enum cerrado', async () => {
    const repo = createProfileRepo(freshDb());
    await expect(
      // @ts-expect-error -- valor inválido a propósito
      repo.createOrUpdate({ primaryUser: 'ambos', acceptedTextures: ['liquida'] }),
    ).rejects.toThrow();
  });

  it('clear() borra el perfil singleton', async () => {
    const repo = createProfileRepo(freshDb());
    await repo.createOrUpdate({ primaryUser: 'cuidador' });
    await repo.clear();
    expect(await repo.get()).toBeUndefined();
  });
});
