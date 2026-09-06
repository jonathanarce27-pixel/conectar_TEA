import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import type { Recipe } from '../../db/types';

const DIFFICULTY_LABEL: Record<Recipe['difficulty'], string> = {
  facil: 'Fácil',
  media: 'Media',
  alta: 'Alta',
};

export interface RecipeCardProps {
  recipe: Recipe;
  /** Modo selección (F3, "Asignar comida"): en vez de navegar a la ficha,
   * la tarjeta se comporta como botón y avisa cuál receta se eligió. */
  onSelect?: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onSelect }: RecipeCardProps) {
  const label = `${recipe.name}, dificultad ${DIFFICULTY_LABEL[recipe.difficulty]}, ${recipe.timeMinutes} minutos`;

  const content = (
    <>
      {recipe.image ? (
        <img className="recipe-card__image" src={recipe.image} alt="" loading="lazy" />
      ) : (
        // TODO: valor provisorio — placeholder visual simple cuando no hay foto real.
        <div className="recipe-card__image-placeholder" aria-hidden="true">
          <Icon name="i-cookbook" size={40} />
        </div>
      )}
      <div className="recipe-card__body">
        <p className="recipe-card__name">{recipe.name}</p>
        <div className="recipe-card__meta">
          <span>
            <Icon name="i-gauge" size={16} /> {DIFFICULTY_LABEL[recipe.difficulty]}
          </span>
          <span>
            <Icon name="i-clock" size={16} /> {recipe.timeMinutes} min
          </span>
          {recipe.bridgeFood && (
            <span>
              <Icon name="i-bridge" size={16} /> {recipe.bridgeFood}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className="recipe-card" aria-label={label} onClick={() => onSelect(recipe)}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/comer/receta/${recipe.id}`} className="recipe-card" aria-label={label}>
      {content}
    </Link>
  );
}
