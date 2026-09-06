import { recetarioContent } from '../content';
import type { Recipe, Texture } from '../db/types';

// Normaliza tildes/mayúsculas para búsqueda simple en memoria (TRD §7.1):
// 60 elementos no justifican un motor de búsqueda ni backend.
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export interface RecipeSearchParams {
  query?: string;
  category?: string;
  bridgeFood?: string;
  texture?: Texture;
}

export const RecipeRepo = {
  getAll(): Recipe[] {
    return recetarioContent;
  },

  getById(id: string): Recipe | undefined {
    return recetarioContent.find((r) => r.id === id);
  },

  search({ query, category, bridgeFood, texture }: RecipeSearchParams): Recipe[] {
    let results = recetarioContent;

    if (category) {
      results = results.filter((r) => normalize(r.category) === normalize(category));
    }
    if (bridgeFood) {
      results = results.filter(
        (r) => r.bridgeFood && normalize(r.bridgeFood).includes(normalize(bridgeFood)),
      );
    }
    if (texture) {
      // Una descripción vacía significa que la receta no trae esa variante
      // en la fuente (ej. R-14 no tiene "crocante") — no cuenta como match.
      results = results.filter((r) => Boolean(r.textures?.[texture]?.description));
    }
    if (query) {
      const q = normalize(query);
      results = results.filter(
        (r) =>
          normalize(r.name).includes(q) ||
          normalize(r.category).includes(q) ||
          r.ingredients.some((ing) => normalize(ing.name).includes(q)) ||
          (r.bridgeFood ? normalize(r.bridgeFood).includes(q) : false),
      );
    }

    return results;
  },

  exists(id: string): boolean {
    return recetarioContent.some((r) => r.id === id);
  },
};
