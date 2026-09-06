import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { HistorialHome } from './HistorialHome';
import { db } from '../../db/schema';
import { clearAllUserData, DiaryRepo } from '../../repositories';
import { seedSyntheticDiaryEntries } from '../../test/diarySeed';

const TODAY = new Date('2026-09-06T12:00:00');

afterEach(async () => {
  await clearAllUserData(db);
});

function renderHistorial() {
  return render(
    <MemoryRouter>
      <HistorialHome today={TODAY} />
    </MemoryRouter>,
  );
}

describe('HistorialHome (Flujo de App §7.3, 4 vistas sobre diary-entries)', () => {
  it('"Hoy" muestra exactamente los registros de la fecha actual, ninguno de otro día', async () => {
    await seedSyntheticDiaryEntries(DiaryRepo, 5, TODAY); // hoy + 4 días previos
    renderHistorial();

    const list = await screen.findByText(/Puré de calabaza|Yogur|Arroz|Pollo al horno|Banana/);
    expect(list).toBeInTheDocument();

    // El seed pone un registro por día — "Hoy" debe mostrar solo el de hoy.
    const cards = screen.getAllByRole('button', { name: /2026-09-\d\d/ });
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent('2026-09-06');
  });

  it('"Últimos 7 días" incluye exactamente los últimos 7 días, no el día 8', async () => {
    await seedSyntheticDiaryEntries(DiaryRepo, 10, TODAY);
    renderHistorial();

    await userEvent.setup().click(screen.getByRole('tab', { name: 'Últimos 7 días' }));

    const cards = await screen.findAllByRole('button', { name: /2026-\d\d-\d\d/ });
    expect(cards).toHaveLength(7);
    const dates = cards.map((c) => c.textContent?.slice(0, 10)).sort();
    // Día 8 hacia atrás (2026-08-30) no debe aparecer.
    expect(dates).not.toContain('2026-08-30');
    expect(dates).toContain('2026-08-31'); // día 6 hacia atrás, dentro del rango
  });

  it('"Últimos 30 días" muestra el gráfico de tendencia y el resumen, acotado a esos 30 días', async () => {
    await seedSyntheticDiaryEntries(DiaryRepo, 40, TODAY);
    renderHistorial();

    await userEvent.setup().click(screen.getByRole('tab', { name: 'Últimos 30 días' }));

    const chart = await screen.findByRole('img', { name: /Comidas registradas por día/ });
    expect(chart).toBeInTheDocument();

    const summary = screen.getByLabelText('Resumen del rango');
    // 40 días sembrados, pero el rango de 30 días solo debe agregar 30 comidas.
    expect(within(summary).getByText('30')).toBeInTheDocument();
  });

  it(
    'Historial completo pagina correctamente un volumen sintético de 90-120 días ' +
      '(criterio de aceptación b) sin romper ni degradar',
    async () => {
      await seedSyntheticDiaryEntries(DiaryRepo, 100, TODAY);
      renderHistorial();

      await userEvent.setup().click(screen.getByRole('tab', { name: 'Historial completo' }));

      expect(await screen.findByText('Página 1 de 10')).toBeInTheDocument();
      const firstPageCards = screen.getAllByRole('button', { name: /2026-\d\d-\d\d/ });
      expect(firstPageCards).toHaveLength(10);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
      expect(await screen.findByText('Página 2 de 10')).toBeInTheDocument();

      // El label de página cambia en el mismo render que el click, pero la
      // lista se actualiza recién cuando resuelve la consulta de la página
      // 2 — se espera esa condición en vez de asumir que ya está lista.
      await waitFor(() => {
        const secondPageDates = screen
          .getAllByRole('button', { name: /2026-\d\d-\d\d/ })
          .map((c) => c.textContent?.slice(0, 10));
        expect(secondPageDates).not.toContain('2026-09-06');
      });
    },
  );
});
