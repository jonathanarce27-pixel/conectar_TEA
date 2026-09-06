import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { EmergencyScreen } from './EmergencyScreen';
import { CommunicationHome } from './CommunicationHome';
import { AppLayout } from '../shared/AppLayout';
import { CommunicationRepo, clearAllUserData } from '../../repositories';
import { db } from '../../db/schema';
import { useCommunicationStore } from '../../store/communicationStore';

afterEach(async () => {
  await clearAllUserData(db);
  useCommunicationStore.getState().clearSelection();
});

function expectedLabels() {
  return CommunicationRepo.getEmergencyPictograms()
    .map((p) => p.label)
    .sort();
}

describe(
  'Tarjeta de ayuda (Flujo de App §3.3): siempre exactamente los ' +
    'pictogramas isEmergency=true, sin importar desde qué pantalla se dispare',
  () => {
    it('renderizada directamente en /ayuda', () => {
      render(
        <MemoryRouter initialEntries={['/ayuda']}>
          <Routes>
            <Route path="/ayuda" element={<EmergencyScreen />} />
          </Routes>
        </MemoryRouter>,
      );

      const grid = screen.getByRole('heading', { name: 'Necesito ayuda' }).closest('main')!;
      const buttonLabels = within(grid)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
        .filter((label): label is string => label !== null && label !== 'Ir a Inicio')
        .sort();

      expect(buttonLabels).toEqual(expectedLabels());
      expect(buttonLabels.length).toBeGreaterThan(0);
    });

    it('disparada desde el botón SOS flotante estando en Comunicación', async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={['/comunicar']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/comunicar" element={<CommunicationHome />} />
              <Route path="/ayuda" element={<EmergencyScreen />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      await user.click(screen.getByRole('link', { name: 'Necesito ayuda' }));

      const grid = await screen.findByRole('heading', { name: 'Necesito ayuda' });
      const buttonLabels = within(grid.closest('main')!)
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'))
        .filter((label): label is string => label !== null && label !== 'Ir a Inicio')
        .sort();

      expect(buttonLabels).toEqual(expectedLabels());
    });
  },
);
