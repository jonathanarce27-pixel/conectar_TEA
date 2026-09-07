import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// F8, Auditoría 6 (Design Brief §3/§10: "regla absoluta: cero emoji en la
// miniapp"). Escaneo EXHAUSTIVO por rango de código Unicode
// (\p{Extended_Pictographic}), no una lista de emoji conocidos — así
// cualquier emoji que se cuele en cualquier fase futura rompe esta
// prueba, sin depender de mantener una lista.
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;
const SCAN_EXTENSIONS = /\.(ts|tsx|css|json|html)$/;

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    else if (SCAN_EXTENSIONS.test(entry.name)) out.push(full);
  }
  return out;
}

describe('Cero emoji Unicode en todo el código fuente (Design Brief §3/§10)', () => {
  it('ningún archivo bajo src/ contiene un carácter del rango Extended_Pictographic', () => {
    const files = collectFiles(join(process.cwd(), 'src'));
    expect(files.length).toBeGreaterThan(50); // sanity check: el escaneo realmente recorrió el árbol

    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const matches = text.match(EMOJI_PATTERN);
      if (matches) {
        offenders.push(`${file}: ${matches.join(', ')}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('api/ai-chat.ts (fuera de src/) tampoco contiene emoji', () => {
    const text = readFileSync(join(process.cwd(), 'api', 'ai-chat.ts'), 'utf8');
    expect(text.match(EMOJI_PATTERN)).toBeNull();
  });
});
