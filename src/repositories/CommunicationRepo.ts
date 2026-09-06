import { comunicacionContent } from '../content';
import { db, type SaboresDB } from '../db/schema';
import { newId } from '../db/id';
import type { CommunicationCategory, CommunicationEvent, CustomPictogram, Pictogram } from '../db/types';

export function createCommunicationRepo(database: SaboresDB = db) {
  return {
    // --- Contenido del producto (read-only) ---
    getCategories(): CommunicationCategory[] {
      return comunicacionContent;
    },

    getCategoryById(id: string): CommunicationCategory | undefined {
      return comunicacionContent.find((c) => c.id === id);
    },

    getBasePictogramById(id: string): Pictogram | undefined {
      for (const category of comunicacionContent) {
        const found = category.pictograms.find((p) => p.id === id);
        if (found) return found;
      }
      return undefined;
    },

    getEmergencyPictograms(): Pictogram[] {
      return comunicacionContent.flatMap((c) => c.pictograms.filter((p) => p.isEmergency));
    },

    // --- Pictogramas personalizados (CRUD, IndexedDB) ---
    async addCustomPictogram(
      input: Omit<CustomPictogram, 'id' | 'isCustom' | 'createdAt'>,
    ): Promise<CustomPictogram> {
      const pictogram: CustomPictogram = {
        ...input,
        id: newId(),
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      await database.customPictograms.add(pictogram);
      return pictogram;
    },

    async getCustomPictogramById(id: string): Promise<CustomPictogram | undefined> {
      return database.customPictograms.get(id);
    },

    async getCustomPictogramsByCategory(categoryId: string): Promise<CustomPictogram[]> {
      return database.customPictograms.where('categoryId').equals(categoryId).toArray();
    },

    async updateCustomPictogram(id: string, changes: Partial<CustomPictogram>): Promise<void> {
      await database.customPictograms.update(id, changes);
    },

    async removeCustomPictogram(id: string): Promise<void> {
      // Integridad referencial (Esquema de Backend §8): se borra el pictograma,
      // pero los CommunicationEvent históricos NO se borran — conservan su
      // propia copia de "label" tomada al momento del evento.
      await database.customPictograms.delete(id);
    },

    // --- Eventos de comunicación ---
    async logEvent(pictogramId: string, label: string): Promise<CommunicationEvent> {
      const event: CommunicationEvent = {
        id: newId(),
        pictogramId,
        label,
        timestamp: new Date().toISOString(),
      };
      await database.communicationEvents.add(event);
      return event;
    },

    async getEventsByPictogram(pictogramId: string): Promise<CommunicationEvent[]> {
      return database.communicationEvents.where('pictogramId').equals(pictogramId).toArray();
    },

    async getAllEvents(): Promise<CommunicationEvent[]> {
      return database.communicationEvents.toArray();
    },

    // --- Preferencias de visibilidad (onboarding Flujo de App §2, Paso 3) ---
    async getDisabledBaseIds(): Promise<string[]> {
      const entry = await database.settings.get('disabledBasePictogramIds');
      return (entry?.value as string[] | undefined) ?? [];
    },

    async setDisabledBaseIds(ids: string[]): Promise<void> {
      await database.settings.put({ key: 'disabledBasePictogramIds', value: ids });
    },

    /**
     * Pictogramas a mostrar en la grilla de una categoría: los del set base
     * que no fueron desactivados en el onboarding, más los personalizados
     * activos de esa categoría. La Tarjeta de Ayuda (emergencia) NUNCA usa
     * este filtro — ver getEmergencyPictograms().
     */
    async getVisiblePictogramsForCategory(categoryId: string): Promise<Pictogram[]> {
      const category = comunicacionContent.find((c) => c.id === categoryId);
      const disabledIds = await this.getDisabledBaseIds();
      const baseVisible = (category?.pictograms ?? []).filter((p) => !disabledIds.includes(p.id));

      const customVisible = (
        await database.customPictograms.where('categoryId').equals(categoryId).toArray()
      ).filter((p) => p.isActive);

      return [...baseVisible, ...customVisible];
    },
  };
}

export const CommunicationRepo = createCommunicationRepo();
