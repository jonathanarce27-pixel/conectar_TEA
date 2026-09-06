// Punto único de acceso al contenido del producto empaquetado en el build.
// Regla de arquitectura (TRD §3 / Esquema de Backend §1): ningún componente
// de UI importa estos JSON directamente — solo los repositorios.
import type {
  CommunicationCategory,
  Exercise,
  ImplementationTip,
  Juice,
  Recipe,
  Routine,
} from '../db/types';
import recetarioData from './recetario_data.json';
import jugoterapiaData from './jugoterapia_data.json';
import ejerciciosData from './ejercicios_data.json';
import comunicacionData from './comunicacion_data.json';

export const recetarioContent: Recipe[] = recetarioData as Recipe[];
export const jugoterapiaContent: Juice[] = jugoterapiaData as Juice[];
export const ejerciciosContent: Exercise[] = (ejerciciosData as { exercises: Exercise[] }).exercises;
export const rutinasContent: Routine[] = (ejerciciosData as { routines: Routine[] }).routines;
// No está en el Esquema de Backend original — contenido real de la página
// "Consejos para la Implementación" del PDF, sin campo donde encajar en
// Exercise/Routine (mismo criterio que bridgeFoodTips en F2).
export const implementationTipsContent: ImplementationTip[] =
  (ejerciciosData as { implementationTips?: ImplementationTip[] }).implementationTips ?? [];
export const comunicacionContent: CommunicationCategory[] =
  comunicacionData as CommunicationCategory[];
