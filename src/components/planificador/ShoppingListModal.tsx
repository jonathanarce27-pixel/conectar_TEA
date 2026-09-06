import { useEffect, useState } from 'react';
import { PlannerRepo, type ShoppingListItem } from '../../repositories';
import './planificador.css';

export interface ShoppingListModalProps {
  weekId: string;
  onClose: () => void;
}

// Flujo de App §6: se recalcula siempre al abrir — nunca queda un valor
// cacheado desactualizado tras agregar/modificar/quitar una asignación.
export function ShoppingListModal({ weekId, onClose }: ShoppingListModalProps) {
  const [items, setItems] = useState<ShoppingListItem[] | null>(null);

  useEffect(() => {
    PlannerRepo.getShoppingList(weekId).then(setItems);
  }, [weekId]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Lista de la compra">
      <div className="modal-sheet">
        <h2 className="modal-sheet__title">Lista de la compra</h2>
        {items === null ? null : items.length === 0 ? (
          <p className="recetario-empty">Todavía no asignaste comidas esta semana.</p>
        ) : (
          <ul className="shopping-list">
            {items.map((item) => (
              <li key={`${item.name}-${item.unit}`}>
                <span>{item.name}</span>
                <span>
                  {item.quantityDisplay} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="recipe-detail__action-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
