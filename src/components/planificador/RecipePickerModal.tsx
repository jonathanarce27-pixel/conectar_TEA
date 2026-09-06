import { RecetarioHome, type PickedItem } from '../recetario/RecetarioHome';
import './planificador.css';

export interface RecipePickerModalProps {
  onPick: (item: PickedItem) => void;
  onClose: () => void;
}

// Flujo de App §6, "Asignar comida": reutiliza el catálogo + búsqueda de
// Recetario (F2) en modo selección — no se duplica el buscador.
export function RecipePickerModal({ onPick, onClose }: RecipePickerModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Elegir receta o jugo">
      <div className="modal-sheet modal-sheet--full">
        <button type="button" className="planner-picker__close" onClick={onClose}>
          Cerrar
        </button>
        <RecetarioHome title="¿Qué vas a preparar?" onPick={onPick} />
      </div>
    </div>
  );
}
