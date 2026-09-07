import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// F8, Auditoría 3 (Design Brief §8: "prefers-reduced-motion se respeta
// siempre"). Hallazgo: las 4 transiciones CSS reales del código (App.css,
// AiButton.css, PictogramButton.css, SosButton.css) ya usan
// var(--transition-fundido), que tokens.css pone en 0ms bajo
// @media (prefers-reduced-motion: reduce) — RoutinePlayer y
// ConfirmationScreen, señalados explícitamente para revisar, NO tienen
// ninguna transición/animación CSS (se confirmó por ausencia, no se
// asumió). Esta prueba es la red de seguridad para que ninguna fase
// futura agregue una transición/animación con una duración fija que
// ignore la preferencia del usuario.

function collectCssFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectCssFiles(full, out);
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

describe('prefers-reduced-motion (Design Brief §8)', () => {
  it('tokens.css define --transition-fundido y lo pone en 0ms bajo prefers-reduced-motion: reduce', () => {
    const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');
    expect(tokens).toMatch(/--transition-fundido:\s*240ms/);
    expect(tokens).toMatch(/@media \(prefers-reduced-motion: reduce\)/);

    const reducedMotionBlock = tokens.slice(tokens.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reducedMotionBlock).toMatch(/--transition-fundido:\s*0ms/);
  });

  it(
    'ninguna declaración transition/animation en todo src/ usa una duración fija propia — ' +
      'todas derivan de var(--transition-fundido), la única que respeta reduced-motion',
    () => {
      const files = collectCssFiles(join(process.cwd(), 'src'));
      const offenders: string[] = [];

      for (const file of files) {
        const text = readFileSync(file, 'utf8');
        // Busca declaraciones transition:/animation: que NO referencien la
        // variable — una duración como "240ms"/"0.3s" escrita a mano ahí
        // ignoraría la preferencia de reduced-motion.
        const declarations = text.match(/(?<!--)\b(transition|animation)\s*:[^;]+;/g) ?? [];
        for (const decl of declarations) {
          if (!decl.includes('var(--transition-fundido)')) {
            offenders.push(`${file}: ${decl.trim()}`);
          }
        }
      }

      expect(offenders).toEqual([]);
    },
  );

  it('no hay ningún @keyframes en el código (Design Brief: nada de loops/parpadeos/rebote)', () => {
    const files = collectCssFiles(join(process.cwd(), 'src'));
    const offenders = files.filter((f) => readFileSync(f, 'utf8').includes('@keyframes'));
    expect(offenders).toEqual([]);
  });
});
