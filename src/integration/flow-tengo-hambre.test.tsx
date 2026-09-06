import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { HistorialHome } from '../components/diario/HistorialHome';
import { db } from '../db/schema';
import { clearAllUserData, DiaryRepo, PlannerRepo, ProfileRepo, RecipeRepo } from '../repositories';
import { getIsoWeekId, getMondayOfWeek } from '../db/isoWeek';

afterEach(async () => {
  await clearAllUserData(db);
  window.history.pushState({}, '', '/');
});

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

async function setUpCompletedProfileWithTodayMeal() {
  await ProfileRepo.createOrUpdate({
    primaryUser: 'ambos',
    acceptedFoods: [],
    rejectedFoods: [],
    acceptedTextures: [],
    onboardingStep: 7,
  });

  const recipe = RecipeRepo.search({ texture: 'trocitos' })[0];
  const weekId = getIsoWeekId(getMondayOfWeek());
  await PlannerRepo.assignSlot(weekId, todayKey(), 'almuerzo', {
    refType: 'recipe',
    refId: recipe.id,
    done: false,
  });
  return recipe;
}

// Flujo de App §8.1, de punta a punta y sin salir de la app: Comunicar
// "Tengo hambre" -> Mi Semana (hoy) -> ficha de la receta -> selector de
// textura -> Registrar experiencia -> queda en Historial.
describe('Flujo completo §8.1 "Tengo hambre"', () => {
  it('recorre Comunicar -> Mi Semana -> receta -> textura -> Registrar experiencia -> Historial', async () => {
    const recipe = await setUpCompletedProfileWithTodayMeal();
    const user = userEvent.setup();
    const appRender = render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Comunicar/ }));
    await user.click(await screen.findByRole('button', { name: 'Necesidades básicas' }));
    await user.click(await screen.findByRole('button', { name: 'Tengo hambre' }));

    await screen.findByText('Tengo hambre');
    await user.click(screen.getByRole('button', { name: 'Ver qué toca comer hoy' }));

    expect(await screen.findByRole('heading', { name: 'Mi Semana' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: recipe.name }));

    expect(await screen.findByRole('heading', { name: recipe.name })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Trocitos' }));
    expect(screen.getByText(recipe.textures.trocitos.description)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Registrar experiencia/ }));
    await user.click(await screen.findByRole('button', { name: 'Comió' }));
    expect(await screen.findByText(/Se registró tu experiencia/)).toBeInTheDocument();

    const entries = await DiaryRepo.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      foodRef: recipe.id,
      food: recipe.name,
      experienceLevel: 'comio',
      sourceModule: 'recetario',
    });

    // Confirmación independiente de que el registro es consultable después,
    // desde la pantalla real de Historial (no solo verificado en el repo).
    appRender.unmount();
    render(
      <MemoryRouter initialEntries={['/diario/historial']}>
        <HistorialHome />
      </MemoryRouter>,
    );
    expect(await screen.findByText(recipe.name)).toBeInTheDocument();
  });
});
