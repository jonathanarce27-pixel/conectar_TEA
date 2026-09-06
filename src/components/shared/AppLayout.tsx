import { Outlet } from 'react-router-dom';
import { SosButton } from './SosButton';
import { AiButton } from '../ai/AiButton';

// Shell de la app: el botón SOS y el acceso a la IA viven fuera del árbol
// de navegación normal y se renderizan en todas las pantallas (Flujo de
// App §1 y §9).
export function AppLayout() {
  return (
    <>
      <Outlet />
      <SosButton />
      <AiButton />
    </>
  );
}
