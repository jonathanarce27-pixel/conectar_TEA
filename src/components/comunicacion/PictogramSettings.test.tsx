import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PictogramSettings } from './PictogramSettings';
import { db } from '../../db/schema';
import { clearAllUserData } from '../../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

describe('PictogramSettings (Flujo de App §3.4, personalización)', () => {
  it('agrega un pictograma personalizado y lo muestra en la lista', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PictogramSettings />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText('Nombre del pictograma'),
      'Milanesa de la abuela',
    );
    await user.click(screen.getByRole('button', { name: 'Añadir alimento nuevo' }));

    expect(await screen.findByText('Milanesa de la abuela')).toBeInTheDocument();
  });

  it('activa/desactiva y quita un pictograma personalizado', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PictogramSettings />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nombre del pictograma'), 'Puré especial');
    await user.click(screen.getByRole('button', { name: 'Añadir alimento nuevo' }));
    await screen.findByText('Puré especial');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    // El toggle pasa por CommunicationRepo (async) antes de refrescar la
    // lista, así que el checkbox controlado tarda un ciclo en reflejarlo.
    await user.click(checkbox);
    await vi.waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());

    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    await vi.waitFor(() => expect(screen.queryByText('Puré especial')).not.toBeInTheDocument());
  });
});
