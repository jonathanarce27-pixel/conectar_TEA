import { SaboresDB } from '../db/schema';

// Cada prueba obtiene su propia base de datos en memoria (fake-indexeddb),
// nombrada de forma única para no compartir estado entre pruebas.
export function freshDb(): SaboresDB {
  return new SaboresDB(`test-db-${crypto.randomUUID()}`);
}
