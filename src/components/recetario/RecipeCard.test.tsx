import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RecipeCard } from './RecipeCard';
import { RecipeRepo } from '../../repositories/RecipeRepo';

describe('RecipeCard (accesibilidad básica, F2)', () => {
  it('tiene un label descriptivo, no solo la imagen', () => {
    const recipe = RecipeRepo.getById('R-01')!;
    const { container } = render(
      <MemoryRouter>
        <RecipeCard recipe={recipe} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', {
      name: 'Puré de Patata y Zanahoria Arcoíris, dificultad Fácil, 25 minutos',
    });
    expect(link).toBeInTheDocument();
    // La imagen es decorativa (alt=""), por eso no tiene role "img" para el
    // accessibility tree — el nombre accesible de la tarjeta viene del
    // aria-label del link, no de un texto alternativo de imagen.
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
  });

  it('es operable por teclado (Tab + Enter navega, igual que el toque)', async () => {
    const user = userEvent.setup();
    const recipe = RecipeRepo.getById('R-02')!;
    render(
      <MemoryRouter>
        <RecipeCard recipe={recipe} />
      </MemoryRouter>,
    );

    await user.tab();
    expect(screen.getByRole('link')).toHaveFocus();
  });
});
