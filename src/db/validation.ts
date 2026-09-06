// Validación de enums cerrados (Esquema de Backend §12): "un valor fuera de
// esa lista se rechaza en el repositorio antes de escribir en IndexedDB, no
// se guarda igual de forma permisiva".

export class InvalidEnumValueError extends Error {
  constructor(fieldName: string, value: unknown, allowed: readonly unknown[]) {
    super(
      `Valor inválido para "${fieldName}": ${JSON.stringify(value)}. ` +
        `Valores permitidos: ${allowed.map((v) => JSON.stringify(v)).join(', ')}`,
    );
    this.name = 'InvalidEnumValueError';
  }
}

export function assertEnum<T extends string | number>(
  fieldName: string,
  value: T | undefined,
  allowed: readonly T[],
): void {
  if (value === undefined) return;
  if (!allowed.includes(value)) {
    throw new InvalidEnumValueError(fieldName, value, allowed);
  }
}

export function assertEnumArray<T extends string | number>(
  fieldName: string,
  values: T[] | undefined,
  allowed: readonly T[],
): void {
  if (values === undefined) return;
  for (const v of values) {
    assertEnum(fieldName, v, allowed);
  }
}

export const FAVORITE_TYPES = ['recipe', 'juice', 'exercise'] as const;
export const TEXTURES = ['pure', 'trocitos', 'crocante'] as const;
export const DIFFICULTIES = ['facil', 'media', 'alta'] as const;
export const EXERCISE_GROUPS = ['respiracion', 'presion', 'motricidad'] as const;
export const DIARY_QUANTITIES = ['poco', 'medio', 'todo'] as const;
export const DIARY_TEXTURES = ['P', 'T', 'C', 'M'] as const;
export const DIARY_BEHAVIORS = [
  'tranquilo',
  'inquieto',
  'ansioso',
  'cooperativo',
  'rechazo',
] as const;
export const GI_SYMPTOMS = [
  'dolor_abdominal',
  'gases',
  'reflujo',
  'nauseas',
  'vomitos',
  'estrenimiento',
  'diarrea',
] as const;
export const BRISTOL_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;
export const EMOTIONS = ['contento', 'preocupado', 'enfadado', 'cansado'] as const;
export const EXPERIENCE_LEVELS = [
  'no-quiso-mirar',
  'miro',
  'toco',
  'olio',
  'probo',
  'comio',
  'rechazo',
] as const;
export const DIARY_SOURCE_MODULES = ['manual', 'recetario', 'planificador', 'comunicacion'] as const;
export const PLANNER_ACCEPTANCE = ['comio-todo', 'comio-poco', 'no-quiso'] as const;
export const PRIMARY_USERS = ['nino', 'cuidador', 'ambos'] as const;
