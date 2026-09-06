import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { HistorialHome } from '../components/diario/HistorialHome';
import { db } from '../db/schema';
import { clearAllUserData, DiaryRepo, ProfileRepo } from '../repositories';

afterEach(async () => {
  await clearAllUserData(db);
  window.history.pushState({}, '', '/');
});

async function setUpCompletedProfile() {
  await ProfileRepo.createOrUpdate({
    primaryUser: 'ambos',
    acceptedFoods: [],
    rejectedFoods: [],
    acceptedTextures: [],
    onboardingStep: 7,
  });
}

// Flujo de App §8.2, de punta a punta: Comunicar "No me gusta la textura" ->
// Comer (Cambiar textura) -> [Puré][Trocitos][Crocante] -> ficha
// actualizada -> Registrar nueva experiencia -> Diario.
describe('Flujo completo §8.2 "No me gusta la textura"', () => {
  it('recorre Comunicar -> Cambiar textura -> selector de textura -> Registrar experiencia -> Historial', async () => {
    await setUpCompletedProfile();
    const user = userEvent.setup();
    const appRender = render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Comunicar/ }));
    await user.click(await screen.findByRole('button', { name: 'Sensaciones físicas' }));
    await user.click(await screen.findByRole('button', { name: 'No me gusta la textura' }));

    await screen.findByText('No me gusta la textura');
    await user.click(screen.getByRole('button', { name: 'Cambiar textura' }));

    // "Cambiar textura" lleva a Comer (Recetario) — decisión de esta fase:
    // reutiliza el catálogo + ficha + selector de textura ya existentes de
    // F2 en vez de inventar una pantalla nueva (Flujo de App §8.2 dibuja
    // "COMER 'Cambiar textura'" como destino, sin fijar una receta puntual).
    expect(await screen.findByRole('heading', { name: 'Comer' })).toBeInTheDocument();

    const recipeLink = (await screen.findAllByRole('link', { name: /dificultad/ }))[0];
    const recipeName = recipeLink.getAttribute('aria-label')?.split(',')[0] ?? '';
    await user.click(recipeLink);

    expect(await screen.findByRole('heading', { name: recipeName })).toBeInTheDocument();
    const textureButton = screen.getAllByRole('button', { name: /Puré|Trocitos|Crocante/ })[0];
    const textureLabel = textureButton.textContent ?? '';
    await user.click(textureButton);
    expect(screen.getByText(new RegExp(`^${textureLabel}:`))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Registrar experiencia/ }));
    await user.click(await screen.findByRole('button', { name: 'Probó' }));
    expect(await screen.findByText(/Se registró tu experiencia/)).toBeInTheDocument();

    const entries = await DiaryRepo.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ food: recipeName, experienceLevel: 'probo', sourceModule: 'recetario' });

    appRender.unmount();
    render(
      <MemoryRouter initialEntries={['/diario/historial']}>
        <HistorialHome />
      </MemoryRouter>,
    );
    expect(await screen.findByText(recipeName)).toBeInTheDocument();
  });
});
