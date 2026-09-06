import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';
import { createProfileRepo } from '../../repositories/ProfileRepo';
import { createSettingsRepo } from '../../repositories/SettingsRepo';
import { createCommunicationRepo } from '../../repositories/CommunicationRepo';
import { freshDb } from '../../test/helpers';
import { ONBOARDING_TOTAL_STEPS } from '../../hooks/useOnboarding';

function setUpRepos() {
  const database = freshDb();
  return {
    profileRepo: createProfileRepo(database),
    settingsRepo: createSettingsRepo(database),
    communicationRepo: createCommunicationRepo(database),
  };
}

describe('Onboarding completo, de punta a punta (Flujo de App §2)', () => {
  it('deja un registro profile válido en Dexie con todos los campos esperados', async () => {
    const user = userEvent.setup();
    const repos = setUpRepos();
    const onComplete = vi.fn();

    render(<OnboardingFlow onComplete={onComplete} {...repos} />);

    // Paso 1: Bienvenida
    expect(await screen.findByText('Sabores que Conectan con Amor')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Comenzar' }));

    // Paso 2: ¿Quién usará la app?
    expect(await screen.findByText('¿Quién usará la app?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tutor/cuidador' }));

    // Paso 3: pictogramas iniciales — desactivar "Tengo sed"
    expect(await screen.findByText('Pictogramas iniciales')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tengo sed' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Paso 4: alimentos conocidos
    expect(await screen.findByText('Alimentos conocidos')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Banana' }));
    await user.click(screen.getByRole('button', { name: 'Arroz' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Paso 5: texturas aceptadas
    expect(await screen.findByText('Texturas aceptadas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Puré' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Paso 6: preferencias
    expect(await screen.findByText('Preferencias')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    // Paso 7: cierre
    expect(await screen.findByText('Todo listo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar a Inicio' }));

    expect(onComplete).toHaveBeenCalledTimes(1);

    // Las escrituras a Dexie disparadas por persistStep() son asíncronas y
    // no están atadas al render — esperamos explícitamente a que se asienten
    // en vez de asumir que ya terminaron apenas la UI cambió de pantalla.
    await vi.waitFor(async () => {
      const profile = await repos.profileRepo.get();
      expect(profile).toMatchObject({
        id: 'local-profile',
        primaryUser: 'cuidador',
        onboardingStep: ONBOARDING_TOTAL_STEPS,
      });
      expect(profile?.acceptedFoods.sort()).toEqual(['Arroz', 'Banana'].sort());
      expect(profile?.acceptedTextures).toEqual(['pure']);
      expect(profile?.createdAt).toBeTruthy();
      expect(profile?.updatedAt).toBeTruthy();
    });

    await vi.waitFor(async () => {
      expect(await repos.settingsRepo.get('soundEnabled')).toBe(true);
      expect(await repos.communicationRepo.getDisabledBaseIds()).toContain('p-sed');
    });
  });

  it('el set base de pictogramas queda activo por defecto si no se desactiva nada', async () => {
    const user = userEvent.setup();
    const repos = setUpRepos();

    render(<OnboardingFlow onComplete={() => {}} {...repos} />);

    await user.click(await screen.findByRole('button', { name: 'Comenzar' }));
    await user.click(await screen.findByRole('button', { name: 'Ambos' }));
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' })); // paso 3
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' })); // paso 4
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' })); // paso 5
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' })); // paso 6

    await vi.waitFor(async () => {
      expect(await repos.communicationRepo.getDisabledBaseIds()).toEqual([]);
      const profile = await repos.profileRepo.get();
      expect(profile?.onboardingStep).toBe(ONBOARDING_TOTAL_STEPS);
    });
  });
});

describe('Reanudación de onboarding interrumpido (Flujo de App §2, "Reingreso")', () => {
  it('retoma en el paso guardado en profile.onboardingStep, no reinicia desde cero', async () => {
    const repos = setUpRepos();

    // Simula que el usuario cerró la app a mitad del Paso 4 (ya completó 1-3).
    await repos.profileRepo.createOrUpdate({
      primaryUser: 'nino',
      acceptedFoods: [],
      acceptedTextures: [],
      onboardingStep: 4,
    });

    const { unmount } = render(<OnboardingFlow onComplete={() => {}} {...repos} />);

    expect(await screen.findByText('Alimentos conocidos')).toBeInTheDocument();
    expect(screen.queryByText('Sabores que Conectan con Amor')).not.toBeInTheDocument();

    // Simula recargar la app: desmontar y volver a montar leyendo la misma
    // base Dexie (el estado en memoria del componente no sobrevive, pero
    // profile.onboardingStep en IndexedDB sí).
    unmount();
    render(<OnboardingFlow onComplete={() => {}} {...repos} />);

    expect(await screen.findByText('Alimentos conocidos')).toBeInTheDocument();
  });

  it('un profile ya completo (onboardingStep >= 7) dispara onComplete sin mostrar pasos', async () => {
    const repos = setUpRepos();
    await repos.profileRepo.createOrUpdate({
      primaryUser: 'ambos',
      acceptedFoods: [],
      acceptedTextures: [],
      onboardingStep: 7,
    });

    const onComplete = vi.fn();
    render(<OnboardingFlow onComplete={onComplete} {...repos} />);

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Sabores que Conectan con Amor')).not.toBeInTheDocument();
  });
});
