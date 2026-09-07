import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { db } from '../db/schema';
import { clearAllUserData, PlannerRepo, ProfileRepo, RecipeRepo } from '../repositories';
import { getIsoWeekId, getMondayOfWeek } from '../db/isoWeek';

afterEach(async () => {
  await clearAllUserData(db);
  vi.unstubAllGlobals();
  window.history.pushState({}, '', '/');
});

beforeEach(async () => {
  await ProfileRepo.createOrUpdate({
    primaryUser: 'ambos',
    acceptedFoods: [],
    rejectedFoods: [],
    acceptedTextures: [],
    onboardingStep: 7,
  });
  // Sin red: fetch/XHR lanzan si se llaman — cualquier módulo que dependa
  // de la red por error rompe fuerte en vez de fallar en silencio.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('RED DESHABILITADA — ningún módulo de F1-F6 debería llamarla');
    }),
  );
  vi.stubGlobal('XMLHttpRequest', function () {
    throw new Error('RED DESHABILITADA — ningún módulo de F1-F6 debería llamarla');
  });
  Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
});

// Criterio de aceptación F7 (c): sin red, el ícono de IA se muestra
// atenuado, y el resto de los módulos (F1-F6) sigue funcionando igual con
// o sin internet (Flujo de App §9) — regresión completa, no solo el
// módulo nuevo de F7.
describe('Regresión offline F1-F6 (criterio de aceptación F7-c)', () => {
  it('Inicio + el botón de IA aparece atenuado con "Necesita conexión"', async () => {
    render(<App />);
    expect(await screen.findByText('¿Qué necesitas?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Necesita conexión' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Preguntarle a la IA' })).not.toBeInTheDocument();
  });

  it('Comunicación (F1): navega categoría -> pictograma -> confirmación sin red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Comunicar/ }));
    await user.click(await screen.findByRole('button', { name: 'Necesidades básicas' }));
    await user.click(await screen.findByRole('button', { name: 'Tengo hambre' }));

    expect(await screen.findByText('Tengo hambre')).toBeInTheDocument();
  });

  it('Recetario (F2): catálogo, ficha y selector de textura funcionan sin red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Comer/ }));
    expect(await screen.findByText('Puré de Patata y Zanahoria Arcoíris')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Puré de Patata y Zanahoria Arcoíris/ }));
    expect(await screen.findByRole('button', { name: 'Trocitos' })).toBeInTheDocument();
  });

  it('Calmarme (F4): catálogo de ejercicios visible sin red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Calmarme/ }));
    expect(await screen.findByRole('heading', { name: 'Calmarme' })).toBeInTheDocument();
  });

  it('Mi Semana (F3): la grilla semanal y una asignación ya existente se muestran sin red', async () => {
    const recipe = RecipeRepo.getAll()[0];
    await PlannerRepo.assignSlot(getIsoWeekId(getMondayOfWeek()), 'lunes', 'desayuno', {
      refType: 'recipe',
      refId: recipe.id,
      done: false,
    });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Mi Semana/ }));
    expect(await screen.findByRole('heading', { name: 'Mi Semana' })).toBeInTheDocument();
    expect(await screen.findByText(recipe.name)).toBeInTheDocument();
  });

  it('Mi Diario + Historial + Exportar (F5/F6): registrar, consultar y exportar funcionan sin red', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: /^Mi Diario/ }));
    await user.click(await screen.findByRole('button', { name: /Nuevo registro/ }));
    await user.click(await screen.findByRole('button', { name: 'Todo' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Se guardó tu registro.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver en Historial' }));
    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Exportar' }));
    await user.click(screen.getByRole('button', { name: 'Exportar PDF' }));
    // No debe explotar ni intentar red — si llegó hasta acá sin lanzar el
    // error de "RED DESHABILITADA", la generación de PDF fue 100% local.
    expect(screen.getByRole('dialog', { name: 'Exportar' })).toBeInTheDocument();
  });
});

// F8, Auditoría 7: el onboarding (Flujo de App §2) también debe recorrerse
// completo sin red — el beforeEach de arriba precrea un profile completo a
// propósito para las otras pruebas, así que este caso va aparte, con la
// base realmente vacía (dispositivo recién instalado).
describe('Regresión offline — Onboarding completo sin red (F8 Auditoría 7)', () => {
  afterEach(async () => {
    await clearAllUserData(db);
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  beforeEach(async () => {
    // Defensivo: garantiza una base realmente vacía para este caso puntual,
    // sin depender del orden de ejecución de los demás describe del archivo.
    await clearAllUserData(db);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('RED DESHABILITADA — el onboarding no debería llamarla');
      }),
    );
    vi.stubGlobal('XMLHttpRequest', function () {
      throw new Error('RED DESHABILITADA — el onboarding no debería llamarla');
    });
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
  });

  it('completa los 7 pasos del onboarding sin red y llega a Inicio', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Sabores que Conectan con Amor')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Comenzar' }));

    await user.click(await screen.findByRole('button', { name: 'Ambos' }));
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));
    await user.click(await screen.findByRole('button', { name: 'Omitir por ahora' }));

    expect(await screen.findByText('Todo listo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar a Inicio' }));

    expect(await screen.findByText('¿Qué necesitas?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Necesita conexión' })).toBeDisabled();
  });
});
