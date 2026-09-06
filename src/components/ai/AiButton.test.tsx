import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiButton } from './AiButton';

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderButton() {
  return render(
    <MemoryRouter>
      <AiButton />
    </MemoryRouter>,
  );
}

describe('AiButton (Flujo de App §9 — indicador de conexión)', () => {
  it('online: es un link habilitado hacia /ia', () => {
    vi.stubGlobal('navigator', { onLine: true });
    renderButton();

    const link = screen.getByRole('link', { name: 'Preguntarle a la IA' });
    expect(link).toHaveAttribute('href', '/ia');
  });

  it('offline: se muestra atenuado, con "Necesita conexión", y no es un link navegable', () => {
    vi.stubGlobal('navigator', { onLine: false });
    renderButton();

    expect(screen.getByRole('button', { name: 'Necesita conexión' })).toBeDisabled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('reacciona a los eventos online/offline del navegador sin recargar la pantalla', () => {
    vi.stubGlobal('navigator', { onLine: true });
    renderButton();
    expect(screen.getByRole('link', { name: 'Preguntarle a la IA' })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('button', { name: 'Necesita conexión' })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByRole('link', { name: 'Preguntarle a la IA' })).toBeInTheDocument();
  });
});
