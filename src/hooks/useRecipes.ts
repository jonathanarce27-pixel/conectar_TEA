import { useMemo } from 'react';
import { RecipeRepo } from '../repositories';
import type { Recipe } from '../db/types';

// UI -> hook -> repositorio -> JSON de contenido (nunca UI -> JSON directo).
export function useRecipes(): Recipe[] {
  return useMemo(() => RecipeRepo.getAll(), []);
}
