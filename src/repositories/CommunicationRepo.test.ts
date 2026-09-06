import { describe, expect, it } from 'vitest';
import { createCommunicationRepo } from './CommunicationRepo';
import { freshDb } from '../test/helpers';

describe('CommunicationRepo (dataset real de Comunicación, corrección post-F4)', () => {
  it('getCategories devuelve las 5 categorías con sus 24 pictogramas reales', () => {
    const repo = createCommunicationRepo(freshDb());
    const categories = repo.getCategories();
    expect(categories.map((c) => c.id).sort()).toEqual(
      ['necesidades', 'preferencias', 'sensaciones', 'alimentos', 'ayuda'].sort(),
    );
    const total = categories.reduce((sum, c) => sum + c.pictograms.length, 0);
    expect(total).toBe(24);
  });

  it('getBasePictogramById encuentra un pictograma dentro de sus categorías', () => {
    const repo = createCommunicationRepo(freshDb());
    expect(repo.getBasePictogramById('p-hambre')?.label).toBe('Tengo hambre');
    expect(repo.getBasePictogramById('p-dolor')?.label).toBe('Me duele la barriga');
  });

  it('getEmergencyPictograms devuelve solo los marcados isEmergency', () => {
    const repo = createCommunicationRepo(freshDb());
    const emergency = repo.getEmergencyPictograms();
    expect(emergency.every((p) => p.isEmergency)).toBe(true);
    expect(emergency.map((p) => p.id).sort()).toEqual(
      ['p-hambre', 'p-sed', 'p-bano', 'p-no-gusta', 'p-caliente', 'p-frio', 'p-dolor'].sort(),
    );
  });

  it('CRUD de pictogramas personalizados', async () => {
    const repo = createCommunicationRepo(freshDb());
    const created = await repo.addCustomPictogram({
      categoryId: 'alimentos',
      label: 'Milanesa de la abuela',
      icon: '',
      isActive: true,
      sortOrder: 0,
    });

    expect(created.isCustom).toBe(true);
    expect(await repo.getCustomPictogramById(created.id)).toMatchObject({
      label: 'Milanesa de la abuela',
    });

    await repo.updateCustomPictogram(created.id, { isActive: false });
    expect((await repo.getCustomPictogramById(created.id))?.isActive).toBe(false);

    const byCategory = await repo.getCustomPictogramsByCategory('alimentos');
    expect(byCategory.map((p) => p.id)).toContain(created.id);
  });

  it(
    'integridad referencial (Esquema de Backend §8): borrar un pictograma ' +
      'personalizado no borra sus CommunicationEvent históricos',
    async () => {
      const repo = createCommunicationRepo(freshDb());
      const pictogram = await repo.addCustomPictogram({
        categoryId: 'alimentos',
        label: 'Puré de la abuela',
        icon: '',
        isActive: true,
        sortOrder: 0,
      });

      await repo.logEvent(pictogram.id, pictogram.label);
      await repo.removeCustomPictogram(pictogram.id);

      expect(await repo.getCustomPictogramById(pictogram.id)).toBeUndefined();

      const events = await repo.getEventsByPictogram(pictogram.id);
      expect(events.length).toBe(1);
      expect(events[0].label).toBe('Puré de la abuela');
    },
  );

  it('getAllEvents acumula eventos de comunicación', async () => {
    const repo = createCommunicationRepo(freshDb());
    await repo.logEvent('p-hambre', 'Tengo hambre');
    await repo.logEvent('p-sed', 'Tengo sed');

    expect((await repo.getAllEvents()).length).toBe(2);
  });

  it('getDisabledBaseIds devuelve [] antes de configurarse, y refleja lo guardado después', async () => {
    const repo = createCommunicationRepo(freshDb());
    expect(await repo.getDisabledBaseIds()).toEqual([]);

    await repo.setDisabledBaseIds(['p-sed']);
    expect(await repo.getDisabledBaseIds()).toEqual(['p-sed']);
  });

  it(
    'getVisiblePictogramsForCategory excluye los base desactivados e incluye ' +
      'los personalizados activos de esa categoría',
    async () => {
      const repo = createCommunicationRepo(freshDb());
      await repo.setDisabledBaseIds(['p-sed']); // "Tengo sed" desactivado

      await repo.addCustomPictogram({
        categoryId: 'necesidades',
        label: 'Quiero upa',
        icon: '',
        isActive: true,
        sortOrder: 0,
      });
      await repo.addCustomPictogram({
        categoryId: 'necesidades',
        label: 'Pictograma inactivo',
        icon: '',
        isActive: false,
        sortOrder: 1,
      });

      const visible = await repo.getVisiblePictogramsForCategory('necesidades');
      const labels = visible.map((p) => p.label).sort();

      // "necesidades" tiene 4 pictogramas base reales (Tengo hambre, Tengo
      // sed, Necesito ir al baño, Para/Basta) — al desactivar solo "Tengo
      // sed", los otros 3 base siguen visibles, más el personalizado activo.
      expect(labels).toEqual(
        ['Tengo hambre', 'Necesito ir al baño', 'Para / Basta', 'Quiero upa'].sort(),
      );
    },
  );

  it(
    'getEmergencyPictograms NUNCA se filtra por disabledBaseIds — la Tarjeta ' +
      'de Ayuda siempre muestra exactamente los isEmergency=true del JSON',
    async () => {
      const repo = createCommunicationRepo(freshDb());
      const before = repo.getEmergencyPictograms().map((p) => p.id).sort();

      await repo.setDisabledBaseIds(before);

      const after = repo.getEmergencyPictograms().map((p) => p.id).sort();
      expect(after).toEqual(before);
    },
  );
});
