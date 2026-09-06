import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutinePlayer } from './RoutinePlayer';
import { ExerciseRepo } from '../../repositories/ExerciseRepo';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderRoutine(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/calmarme/rutina/${id}`]}>
      <Routes>
        <Route path="/calmarme/rutina/:id" element={<RoutinePlayer />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Avanza el paso actual: si es un ejercicio, lo inicia y deja correr el
 * temporizador completo (auto-avance); si es acción libre, toca
 * "Siguiente paso" a mano — igual que haría un usuario real. */
async function advanceCurrentStep() {
  const startButton = screen.queryByRole('button', { name: 'Iniciar ejercicio' });
  if (startButton) {
    act(() => startButton.click());
    // Duración máxima real del set de contenido es 450s — sobra margen.
    act(() => vi.advanceTimersByTime(451_000));
    // Delay de auto-avance tras terminar el temporizador.
    act(() => vi.advanceTimersByTime(2000));
  } else {
    const nextButton = screen.getByRole('button', { name: 'Siguiente paso' });
    act(() => nextButton.click());
  }
}

describe('RoutinePlayer — las 3 rutinas completas, de punta a punta (criterio b)', () => {
  for (const routine of ExerciseRepo.getRoutines()) {
    it(`completa "${routine.id}" (${routine.name}) encadenando sus ${routine.steps.length} pasos sin quedarse trabada`, async () => {
      renderRoutine(routine.id);

      expect(screen.getByText(`Paso 1 de ${routine.steps.length}`)).toBeInTheDocument();

      for (let i = 0; i < routine.steps.length; i++) {
        await advanceCurrentStep();
      }

      expect(screen.getByText('Rutina completada')).toBeInTheDocument();
    });
  }

  it('RT-02 tiene un paso de acción libre en medio de la secuencia (sin temporizador) y avanza manualmente', async () => {
    const routine = ExerciseRepo.getRoutineById('RT-02')!;
    const actionStepIndex = routine.steps.findIndex((s) => s.refType === 'action');
    expect(actionStepIndex).toBeGreaterThanOrEqual(0);
    expect(actionStepIndex).toBeLessThan(routine.steps.length - 1); // no es el último, está "en medio"

    renderRoutine('RT-02');
    for (let i = 0; i < actionStepIndex; i++) {
      await advanceCurrentStep();
    }

    // El paso de acción libre no debe mostrar controles de temporizador.
    expect(screen.queryByRole('button', { name: 'Iniciar ejercicio' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente paso' })).toBeInTheDocument();
  });

  it('un paso con temporizador también puede saltarse a mano sin esperar a que termine', async () => {
    renderRoutine('RT-01'); // paso 1 es un ejercicio (E-05)
    expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Siguiente paso' }).click());

    expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
  });
});
