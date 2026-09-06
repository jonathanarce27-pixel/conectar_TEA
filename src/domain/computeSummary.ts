import type { DiaryEntry, DiaryTexture, GiSymptom } from '../db/types';

export interface SummaryRange {
  from: string; // ISO YYYY-MM-DD, inclusivo
  to: string; // ISO YYYY-MM-DD, inclusivo
}

export interface DiarySummary {
  range: SummaryRange;
  totalEntries: number;
  distinctFoodsCount: number;
  // Esquema de Backend §11 pide "comidas realizadas / tentempiés" en el
  // resumen, pero DiaryEntry no tiene un campo que distinga comida de
  // tentempié (esa distinción solo existe en PlannerSlot.mealSlot, que no
  // viaja al registrar en el Diario) — se reporta un único conteo de
  // "comidas registradas" en vez de inventar un campo que no existe en el
  // esquema. Documentado como decisión de esta fase (F5).
  mealsLogged: number;
  rejections: number;
  symptomsRecorded: number;
  symptomCounts: Partial<Record<GiSymptom, number>>;
  anxietyEpisodes: number;
  texturesUsed: Partial<Record<DiaryTexture, number>>;
  favoriteFoods: string[];
  rejectedFoods: string[];
}

function isRejection(entry: DiaryEntry): boolean {
  return entry.experienceLevel === 'rechazo' || entry.behavior === 'rechazo';
}

function isPositiveOutcome(entry: DiaryEntry): boolean {
  return entry.quantity === 'todo' || entry.experienceLevel === 'comio' || entry.experienceLevel === 'probo';
}

/**
 * Agregación pura sobre registros ya guardados — sin IA, sin acceso a
 * IndexedDB (Esquema de Backend §11: "objeto de conteos ... nunca los
 * registros individuales sin agregar"). Pensada para reusarse tal cual en
 * F7, donde la IA solo redacta en lenguaje natural este resultado.
 */
export function computeSummary(entries: DiaryEntry[], range: SummaryRange): DiarySummary {
  const distinctFoods = new Set<string>();
  const symptomCounts: Partial<Record<GiSymptom, number>> = {};
  const texturesUsed: Partial<Record<DiaryTexture, number>> = {};
  const foodOutcomes = new Map<string, { positive: number; rejected: number }>();

  let mealsLogged = 0;
  let rejections = 0;
  let symptomsRecorded = 0;
  let anxietyEpisodes = 0;

  for (const entry of entries) {
    if (entry.food) {
      distinctFoods.add(entry.food);
      mealsLogged += 1;

      const outcome = foodOutcomes.get(entry.food) ?? { positive: 0, rejected: 0 };
      if (isRejection(entry)) outcome.rejected += 1;
      else if (isPositiveOutcome(entry)) outcome.positive += 1;
      foodOutcomes.set(entry.food, outcome);
    }

    if (isRejection(entry)) rejections += 1;

    if (entry.giSymptoms && entry.giSymptoms.length > 0) {
      symptomsRecorded += 1;
      for (const symptom of entry.giSymptoms) {
        symptomCounts[symptom] = (symptomCounts[symptom] ?? 0) + 1;
      }
    }

    if (entry.behavior === 'ansioso') anxietyEpisodes += 1;

    if (entry.texture) {
      texturesUsed[entry.texture] = (texturesUsed[entry.texture] ?? 0) + 1;
    }
  }

  // "Favorito" / "rechazado" es un alimento, no un registro individual —
  // clasificado por si tuvo alguna vez un rechazo (Esquema de Backend §11
  // no especifica el criterio exacto; se documenta acá como decisión de
  // esta fase): cualquier rechazo registrado pesa más que una aceptación,
  // así "alimentos rechazados" no se pisa con una sola vez que sí comió.
  const favoriteFoods: string[] = [];
  const rejectedFoods: string[] = [];
  for (const [food, outcome] of foodOutcomes) {
    if (outcome.rejected > 0) rejectedFoods.push(food);
    else if (outcome.positive > 0) favoriteFoods.push(food);
  }

  return {
    range,
    totalEntries: entries.length,
    distinctFoodsCount: distinctFoods.size,
    mealsLogged,
    rejections,
    symptomsRecorded,
    symptomCounts,
    anxietyEpisodes,
    texturesUsed,
    favoriteFoods: favoriteFoods.sort((a, b) => a.localeCompare(b, 'es')),
    rejectedFoods: rejectedFoods.sort((a, b) => a.localeCompare(b, 'es')),
  };
}
