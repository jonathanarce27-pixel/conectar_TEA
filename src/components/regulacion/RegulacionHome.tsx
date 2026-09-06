import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { ExerciseCard } from './ExerciseCard';
import { GROUP_LABEL, GROUP_ORDER } from './groupStyles';
import { ExerciseRepo } from '../../repositories/ExerciseRepo';
import './regulacion.css';

const ROUTINE_LABEL: Record<string, string> = {
  'ritual-comida': 'Ritual de la Comida',
  'rincon-calma': 'Rincón de Calma',
  'transicion-alimentaria': 'Transición Alimentaria',
};

type Tab = 'ejercicios' | 'rutinas';

// Flujo de App §5: catálogo de 12 ejercicios agrupado por el grupo real
// del contenido (respiración/presión/motricidad) — nunca hardcodeado a
// mano, siempre leído de Exercise.group.
export function RegulacionHome() {
  const [tab, setTab] = useState<Tab>('ejercicios');
  const exercises = useMemo(() => ExerciseRepo.getAll(), []);
  const routines = useMemo(() => ExerciseRepo.getRoutines(), []);

  const byGroup = useMemo(() => {
    const map = new Map<string, typeof exercises>();
    for (const group of GROUP_ORDER) map.set(group, []);
    for (const exercise of exercises) {
      map.get(exercise.group)?.push(exercise);
    }
    return map;
  }, [exercises]);

  return (
    <main className="regulacion-screen">
      <h1 className="regulacion-screen__title">Calmarme</h1>

      <div className="regulacion-tabs" role="tablist" aria-label="Calmarme">
        <button type="button" role="tab" aria-selected={tab === 'ejercicios'} onClick={() => setTab('ejercicios')}>
          Ejercicios
        </button>
        <button type="button" role="tab" aria-selected={tab === 'rutinas'} onClick={() => setTab('rutinas')}>
          Rutinas
        </button>
      </div>

      {tab === 'ejercicios' &&
        GROUP_ORDER.map((group) => (
          <section key={group} className="regulacion-group">
            <h2 className={`regulacion-group__title regulacion-group__title--${group}`}>
              {GROUP_LABEL[group]}
            </h2>
            <div className="regulacion-grid">
              {byGroup.get(group)?.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          </section>
        ))}

      {tab === 'rutinas' && (
        <section className="regulacion-group">
          {routines.map((routine) => (
            <Link key={routine.id} to={`/calmarme/rutina/${routine.id}`} className="routine-card">
              <Icon name="i-repeat" size={28} />
              <div>
                <p className="routine-card__name">{ROUTINE_LABEL[routine.name] ?? routine.name}</p>
                <p className="routine-card__meta">{routine.steps.length} pasos</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      <Link to="/calmarme/consejos" className="routine-card">
        <Icon name="i-help" size={24} />
        <span className="routine-card__name">Consejos para la implementación</span>
      </Link>
    </main>
  );
}
