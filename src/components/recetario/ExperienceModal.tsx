import { useState } from 'react';
import { DiaryRepo } from '../../repositories';
import type { ExperienceLevel } from '../../db/types';
import './recetario.css';

const EXPERIENCE_LEVELS: { id: ExperienceLevel; label: string }[] = [
  { id: 'no-quiso-mirar', label: 'No quiso mirar' },
  { id: 'miro', label: 'Miró' },
  { id: 'toco', label: 'Tocó' },
  { id: 'olio', label: 'Olió' },
  { id: 'probo', label: 'Probó' },
  { id: 'comio', label: 'Comió' },
  { id: 'rechazo', label: 'Rechazó' },
];

export interface ExperienceModalProps {
  foodRef: string;
  foodName: string;
  onClose: () => void;
}

// Flujo de App §4: "Registrar experiencia" — el Diario (F5) todavía no
// tiene pantalla propia, pero el registro se guarda de verdad vía
// DiaryRepo (F0), con foodRef+food completos (Esquema de Backend §8: todo
// registro con foodRef debe conservar también el nombre en texto plano).
export function ExperienceModal({ foodRef, foodName, onClose }: ExperienceModalProps) {
  const [saved, setSaved] = useState(false);

  const handleSelect = async (level: ExperienceLevel) => {
    await DiaryRepo.create({
      date: new Date().toISOString().slice(0, 10),
      foodRef,
      food: foodName,
      experienceLevel: level,
      sourceModule: 'recetario',
    });
    setSaved(true);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Registrar experiencia">
      <div className="modal-sheet">
        {saved ? (
          <>
            <p className="modal-confirm-message">Se registró tu experiencia con "{foodName}".</p>
            <button type="button" className="recipe-detail__action-button" onClick={onClose}>
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 className="modal-sheet__title">¿Cómo fue la experiencia?</h2>
            <div className="recetario-texture-filter">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => handleSelect(level.id)}
                  style={{ minHeight: 44 }}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <button type="button" className="recipe-detail__action-button" onClick={onClose}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
