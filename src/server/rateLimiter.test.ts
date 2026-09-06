import { afterEach, describe, expect, it } from 'vitest';
import { checkAndConsume, DEVICE_DAILY_LIMIT, IP_DAILY_LIMIT, __resetRateLimiterForTests } from './rateLimiter';

afterEach(() => {
  __resetRateLimiterForTests();
});

describe('rateLimiter (F7 — límite del lado del servidor, no confía en el contador local)', () => {
  it(
    'permite las primeras 10 llamadas de un deviceId y rechaza la 11 — el ' +
      'contador local nunca es la única defensa',
    () => {
      const results = Array.from({ length: 11 }, () => checkAndConsume('device-A', '1.1.1.1'));

      for (let i = 0; i < DEVICE_DAILY_LIMIT; i++) {
        expect(results[i].allowed).toBe(true);
      }
      expect(results[10].allowed).toBe(false);
      expect(results[10].reason).toBe('device_limit');
      expect(results[10].deviceRemaining).toBe(0);
    },
  );

  it('el contador es independiente por deviceId', () => {
    for (let i = 0; i < DEVICE_DAILY_LIMIT; i++) {
      expect(checkAndConsume('device-A', '2.2.2.2').allowed).toBe(true);
    }
    expect(checkAndConsume('device-A', '2.2.2.2').allowed).toBe(false);
    // Un deviceId distinto, misma IP, todavía tiene su propio cupo de 10.
    expect(checkAndConsume('device-B', '2.2.2.2').allowed).toBe(true);
  });

  it(
    'el límite por IP corta un abuso simulado con deviceId rotante — un ' +
      'atacante que genere un deviceId nuevo en cada request no puede ' +
      'saltearse el límite indefinidamente',
    () => {
      let lastResult;
      for (let i = 0; i < IP_DAILY_LIMIT + 5; i++) {
        lastResult = checkAndConsume(`device-rotante-${i}`, '3.3.3.3');
      }

      // Cada deviceId es nuevo (nunca llega a su propio límite de 10), pero
      // la IP compartida sí llega a su tope y empieza a rechazar.
      expect(lastResult!.allowed).toBe(false);
      expect(lastResult!.reason).toBe('ip_limit');
    },
  );

  it('el contador se resetea al pasar al día siguiente', () => {
    const day1 = new Date('2026-09-06T23:59:00Z');
    const day2 = new Date('2026-09-07T00:01:00Z');

    for (let i = 0; i < DEVICE_DAILY_LIMIT; i++) {
      checkAndConsume('device-C', '4.4.4.4', day1);
    }
    expect(checkAndConsume('device-C', '4.4.4.4', day1).allowed).toBe(false);
    expect(checkAndConsume('device-C', '4.4.4.4', day2).allowed).toBe(true);
  });

  it('un request rechazado no consume cupo (no incrementa el contador)', () => {
    for (let i = 0; i < DEVICE_DAILY_LIMIT; i++) {
      checkAndConsume('device-D', '5.5.5.5');
    }
    checkAndConsume('device-D', '5.5.5.5'); // rechazado, 11ª llamada
    checkAndConsume('device-D', '5.5.5.5'); // rechazado, 12ª llamada
    const result = checkAndConsume('device-D', '5.5.5.5');
    expect(result.allowed).toBe(false);
    expect(result.deviceRemaining).toBe(0);
  });
});
