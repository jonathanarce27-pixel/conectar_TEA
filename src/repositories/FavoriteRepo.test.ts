import { describe, expect, it } from 'vitest';
import { createFavoriteRepo } from './FavoriteRepo';
import { freshDb } from '../test/helpers';

describe('FavoriteRepo', () => {
  it('add crea una entrada de favorito', async () => {
    const repo = createFavoriteRepo(freshDb());
    const fav = await repo.add('recipe', 'R-01');

    expect(fav.type).toBe('recipe');
    expect(fav.refId).toBe('R-01');
    expect(await repo.isFavorite('recipe', 'R-01')).toBe(true);
  });

  it('add es idempotente: no duplica la misma [type+refId]', async () => {
    const repo = createFavoriteRepo(freshDb());
    const first = await repo.add('recipe', 'R-01');
    const second = await repo.add('recipe', 'R-01');

    expect(second.id).toBe(first.id);
    expect((await repo.listAll()).length).toBe(1);
  });

  it('remove borra una entrada de favorito', async () => {
    const repo = createFavoriteRepo(freshDb());
    const fav = await repo.add('exercise', 'E-01');
    await repo.remove(fav.id);

    expect(await repo.isFavorite('exercise', 'E-01')).toBe(false);
  });

  it('rechaza un type fuera del enum cerrado', async () => {
    const repo = createFavoriteRepo(freshDb());
    // @ts-expect-error -- valor inválido a propósito
    await expect(repo.add('receta', 'R-01')).rejects.toThrow();
  });

  it(
    'integridad referencial (Esquema de Backend §8): un refId que ya no existe ' +
      'en el catálogo actual se oculta de listResolved() pero no se borra',
    async () => {
      const repo = createFavoriteRepo(freshDb());
      // R-999 nunca existió en el catálogo de contenido de prueba: simula una
      // receta que fue quitada en una versión nueva del build.
      await repo.add('recipe', 'R-999');
      await repo.add('recipe', 'R-01');

      const all = await repo.listAll();
      expect(all.length).toBe(2);

      const resolved = await repo.listResolved();
      expect(resolved.map((f) => f.refId)).toEqual(['R-01']);
    },
  );
});
