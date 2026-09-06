import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RegulacionHome } from './RegulacionHome';
import { ExerciseRepo } from '../../repositories/ExerciseRepo';

function renderHome() {
  return render(
    <MemoryRouter>
      <RegulacionHome />
    </MemoryRouter>,
  );
}

describe('RegulacionHome — catálogo agrupado por color (F4)', () => {
  it('muestra los 12 ejercicios', () => {
    renderHome();
    for (const exercise of ExerciseRepo.getAll()) {
      expect(screen.getByRole('link', { name: new RegExp(exercise.name) })).toBeInTheDocument();
    }
  });

  it(
    'cada ejercicio se renderiza con la clase de color de SU grupo real ' +
      '(leído de Exercise.group, no hardcodeado a mano)',
    () => {
      renderHome();
      for (const exercise of ExerciseRepo.getAll()) {
        const link = screen.getByRole('link', { name: new RegExp(exercise.name) });
        expect(link).toHaveClass(`exercise-card--${exercise.group}`);
      }
    },
  );

  it('agrupa visualmente en 3 secciones con la distribución real (4/4/4)', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: 'Respiración' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Presión Profunda' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Motricidad y Movimiento' })).toBeInTheDocument();

    const byGroup = { respiracion: 0, presion: 0, motricidad: 0 } as Record<string, number>;
    for (const e of ExerciseRepo.getAll()) byGroup[e.group]++;
    expect(byGroup).toEqual({ respiracion: 4, presion: 4, motricidad: 4 });
  });

  it('cambia a la pestaña Rutinas y muestra las 3 rutinas', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('tab', { name: 'Rutinas' }));

    const routines = ExerciseRepo.getRoutines();
    expect(routines.length).toBe(3);

    const cards = screen.getAllByRole('link', { name: /pasos/ });
    expect(cards).toHaveLength(3);
    // Cada tarjeta debe mostrar la cantidad real de pasos de ESA rutina
    // (leída de routine.steps.length, no un número fijo a mano).
    for (const routine of routines) {
      const matching = cards.filter((c) => c.textContent?.includes(`${routine.steps.length} pasos`));
      expect(matching.length).toBeGreaterThan(0);
    }
  });
});
