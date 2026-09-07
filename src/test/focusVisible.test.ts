import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// F8, Auditoría 4 (navegación por teclado). Hallazgo real: `.recetario-search
// input { outline: none; }` quitaba el único indicador de foco del buscador
// de Recetario sin poner nada en su lugar (WCAG 2.4.7) — se corrigió con
// `.recetario-search:focus-within`. Esta prueba es la red de seguridad:
// cualquier `outline: none`/`outline: 0` futuro en cualquier .css DEBE
// tener, en el mismo archivo, alguna regla `:focus` / `:focus-visible` /
// `:focus-within` que ponga un outline real — si no, se cuela el mismo
// hallazgo otra vez sin que nadie lo note hasta una auditoría manual.

function collectCssFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectCssFiles(full, out);
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

describe('Ningún outline:none queda sin reemplazo visible al enfocar (WCAG 2.4.7)', () => {
  it('cada outline: none/0 en un .css tiene una regla :focus*/that pone un outline real en el mismo archivo', () => {
    const files = collectCssFiles(join(process.cwd(), 'src'));
    const offenders: string[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const suppressesOutline = /outline\s*:\s*(none|0)\s*;/.test(text);
      if (!suppressesOutline) continue;

      const hasFocusReplacement =
        /:focus(-visible|-within)?[^{]*\{[^}]*outline\s*:\s*(?!none|0\b)[^;]+;/s.test(text);

      if (!hasFocusReplacement) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
