import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { ExerciseTimer } from './ExerciseTimer';
import { GROUP_ICON, GROUP_LABEL } from './groupStyles';
import { ExerciseRepo } from '../../repositories/ExerciseRepo';
import './regulacion.css';

const DIFFICULTY_LABEL: Record<string, string> = { facil: 'Fácil', media: 'Media', alta: 'Alta' };

// Flujo de App §5: ficha de ejercicio -> "Iniciar" -> temporizador visual.
export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const exercise = id ? ExerciseRepo.getById(id) : undefined;
  const [showTimer, setShowTimer] = useState(false);

  if (!exercise) {
    return (
      <main className="exercise-detail">
        <p>No encontramos ese ejercicio.</p>
      </main>
    );
  }

  return (
    <main className="exercise-detail">
      <div className={`exercise-detail__icon exercise-card--${exercise.group}`}>
        <Icon name={GROUP_ICON[exercise.group]} size={40} />
      </div>
      <h1 className="exercise-detail__name">{exercise.name}</h1>
      <div className="exercise-detail__meta">
        <span>
          <Icon name="i-clock" size={16} /> {Math.round(exercise.durationSeconds / 60)} min
        </span>
        <span>
          <Icon name="i-gauge" size={16} /> {DIFFICULTY_LABEL[exercise.difficulty]}
        </span>
        <span>{exercise.ageRange}</span>
        <span>{GROUP_LABEL[exercise.group]}</span>
      </div>

      {exercise.description && <p>{exercise.description}</p>}

      {showTimer ? (
        <ExerciseTimer durationSeconds={exercise.durationSeconds} />
      ) : (
        <button
          type="button"
          className="exercise-detail__action-button"
          onClick={() => setShowTimer(true)}
        >
          <Icon name="i-play" size={20} /> Iniciar
        </button>
      )}

      <section aria-label="Paso a paso">
        <h2 className="exercise-detail__section-title">Paso a paso</h2>
        <ol className="exercise-detail__steps">
          {exercise.instructions.map((step) => (
            <li key={step.order} className="exercise-detail__step">
              <span className="exercise-detail__step-number">{step.order}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {exercise.whenToUse && (
        <p className="exercise-detail__when">
          <strong>Cuándo usarlo:</strong> {exercise.whenToUse}
        </p>
      )}
    </main>
  );
}
