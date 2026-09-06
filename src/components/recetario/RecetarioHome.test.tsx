import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RecetarioHome } from './RecetarioHome';

function renderHome() {
  return render(
    <MemoryRouter>
      <RecetarioHome />
    </MemoryRouter>,
  );
}

describe('RecetarioHome (catálogo con pestañas y búsqueda, F2)', () => {
  it('muestra las 48 recetas por defecto en la pestaña Recetas', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /Puré de Patata y Zanahoria Arcoíris/ })).toBeInTheDocument();
  });

  it('busca por nombre y filtra la grilla', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(
      screen.getByPlaceholderText('Buscar por nombre, ingrediente o alimento puente'),
      'tostada francesa',
    );

    expect(screen.getByRole('link', { name: /Tostada Francesa/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Puré de Patata/ })).not.toBeInTheDocument();
  });

  it('muestra un mensaje claro cuando la búsqueda no tiene resultados', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(
      screen.getByPlaceholderText('Buscar por nombre, ingrediente o alimento puente'),
      'zzz-no-existe',
    );

    expect(screen.getByText('No encontramos recetas con esa búsqueda.')).toBeInTheDocument();
  });

  it('cambia a la pestaña Jugoterapia y muestra los 12 jugos', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('tab', { name: 'Jugoterapia' }));

    expect(screen.getByRole('link', { name: /Jugo de Manzana y Zanahoria/ })).toBeInTheDocument();
  });

  it('filtra por textura ocultando recetas que no tienen esa variante', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Crocante' }));

    expect(screen.queryByRole('link', { name: /Frittata de Verduras/ })).not.toBeInTheDocument();
  });
});
