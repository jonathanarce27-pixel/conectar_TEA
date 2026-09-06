// Tipos del modelo de datos de la miniapp "Sabores que Conectan con Amor".
// Fuente: Esquema-de-Backend-Miniapp-Sabores.md §4 (contenido) y §5 (datos de usuario).
// Copiados literalmente de la especificación — no reinventar formas nuevas aquí.

// ---------------------------------------------------------------------------
// 1. Contenido del producto (read-only, empaquetado en el build como JSON)
// ---------------------------------------------------------------------------

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Step {
  order: number;
  text: string;
}

export interface TextureVariant {
  description: string;
}

export type Difficulty = 'facil' | 'media' | 'alta';
export type Texture = 'pure' | 'trocitos' | 'crocante';

export interface Recipe {
  id: string; // "R-01" ... "R-48"
  name: string;
  category: string;
  difficulty: Difficulty;
  timeMinutes: number;
  image: string;
  ingredients: Ingredient[];
  steps: Step[];
  bridgeFood?: string;
  // No está en el Esquema de Backend original — agregado en F2 al extraer
  // el PDF real: cada receta trae una sección "Alimentos Puente" con 1-3
  // sugerencias progresivas de food-chaining además del "Desde: X" corto.
  // Es contenido real del PDF sin campo donde encajar; se preserva acá en
  // vez de perderlo (ver decisión documentada en el reporte de F2).
  bridgeFoodTips?: string[];
  textures: {
    pure: TextureVariant;
    trocitos: TextureVariant;
    crocante: TextureVariant;
  };
  sensoryTip: string;
}

export interface Juice {
  id: string; // "J-01" ... "J-12"
  name: string;
  ingredients: Ingredient[];
  preparation: Step[];
  recommendations: string[];
}

export type CommunicationCategoryId =
  | 'necesidades'
  | 'preferencias'
  | 'sensaciones'
  | 'alimentos'
  | 'ayuda';

export interface Pictogram {
  id: string;
  categoryId: CommunicationCategoryId;
  label: string; // "Tengo hambre"
  icon: string;
  audioText?: string; // texto a pasar a SpeechSynthesis
  isCustom: boolean; // false para el set base, true para los del usuario
  isEmergency?: boolean; // default false — marca los de la Tarjeta de Ayuda
}

export interface CommunicationCategory {
  id: CommunicationCategoryId;
  label: string;
  pictograms: Pictogram[];
}

export type ExerciseGroup = 'respiracion' | 'presion' | 'motricidad';

export interface Exercise {
  id: string; // "E-01" ... "E-12"
  name: string;
  group: ExerciseGroup;
  durationSeconds: number;
  difficulty: Difficulty;
  ageRange: string;
  // No está en el Esquema de Backend original — agregado en F4 al extraer
  // el PDF real: cada ficha trae un párrafo descriptivo del ejercicio
  // además de las instrucciones paso a paso. Mismo criterio que
  // Recipe.bridgeFoodTips en F2: contenido real del PDF sin campo donde
  // encajar, se preserva en vez de perderlo.
  description?: string;
  instructions: Step[];
  whenToUse: string;
}

export type RoutineName = 'ritual-comida' | 'rincon-calma' | 'transicion-alimentaria';

export interface RoutineStep {
  refType: 'exercise' | 'action';
  refId?: string;
  label: string;
}

export interface Routine {
  id: string;
  name: RoutineName;
  steps: RoutineStep[];
}

// No está en el Esquema de Backend original — contenido real de "Consejos
// para la Implementación" del PDF de F4 (Bonus 3), sin campo donde encajar
// en Exercise/Routine. Mismo criterio que Recipe.bridgeFoodTips (F2).
export interface ImplementationTip {
  title: string;
  text: string;
}

// ---------------------------------------------------------------------------
// 2. Datos del usuario (mutables, en IndexedDB vía Dexie — sabores-db)
// ---------------------------------------------------------------------------

export type PrimaryUser = 'nino' | 'cuidador' | 'ambos';

