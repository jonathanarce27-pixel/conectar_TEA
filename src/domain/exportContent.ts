import type { DiaryEntry } from '../db/types';
import { computeSummary, type DiarySummary, type SummaryRange } from './computeSummary';

// Contenido GENERADO por esta fase (F6), no extraído de ningún documento
// fuente — el PRD (secc. 58, fila "Preguntas profesional") menciona que
// existen "6 preguntas" como contenido ya escrito en algún material previo,
// pero no las enumera en ningún lugar del propio PRD (búsqueda explícita
// hecha antes de escribir esto). Genéricas, basadas en los campos del
// resumen, sin afirmar causalidad ni diagnóstico (PRD secc. 27/36) —
// **deben revisarse antes de F9** según lo pedido explícitamente.
export const GENERATED_PROFESSIONAL_QUESTIONS = [
  '¿Es esperable que ciertos alimentos generen más rechazo que otros a esta edad, o conviene evaluarlo con más detalle?',
  'Sobre los síntomas digestivos registrados en este período, ¿ameritan algún seguimiento particular?',
  '¿Hay alguna recomendación sobre las texturas que mejor está tolerando actualmente?',
  'Los episodios de ansiedad registrados durante las comidas, ¿son un patrón a trabajar, y de qué forma?',
  '¿Hay algún paso concreto que podamos probar en casa a partir de estos registros?',
];

export interface ExportEntryRow {
  date: string;
  time: string;
  food: string;
  quantity: string;
  texture: string;
  behavior: string;
  giSymptoms: string;
  bristol: string;
  emotionBefore: string;
  emotionAfter: string;
  observations: string;
}

export interface ExportContent {
  range: SummaryRange;
  summary: DiarySummary;
  summaryLines: string[];
  entryRows: ExportEntryRow[];
  professionalQuestions: string[];
}

function entryToRow(entry: DiaryEntry): ExportEntryRow {
  return {
    date: entry.date,
    time: entry.time ?? '',
    food: entry.food ?? '',
    quantity: entry.quantity ?? '',
    texture: entry.texture ?? '',
    behavior: entry.behavior ?? '',
    giSymptoms: entry.giSymptoms?.join(', ') ?? '',
    bristol: entry.bowelMovement ? String(entry.bowelMovement.bristolType) : '',
    emotionBefore: entry.emotionBefore ?? '',
    emotionAfter: entry.emotionAfter ?? '',
    observations: entry.observations ?? '',
  };
}

function summaryToLines(summary: DiarySummary): string[] {
  const symptomBreakdown = Object.entries(summary.symptomCounts)
    .map(([symptom, count]) => `${symptom}: ${count}`)
    .join(', ');
  const textureBreakdown = Object.entries(summary.texturesUsed)
    .map(([texture, count]) => `${texture}: ${count}`)
    .join(', ');

  return [
    `Alimentos distintos registrados: ${summary.distinctFoodsCount}`,
    `Comidas registradas: ${summary.mealsLogged}`,
    `Rechazos: ${summary.rejections}`,
    `Registros con síntomas: ${summary.symptomsRecorded}${symptomBreakdown ? ` (${symptomBreakdown})` : ''}`,
    `Episodios de ansiedad: ${summary.anxietyEpisodes}`,
    `Texturas utilizadas: ${textureBreakdown || 'ninguna registrada'}`,
    `Alimentos favoritos: ${summary.favoriteFoods.join(', ') || 'ninguno registrado'}`,
    `Alimentos rechazados: ${summary.rejectedFoods.join(', ') || 'ninguno registrado'}`,
  ];
}

/** Arma el contenido textual compartido por PDF e Impresión (TRD §8: "mismo
 * contenido base") — reutiliza computeSummary() de F5 tal cual, sin
 * reimplementar el cálculo acá. Rango sin registros: no rompe, produce
 * contenido vacío coherente en vez de un error. */
export function buildExportContent(
  entries: DiaryEntry[],
  range: SummaryRange,
  professionalQuestions: string[] = GENERATED_PROFESSIONAL_QUESTIONS,
): ExportContent {
  const summary = computeSummary(entries, range);
  return {
    range,
    summary,
    summaryLines: summaryToLines(summary),
    entryRows: entries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(entryToRow),
    professionalQuestions,
  };
}
