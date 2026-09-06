import { jugoterapiaContent } from '../content';
import type { Juice } from '../db/types';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export const JuiceRepo = {
  getAll(): Juice[] {
    return jugoterapiaContent;
  },

  getById(id: string): Juice | undefined {
    return jugoterapiaContent.find((j) => j.id === id);
  },

  search(query: string): Juice[] {
    const q = normalize(query);
    return jugoterapiaContent.filter(
      (j) => normalize(j.name).includes(q) || j.ingredients.some((ing) => normalize(ing.name).includes(q)),
    );
  },

  exists(id: string): boolean {
    return jugoterapiaContent.some((j) => j.id === id);
  },
};
