import { describe, expect, it } from 'vitest';
import { ExerciseRepo } from './ExerciseRepo';

describe('ExerciseRepo (dataset real extraído del PDF, F4)', () => {
  it('getAll devuelve los 12 ejercicios', () => {
    expect(ExerciseRepo.getAll().length).toBe(12);
  });

  it('getById encuentra un ejercicio existente', () => {
    expect(ExerciseRepo.getById('E-01')?.name).toBe('La Respiración de la Mariposa');
  });

  it('search filtra por grupo, y respeta la distribución real 4/4/4', () => {
    for (const group of ['respiracion', 'presion', 'motricidad'] as const) {
      const results = ExerciseRepo.search({ group });
      expect(results.every((e) => e.group === group)).toBe(true);
      expect(results.length).toBe(4);
    }
  });

  it('search filtra por duración máxima', () => {
    const results = ExerciseRepo.search({ maxDuration: 150 });
    expect(results.every((e) => e.durationSeconds <= 150)).toBe(true);
    // E-01, E-02, E-03 (150s) y E-05 (120s) — el resto son más largos.
    expect(results.map((e) => e.id).sort()).toEqual(['E-01', 'E-02', 'E-03', 'E-05'].sort());
  });

  it('getRoutines y getRoutineById exponen las 3 rutinas de contenido', () => {
    expect(ExerciseRepo.getRoutines().length).toBe(3);
    expect(ExerciseRepo.getRoutineById('RT-01')?.name).toBe('ritual-comida');
    expect(ExerciseRepo.getRoutineById('RT-02')?.name).toBe('rincon-calma');
    expect(ExerciseRepo.getRoutineById('RT-03')?.name).toBe('transicion-alimentaria');
  });

  it('las rutinas referencian ejercicios reales por refId', () => {
    const ritual = ExerciseRepo.getRoutineById('RT-01')!;
    const exerciseSteps = ritual.steps.filter((s) => s.refType === 'exercise');
    expect(exerciseSteps.length).toBeGreaterThan(0);
    for (const step of exerciseSteps) {
      expect(ExerciseRepo.getById(step.refId!)).toBeTruthy();
    }
  });
});
