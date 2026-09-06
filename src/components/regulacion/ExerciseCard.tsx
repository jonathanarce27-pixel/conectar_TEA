import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { GROUP_ICON } from './groupStyles';
import type { Exercise } from '../../db/types';

const DIFFICULTY_LABEL: Record<Exercise['difficulty'], string> = {
  facil: 'Fácil',
  media: 'Media',
  alta: 'Alta',
};

export interface ExerciseCardProps {
  exercise: Exercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const minutes = Math.round(exercise.durationSeconds / 60);
  return (
    <Link
      to={`/calmarme/ejercicio/${exercise.id}`}
      className={`exercise-card exercise-card--${exercise.group}`}
      aria-label={`${exercise.name}, ${minutes} minutos, dificultad ${DIFFICULTY_LABEL[exercise.difficulty]}`}
    >
      <Icon name={GROUP_ICON[exercise.group]} size={36} />
      <span className="exercise-card__name">{exercise.name}</span>
      <span className="exercise-card__meta">
        {minutes} min · {DIFFICULTY_LABEL[exercise.difficulty]}
      </span>
    </Link>
  );
}
