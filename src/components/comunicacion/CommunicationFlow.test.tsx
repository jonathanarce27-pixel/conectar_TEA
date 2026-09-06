import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CommunicationHome } from './CommunicationHome';
import { CategoryGrid } from './CategoryGrid';
import { ConfirmationScreen } from './ConfirmationScreen';
import { PlannerHome } from '../planificador/PlannerHome';
import { db } from '../../db/schema';
import { clearAllUserData } from '../../repositories';
import { useCommunicationStore } from '../../store/communicationStore';

afterEach(async () => {
  await clearAllUserData(db);
  useCommunicationStore.getState().clearSelection();
});

function renderCommunicationRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/comunicar" element={<CommunicationHome />} />
        <Route path="/comunicar/confirmacion" element={<ConfirmationScreen />} />
        <Route path="/comunicar/:categoryId" element={<CategoryGrid />} />
        <Route path="/semana" element={<PlannerHome />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Flujo básico de Comunicación (Flujo de App §3.1), de punta a punta', () => {
  it('selección de categoría -> grilla de pictogramas -> confirmación visual', async () => {
    const user = userEvent.setup();
    renderCommunicationRoutes('/comunicar');

    expect(screen.getByText('¿Qué quieres decir?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Necesidades básicas' }));

    expect(await screen.findByRole('button', { name: 'Tengo hambre' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tengo hambre' }));

    expect(await screen.findByText('Tengo hambre')).toBeInTheDocument();
  });

  it('la confirmación permite volver a Comunicación sin quedar en un callejón sin salida', async () => {
    const user = userEvent.setup();
    renderCommunicationRoutes('/comunicar');

    await user.click(screen.getByRole('button', { name: 'Necesidades básicas' }));
    await user.click(await screen.findByRole('button', { name: 'Tengo sed' }));
    await screen.findByText('Tengo sed');

    await user.click(screen.getByRole('button', { name: 'Volver a Comunicación' }));
    expect(await screen.findByText('¿Qué quieres decir?')).toBeInTheDocument();
  });
});

describe(
  'Corrección post-F4: "Ver qué toca comer hoy" conecta Comunicación -> Mi Semana ' +
    '(Flujo de App §3.1, rama que dependía del Planificador de F3)',
  () => {
    it('desde la confirmación de un pictograma, navega a Mi Semana con el día de hoy visible/resaltado', async () => {
      const user = userEvent.setup();
      renderCommunicationRoutes('/comunicar');

      await user.click(screen.getByRole('button', { name: 'Necesidades básicas' }));
      await user.click(await screen.findByRole('button', { name: 'Tengo hambre' }));
      await screen.findByText('Tengo hambre');

      await user.click(screen.getByRole('button', { name: 'Ver qué toca comer hoy' }));

      expect(await screen.findByRole('heading', { name: 'Mi Semana' })).toBeInTheDocument();

      // "Hoy" queda marcado explícitamente, no solo presente como un día
      // más de los 7 — ver aria-current="date" en la sección de ese día.
      const todayBadge = screen.getByText('Hoy');
      const todaySection = todayBadge.closest('section');
      expect(todaySection).toHaveClass('planner-day--today');
      expect(todaySection).toHaveAttribute('aria-current', 'date');
    });
  },
);
