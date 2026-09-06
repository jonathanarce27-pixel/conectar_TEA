import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoicePrompt } from './ChoicePrompt';

describe('ChoicePrompt (Flujo de App §3.2, modo elección)', () => {
  it('caso de 2 opciones: renderiza ambas y devuelve la seleccionada', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ChoicePrompt
        question="¿Qué quieres?"
        options={[
          { id: 'pollo', label: 'Pollo' },
          { id: 'pescado', label: 'Pescado' },
        ]}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: 'Pollo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pescado' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pescado' }));
    expect(onSelect).toHaveBeenCalledWith('pescado');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('caso de 4 opciones: renderiza las 4 y devuelve la seleccionada', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ChoicePrompt
        question="¿Quién usará la app?"
        options={[
          { id: 'nino', label: 'Niño/a' },
          { id: 'cuidador', label: 'Tutor/cuidador' },
          { id: 'ambos', label: 'Ambos' },
          { id: 'otro', label: 'Otro' },
        ]}
        onSelect={onSelect}
      />,
    );

    for (const label of ['Niño/a', 'Tutor/cuidador', 'Ambos', 'Otro']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Ambos' }));
    expect(onSelect).toHaveBeenCalledWith('ambos');
  });
});
