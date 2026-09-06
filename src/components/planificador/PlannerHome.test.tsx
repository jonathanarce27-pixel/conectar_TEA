import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlannerHome } from './PlannerHome';
import { PlannerRepo, clearAllUserData } from '../../repositories';
import { db } from '../../db/schema';
import { getIsoWeekId, getMondayOfWeek } from '../../db/isoWeek';

afterEach(async () => {
  await clearAllUserData(db);
});

function renderPlanner() {
  return render(
    <MemoryRouter>
      <PlannerHome />
    </MemoryRouter>,
  );
}

function currentWeekId() {
  return getIsoWeekId(getMondayOfWeek());
}

describe(
  'PlannerHome — criterio (a): una asignación de F2 aparece correctamente en la celda',
  () => {
    it('un slot ya escrito directamente vía PlannerRepo (simula "Añadir al planificador" de F2) se muestra en su día/momento', async () => {
      await PlannerRepo.assignSlot(currentWeekId(), 'miercoles', 'cena', {
        refType: 'recipe',
        refId: 'R-01',
        done: false,
      });

      renderPlanner();

      const miercolesSection = (await screen.findByRole('heading', { name: /Miércoles/ })).closest('section')!;
      expect(
        await within(miercolesSection).findByText('Puré de Patata y Zanahoria Arcoíris'),
      ).toBeInTheDocument();
    });

    it('asignar una comida desde la propia grilla (tocar celda vacía -> elegir receta) persiste y se muestra', async () => {
      const user = userEvent.setup();
      renderPlanner();

      const lunesSection = screen.getByRole('heading', { name: /Lunes/ }).closest('section')!;
      await user.click(within(lunesSection).getByRole('button', { name: 'Desayuno+ Agregar' }));

      await user.type(
        await screen.findByPlaceholderText('Buscar por nombre, ingrediente o alimento puente'),
        'tostada francesa',
      );
      await user.click(await screen.findByRole('button', { name: /Tostada Francesa/ }));

      expect(await within(lunesSection).findByText('Tostada Francesa (Suave y Dulce)')).toBeInTheDocument();

      const week = await PlannerRepo.getWeek(currentWeekId());
      expect(week?.days.lunes.desayuno).toMatchObject({ refType: 'recipe', refId: 'R-48' });
    });
  },
);

describe('PlannerHome — Marcar como realizada / Modificar / Quitar', () => {
  it('los 3 chips de aceptación escriben el valor correcto en el slot', async () => {
    const cases: Array<['comio-todo' | 'comio-poco' | 'no-quiso', string]> = [
      ['comio-todo', 'Comió todo'],
      ['comio-poco', 'Comió un poco'],
      ['no-quiso', 'No quiso comer'],
    ];

    for (const [acceptance, label] of cases) {
      await clearAllUserData(db);
      await PlannerRepo.assignSlot(currentWeekId(), 'martes', 'almuerzo', {
        refType: 'recipe',
        refId: 'R-01',
        done: false,
      });

      const user = userEvent.setup();
      const { unmount } = renderPlanner();

      const martesSection = (await screen.findByRole('heading', { name: /Martes/ })).closest('section')!;
      await user.click(
        await within(martesSection).findByRole('button', { name: /Marcar como realizada/ }),
      );
      await user.click(within(martesSection).getByRole('button', { name: label }));

      await vi.waitFor(async () => {
        const week = await PlannerRepo.getWeek(currentWeekId());
        expect(week?.days.martes.almuerzo?.acceptance).toBe(acceptance);
        expect(week?.days.martes.almuerzo?.done).toBe(true);
      });
      unmount();
    }
  });

  it('"Modificar" reemplaza la receta asignada en el mismo día/momento', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), 'jueves', 'cena', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlanner();

    const juevesSection = (await screen.findByRole('heading', { name: /Jueves/ })).closest('section')!;
    await user.click(await within(juevesSection).findByRole('button', { name: /Modificar/ }));

    await user.type(
      await screen.findByPlaceholderText('Buscar por nombre, ingrediente o alimento puente'),
      'nuggets',
    );
    await user.click(await screen.findByRole('button', { name: /Nuggets de Pollo/ }));

    expect(await within(juevesSection).findByText(/Nuggets de Pollo Caseros/)).toBeInTheDocument();
    const week = await PlannerRepo.getWeek(currentWeekId());
    expect(week?.days.jueves.cena?.refId).toBe('R-02');
  });

  it('"Quitar" limpia el slot y vuelve a mostrar la celda vacía', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), 'viernes', 'tentempie', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlanner();

    const viernesSection = (await screen.findByRole('heading', { name: /Viernes/ })).closest('section')!;
    expect(
      await within(viernesSection).findByText('Puré de Patata y Zanahoria Arcoíris'),
    ).toBeInTheDocument();

    await user.click(within(viernesSection).getByRole('button', { name: /Quitar/ }));

    expect(
      await within(viernesSection).findByRole('button', { name: 'Tentempié+ Agregar' }),
    ).toBeInTheDocument();
    const week = await PlannerRepo.getWeek(currentWeekId());
    expect(week?.days.viernes.tentempie).toBeUndefined();
  });
});

