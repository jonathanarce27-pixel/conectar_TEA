import { useLocation } from 'react-router-dom';
import { DiaryEntryForm, type DiaryEntryFormPrefill } from './DiaryEntryForm';
import type { DiarySourceModule } from '../../db/types';

interface NewEntryRouteState {
  prefill?: DiaryEntryFormPrefill;
  sourceModule?: DiarySourceModule;
}

// Punto de entrada de la ruta /diario/nuevo: lee el pre-rellenado que
// Planificador o Comunicación pasan por router state (Flujo de App §7.2),
// o arranca en blanco si se llega desde "+ Nuevo registro" en Mi Diario.
export function NewEntryRoute() {
  const location = useLocation();
  const state = (location.state ?? null) as NewEntryRouteState | null;

  return <DiaryEntryForm prefill={state?.prefill} sourceModule={state?.sourceModule ?? 'manual'} />;
}
