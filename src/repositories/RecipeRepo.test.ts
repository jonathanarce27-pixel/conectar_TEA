import { describe, expect, it } from 'vitest';
import { RecipeRepo } from './RecipeRepo';

describe('RecipeRepo (dataset real extraído del PDF, F2)', () => {
  it('getAll devuelve las 48 recetas del recetario', () => {
    const recipes = RecipeRepo.getAll();
    expect(recipes.length).toBe(48);
    expect(recipes[0]).toHaveProperty('id');
    expect(recipes[0]).toHaveProperty('textures.pure');
  });

  it('getById encuentra una receta existente', () => {
    const recipe = RecipeRepo.getById('R-01');
    expect(recipe?.name).toBe('Puré de Patata y Zanahoria Arcoíris');
  });

  it('getById devuelve undefined para un id inexistente', () => {
    expect(RecipeRepo.getById('R-999')).toBeUndefined();
  });

  it('search filtra por nombre ignorando mayúsculas y tildes', () => {
    const results = RecipeRepo.search({ query: 'pure de patata' });
    expect(results.some((r) => r.id === 'R-01')).toBe(true);
  });

  it('search filtra por ingrediente', () => {
    const results = RecipeRepo.search({ query: 'zanahoria' });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (r) =>
          r.name.toLowerCase().includes('zanahoria') ||
          r.ingredients.some((ing) => ing.name.toLowerCase().includes('zanahoria')),
      ),
    ).toBe(true);
  });

  it('search filtra por alimento puente', () => {
    const results = RecipeRepo.search({ bridgeFood: 'puré de patata' });
    expect(results.some((r) => r.id === 'R-01')).toBe(true);
  });

  it('search filtra por textura (solo recetas que tienen esa variante)', () => {
    // R-14 (Frittata) no tiene variante "crocante" en la fuente real —
    // la búsqueda por esa textura no debe incluirla.
    const results = RecipeRepo.search({ texture: 'crocante' });
    expect(results.some((r) => r.id === 'R-14')).toBe(false);
    expect(results.length).toBeGreaterThan(0);
  });

  it('search filtra por categoría', () => {
    const results = RecipeRepo.search({ category: 'Recetas Amigables' });
    expect(results.length).toBe(48);
  });

  it('search devuelve [] cuando no hay coincidencias', () => {
    const results = RecipeRepo.search({ query: 'xyzxyz-ingrediente-inexistente' });
    expect(results).toEqual([]);
  });

  it('exists refleja correctamente si un id está en el catálogo', () => {
    expect(RecipeRepo.exists('R-01')).toBe(true);
    expect(RecipeRepo.exists('R-999')).toBe(false);
  });
});
