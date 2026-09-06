import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExerciseTimer } from './ExerciseTimer';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ExerciseTimer — accesibilidad básica (F4)', () => {
  it('los controles tienen un label descriptivo, no solo el ícono', () => {
    render(<ExerciseTimer durationSeconds={60} />);
    expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reiniciar ejercicio' })).toBeInTheDocument();
  });

  it('tras iniciar, el control cambia a "Pausar ejercicio" con label propio', () => {
    render(<ExerciseTimer durationSeconds={60} />);
    act(() => screen.getByRole('button', { name: 'Iniciar ejercicio' }).click());
    expect(screen.getByRole('button', { name: 'Pausar ejercicio' })).toBeInTheDocument();
  });

  it('es operable por teclado (Tab llega al botón, Enter lo activa)', async () => {
    // user-event necesita timers reales para su propio scheduling interno.
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ExerciseTimer durationSeconds={60} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Pausar ejercicio' })).toBeInTheDocument();
  });

  it('muestra la cuenta regresiva en formato mm:ss y llega a "¡Bien hecho!" al terminar', () => {
    const onDone = vi.fn();
    render(<ExerciseTimer durationSeconds={5} onDone={onDone} />);
    expect(screen.getByText('0:05')).toBeInTheDocument();

    act(() => screen.getByRole('button', { name: 'Iniciar ejercicio' }).click());
    act(() => vi.advanceTimersByTime(6000));

    expect(screen.getByText('¡Bien hecho!')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
