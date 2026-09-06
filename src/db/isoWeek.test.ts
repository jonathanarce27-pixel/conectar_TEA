import { describe, expect, it } from 'vitest';
import { getIsoWeekId, getMondayOfWeek } from './isoWeek';

describe('getIsoWeekId', () => {
  it('calcula la semana ISO para una fecha a mitad de año', () => {
    expect(getIsoWeekId(new Date('2026-09-05T12:00:00Z'))).toBe('2026-W36');
  });

  it('el 1 de enero cae en la semana 1 cuando es jueves', () => {
    expect(getIsoWeekId(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
  });

  it('fin de diciembre puede pertenecer a la semana 1 del año siguiente', () => {
    expect(getIsoWeekId(new Date('2025-12-29T12:00:00Z'))).toBe('2026-W01');
  });

  // Casos de borde pedidos explícitamente (Plan de Implementación F3):
  it('un lunes exacto', () => {
    // 2026-09-07 es lunes.
    expect(getIsoWeekId(new Date('2026-09-07T12:00:00Z'))).toBe('2026-W37');
  });

  it('un domingo cae en la semana que empezó el lunes anterior (no en la siguiente)', () => {
    // 2026-09-13 es domingo, último día de la misma semana ISO que el
    // lunes 2026-09-07 — debe dar el mismo id, W37, no W38.
    expect(getIsoWeekId(new Date('2026-09-13T12:00:00Z'))).toBe('2026-W37');
  });

  it('cambio de año: una fecha de enero puede pertenecer a la última semana del año anterior', () => {
    // 2027-01-01 es viernes -> pertenece a la semana 53 de 2026, no a la
    // semana 1 de 2027 (el primer lunes de 2027 es el 2027-01-04).
    expect(getIsoWeekId(new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53');
    expect(getIsoWeekId(new Date('2027-01-04T12:00:00Z'))).toBe('2027-W01');
  });
});

describe('getMondayOfWeek', () => {
  it('un lunes devuelve la misma fecha', () => {
    const monday = getMondayOfWeek(new Date(2026, 8, 7)); // 7 sep 2026, lunes
    expect(monday.getDate()).toBe(7);
    expect(monday.getMonth()).toBe(8);
  });

  it('un domingo devuelve el lunes anterior, no el siguiente', () => {
    const monday = getMondayOfWeek(new Date(2026, 8, 13)); // 13 sep 2026, domingo
    expect(monday.getDate()).toBe(7);
    expect(monday.getMonth()).toBe(8);
  });
});
