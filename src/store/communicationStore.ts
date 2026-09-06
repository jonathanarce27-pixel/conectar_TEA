import { create } from 'zustand';
import type { Pictogram } from '../db/types';

// Estado transitorio (no persistente) para pasar el pictograma tocado
// desde la grilla hasta la pantalla de confirmación sin prop-drilling a
// través de rutas (Flujo de App §3.1). Nunca se guarda en Dexie desde acá
// — lo que sí debe persistir (CommunicationEvent) lo escribe CommunicationRepo.
interface CommunicationState {
  selectedPictogram: Pictogram | null;
  selectPictogram: (pictogram: Pictogram) => void;
  clearSelection: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  selectedPictogram: null,
  selectPictogram: (pictogram) => set({ selectedPictogram: pictogram }),
  clearSelection: () => set({ selectedPictogram: null }),
}));
