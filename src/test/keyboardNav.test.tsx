import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExerciseTimer } from '../components/regulacion/ExerciseTimer';
import { PlannerAddModal } from '../components/recetario/PlannerAddModal';
import { DiaryEntryForm } from '../components/diario/DiaryEntryForm';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../db/schema';
import { clearAllUserData } from '../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

// F8, Auditoría 4: recorrido completo solo con Tab/Shift+Tab/Enter/Espacio,
// sin mouse — foco en los 3 componentes que el cuidador señaló como los
// más complejos de operar sin mouse.
describe('Navegación por teclado — componentes complejos (F8 Auditoría 4)', () => {
  describe('Temporizador de Ejercicios (F4)', () => {
    it('el botón Iniciar es alcanzable con Tab y operable con Enter', async () => {
      const user = userEvent.setup();
      render(<ExerciseTimer durationSeconds={60} />);

      await user.tab();
      expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(await screen.findByRole('button', { name: 'Pausar ejercicio' })).toHaveFocus();
    });

    it('el botón Reiniciar es alcanzable con Tab y operable con Espacio', async () => {
      const user = userEvent.setup();
      render(<ExerciseTimer durationSeconds={60} />);

      await user.tab(); // Iniciar/Pausar
      await user.tab(); // Reiniciar
      expect(screen.getByRole('button', { name: 'Reiniciar ejercicio' })).toHaveFocus();

      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'Iniciar ejercicio' })).toBeInTheDocument();
    });
  });

  describe('Modal "Añadir al planificador" (F2/F3)', () => {
    it('los 2 selects y los botones Guardar/Cancelar son alcanzables en orden con Tab', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PlannerAddModal refType="recipe" refId="R-01" label="Puré de Patata" onClose={onClose} />);

      await user.tab();
      expect(screen.getByLabelText('Día')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Momento')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Guardar' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    });

    it('se puede elegir día/momento y guardar sin tocar el mouse', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PlannerAddModal refType="recipe" refId="R-01" label="Puré de Patata" onClose={onClose} />);

      await user.tab();
      await user.selectOptions(screen.getByLabelText('Día'), 'martes');
      await user.tab();
      await user.selectOptions(screen.getByLabelText('Momento'), 'cena');
      await user.tab();
      await user.keyboard('{Enter}');

      expect(await screen.findByText(/Se agregó "Puré de Patata" a tu semana/)).toBeInTheDocument();
    });
  });

  describe('Formulario de Diario con secciones condicionales (F5)', () => {
    function renderForm() {
      return render(
        <MemoryRouter>
          <DiaryEntryForm />
        </MemoryRouter>,
      );
    }

    it(
      'el checkbox de síntomas es operable con Espacio, y los controles que ' +
        'aparecen después (chips + Bristol) quedan alcanzables con Tab a continuación',
      async () => {
        const user = userEvent.setup();
        renderForm();

        const checkbox = screen.getByRole('checkbox', { name: '¿Hubo síntomas digestivos?' });
        checkbox.focus();
        expect(checkbox).toHaveFocus();

        await user.keyboard(' ');
        expect(checkbox).toBeChecked();

        // Recién aparecidos por el toggle — deben ser alcanzables con Tab
        // inmediatamente después del checkbox, no requerir mouse.
        await user.tab();
        expect(screen.getByRole('button', { name: 'Dolor abdominal' })).toHaveFocus();
      },
    );

    it('un chip de selección única se activa con Enter y con Espacio', async () => {
      const user = userEvent.setup();
      renderForm();

      const pocoChip = screen.getByRole('button', { name: 'Poco' });
      pocoChip.focus();
      await user.keyboard('{Enter}');
      expect(pocoChip).toHaveAttribute('data-selected', 'true');

      await user.keyboard(' '); // vuelve a tocar el mismo chip -> deselecciona
      expect(pocoChip).not.toHaveAttribute('data-selected');
    });

    it('"Guardar" es alcanzable con Tab y operable con Enter sin mouse', async () => {
      const user = userEvent.setup();
      renderForm();

      const guardar = screen.getByRole('button', { name: 'Guardar' });
      guardar.focus();
      await user.keyboard('{Enter}');

      expect(await screen.findByText('Se guardó tu registro.')).toBeInTheDocument();
    });
  });
});
