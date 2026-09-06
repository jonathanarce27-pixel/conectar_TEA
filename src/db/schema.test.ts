import { describe, expect, it } from 'vitest';
import { freshDb } from '../test/helpers';

describe('SaboresDB (esquema Dexie v1)', () => {
  it('se abre desde cero sin errores', async () => {
    const database = freshDb();
    await expect(database.open()).resolves.toBeDefined();
    database.close();
  });

  it('crea las 7 tablas esperadas', async () => {
    const database = freshDb();
    await database.open();

    const tableNames = database.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(
      [
        'communicationEvents',
        'customPictograms',
        'diaryEntries',
        'favorites',
        'plannerWeeks',
        'profile',
        'settings',
      ].sort(),
    );

    database.close();
  });

  it('define los índices esperados en cada tabla (Esquema de Backend §6)', async () => {
    const database = freshDb();
    await database.open();

    const indexNamesOf = (tableName: string) => {
      const table = database.table(tableName);
      return [table.schema.primKey, ...table.schema.indexes].map((idx) => idx.name);
    };

    expect(indexNamesOf('profile')).toEqual(['id']);

    expect(indexNamesOf('customPictograms')).toEqual([
      'id',
      'categoryId',
      'isActive',
      'sortOrder',
    ]);

    expect(indexNamesOf('favorites')).toEqual(['id', 'type', 'refId', '[type+refId]', 'createdAt']);

    expect(indexNamesOf('plannerWeeks')).toEqual(['id', 'createdAt']);

    expect(indexNamesOf('diaryEntries')).toEqual([
      'id',
      'date',
      'foodRef',
      '[date+behavior]',
      '[date+giSymptoms]',
      'createdAt',
    ]);

    expect(indexNamesOf('communicationEvents')).toEqual(['id', 'pictogramId', 'timestamp']);

    expect(indexNamesOf('settings')).toEqual(['key']);

    database.close();
  });

  it('el índice [type+refId] de favorites es único', async () => {
    const database = freshDb();
    await database.open();

    const favoritesTable = database.table('favorites');
    const compoundIndex = favoritesTable.schema.indexes.find((idx) => idx.name === '[type+refId]');
    expect(compoundIndex?.unique).toBe(true);

    database.close();
  });
});
