import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExerciseTimer } from './useExerciseTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-06T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useExerciseTimer', () => {
  it('cuenta regresiva correcta mientras corre en primer plano', () => {
    const { result } = renderHook(() => useExerciseTimer(10));
    expect(result.current.remainingSeconds).toBe(10);

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));

    expect(result.current.remainingSeconds).toBe(7);
    expect(result.current.state).toBe('running');
  });

  it('llega a "done" y se detiene en 0, no en negativo', () => {
    const { result } = renderHook(() => useExerciseTimer(5));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(8000));

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.state).toBe('done');
  });

  it('pausa y reanuda sin perder precisión', () => {
    const { result } = renderHook(() => useExerciseTimer(10));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000)); // quedan 7s
    act(() => result.current.pause());
    expect(result.current.remainingSeconds).toBe(7);
    expect(result.current.state).toBe('paused');

    // Mientras está en pausa, el paso del tiempo NO debe descontar nada.
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingSeconds).toBe(7);

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000)); // quedan 5s
    expect(result.current.remainingSeconds).toBe(5);
  });

  it('reset vuelve al total original y al estado idle', () => {
    const { result } = renderHook(() => useExerciseTimer(10));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.reset());

    expect(result.current.remainingSeconds).toBe(10);
    expect(result.current.state).toBe('idle');
  });

  it(
    'criterio de aceptación (a): sigue siendo preciso si la pestaña pasa a ' +
      'segundo plano y los ticks de setInterval se atrasan/pierden mientras tanto',
    () => {
      const { result } = renderHook(() => useExerciseTimer(30));
      act(() => result.current.start());

      // Simula la pestaña yéndose a segundo plano: el reloj real avanza
      // 20 segundos, pero (a diferencia del test de arriba) NO dejamos que
      // vitest dispare los ~80 ticks de 250ms que "deberían" haber ocurrido
      // — usamos setSystemTime para mover el reloj de pared sin disparar el
      // intervalo, tal como un navegador que limita timers en background.
      act(() => {
        vi.setSystemTime(new Date('2026-09-06T12:00:20.000Z'));
      });

      // Al volver a primer plano, el listener de visibilitychange fuerza
      // un recálculo inmediato con el Date.now() real, sin esperar el
      // próximo tick programado.
      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Un contador ingenuo que solo restara 1 por cada tick de setInterval
      // disparado (y ninguno se disparó de verdad durante el "background")
      // seguiría marcando 30 o muy cerca. La implementación correcta debe
      // reflejar los 20 segundos reales transcurridos: 30 - 20 = 10.
      expect(result.current.remainingSeconds).toBe(10);
      expect(result.current.state).toBe('running');
    },
  );

  it('no arranca de nuevo si ya está "done"', () => {
    const { result } = renderHook(() => useExerciseTimer(2));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.state).toBe('done');

    act(() => result.current.start());
    expect(result.current.state).toBe('done');
    expect(result.current.remainingSeconds).toBe(0);
  });
});
