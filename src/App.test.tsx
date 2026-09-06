import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { HomeScreen } from './components/shared/HomeScreen';
import { db } from './db/schema';
import { clearAllUserData } from './repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

// Detecta cualquier emoji Unicode en el árbol renderizado — regla absoluta
// del Design Brief §3/§10: "cero emoji en la miniapp".
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;

describe('HomeScreen (pantalla de Inicio, F0)', () => {
  it('muestra el encabezado y el prompt "¿Qué necesitas?"', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sabores que Conectan con Amor')).toBeInTheDocument();
    expect(screen.getByText('¿Qué necesitas?')).toBeInTheDocument();
  });

  it('lee y muestra la primera receta real vía RecipeRepo (cadena UI -> hook -> repo -> JSON)', () => {
    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>,
    );
    expect(screen.getByText('Puré de Patata y Zanahoria Arcoíris')).toBeInTheDocument();
  });

  it('no renderiza ningún emoji Unicode', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>,
    );
    expect(EMOJI_PATTERN.test(container.textContent ?? '')).toBe(false);
  });
});

describe('App (F1: enrutamiento raíz)', () => {
  it('sin profile todavía, muestra el onboarding en vez de Inicio', async () => {
    render(<App />);
    expect(await screen.findByText('Sabores que Conectan con Amor')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Comenzar' })).toBeInTheDocument();
    expect(screen.queryByText('¿Qué necesitas?')).not.toBeInTheDocument();
  });
});
