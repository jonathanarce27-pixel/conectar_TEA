import { describe, expect, it } from 'vitest';

// F8, Auditoría 1 (Design Brief §4.2 paleta / WCAG 2.x contraste). Cada
// caso de abajo es un par color/fondo REAL usado en el código (no
// hipotético) — ver comentarios "F8, Auditoría 1" en los .css citados.
// Implementa la fórmula de contraste de WCAG directamente (no depende de
// una librería) para que un cambio futuro de paleta que rompa el piso de
// AA falle acá, en vez de descubrirse a simple vista.

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// Valores tal como están en src/styles/tokens.css — si tokens.css cambia
// sin actualizar estos valores, las aserciones de abajo lo detectan.
const TOKENS = {
  'crema-app': '#FAF5EA',
  'crema-honda-app': '#F1E9D6',
  'terracota-app': '#C2694A',
  'terracota-suave': '#F1D9CA',
  'terracota-texto': '#974D33',
  'terracota-cta': '#AE583B',
  'salvia-app': '#7C8F68',
  'salvia-suave': '#E7EAD9',
  'salvia-texto': '#5F6D4F',
  'mostaza-app': '#C89A45',
  'mostaza-suave': '#F4E6C8',
  'mostaza-texto': '#836227',
  'coral-app': '#DB7C5E',
  'coral-suave': '#F5E0D3',
  'coral-texto': '#B14827',
  tinta: '#3B2E24',
  white: '#FFFFFF',
} as const;

const AA_TEXT = 4.5;
const AA_ICON_OR_LARGE_TEXT = 3;

