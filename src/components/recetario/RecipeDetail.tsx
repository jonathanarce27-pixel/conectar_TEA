import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import { ChoicePrompt } from '../shared/ChoicePrompt';
import { PlannerAddModal } from './PlannerAddModal';
import { ExperienceModal } from './ExperienceModal';
import { RecipeRepo } from '../../repositories/RecipeRepo';
import { useFavorite } from '../../hooks/useFavorite';
import type { Texture } from '../../db/types';
import './recetario.css';

const DIFFICULTY_LABEL: Record<string, string> = { facil: 'Fácil', media: 'Media', alta: 'Alta' };
const TEXTURE_LABEL: Record<Texture, string> = { pure: 'Puré', trocitos: 'Trocitos', crocante: 'Crocante' };

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const recipe = id ? RecipeRepo.getById(id) : undefined;
  const { isFavorite, toggle } = useFavorite('recipe', id ?? '');

  const availableTextures = (['pure', 'trocitos', 'crocante'] as Texture[]).filter(
    (t) => recipe?.textures[t]?.description,
  );
  const [selectedTexture, setSelectedTexture] = useState<Texture | undefined>(availableTextures[0]);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);

  if (!recipe) {
    return (
      <main className="recipe-detail">
        <p className="recetario-empty">No encontramos esa receta.</p>
      </main>
    );
  }

  return (
    <main className="recipe-detail">
      {recipe.image ? (
        <img className="recipe-detail__hero" src={recipe.image} alt={recipe.name} />
      ) : (
        <div className="recipe-detail__hero-placeholder" aria-hidden="true">
          <Icon name="i-cookbook" size={56} />
        </div>
      )}

      <div className="recipe-detail__body">
        <div className="recipe-detail__header">
          <div>
            <h1 className="recipe-detail__name">{recipe.name}</h1>
            <div className="recipe-detail__meta">
              <span>
                <Icon name="i-gauge" size={18} /> {DIFFICULTY_LABEL[recipe.difficulty]}
              </span>
              <span>
                <Icon name="i-clock" size={18} /> {recipe.timeMinutes} min
              </span>
              {recipe.bridgeFood && (
                <span>
                  <Icon name="i-bridge" size={18} /> Desde: {recipe.bridgeFood}
                </span>
              )}
            </div>
          </div>
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
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {[ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ')}
              </li>
            ))}
          </ul>
        </section>

        {availableTextures.length > 0 && (
          <section aria-label="Selector de textura">
            <ChoicePrompt
              question="¿Con qué textura la vas a preparar?"
              options={availableTextures.map((t) => ({ id: t, label: TEXTURE_LABEL[t], icon: 'i-texture' }))}
              onSelect={(t) => setSelectedTexture(t as Texture)}
            />
            {selectedTexture && (
              <p className="recipe-detail__texture-description">
                <strong>{TEXTURE_LABEL[selectedTexture]}:</strong>{' '}
                {recipe.textures[selectedTexture].description}
              </p>
            )}
          </section>
        )}

        <section aria-label="Paso a paso">
          <h2 className="recipe-detail__section-title">Paso a paso</h2>
          <ol className="recipe-detail__steps">
            {recipe.steps.map((step) => (
              <li key={step.order} className="recipe-detail__step">
                <span className="recipe-detail__step-number">{step.order}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        {recipe.sensoryTip && (
          <p className="recipe-detail__sensory-tip">
            <strong>Consejo sensorial:</strong> {recipe.sensoryTip}
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
          refType="recipe"
          refId={recipe.id}
          label={recipe.name}
          onClose={() => setShowPlannerModal(false)}
        />
      )}
      {showExperienceModal && (
        <ExperienceModal
          foodRef={recipe.id}
          foodName={recipe.name}
          onClose={() => setShowExperienceModal(false)}
        />
      )}
    </main>
  );
}
