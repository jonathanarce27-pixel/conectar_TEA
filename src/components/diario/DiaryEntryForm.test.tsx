import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { DiaryEntryForm } from './DiaryEntryForm';
import { db } from '../../db/schema';
import { clearAllUserData, DiaryRepo } from '../../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

function renderForm(props: React.ComponentProps<typeof DiaryEntryForm> = {}) {
  return render(
    <MemoryRouter>
      <DiaryEntryForm {...props} />
    </MemoryRouter>,
  );
}

describe('DiaryEntryForm (Flujo de App §7.1, formulario manual de Diario)', () => {
  it('guarda un registro con la combinación mínima (sin ningún campo opcional presente)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Se guardó tu registro.')).toBeInTheDocument();
    const all = await DiaryRepo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ sourceModule: 'manual' });
    expect(all[0].food).toBeUndefined();
    expect(all[0].behavior).toBeUndefined();
  });

  it('guarda un registro con todos los campos opcionales presentes', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Todo' })); // cantidad
    await user.click(screen.getByRole('button', { name: 'Trocitos' })); // textura
    await user.click(screen.getByRole('button', { name: 'Casa' })); // dónde
    await user.click(screen.getByRole('button', { name: 'Mamá' })); // con quién
    await user.click(screen.getByRole('button', { name: 'Tranquilo' })); // conducta
    await user.click(screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' }));
    await user.click(screen.getByRole('button', { name: 'Gases' }));
    await user.click(screen.getByRole('button', { name: 'Tipo 4' }));
    const antesGroup = screen.getByRole('group', { name: 'Antes' });
    await user.click(within(antesGroup).getByRole('button', { name: 'Contento' }));
    const despuesGroup = screen.getByRole('group', { name: 'Después' });
    await user.click(within(despuesGroup).getByRole('button', { name: 'Cansado' }));
    await user.type(screen.getByPlaceholderText('Observaciones (opcional)'), 'Comió sin dificultad');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Se guardó tu registro.');

    const [entry] = await DiaryRepo.getAll();
    expect(entry).toMatchObject({
      quantity: 'todo',
      texture: 'T',
      place: 'Casa',
      company: 'Mamá',
      behavior: 'tranquilo',
      giSymptoms: ['gases'],
      bowelMovement: { bristolType: 4 },
      emotionBefore: 'contento',
      emotionAfter: 'cansado',
      observations: 'Comió sin dificultad',
    });
  });

  it('elige un alimento real del Recetario y guarda foodRef + food', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Elegir del Recetario' }));
    await user.click(await screen.findByRole('button', { name: /Puré de Patata y Zanahoria Arcoíris/ }));

    expect(screen.getByText('Puré de Patata y Zanahoria Arcoíris')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Se guardó tu registro.');

    const [entry] = await DiaryRepo.getAll();
    expect(entry.food).toBe('Puré de Patata y Zanahoria Arcoíris');
    expect(entry.foodRef).toBeTruthy();
  });

  it('si se destilda "¿Hubo síntomas digestivos?" después de elegir alguno, no se guardan síntomas ni Bristol', async () => {
    const user = userEvent.setup();
    renderForm();

    const toggle = screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Gases' }));
    await user.click(screen.getByRole('button', { name: 'Tipo 4' }));
    await user.click(toggle); // destildar

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Se guardó tu registro.');

    const [entry] = await DiaryRepo.getAll();
    expect(entry.giSymptoms).toBeUndefined();
    expect(entry.bowelMovement).toBeUndefined();
  });

  it(
    'la sección 5 (síntomas GI + Bristol) queda colapsada por defecto — Flujo ' +
      'de App §7.1 la marca "(si aplica)", no debe sumar densidad al caso ' +
      'común de un registro sin síntomas',
    () => {
      renderForm();

      // El checkbox en sí es liviano y siempre visible...
      expect(screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' })).not.toBeChecked();
      // ...pero la grilla de 7 síntomas y la escala de Bristol NO se
      // renderizan hasta que el usuario indica que sí hubo algún síntoma.
      expect(screen.queryByRole('button', { name: 'Gases' })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Escala de Bristol (tipo 1-7)' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Tipo 4' })).not.toBeInTheDocument();
    },
  );

  it(
    'la escala de Bristol muestra solo el número elegido, sin ningún texto ' +
      'interpretativo o diagnóstico agregado por la UI (PRD secc. 27)',
    async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' }));
      const bristolGroup = screen.getByRole('group', { name: 'Escala de Bristol (tipo 1-7)' });

      // Ningún texto que describa qué significa cada tipo (duro/blando/
      // líquido, etc.) — solo los números 1-7 como opciones.
      expect(bristolGroup).not.toHaveTextContent(/duro|blando|líquido|normal|estreñi|diarrea/i);
      for (const n of [1, 2, 3, 4, 5, 6, 7]) {
        expect(screen.getByRole('button', { name: `Tipo ${n}` })).toBeInTheDocument();
      }
    },
  );

  it('con prefill (food/foodRef/quantity/giSymptoms), arranca con esos campos ya completos', async () => {
    renderForm({
      prefill: { food: 'Puré de calabaza', foodRef: 'R-01', quantity: 'poco', giSymptoms: ['dolor_abdominal'] },
      sourceModule: 'recetario',
    });

    expect(screen.getByText('Puré de calabaza')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Dolor abdominal' })).toHaveAttribute('data-selected', 'true');
  });

  it('"Añadir otro registro" limpia el formulario y permite guardar un segundo registro', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Todo' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Se guardó tu registro.');

    await user.click(screen.getByRole('button', { name: 'Añadir otro registro' }));
    expect(screen.getByText('Nuevo registro')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Se guardó tu registro.');

    const all = await DiaryRepo.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((e) => e.quantity).sort()).toEqual([undefined, 'todo'].sort());
  });
});
