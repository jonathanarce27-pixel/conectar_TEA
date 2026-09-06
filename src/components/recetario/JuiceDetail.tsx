import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { PlannerAddModal } from './PlannerAddModal';
import { ExperienceModal } from './ExperienceModal';
import { JuiceRepo } from '../../repositories/JuiceRepo';
import { useFavorite } from '../../hooks/useFavorite';
import './recetario.css';

// Flujo de App §4: idéntico al flujo de Recetario, sin selector de
// textura (los jugos no tienen esa variante en el contenido fuente).
export function JuiceDetail() {
  const { id } = useParams<{ id: string }>();
  const juice = id ? JuiceRepo.getById(id) : undefined;
  const { isFavorite, toggle } = useFavorite('juice', id ?? '');
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  if (!juice) {
    return (
      <main className="recipe-detail">
        <p className="recetario-empty">No encontramos ese jugo.</p>
      </main>
    );
  }

  return (
    <main className="recipe-detail">
      <div className="recipe-detail__hero-placeholder" aria-hidden="true">
        <Icon name="i-glass" size={56} />
      </div>

      <div className="recipe-detail__body">
        <div className="recipe-detail__header">
          <h1 className="recipe-detail__name">{juice.name}</h1>
          <button
            type="button"
            className="favorite-toggle"
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            onClick={toggle}
          >
            <Icon name="i-star" size={22} />
          </button>
        </div>

        <section aria-label="Ingredientes">
          <h2 className="recipe-detail__section-title">
            <Icon name="i-list" size={18} /> Ingredientes
          </h2>
          <ul className="recipe-detail__ingredients">
            {juice.ingredients.map((ing, i) => (
              <li key={i}>{[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}</li>
            ))}
          </ul>
        </section>

        <section aria-label="Preparación">
          <h2 className="recipe-detail__section-title">Preparación</h2>
          <ol className="recipe-detail__steps">
            {juice.preparation.map((step) => (
              <li key={step.order} className="recipe-detail__step">
                <span className="recipe-detail__step-number">{step.order}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {juice.recommendations.length > 0 && (
          <p className="recipe-detail__sensory-tip">
            <strong>Recomendaciones:</strong> {juice.recommendations.join(' ')}
          </p>
        )}

        <div className="recipe-detail__actions">
          <button
            type="button"
            className="recipe-detail__action-button"
            onClick={() => setShowPlannerModal(true)}
          >
            <Icon name="i-plus-calendar" size={20} /> Añadir al planificador
          </button>
          <button
            type="button"
            className="recipe-detail__action-button"
            onClick={() => setShowExperienceModal(true)}
          >
            <Icon name="i-diary" size={20} /> Registrar experiencia
          </button>
        </div>
      </div>

      {showPlannerModal && (
        <PlannerAddModal
          refType="juice"
          refId={juice.id}
          label={juice.name}
          onClose={() => setShowPlannerModal(false)}
        />
      )}
      {showExperienceModal && (
        <ExperienceModal
          foodRef={juice.id}
          foodName={juice.name}
          onClose={() => setShowExperienceModal(false)}
        />
      )}
    </main>
  );
}
