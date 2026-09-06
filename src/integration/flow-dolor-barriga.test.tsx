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

// Flujo de App §8.3, de punta a punta: Comunicar "Me duele la barriga" ->
// registro rápido pre-rellenado (hora + síntoma) -> queda disponible en
// Historial para consulta posterior.
describe('Flujo completo §8.3 "Dolor de barriga"', () => {
  it('recorre Comunicar (p-dolor) -> registro rápido pre-rellenado -> Historial', async () => {
    await setUpCompletedProfile();
    const user = userEvent.setup();
    const appRender = render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Comunicar/ }));
    await user.click(await screen.findByRole('button', { name: 'Sensaciones físicas' }));
    await user.click(await screen.findByRole('button', { name: 'Me duele la barriga' }));

    await screen.findByText('Me duele la barriga');
    await user.click(screen.getByRole('button', { name: 'Registrar en Diario' }));

    // El formulario de Diario llega pre-rellenado: síntoma GI ya
    // seleccionado, el usuario solo completa el resto (Flujo de App §7.2).
    expect(await screen.findByText('Nuevo registro')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Dolor abdominal' })).toHaveAttribute('data-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Se guardó tu registro.')).toBeInTheDocument();

    const entries = await DiaryRepo.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ giSymptoms: ['dolor_abdominal'], sourceModule: 'comunicacion' });
    expect(entries[0].time).toMatch(/^\d\d:\d\d$/);

    appRender.unmount();
    render(
      <MemoryRouter initialEntries={['/diario/historial']}>
        <HistorialHome />
      </MemoryRouter>,
    );
    // Sin alimento asociado, la tarjeta muestra la hora pre-rellenada como
    // referencia del registro.
    expect(await screen.findByText(entries[0].time as string)).toBeInTheDocument();
  });
});