describe('PlannerHome — "Reutilizar semana anterior" (criterio c)', () => {
  it('clona los 7×4 slots de la semana previa a la semana visible, con un id distinto', async () => {
    const monday = getMondayOfWeek();
    const previousMonday = new Date(monday);
    previousMonday.setDate(previousMonday.getDate() - 7);
    const previousWeekId = getIsoWeekId(previousMonday);

    await PlannerRepo.assignSlot(previousWeekId, 'lunes', 'desayuno', {
      refType: 'juice',
      refId: 'J-01',
      done: true,
      acceptance: 'comio-todo',
    });
    await PlannerRepo.assignSlot(previousWeekId, 'domingo', 'cena', {
      refType: 'recipe',
      refId: 'R-03',
      done: false,
    });

    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /Reutilizar semana anterior/ }));

    const cloned = await PlannerRepo.getWeek(currentWeekId());
    expect(cloned?.id).not.toBe(previousWeekId);
    expect(Object.keys(cloned!.days).length).toBe(7);
    const totalSlots = Object.values(cloned!.days).reduce(
      (count, day) => count + Object.keys(day).length,
      0,
    );
    expect(totalSlots).toBe(2); // los 2 slots reales clonados (el resto de los 28 quedan vacíos, como en el origen)
    expect(cloned?.days.lunes.desayuno).toMatchObject({ refId: 'J-01', acceptance: 'comio-todo' });
    expect(cloned?.days.domingo.cena).toMatchObject({ refId: 'R-03' });
  });

  it('si no hay semana anterior guardada, avisa sin romper la UI', async () => {
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /Reutilizar semana anterior/ }));

    expect(
      await screen.findByText('No hay una semana anterior guardada para reutilizar.'),
    ).toBeInTheDocument();
  });
});

describe('PlannerHome — navegación entre semanas', () => {
  it('moverse a una semana sin datos muestra la grilla vacía, no un error', async () => {
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));

    const lunesSection = (await screen.findByRole('heading', { name: /Lunes/ })).closest('section')!;
    expect(within(lunesSection).getAllByText('+ Agregar').length).toBe(4);
  });
});

describe('PlannerHome — lista de la compra', () => {
  it('abre y muestra los ingredientes de las recetas asignadas en la semana visible', async () => {
    await PlannerRepo.assignSlot(currentWeekId(), 'lunes', 'almuerzo', {
      refType: 'recipe',
      refId: 'R-01',
      done: false,
    });
    const user = userEvent.setup();
    renderPlanner();

    await user.click(screen.getByRole('button', { name: /Lista de la compra/ }));

    expect(await screen.findByText('patatas medianas')).toBeInTheDocument();
  });
});
