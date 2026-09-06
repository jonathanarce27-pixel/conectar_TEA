import { describe, expect, it } from 'vitest';
import { isoDate, isoDatesInRange, lastNDaysRange, subtractDays } from './dateRange';

describe('dateRange', () => {
  it('isoDate formatea a YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-09-06T15:30:00Z'))).toBe('2026-09-06');
  });

  it('subtractDays resta días de calendario, incluso cruzando meses', () => {
    expect(isoDate(subtractDays(new Date('2026-09-02T00:00:00'), 5))).toBe('2026-08-28');
  });

  it('lastNDaysRange(7) devuelve un rango inclusivo de 7 días terminando hoy', () => {
    const range = lastNDaysRange(7, new Date('2026-09-06T00:00:00'));
    expect(range).toEqual({ from: '2026-08-31', to: '2026-09-06' });
  });

  it('isoDatesInRange enumera cada fecha del rango, sin saltarse ni duplicar', () => {
    const dates = isoDatesInRange('2026-08-30', '2026-09-02');
    expect(dates).toEqual(['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02']);
  });
});
