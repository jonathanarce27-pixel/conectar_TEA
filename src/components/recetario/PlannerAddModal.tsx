import { useState } from 'react';
import { PlannerRepo } from '../../repositories';
import { getIsoWeekId } from '../../db/isoWeek';
import type { DayOfWeek, MealSlot } from '../../db/types';
import './recetario.css';

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

const MEALS: { id: MealSlot; label: string }[] = [
  { id: 'desayuno', label: 'Desayuno' },
  { id: 'almuerzo', label: 'Almuerzo' },
  { id: 'cena', label: 'Cena' },
  { id: 'tentempie', label: 'Tentempié' },
];

export interface PlannerAddModalProps {
  refType: 'recipe' | 'juice';
  refId: string;
  label: string;
  onClose: () => void;
}

// Flujo de App §4 / §6: "Añadir al planificador" — el módulo Mi Semana
// (F3) todavía no tiene pantalla propia, pero el slot se guarda de verdad
// vía PlannerRepo (ya existe desde F0). No se agrega un link "Ver en Mi
// Semana" hasta que esa pantalla exista (decisión F1, reafirmada en F2).
export function PlannerAddModal({ refType, refId, label, onClose }: PlannerAddModalProps) {
  const [day, setDay] = useState<DayOfWeek>('lunes');
  const [meal, setMeal] = useState<MealSlot>('desayuno');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const weekId = getIsoWeekId();
    await PlannerRepo.assignSlot(weekId, day, meal, {
      refType,
      refId,
      done: false,
    });
    setSaved(true);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Añadir al planificador">
      <div className="modal-sheet">
        {saved ? (
          <>
            <p className="modal-confirm-message">Se agregó "{label}" a tu semana.</p>
            <button type="button" className="recipe-detail__action-button" onClick={onClose}>
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 className="modal-sheet__title">¿Qué día y momento?</h2>
            <div className="modal-select-row">
              <label htmlFor="planner-day">Día</label>
              <select
                id="planner-day"
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-select-row">
              <label htmlFor="planner-meal">Momento</label>
              <select
                id="planner-meal"
                value={meal}
                onChange={(e) => setMeal(e.target.value as MealSlot)}
              >
                {MEALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="recipe-detail__action-button" onClick={handleSave}>
              Guardar
            </button>
            <button type="button" className="recipe-detail__action-button" onClick={onClose}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
