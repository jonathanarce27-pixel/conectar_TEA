import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import './PictogramButton.css';

// Objetivo táctil 56-64px en pantallas dirigidas al niño (Design Brief §8),
// no el mínimo genérico de 44px. Valor literal (no CSS var) a propósito:
// así una prueba automatizada puede leer getComputedStyle(...).minHeight
// de forma determinística sin depender de resolución de variables CSS.
const CHILD_TAP_TARGET_PX = '56px';

export interface PictogramButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: 'terracota' | 'salvia' | 'mostaza' | 'coral';
}

export function PictogramButton({
  icon,
  label,
  variant = 'terracota',
  style,
  ...rest
}: PictogramButtonProps) {
  return (
    <button
      type="button"
      className={`pictogram-button pictogram-button--${variant}`}
      // Regla de accesibilidad (F1): el label es siempre visible como texto,
      // nunca solo el ícono — aria-label es redundante a propósito, para
      // que el nombre accesible no dependa de cómo el navegador arme el
      // texto visible + ícono decorativo.
      aria-label={label}
      style={{ minHeight: CHILD_TAP_TARGET_PX, minWidth: CHILD_TAP_TARGET_PX, ...style }}
      {...rest}
    >
      <Icon name={icon} size={32} />
      <span className="pictogram-button__label">{label}</span>
    </button>
  );
}
