import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CategoryGrid } from '../components/comunicacion/CategoryGrid';
import { ExerciseTimer } from '../components/regulacion/ExerciseTimer';
import { SosButton } from '../components/shared/SosButton';
import { AiButton } from '../components/ai/AiButton';
import { db } from '../db/schema';
import { clearAllUserData } from '../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

// F8, Auditoría 5 (labels de accesibilidad): cada control que es solo
// ícono (sin texto visible propio) debe tener un nombre accesible que
// describa la ACCIÓN real, nunca un nombre de ícono/archivo ni "botón"
// genérico. Se prueba con contenido real, no props sintéticas — así
// queda cubierto el caso explícito que pidió el cuidador: los pictogramas
// de Comunicación deben anunciar su label real ("Tengo hambre").
describe('Nombres accesibles de controles solo-ícono (Design Brief, F8 Auditoría 5)', () => {
  it('los pictogramas de Comunicación (contenido real) anuncian su label real, no el nombre del ícono', async () => {
    render(
      <MemoryRouter initialEntries={['/comunicar/necesidades']}>
        <Routes>
          <Route path="/comunicar/:categoryId" element={<CategoryGrid />} />
        </Routes>
      </MemoryRouter>,
    );

    const button = await screen.findByRole('button', { name: 'Tengo hambre' });
    expect(button).toHaveAccessibleName('Tengo hambre');
    // El ícono real usado por este pictograma no debería filtrarse como
    // parte del nombre accesible (ej. "i-food" o el nombre del archivo).
    expect(button).not.toHaveAccessibleName(/i-food|icon|ícono/i);
  });

  it('los controles del temporizador de Ejercicios (solo ícono) describen la acción, no el ícono', () => {
    render(<ExerciseTimer durationSeconds={60} />);
    expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toHaveAccessibleName('Iniciar ejercicio');
  });

  it('el botón flotante de SOS (solo ícono) anuncia la acción, no "botón" genérico', () => {
    render(
      <MemoryRouter>
        <SosButton />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Necesito ayuda' });
    expect(link).toHaveAccessibleName('Necesito ayuda');
  });

  it('el botón flotante de IA (solo ícono, online) anuncia la acción, no "botón" genérico', () => {
    render(
      <MemoryRouter>
        <AiButton />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Preguntarle a la IA' })).toHaveAccessibleName('Preguntarle a la IA');
  });
});
