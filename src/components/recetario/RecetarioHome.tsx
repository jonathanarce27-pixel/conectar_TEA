import { useMemo, useState } from 'react';
import { Icon } from '../shared/Icon';
import { RecipeCard } from './RecipeCard';
import { JuiceCard } from './JuiceCard';
import { RecipeRepo } from '../../repositories/RecipeRepo';
import { JuiceRepo } from '../../repositories/JuiceRepo';
import type { Texture } from '../../db/types';
import './recetario.css';

type Tab = 'recetas' | 'jugoterapia';

export interface PickedItem {
  type: 'recipe' | 'juice';
  id: string;
  name: string;
}

export interface RecetarioHomeProps {
  /** Modo selección (F3, "Asignar comida"): reutiliza el mismo catálogo +
   * búsqueda + pestañas, pero tocar una tarjeta elige el ítem en vez de
   * navegar a su ficha. Sin esta prop, el catálogo se comporta como en F2. */
  onPick?: (item: PickedItem) => void;
  title?: string;
}

const TEXTURE_OPTIONS: { id: Texture; label: string }[] = [
  { id: 'pure', label: 'Puré' },
  { id: 'trocitos', label: 'Trocitos' },
  { id: 'crocante', label: 'Crocante' },
];

// Flujo de App §4: catálogo con 2 pestañas, búsqueda en memoria
// (Esquema de Backend §7: ≤72 registros, no hace falta índice).
export function RecetarioHome({ onPick, title = 'Comer' }: RecetarioHomeProps) {
  const [tab, setTab] = useState<Tab>('recetas');
  const [query, setQuery] = useState('');
  const [texture, setTexture] = useState<Texture | null>(null);

  const recipes = useMemo(() => {
    if (tab !== 'recetas') return [];
    return RecipeRepo.search({ query: query || undefined, texture: texture ?? undefined });
  }, [tab, query, texture]);

  const juices = useMemo(() => {
    if (tab !== 'jugoterapia') return [];
    return query ? JuiceRepo.search(query) : JuiceRepo.getAll();
  }, [tab, query]);

  return (
    <main className="recetario-screen">
      <h1 className="recetario-screen__title">{title}</h1>

      <div className="recetario-tabs" role="tablist" aria-label="Recetario">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'recetas'}
          onClick={() => setTab('recetas')}
        >
          Recetas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'jugoterapia'}
          onClick={() => setTab('jugoterapia')}
        >
          Jugoterapia
        </button>
      </div>

      <label className="recetario-search">
        <Icon name="i-search" size={20} />
        <span className="sr-only">Buscar por nombre, ingrediente o alimento puente</span>
        <input
          type="search"
          placeholder="Buscar por nombre, ingrediente o alimento puente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {tab === 'recetas' && (
        <div className="recetario-texture-filter" role="group" aria-label="Filtrar por textura">
          <button
            type="button"
            aria-pressed={texture === null}
            onClick={() => setTexture(null)}
          >
            Todas las texturas
          </button>
          {TEXTURE_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={texture === t.id}
              onClick={() => setTexture(texture === t.id ? null : t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'recetas' &&
        (recipes.length > 0 ? (
          <div className="recetario-grid">
            {recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onSelect={onPick ? () => onPick({ type: 'recipe', id: r.id, name: r.name }) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="recetario-empty">No encontramos recetas con esa búsqueda.</p>
        ))}

      {tab === 'jugoterapia' &&
        (juices.length > 0 ? (
          <div className="recetario-grid">
            {juices.map((j) => (
              <JuiceCard
                key={j.id}
                juice={j}
                onSelect={onPick ? () => onPick({ type: 'juice', id: j.id, name: j.name }) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="recetario-empty">No encontramos jugos con esa búsqueda.</p>
        ))}
    </main>
  );
}
