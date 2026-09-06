import { Link } from 'react-router-dom';
import { Icon } from '../shared/Icon';
import type { Juice } from '../../db/types';

export interface JuiceCardProps {
  juice: Juice;
  /** Modo selección (F3, "Asignar comida"): ver RecipeCard. */
  onSelect?: (juice: Juice) => void;
}

// Juice no tiene campo `image` en el esquema (Esquema de Backend §4.2) —
// se usa el ícono i-glass como placeholder visual simple, no una foto.
export function JuiceCard({ juice, onSelect }: JuiceCardProps) {
  const label = `${juice.name}, ${juice.ingredients.length} ingredientes`;
  const content = (
    <>
      <Icon name="i-glass" size={36} />
      <span className="juice-card__name">{juice.name}</span>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className="juice-card" aria-label={label} onClick={() => onSelect(juice)}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/comer/jugo/${juice.id}`} className="juice-card" aria-label={label}>
      {content}
    </Link>
  );
}
