import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { ExerciseTimer } from './ExerciseTimer';
import { ExerciseRepo } from '../../repositories/ExerciseRepo';
import type { RoutineStep } from '../../db/types';
import './regulacion.css';

const AUTO_ADVANCE_DELAY_MS = 1800;

interface RoutineStepViewProps {
  step: RoutineStep;
  onAdvance: () => void;
}

// Flujo de App §5.1: un paso con temporizador (ejercicio) avanza SOLO al
// completarse (más un botón para saltar si se quiere); un paso de acción
// libre no tiene señal objetiva de finalización, así que requiere el
// toque manual en "Siguiente paso". El contenido extraído del PDF no
// distingue esto explícitamente por paso — se decidió usar la naturaleza
// del paso (tiene temporizador o no) como criterio, documentado en el
// reporte de F4.
function RoutineStepView({ step, onAdvance }: RoutineStepViewProps) {
  const exercise = step.refType === 'exercise' && step.refId ? ExerciseRepo.getById(step.refId) : undefined;

  if (exercise) {
    return (
      <div className="routine-player__step">
        <h2 className="routine-player__step-label">{exercise.name}</h2>
        <ExerciseTimerWithAutoAdvance durationSeconds={exercise.durationSeconds} onAdvance={onAdvance} />
        <button type="button" className="routine-player__next-button" onClick={onAdvance}>
          Siguiente paso
        </button>
      </div>
    );
  }

  return (
    <div className="routine-player__step">
      <h2 className="routine-player__step-label">{step.label}</h2>
      <button type="button" className="routine-player__next-button" onClick={onAdvance}>
        Siguiente paso
      </button>
    </div>
  );
}

function ExerciseTimerWithAutoAdvance({
  durationSeconds,
  onAdvance,
}: {
  durationSeconds: number;
  onAdvance: () => void;
}) {
  // ExerciseTimer llama a onDone al llegar a 0; acá esperamos un instante
  // (para que se vea "¡Bien hecho!") y avanzamos solos — el timeout se
  // limpia si el usuario ya avanzó manualmente antes (desmonta el paso).
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <ExerciseTimer
      durationSeconds={durationSeconds}
      onDone={() => {
        const id = setTimeout(onAdvance, AUTO_ADVANCE_DELAY_MS);
        setTimeoutId(id);
      }}
    />
  );
}

export function RoutinePlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routine = id ? ExerciseRepo.getRoutineById(id) : undefined;
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!routine) {
    return (
      <main className="routine-player">
        <p>No encontramos esa rutina.</p>
      </main>
    );
  }

  const handleAdvance = () => {
    if (stepIndex + 1 >= routine.steps.length) {
      setFinished(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  if (finished) {
    return (
      <main className="routine-player">
        <div className="routine-player__done">
          <Icon name="i-check-circle" size={48} />
          <h1 className="routine-player__step-label">Rutina completada</h1>
          <button
            type="button"
            className="routine-player__next-button"
            onClick={() => navigate('/calmarme')}
          >
            Volver a Calmarme
          </button>
        </div>
      </main>
    );
  }

  const currentStep = routine.steps[stepIndex];

  return (
    <main className="routine-player">
      <p className="routine-player__progress">
        Paso {stepIndex + 1} de {routine.steps.length}
      </p>
      <RoutineStepView key={stepIndex} step={currentStep} onAdvance={handleAdvance} />
    </main>
  );
}
