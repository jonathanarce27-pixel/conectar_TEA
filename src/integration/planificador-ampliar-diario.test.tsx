import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlannerHome } from '../components/planificador/PlannerHome';
import { NewEntryRoute } from '../components/diario/NewEntryRoute';
import { PlannerRepo, clearAllUserData } from '../repositories';
import { db } from '../db/schema';
import { getIsoWeekId, getMondayOfWeek } from '../db/isoWeek';

afterEach(async () => {
  await clearAllUserData(db);
});

function currentWeekId() {
  return getIsoWeekId(getMondayOfWeek());
}

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
function todayKey() {
  return DAYS[(new Date().getDay() + 6) % 7];
}

function renderPlannerWithDiarioRoute() {
  return render(
    <MemoryRouter initialEntries={['/semana']}>
      <Routes>
        <Route path="/semana" element={<PlannerHome />} />
        <Route path="/diario/nuevo" element={<NewEntryRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

// F5 Parte B: "Marcar como realizada" con aceptación != "Comió todo" ofrece
// ampliar a un registro completo de Diario, pre-rellenado con el alimento
// del PlannerSlot — sin romper el guardado de la aceptación en sí. Solo se
// asigna una comida por prueba, así que los botones son únicos en la
// página sin necesidad de acotar por día/celda.
describe('PlannerHome -> "Ampliar a un registro completo de Diario"', () => {
  it('con "Comió un poco", ofrece ampliar y el Diario llega pre-rellenado con food/foodRef/quantity', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), todayKey(), 'almuerzo', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlannerWithDiarioRoute();

    await screen.findByText('Puré de Patata y Zanahoria Arcoíris');
    await user.click(screen.getByRole('button', { name: /Marcar como realizada/ }));
    await user.click(screen.getByRole('button', { name: 'Comió un poco' }));

    // El guardado de la aceptación en sí no se rompe con la nueva oferta.
    await vi.waitFor(async () => {
      const week = await PlannerRepo.getWeek(currentWeekId());
      expect(week?.days[todayKey()].almuerzo?.acceptance).toBe('comio-poco');
    });

    await user.click(
      await screen.findByRole('button', { name: 'Ampliar a un registro completo de Diario' }),
    );

    expect(await screen.findByText('Nuevo registro')).toBeInTheDocument();
    expect(screen.getByText('Puré de Patata y Zanahoria Arcoíris')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Poco' })).toHaveAttribute('data-selected', 'true');
  });

  it('con "No quiso comer", ofrece ampliar con food/foodRef pero sin cantidad pre-rellenada', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), todayKey(), 'cena', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlannerWithDiarioRoute();

    await screen.findByText('Puré de Patata y Zanahoria Arcoíris');
    await user.click(screen.getByRole('button', { name: /Marcar como realizada/ }));
    await user.click(screen.getByRole('button', { name: 'No quiso comer' }));

    await vi.waitFor(async () => {
      const week = await PlannerRepo.getWeek(currentWeekId());
      expect(week?.days[todayKey()].cena?.acceptance).toBe('no-quiso');
    });

    await user.click(
      await screen.findByRole('button', { name: 'Ampliar a un registro completo de Diario' }),
    );

    expect(await screen.findByText('Nuevo registro')).toBeInTheDocument();
    expect(screen.getByText('Puré de Patata y Zanahoria Arcoíris')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Poco' })).not.toHaveAttribute('data-selected');
    expect(screen.getByRole('button', { name: 'Todo' })).not.toHaveAttribute('data-selected');
  });

  it('con "Comió todo", NO ofrece ampliar (solo aplica cuando la aceptación no es completa)', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), todayKey(), 'desayuno', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlannerWithDiarioRoute();

    await screen.findByText('Puré de Patata y Zanahoria Arcoíris');
    await user.click(screen.getByRole('button', { name: /Marcar como realizada/ }));
    await user.click(screen.getByRole('button', { name: 'Comió todo' }));

    await vi.waitFor(async () => {
      const week = await PlannerRepo.getWeek(currentWeekId());
      expect(week?.days[todayKey()].desayuno?.acceptance).toBe('comio-todo');
    });

    expect(
      screen.queryByRole('button', { name: 'Ampliar a un registro completo de Diario' }),
    ).not.toBeInTheDocument();
  });
});