export interface UserProfile {
  id: 'local-profile'; // singleton — Esquema de Backend §5.1 usa "local", TRD usa "local-profile"; ver README de decisiones F0
  name?: string;
  birthDate?: string;
  primaryUser: PrimaryUser;
  acceptedFoods: string[];
  rejectedFoods: string[];
  acceptedTextures: Texture[];
  // Campos opcionales y especialmente protegidos (PRD secc. 43):
  diagnosis?: string;
  medication?: string;
  allergies?: string;
  weight?: number;
  height?: number;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomPictogram extends Pictogram {
  photoDataUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export type FavoriteType = 'recipe' | 'juice' | 'exercise';

export interface FavoriteEntry {
  id: string;
  type: FavoriteType;
  refId: string;
  createdAt: string;
}

export type DayOfWeek =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export type MealSlot = 'desayuno' | 'almuerzo' | 'cena' | 'tentempie';

export interface PlannerSlot {
  refType: 'recipe' | 'juice' | 'custom';
  refId?: string;
  label?: string;
  done: boolean;
  acceptance?: 'comio-todo' | 'comio-poco' | 'no-quiso';
}

export type PlannerDay = Partial<Record<MealSlot, PlannerSlot>>;

export interface PlannerWeek {
  id: string; // ISO de lunes de esa semana, ej. "2026-W37"
  days: Record<DayOfWeek, PlannerDay>;
  createdAt: string;
  updatedAt: string;
}

export type DiaryQuantity = 'poco' | 'medio' | 'todo';
export type DiaryTexture = 'P' | 'T' | 'C' | 'M';
export type DiaryBehavior = 'tranquilo' | 'inquieto' | 'ansioso' | 'cooperativo' | 'rechazo';
export type GiSymptom =
  | 'dolor_abdominal'
  | 'gases'
  | 'reflujo'
  | 'nauseas'
  | 'vomitos'
  | 'estrenimiento'
  | 'diarrea';
export type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Emotion = 'contento' | 'preocupado' | 'enfadado' | 'cansado';
export type ExperienceLevel =
  | 'no-quiso-mirar'
  | 'miro'
  | 'toco'
  | 'olio'
  | 'probo'
  | 'comio'
  | 'rechazo';
export type DiarySourceModule = 'manual' | 'recetario' | 'planificador' | 'comunicacion';

export interface DiaryEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  time?: string; // HH:mm
  foodRef?: string; // FK lógica -> Recipe.id / Juice.id
  food?: string; // texto libre / respaldo si foodRef ya no existe
  quantity?: DiaryQuantity;
  texture?: DiaryTexture;
  place?: string;
  company?: string;
  behavior?: DiaryBehavior;
  giSymptoms?: GiSymptom[];
  bowelMovement?: { bristolType: BristolType };
  emotionBefore?: Emotion;
  emotionAfter?: Emotion;
  experienceLevel?: ExperienceLevel;
  observations?: string;
  sourceModule: DiarySourceModule;
  createdAt: string;
}

export interface CommunicationEvent {
  id: string;
  pictogramId: string;
  label: string; // copia del label al momento del evento
  timestamp: string;
}

export interface SettingEntry<T = unknown> {
  key: string;
  value: T;
}

// Claves conocidas de la tabla `settings` (Esquema de Backend §5.7).
export interface SettingsMap {
  soundEnabled: boolean;
  pinEnabled: boolean;
  pinHash: string;
  reducedStimulationMode: boolean;
  lastBackupAt: string;
  aiCallsToday: number;
  aiCallsResetDate: string;
  onboardingStep: number;
  // No está en el Esquema de Backend original — agregado en F1 para
  // soportar "Configurar pictogramas iniciales" del onboarding (Flujo de
  // App §2, Paso 3): ids de pictogramas BASE (isCustom=false) que el
  // cuidador marcó como "no los necesito". No requiere migración de Dexie
  // porque `settings` ya es una tabla clave-valor genérica.
  disabledBasePictogramIds: string[];
  // No está en el Esquema de Backend original — agregado en F7 para el
  // límite de 10 llamadas de IA/día del lado del servidor (TRD §9): un id
  // estable por dispositivo, generado una sola vez (la primera vez que se
  // usa la IA) y enviado en cada llamada al proxy. No es un mecanismo de
  // autenticación — un atacante que le pegue directo al endpoint puede
  // generar el suyo propio — por eso el proxy también limita por IP (ver
  // src/server/rateLimiter.ts).
  aiDeviceId: string;
}
