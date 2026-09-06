import { ejerciciosContent, implementationTipsContent, rutinasContent } from '../content';
import type { Exercise, ExerciseGroup, ImplementationTip, Routine } from '../db/types';

export interface ExerciseSearchParams {
  group?: ExerciseGroup;
  maxDuration?: number;
}

export const ExerciseRepo = {
  getAll(): Exercise[] {
    return ejerciciosContent;
  },

  getById(id: string): Exercise | undefined {
    return ejerciciosContent.find((e) => e.id === id);
  },

  search({ group, maxDuration }: ExerciseSearchParams): Exercise[] {
    let results = ejerciciosContent;
    if (group) {
      results = results.filter((e) => e.group === group);
    }
    if (typeof maxDuration === 'number') {
      results = results.filter((e) => e.durationSeconds <= maxDuration);
    }
    return results;
  },

  exists(id: string): boolean {
    return ejerciciosContent.some((e) => e.id === id);
  },

  getRoutines(): Routine[] {
    return rutinasContent;
  },

  getRoutineById(id: string): Routine | undefined {
    return rutinasContent.find((r) => r.id === id);
  },

  getImplementationTips(): ImplementationTip[] {
    return implementationTipsContent;
  },
};
