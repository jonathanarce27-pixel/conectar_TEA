import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

// TRD §7.3: máquina de estados idle -> running -> paused -> done. El
// tiempo restante SIEMPRE se recalcula a partir de Date.now() en cada
// tick/reanudación — nunca se confía en el conteo acumulado de
// setInterval, porque los navegadores limitan/pausan timers en pestañas
// en segundo plano y un contador ingenuo se desincroniza.
export function useExerciseTimer(totalSeconds: number) {
  const [state, setState] = useState<TimerState>('idle');
  const [remaining, setRemaining] = useState(totalSeconds);

  const startTimestampRef = useRef<number | null>(null);
  const remainingAtStartRef = useRef(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<TimerState>('idle');

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const recompute = useCallback(() => {
    if (startTimestampRef.current === null) return;
    const elapsed = (Date.now() - startTimestampRef.current) / 1000;
    const next = Math.max(0, remainingAtStartRef.current - elapsed);
    setRemaining(next);
    if (next <= 0) {
      clearTick();
      stateRef.current = 'done';
      setState('done');
    }
  }, [clearTick]);

  const start = useCallback(() => {
    if (stateRef.current === 'done' || stateRef.current === 'running') return;
    startTimestampRef.current = Date.now();
    stateRef.current = 'running';
    setState('running');
    clearTick();
    intervalRef.current = setInterval(recompute, 250);
  }, [clearTick, recompute]);

  const pause = useCallback(() => {
    if (stateRef.current !== 'running' || startTimestampRef.current === null) return;
    const elapsed = (Date.now() - startTimestampRef.current) / 1000;
    remainingAtStartRef.current = Math.max(0, remainingAtStartRef.current - elapsed);
    startTimestampRef.current = null;
    setRemaining(remainingAtStartRef.current);
    clearTick();
    stateRef.current = 'paused';
    setState('paused');
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    startTimestampRef.current = null;
    remainingAtStartRef.current = totalSeconds;
    setRemaining(totalSeconds);
    stateRef.current = 'idle';
    setState('idle');
  }, [clearTick, totalSeconds]);

  // Al volver de segundo plano, recalcula de inmediato en vez de esperar
  // al próximo tick programado (que puede tardar si el navegador limitó
  // los timers mientras la pestaña estaba oculta).
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && stateRef.current === 'running') {
        recompute();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [recompute]);

  useEffect(() => clearTick, [clearTick]);

  return {
    state,
    remainingSeconds: Math.ceil(remaining),
    start,
    pause,
    reset,
  };
}
