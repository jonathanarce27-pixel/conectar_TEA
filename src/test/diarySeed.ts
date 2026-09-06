import type { createDiaryRepo } from '../repositories/DiaryRepo';
import { isoDate, subtractDays } from '../domain/dateRange';
import type { DiaryBehavior, DiaryTexture } from '../db/types';

const FOODS = ['Puré de calabaza', 'Pollo al horno', 'Arroz', 'Banana', 'Yogur'];
const BEHAVIORS: DiaryBehavior[] = ['tranquilo', 'inquieto', 'ansioso', 'cooperativo', 'rechazo'];
const TEXTURES: DiaryTexture[] = ['P', 'T', 'C', 'M'];

/**
 * Genera `days` registros sintéticos de DiaryEntry, uno por día, terminando
 * hoy — usado para el criterio de aceptación (b) de F5: el Historial de 30
 * días debe responder con fluidez incluso con varios meses de datos reales.
 */
export async function seedSyntheticDiaryEntries(
  repo: ReturnType<typeof createDiaryRepo>,
  days: number,
  today: Date = new Date(),
): Promise<void> {
  for (let i = 0; i < days; i++) {
    const date = isoDate(subtractDays(today, i));
    await repo.create({
      date,
      food: FOODS[i % FOODS.length],
      quantity: i % 3 === 0 ? 'todo' : 'poco',
      texture: TEXTURES[i % TEXTURES.length],
      behavior: BEHAVIORS[i % BEHAVIORS.length],
      giSymptoms: i % 5 === 0 ? ['gases'] : undefined,
      sourceModule: 'manual',
    });
  }
}
