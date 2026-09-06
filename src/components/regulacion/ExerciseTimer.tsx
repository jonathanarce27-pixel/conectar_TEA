import { useEffect, useRef } from 'react';
import { Icon } from '../shared/Icon';
import { useExerciseTimer } from '../../hooks/useExerciseTimer';
import './regulacion.css';

export interface ExerciseTimerProps {
  durationSeconds: number;
  onDone?: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// TRD §7.3: Iniciar / Pausar / Reiniciar sobre useExerciseTimer, que ya
// garantiza precisión aunque la app pase a segundo plano.
export function ExerciseTimer({ durationSeconds, onDone }: ExerciseTimerProps) {
  const { state, remainingSeconds, start, pause, reset } = useExerciseTimer(durationSeconds);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (state === 'done' && !notifiedRef.current) {
      notifiedRef.current = true;
      onDone?.();
    }
    if (state !== 'done') {
      notifiedRef.current = false;
    }
  }, [state, onDone]);

  return (
    <div className="exercise-timer">
      <output className="exercise-timer__display" aria-live="polite">
        {formatTime(remainingSeconds)}
      </output>

      {state === 'done' ? (
        <p className="exercise-timer__done">¡Bien hecho!</p>
      ) : (
        <div className="exercise-timer__controls">
          {state === 'running' ? (
            <button
              type="button"
              className="exercise-timer__button"
              aria-label="Pausar ejercicio"
              onClick={pause}
            >
              <Icon name="i-pause" size={28} />
            </button>
          ) : (
            <button
              type="button"
              className="exercise-timer__button"
              aria-label="Iniciar ejercicio"
              onClick={start}
            >
              <Icon name="i-play" size={28} />
            </button>
          )}
          <button
            type="button"
            className="exercise-timer__button exercise-timer__button--secondary"
            aria-label="Reiniciar ejercicio"
            onClick={reset}
          >
            <Icon name="i-restart" size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