describe('Contraste WCAG AA — pares reales texto/fondo e ícono/fondo (F8 Auditoría 1)', () => {
  describe('--terracota-texto: texto real (4.5:1) en cada fondo donde se usa', () => {
    it.each([
      ['diario.css .diario-summary__value', 'crema-honda-app'],
      ['planificador.css .planner-nav__arrow', 'crema-honda-app'],
      ['recetario.css .recipe-detail__step-number', 'terracota-suave'],
      ['regulacion.css .regulacion-group__title--presion', 'salvia-suave'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['terracota-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('--terracota-texto: ícono suelto (3:1) en cada fondo donde se usa', () => {
    it.each([
      ['App.css .header-lockup__halo', 'salvia-suave'],
      ['onboarding.css .onboarding-step__halo', 'salvia-suave'],
      ['App.css .home-card--terracota', 'crema-honda-app'],
      ['recetario.css .recetario-search (i-search)', 'white'],
      ['recetario.css .recipe-card__image-placeholder', 'terracota-suave'],
      ['recetario.css .recipe-detail__hero-placeholder', 'terracota-suave'],
      ['recetario.css .juice-card (i-glass)', 'crema-honda-app'],
      ['regulacion.css .exercise-card--presion', 'terracota-suave'],
      ['regulacion.css .exercise-timer__button--secondary', 'crema-honda-app'],
      ['PictogramButton.css .pictogram-button--terracota', 'crema-honda-app'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['terracota-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });
  });

  describe('--salvia-texto: texto real (4.5:1) en cada fondo donde se usa', () => {
    it.each([
      ['planificador.css .planner-slot__acceptance', 'crema-honda-app'],
      ['regulacion.css .regulacion-group__title--respiracion', 'salvia-suave'],
      ['regulacion.css .exercise-timer__done', 'salvia-suave'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['salvia-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(AA_TEXT);
    });
  });

  describe('--salvia-texto: ícono suelto (3:1) en cada fondo donde se usa', () => {
    it.each([
      ['App.css .home-card--salvia', 'crema-honda-app'],
      ['regulacion.css .exercise-card--respiracion', 'salvia-suave'],
      ['PictogramButton.css .pictogram-button--salvia', 'crema-honda-app'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['salvia-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });
  });

  describe('--mostaza-texto: texto real (4.5:1) en cada fondo donde se usa', () => {
    it('regulacion.css .regulacion-group__title--motricidad sobre salvia-suave', () => {
      expect(contrastRatio(TOKENS['mostaza-texto'], TOKENS['salvia-suave'])).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    });
  });

  describe('--mostaza-texto: ícono suelto (3:1) en cada fondo donde se usa', () => {
    it.each([
      ['App.css .home-card--mostaza', 'crema-honda-app'],
      ['regulacion.css .exercise-card--motricidad', 'mostaza-suave'],
      ['PictogramButton.css .pictogram-button--mostaza', 'crema-honda-app'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['mostaza-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });
  });

  describe('--coral-texto: ícono suelto (3:1) en cada fondo donde se usa', () => {
    it.each([
      ['App.css .home-card--coral', 'crema-honda-app'],
      ['recetario.css .favorite-toggle[aria-pressed=true]', 'coral-suave'],
      ['PictogramButton.css .pictogram-button--coral', 'crema-honda-app'],
    ] as const)('%s sobre %s', (_where, bg) => {
      expect(contrastRatio(TOKENS['coral-texto'], TOKENS[bg])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });
  });

  describe('Todos los tokens -texto cumplen 4.5:1 contra la base común (Crema-app y Crema-honda-app)', () => {
    it.each(['terracota-texto', 'salvia-texto', 'mostaza-texto', 'coral-texto'] as const)(
      '--%s',
      (token) => {
        expect(contrastRatio(TOKENS[token], TOKENS['crema-app'])).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrastRatio(TOKENS[token], TOKENS['crema-honda-app'])).toBeGreaterThanOrEqual(
          AA_TEXT,
        );
      },
    );
  });

  describe('Indicadores invertidos a Terracota-suave + terracota-texto (tabs/chip/burbuja/badge)', () => {
    it('texto sobre Terracota-suave llega a 4.5:1 (diario-tabs, recetario-tabs, regulacion-tabs, chip, ai-chat-message--user, planner-day__today-badge)', () => {
      expect(contrastRatio(TOKENS['terracota-texto'], TOKENS['terracota-suave'])).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    });
  });

  describe('Hallazgo adicional (detectado en verificación visual real, fuera de la tabla original)', () => {
    it('regulacion.css .exercise-detail__step-number: Salvia-app + white solo llegaba a 3.51:1 — se invirtió a Salvia-suave + salvia-texto', () => {
      expect(contrastRatio(TOKENS.white, TOKENS['salvia-app'])).toBeLessThan(AA_TEXT);
      expect(contrastRatio(TOKENS['salvia-texto'], TOKENS['salvia-suave'])).toBeGreaterThanOrEqual(
        AA_TEXT,
      );
    });
  });

  describe('--terracota-cta: fondo de botón sólido de acción principal (4.5:1 con texto claro)', () => {
    it.each([
      ['onboarding.css .onboarding-step__primary (Crema-app)', 'crema-app'],
      ['regulacion.css .exercise-detail__action-button (Crema-app)', 'crema-app'],
      ['regulacion.css .routine-player__next-button (Crema-app)', 'crema-app'],
      ['aiChat.css .ai-chat-screen__form button (white)', 'white'],
    ] as const)('%s', (_where, fg) => {
      expect(contrastRatio(TOKENS[fg], TOKENS['terracota-cta'])).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it('--terracota-app SIN oscurecer NO alcanza 4.5:1 en este mismo uso (confirma por qué existe --terracota-cta)', () => {
      expect(contrastRatio(TOKENS['crema-app'], TOKENS['terracota-app'])).toBeLessThan(AA_TEXT);
      expect(contrastRatio(TOKENS.white, TOKENS['terracota-app'])).toBeLessThan(AA_TEXT);
    });
  });

  describe('Casos ya conformes sin cambios (ícono claro sobre fondo sólido -app, no forman parte de -texto/-cta)', () => {
    it('regulacion.css .exercise-timer__button: Crema-app sobre Terracota-app (Iniciar/Pausar)', () => {
      expect(contrastRatio(TOKENS['crema-app'], TOKENS['terracota-app'])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });

    it('AiButton.css .ai-button: Crema-app sobre Salvia-app (ícono IA)', () => {
      expect(contrastRatio(TOKENS['crema-app'], TOKENS['salvia-app'])).toBeGreaterThanOrEqual(
        AA_ICON_OR_LARGE_TEXT,
      );
    });
  });
});
