// Iconografía lineal propia — cero emoji Unicode (Design Brief §3, §6, §10).
// TODO: valor provisorio, confirmar con el cliente — placeholder mínimo
// hasta reexportar el sprite real del ebook (`sistema-diseno-ebook.md`)
// como estos mismos nombres de <Icon name="..." />. Mismo criterio en
// todos: trazo 2.2-2.6px, redondeado, viewBox 0 0 48 48.
import type { SVGProps } from 'react';

const BASE_PATHS: Record<string, string> = {
  // --- F0 ---
  'i-bowl-heart':
    'M8 24c0 8.837 7.163 16 16 16s16-7.163 16-16H8Z M18 15c0-2.761 2.239-5 5-5 1.657 0 3 1.343 3 3 0-1.657 1.343-3 3-3 2.761 0 5 2.239 5 5 0 3.5-4 6-8 8-4-2-8-4.5-8-8Z',
  'i-glass': 'M15 9h18l-2 30H17L15 9Z M15 9h18 M18 20h12',
  'i-meditate': 'M24 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 34c2-8 7-12 12-12s10 4 12 12',
  'i-calendar': 'M9 12h30v27H9V12Z M9 19h30 M16 8v8 M32 8v8',
  'i-home': 'M8 22 24 8l16 14 M13 20v20h22V20',

  // --- F1: Comunicación / onboarding ---
  'i-food': 'M9 26c0 8 6.7 14 15 14s15-6 15-14H9Z M15 18c1-4 4-7 9-7s8 3 9 7',
  'i-toilet': 'M14 10h20v8H14Z M14 18v6c0 8 4 14 10 14s10-6 10-14v-6',
  'i-stop': 'M14 10h20v28H14Z',
  'i-thumb-up':
    'M10 22h6v16h-6Z M16 22l6-14c2-1 4 1 3 3l-2 7h13c2 0 3 2 2 4l-4 12c-1 2-2 3-4 3H16Z',
  'i-thumb-down':
    'M10 10h6v16h-6Z M16 26l6 14c2 1 4-1 3-3l-2-7h13c2 0 3-2 2-4l-4-12c-1-2-2-3-4-3H16Z',
  'i-plus': 'M24 10v28 M10 24h28',
  'i-minus': 'M10 24h28',
  'i-thermo-hot': 'M22 8h4v22a7 7 0 1 1-4 0V8Z M20 30h8',
  'i-thermo-cold': 'M22 8h4v22a7 7 0 1 1-4 0V8Z M14 16l-4-2 M14 16l-4 2 M14 16v-5',
  'i-stomach': 'M16 10c-4 4-6 8-6 14 0 8 6 14 14 14s14-6 14-14c0-4-2-8-5-11',
  'i-texture': 'M10 14h28 M10 24h28 M10 34h28',
  'i-bread': 'M10 26c0-9 6-16 14-16s14 7 14 16v6H10Z',
  'i-milk': 'M19 8h10l2 6v26H17V14Z M17 20h14',
  'i-chicken':
    'M18 12c6-4 12-4 16 2 3 4 2 9-2 12l2 10H16l2-10c-4-2-6-6-4-10 1-2 2-3 4-4Z',
  'i-rice': 'M12 26a12 8 0 1 0 24 0 12 8 0 1 0-24 0Z M18 26v-8 M24 26v-10 M30 26v-8',
  'i-potato':
    'M14 20c-3 3-4 7-2 11 3 5 9 6 14 4 6-2 9-8 7-13-2-4-6-6-11-6-3 0-6 1-8 4Z',
  'i-banana': 'M12 32c8 4 20 2 24-8 1-3 0-6-2-6-1 4-4 8-9 10-5 2-10 2-13 4Z',
  'i-apple':
    'M24 16c-6-6-14-2-13 5 1 8 8 15 13 15s12-7 13-15c1-7-7-11-13-5Z M24 16v-6 M24 10c2-2 5-2 6 0',
  'i-cookie':
    'M24 10a14 14 0 1 0 0 28 14 14 0 0 0 0-28Z M19 19h.01 M29 19h.01 M18 27h.01 M28 28h.01 M24 23h.01',
  'i-help':
    'M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32Z M19 19c1-4 4-6 7-5 3 1 5 4 3 7-1 2-4 3-5 5v2 M24 32h.01',
  'i-clock': 'M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32Z M24 15v9l7 5',
  'i-heart':
    'M24 38C12 30 6 23 6 16c0-5 4-9 9-9 4 0 7 2 9 5 2-3 5-5 9-5 5 0 9 4 9 9 0 7-6 14-18 22Z',
  'i-mute': 'M8 18v12h8l12 8V10L16 18Z M34 18l8 8 M42 18l-8 8',
  'i-sos': 'M24 6 8 14v10c0 12 8 18 16 22 8-4 16-10 16-22V14Z M24 18v10 M24 32h.01',
  'i-communicate': 'M8 10h32v20H20l-6 6v-6H8Z',
  'i-eat': 'M14 8v10 M14 8v28 M18 8v10 M34 8c-4 0-6 4-6 8s2 6 6 6v18',
  'i-diary': 'M12 8h20l4 4v28H12Z M16 16h16 M16 22h16 M16 28h10',

  // --- F2: Recetario / Jugoterapia ---
  'i-cookbook': 'M10 8h24v34l-12-6-12 6Z M14 8v30',
  'i-list': 'M18 12h20 M18 24h20 M18 36h20 M10 12h.01 M10 24h.01 M10 36h.01',
  'i-gauge': 'M8 34a16 16 0 1 1 32 0 M24 34 32 20',
  'i-bridge': 'M6 30c4-8 10-12 18-12s14 4 18 12 M6 30h36 M14 30v-6 M34 30v-6',
  'i-search': 'M22 8a14 14 0 1 0 0 28 14 14 0 0 0 0-28Z M32 32l10 10',
  'i-star':
    'M24 6l5.5 12 13 1.5-9.8 9 2.6 12.9L24 35l-11.3 6.4L15.3 28.5l-9.8-9 13-1.5Z',
  'i-plus-calendar': 'M9 12h30v27H9V12Z M9 19h30 M16 8v8 M32 8v8 M24 26v10 M19 31h10',

  // --- F3: Planificador semanal ---
  'i-shopping-cart': 'M8 10h6l5 22h20l4-16H16 M18 40a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M32 40a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  'i-repeat': 'M12 16h20a6 6 0 0 1 6 6v2 M38 32H18a6 6 0 0 1-6-6v-2 M18 10l-6 6 6 6 M30 38l6-6-6-6',
  'i-check-circle': 'M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32Z M17 24l5 5 10-11',
  'i-edit': 'M30 8l10 10-22 22H8V30Z M24 14l10 10',
  'i-trash': 'M10 14h28 M18 14V9h12v5 M14 14l2 26h16l2-26',

  // --- F4: Ejercicios de Regulación + Rutinas ---
  'i-play': 'M14 9l24 15-24 15Z',
  'i-pause': 'M14 8h8v32h-8Z M26 8h8v32h-8Z',
  'i-restart': 'M12 24a12 12 0 1 0 4-8.9 M12 24V13 M12 24h11',
  'i-wind': 'M6 16h24a5 5 0 1 0-5-5 M6 24h32a5 5 0 1 1-5 5 M6 32h20a5 5 0 1 1-5 5',
  'i-hand-press': 'M16 22V10a3 3 0 0 1 6 0v10 M22 20v-6a3 3 0 0 1 6 0v8 M28 22v-4a3 3 0 0 1 6 0v10c0 8-5 12-11 12h-4c-4 0-6-2-9-6l-4-6c-1.5-2 1-4.5 3-3l5 4',
  'i-activity': 'M6 24h8l4-14 8 28 4-14h12',

  // --- F5: Diario / Historial — emociones e íconos de conducta.
  // Regla del Design Brief: cero emoji Unicode, incluidas las "caras" de
  // emoción — estos son trazos lineales propios (mismo estilo que el resto
  // del sprite), no glifos de emoji del sistema operativo.
  'i-emotion-contento': 'M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z M17 20h.01 M31 20h.01 M16 28c2 4 6 6 8 6s6-2 8-6',
  'i-emotion-preocupado':
    'M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z M14 19l6 2 M34 19l-6 2 M17 33c2-3 5-3 7 0s5 3 7 0',
  'i-emotion-enfadado':
    'M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z M14 21l6-3 M34 21l-6-3 M16 35c2-4 6-6 8-6s6 2 8 6',
  'i-emotion-cansado': 'M24 6a18 18 0 1 0 0 36 18 18 0 0 0 0-36Z M15 20h6 M27 20h6 M17 32h14',
  'i-restless': 'M8 26l5-8 5 16 5-16 5 16 5-16 5 8',
};

const PATHS: Record<string, string> = {
  ...BASE_PATHS,
  // Reutilizan un glifo ya definido — mismo ícono, otro nombre semántico.
  'i-calm': BASE_PATHS['i-meditate'],
  'i-week': BASE_PATHS['i-calendar'],
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: keyof typeof PATHS | string;
  size?: number;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  const d = PATHS[name];
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
