import type Anthropic from '@anthropic-ai/sdk';
import { RecipeRepo, ExerciseRepo, DiaryRepo } from '../repositories';
import { computeSummary } from '../domain/computeSummary';

// F7 — Esquema de Backend §11: funciones expuestas por la capa de
// repositorios con forma de tool, ejecutadas SIEMPRE acá (cliente, donde
// vive Dexie/el contenido estático) — el modelo nunca toca la base de
// datos directamente, solo recibe el resultado ya armado como tool_result.
//
// `import type` para el SDK de Anthropic: solo tipos, se borra en el
// build — no mete el paquete completo en el bundle del cliente.

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_recipes',
    description:
      'Busca recetas reales en el catálogo del Recetario. Devuelve solo resultados que existen de verdad — si no hay resultados, devuelve una lista vacía en vez de inventar una receta.',
    input_schema: {
      type: 'object',
      properties: {
        ingredient: { type: 'string', description: 'Ingrediente o alimento a buscar' },
        category: { type: 'string' },
        bridgeFood: { type: 'string', description: 'Alimento puente (food chaining)' },
        texture: { type: 'string', enum: ['pure', 'trocitos', 'crocante'] },
      },
    },
  },
  {
    name: 'search_exercises',
    description: 'Busca ejercicios reales de regulación en el catálogo de Calmarme.',
    input_schema: {
      type: 'object',
      properties: {
        group: { type: 'string', enum: ['respiracion', 'presion', 'motricidad'] },
        maxDuration: { type: 'number', description: 'Duración máxima en segundos' },
      },
    },
  },
  {
    name: 'get_diary_summary',
    description:
      'Devuelve un resumen YA AGREGADO (conteos, nunca registros individuales) del Diario en un rango de fechas — para redactar en lenguaje natural, no para citar registros puntuales.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Fecha ISO YYYY-MM-DD, inicio del rango' },
        to: { type: 'string', description: 'Fecha ISO YYYY-MM-DD, fin del rango' },
      },
      required: ['from', 'to'],
    },
  },
];

interface SearchRecipesInput {
  ingredient?: string;
  category?: string;
  bridgeFood?: string;
  texture?: 'pure' | 'trocitos' | 'crocante';
}

interface SearchExercisesInput {
  group?: 'respiracion' | 'presion' | 'motricidad';
  maxDuration?: number;
}

interface GetDiarySummaryInput {
  from: string;
  to: string;
}

/** Ejecuta un tool call — siempre devuelve un string JSON (nunca lanza),
 * para que el resultado se pueda mandar tal cual como `tool_result`. */
export async function executeAiTool(name: string, input: unknown): Promise<string> {
  if (name === 'search_recipes') {
    const { ingredient, category, bridgeFood, texture } = input as SearchRecipesInput;
    const results = RecipeRepo.search({ query: ingredient, category, bridgeFood, texture });
    return JSON.stringify(
      results.map((r) => ({ id: r.id, name: r.name, category: r.category, bridgeFood: r.bridgeFood ?? null })),
    );
  }

  if (name === 'search_exercises') {
    const { group, maxDuration } = input as SearchExercisesInput;
    const results = ExerciseRepo.search({ group, maxDuration });
    return JSON.stringify(results.map((e) => ({ id: e.id, name: e.name, group: e.group, durationSeconds: e.durationSeconds })));
  }

  if (name === 'get_diary_summary') {
    const { from, to } = input as GetDiarySummaryInput;
    const entries = await DiaryRepo.getByDateRange(from, to);
    // computeSummary() de F5, sin reimplementar — y el resultado agregado
    // es LO ÚNICO que se serializa acá. `entries` (los DiaryEntry crudos)
    // nunca se le pasa a la IA, ni acá ni en ningún otro tool.
    const summary = computeSummary(entries, { from, to });
    return JSON.stringify(summary);
  }

  return JSON.stringify({ error: `herramienta desconocida: ${name}` });
}
