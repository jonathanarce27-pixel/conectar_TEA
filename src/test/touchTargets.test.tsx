import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { RegulacionHome } from '../components/regulacion/RegulacionHome';
import { RecetarioHome } from '../components/recetario/RecetarioHome';
import { DiaryEntryForm } from '../components/diario/DiaryEntryForm';
import { PictogramSettings } from '../components/comunicacion/PictogramSettings';
import { db } from '../db/schema';
import { clearAllUserData, createCommunicationRepo } from '../repositories';

afterEach(async () => {
  await clearAllUserData(db);
});

// jsdom no hace layout real (getBoundingClientRect siempre da 0), así que
// estas pruebas no miden píxeles — combinan (a) confirmar que el elemento
// interactivo real tiene la clase CSS esperada [el hallazgo del textarea
// de Diario era exactamente una clase que no matcheaba ningún elemento] y
// (b) parsear el .css correspondiente para confirmar que esa clase define
// un piso ≥ el requerido. El valor real en píxeles quedó medido y
// documentado a mano en el reporte de F8 (Chrome DevTools, viewport
// 375×812), como corresponde a un hallazgo verificado visualmente.

function minHeightPx(cssFile: string, selectorRegexSource: string): number {
  const css = readFileSync(cssFile, 'utf8');
  const ruleMatch = css.match(new RegExp(`${selectorRegexSource}[^{]*\\{([^}]*)\\}`, 's'));
  if (!ruleMatch) throw new Error(`No se encontró la regla para "${selectorRegexSource}" en ${cssFile}`);
  const heightMatch = ruleMatch[1].match(/min-height:\s*(?:var\(--tap-target-(?:min|nino)\)|(\d+)px)/);
  if (!heightMatch) throw new Error(`"${selectorRegexSource}" no define min-height en ${cssFile}`);
  // Si usa la variable, resolvemos el piso conocido (44 genérico / 56 niño).
  if (!heightMatch[1]) {
    return ruleMatch[1].includes('--tap-target-nino') ? 56 : 44;
  }
  return Number(heightMatch[1]);
}

describe('Objetivos táctiles (F8 Auditoría 2) — regresión de los hallazgos corregidos', () => {
  it('Calmarme (pantalla "de niño"): las pestañas Ejercicios/Rutinas usan la clase con piso 56-64px', () => {
    render(
      <MemoryRouter>
        <RegulacionHome />
      </MemoryRouter>,
    );

    const tab = screen.getByRole('tab', { name: 'Ejercicios' });
    expect(tab.closest('.regulacion-tabs')).not.toBeNull();
    const height = minHeightPx(
      join(process.cwd(), 'src/components/regulacion/regulacion.css'),
      '\\.regulacion-tabs button',
    );
    expect(height).toBeGreaterThanOrEqual(56);
  });

  it('Recetario: el buscador y los chips de textura tienen un piso ≥44px (medían 20px y 40px reales antes de la corrección)', () => {
    render(
      <MemoryRouter>
        <RecetarioHome />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Buscar por nombre/);
    expect(input.closest('.recetario-search')).not.toBeNull();
    const cssPath = join(process.cwd(), 'src/components/recetario/recetario.css');
    expect(minHeightPx(cssPath, '\\.recetario-search input')).toBeGreaterThanOrEqual(44);
    expect(minHeightPx(cssPath, '\\.recetario-texture-filter button')).toBeGreaterThanOrEqual(44);
  });

  it('Diario: el textarea de Observaciones usa una clase que SÍ matchea un elemento real (antes: .diario-form, que no existía)', () => {
    render(
      <MemoryRouter>
        <DiaryEntryForm />
      </MemoryRouter>,
    );

    const textarea = screen.getByPlaceholderText('Observaciones (opcional)');
    // El textarea vive dentro de una sección con esta clase real.
    expect(textarea.closest('.diario-form__section')).not.toBeNull();

    const cssPath = join(process.cwd(), 'src/components/diario/diario.css');
    expect(minHeightPx(cssPath, '\\.diario-form__section textarea')).toBeGreaterThanOrEqual(44);
  });

  it(
    'Configurar pictogramas: "Añadir alimento nuevo"/"Volver a Comunicación" ya no son ' +
      'botones nativos sin estilo (medían 23px reales)',
    () => {
      render(
        <MemoryRouter>
          <PictogramSettings />
        </MemoryRouter>,
      );

      expect(screen.getByRole('button', { name: 'Añadir alimento nuevo' }).className).toContain(
        'recipe-detail__action-button',
      );
      expect(screen.getByRole('button', { name: 'Volver a Comunicación' }).className).toContain(
        'recipe-detail__action-button',
      );

      const height = minHeightPx(
        join(process.cwd(), 'src/components/recetario/recetario.css'),
        '\\.recipe-detail__action-button',
      );
      expect(height).toBeGreaterThanOrEqual(44);
    },
  );

  it(
    'Configurar pictogramas: el toggle "Activo" y "Quitar" de un pictograma personalizado ' +
      'tienen su propia clase con piso ≥44px (antes se achicaban a su tamaño nativo dentro de la fila)',
    async () => {
      const repo = createCommunicationRepo(db);
      await repo.addCustomPictogram({
        categoryId: 'alimentos',
        label: 'Milanesa de la abuela',
        icon: '',
        isActive: true,
        sortOrder: 0,
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<PictogramSettings />} />
          </Routes>
        </MemoryRouter>,
      );

      await user.selectOptions(screen.getByLabelText('Categoría'), 'alimentos');
      const toggleLabel = (await screen.findByText('Milanesa de la abuela')).closest('li')!;
      expect(toggleLabel.querySelector('.pictogram-settings__toggle')).not.toBeNull();
      expect(toggleLabel.querySelector('.pictogram-settings__remove')).not.toBeNull();

      const cssPath = join(process.cwd(), 'src/components/comunicacion/PictogramSettings.css');
      expect(minHeightPx(cssPath, '\\.pictogram-settings__toggle')).toBeGreaterThanOrEqual(44);
    },
  );
});
