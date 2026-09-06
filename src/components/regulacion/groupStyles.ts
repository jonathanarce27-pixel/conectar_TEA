import type { ExerciseGroup } from '../../db/types';

// Mismo criterio de color por grupo del sistema de diseño del ebook
// (salvia=Respiración, terracota=Presión Profunda, mostaza=Motricidad),
// pero con los tonos de UI del Design Brief §4.2, no los de impresión.
export const GROUP_LABEL: Record<ExerciseGroup, string> = {
  respiracion: 'Respiración',
  presion: 'Presión Profunda',
  motricidad: 'Motricidad y Movimiento',
};

export const GROUP_ICON: Record<ExerciseGroup, string> = {
  respiracion: 'i-wind',
  presion: 'i-hand-press',
  motricidad: 'i-activity',
};

export const GROUP_ORDER: ExerciseGroup[] = ['respiracion', 'presion', 'motricidad'];
