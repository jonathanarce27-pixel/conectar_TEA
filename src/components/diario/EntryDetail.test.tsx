import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { EntryDetail } from './EntryDetail';
import { HistorialHome } from './HistorialHome';
import { db } from '../../db/schema';
import { clearAllUserData, DiaryRepo } from '../../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

function renderDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/diario/historial/${id}`]}>
      <Routes>
        <Route path="/diario/historial/:id" element={<EntryDetail />} />
        <Route path="/diario/historial" element={<HistorialHome />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EntryDetail (Flujo de App §7.3, ficha de detalle [Editar] [Borrar])', () => {
  it('muestra el tipo de Bristol solo como número, sin ningún texto interpretativo agregado', async () => {
    const entry = await DiaryRepo.create({
      date: '2026-09-05',
      sourceModule: 'manual',
      bowelMovement: { bristolType: 6 },
    });
    renderDetail(entry.id);

    const bristolValue = await screen.findByText('6');
    expect(bristolValue).toHaveAttribute('aria-label', 'Tipo 6');
    expect(document.body).not.toHaveTextContent(/duro|blando|líquido|normal|estreñi|diarrea/i);
  });

  it('Editar persiste los cambios sin romper el índice [date+behavior]', async () => {
    const entry = await DiaryRepo.create({
      date: '2026-09-05',
      sourceModule: 'manual',
      behavior: 'tranquilo',
    });
    const user = userEvent.setup();
    renderDetail(entry.id);

    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: 'Ansioso' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByText(`Registro del ${entry.date}`);
    const updated = await DiaryRepo.getById(entry.id);
    expect(updated?.behavior).toBe('ansioso');

    // El índice compuesto [date+behavior] sigue sirviendo consultas por
    // fecha con normalidad después de editar el campo behavior.
    const byDate = await DiaryRepo.getByDate('2026-09-05');
    expect(byDate).toHaveLength(1);
    expect(byDate[0].behavior).toBe('ansioso');
  });

  it('Borrar elimina el registro y vuelve al Historial', async () => {
    const entry = await DiaryRepo.create({ date: '2026-09-05', sourceModule: 'manual' });
    const user = userEvent.setup();
    renderDetail(entry.id);

    await user.click(await screen.findByRole('button', { name: 'Borrar' }));

    await screen.findByText('Historial');
    expect(await DiaryRepo.getById(entry.id)).toBeUndefined();
  });
});
