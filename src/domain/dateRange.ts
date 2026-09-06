export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/** Rango inclusivo de los últimos `days` días, terminando hoy. */
export function lastNDaysRange(days: number, today: Date = new Date()): { from: string; to: string } {
  return { from: isoDate(subtractDays(today, days - 1)), to: isoDate(today) };
}

/** Lista de fechas ISO del rango, en orden cronológico (para el eje de un gráfico). */
export function isoDatesInRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    dates.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
