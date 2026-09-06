import { Icon } from './Icon';
import './Chip.css';

// Objetivo táctil de 44px (piso genérico WCAG 2.5.5) — a diferencia de
// PictogramButton (56px), este componente es para pantallas "de cuidador"
// (Design Brief §2: Diario/Historial), no para el niño directamente.
// Valor literal a propósito, mismo criterio que PictogramButton: permite
// leer getComputedStyle(...).minHeight de forma determinística en pruebas.
const CAREGIVER_TAP_TARGET_PX = '44px';

export interface ChipProps {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

// Chip seleccionable (Flujo de App §7.1: "chips, no texto libre salvo
// observaciones") — usado tanto para selección única como múltiple; quién
// llama decide la semántica de selección.
export function Chip({ label, icon, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={selected}
      data-selected={selected || undefined}
      style={{ minHeight: CAREGIVER_TAP_TARGET_PX }}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={20} />}
      <span>{label}</span>
    </button>
  );
}

export interface ChipGroupProps<T extends string> {
  label: string;
  options: { id: T; label: string; icon?: string }[];
  /** Siempre un array — en modo selección única, nunca tiene más de 1 elemento. */
  values: T[];
  onChange: (values: T[]) => void;
  multiple?: boolean;
}

// Grupo de chips: modo múltiple acumula, modo único (default) reemplaza —
// y tocar el chip ya elegido lo deselecciona (el campo es opcional en
// ambos casos, Flujo de App §7.1 no marca ninguno de estos pasos como
// obligatorio salvo el propio guardado).
export function ChipGroup<T extends string>({
  label,
  options,
  values,
  onChange,
  multiple = false,
}: ChipGroupProps<T>) {
  const handleToggle = (id: T) => {
    if (multiple) {
      onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);
    } else {
      onChange(values.includes(id) ? [] : [id]);
    }
  };

  return (
    <fieldset className="chip-group">
      <legend className="chip-group__label">{label}</legend>
      <div className="chip-group__options">
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            icon={option.icon}
            selected={values.includes(option.id)}
            onClick={() => handleToggle(option.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}
