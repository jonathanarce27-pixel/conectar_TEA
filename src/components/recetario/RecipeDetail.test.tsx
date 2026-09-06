import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecipeDetail } from './RecipeDetail';
import { RecipeRepo } from '../../repositories/RecipeRepo';
import { FavoriteRepo, PlannerRepo, DiaryRepo, clearAllUserData } from '../../repositories';
import { db } from '../../db/schema';
import { getIsoWeekId } from '../../db/isoWeek';

afterEach(async () => {
  await clearAllUserData(db);
});

function renderDetail(id = 'R-01') {
  return render(
    <MemoryRouter initialEntries={[`/comer/receta/${id}`]}>
      <Routes>
        <Route path="/comer/receta/:id" element={<RecipeDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RecipeDetail — selector de textura (F2, reutiliza ChoicePrompt de F1)', () => {
  it('cambia la adaptación mostrada sin navegar ni perder el resto de la ficha', async () => {
    const user = userEvent.setup();
    const recipe = RecipeRepo.getById('R-01')!;
    renderDetail('R-01');

    expect(screen.getByRole('heading', { name: recipe.name })).toBeInTheDocument();
    expect(screen.getByText(/Ideal para primeros contactos/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Trocitos' }));

    expect(screen.getByText(/Cuando el niño tolera texturas con pequeñas variaciones/)).toBeInTheDocument();
    expect(screen.queryByText(/Ideal para primeros contactos/)).not.toBeInTheDocument();
    // El resto de la ficha (nombre, ingredientes) sigue intacto — no navegó.
    expect(screen.getByRole('heading', { name: recipe.name })).toBeInTheDocument();
    expect(screen.getByText(/patatas medianas/)).toBeInTheDocument();
  });

  it('no ofrece una textura que la receta no trae en la fuente (R-14 sin Crocante)', () => {
    renderDetail('R-14');
    expect(screen.queryByRole('button', { name: 'Crocante' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Puré' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trocitos' })).toBeInTheDocument();
  });
});

describe('RecipeDetail — favoritos (F2, usa FavoriteRepo de F0)', () => {
  it('marcar/desmarcar no crea duplicados y persiste entre recargas', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDetail('R-01');

    const favButton = screen.getByRole('button', { name: 'Guardar en favoritos' });
    await user.click(favButton);

    await vi.waitFor(async () => {
      expect(await FavoriteRepo.isFavorite('recipe', 'R-01')).toBe(true);
    });
    expect((await FavoriteRepo.listAll()).length).toBe(1);

    // Simula una recarga: desmontar y volver a montar leyendo la misma Dexie.
    unmount();
    renderDetail('R-01');
    expect(await screen.findByRole('button', { name: 'Quitar de favoritos' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar de favoritos' }));
    await vi.waitFor(async () => {
      expect(await FavoriteRepo.isFavorite('recipe', 'R-01')).toBe(false);
    });
    expect((await FavoriteRepo.listAll()).length).toBe(0);
  });
});

describe('RecipeDetail — "Añadir al planificador" (F2, usa PlannerRepo de F0)', () => {
  it('escribe un slot real en PlannerWeek para distintos días y momentos', async () => {
    const user = userEvent.setup();
    const cases: Array<['lunes' | 'martes', 'desayuno' | 'almuerzo' | 'cena' | 'tentempie']> = [
      ['lunes', 'desayuno'],
      ['lunes', 'almuerzo'],
      ['martes', 'cena'],
      ['martes', 'tentempie'],
    ];

    for (const [day, meal] of cases) {
      const { unmount } = renderDetail('R-01');
      await user.click(screen.getByRole('button', { name: /Añadir al planificador/ }));

      await user.selectOptions(screen.getByLabelText('Día'), day);
      await user.selectOptions(screen.getByLabelText('Momento'), meal);
      await user.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(await screen.findByText(/Se agregó/)).toBeInTheDocument();
      unmount();
    }

    const week = (await PlannerRepo.getWeek(getIsoWeekId()))!;
    expect(week.days.lunes.desayuno).toMatchObject({ refType: 'recipe', refId: 'R-01' });
    expect(week.days.lunes.almuerzo).toMatchObject({ refType: 'recipe', refId: 'R-01' });
    expect(week.days.martes.cena).toMatchObject({ refType: 'recipe', refId: 'R-01' });
    expect(week.days.martes.tentempie).toMatchObject({ refType: 'recipe', refId: 'R-01' });
  });
});

describe('RecipeDetail — "Registrar experiencia" (F2, usa DiaryRepo de F0)', () => {
  const LEVELS: Array<['no-quiso-mirar' | 'miro' | 'toco' | 'olio' | 'probo' | 'comio' | 'rechazo', string]> = [
    ['no-quiso-mirar', 'No quiso mirar'],
    ['miro', 'Miró'],
    ['toco', 'Tocó'],
    ['olio', 'Olió'],
    ['probo', 'Probó'],
    ['comio', 'Comió'],
    ['rechazo', 'Rechazó'],
  ];

  it('cada uno de los 7 niveles crea un DiaryEntry con sourceModule, foodRef y food correctos', async () => {
    for (const [level, label] of LEVELS) {
      await clearAllUserData(db);
      const user = userEvent.setup();
      const { unmount } = renderDetail('R-01');

      await user.click(screen.getByRole('button', { name: /Registrar experiencia/ }));
      await user.click(screen.getByRole('button', { name: label }));

      expect(await screen.findByText(/Se registró tu experiencia/)).toBeInTheDocument();

      const entries = await DiaryRepo.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        sourceModule: 'recetario',
        foodRef: 'R-01',
        food: 'Puré de Patata y Zanahoria Arcoíris',
        experienceLevel: level,
      });
      unmount();
    }
  });

  it('caso "comió": el registro queda completo con foodRef y food (Esquema de Backend §8)', async () => {
    const user = userEvent.setup();
    renderDetail('R-01');
    await user.click(screen.getByRole('button', { name: /Registrar experiencia/ }));
    await user.click(screen.getByRole('button', { name: 'Comió' }));

    const [entry] = await DiaryRepo.getAll();
    expect(entry.foodRef).toBe('R-01');
    expect(entry.food).toBe('Puré de Patata y Zanahoria Arcoíris');
    expect(entry.experienceLevel).toBe('comio');
  });

  it('caso "rechazó": el registro queda completo con foodRef y food', async () => {
    const user = userEvent.setup();
    renderDetail('R-01');
    await user.click(screen.getByRole('button', { name: /Registrar experiencia/ }));
    await user.click(screen.getByRole('button', { name: 'Rechazó' }));

    const [entry] = await DiaryRepo.getAll();
    expect(entry.foodRef).toBe('R-01');
    expect(entry.food).toBe('Puré de Patata y Zanahoria Arcoíris');
    expect(entry.experienceLevel).toBe('rechazo');
  });
});
