// Genera el id de PlannerWeek en formato ISO semana (Esquema de Backend
// §5.4, ej. "2026-W37") para la semana que contiene `date`.
export function getIsoWeekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Mueve al jueves de la semana ISO actual (día 1=lunes...7=domingo).
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Lunes (00:00 hora local) de la semana ISO que contiene `date` — usado
// para navegar entre semanas en Mi Semana (F3) sumando/restando 7 días.
export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = (d.getDay() + 6) % 7; // lunes=0 ... domingo=6
  d.setDate(d.getDate() - dayNum);
  return d;
}

