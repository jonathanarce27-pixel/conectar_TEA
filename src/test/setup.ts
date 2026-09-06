// Polyfill de IndexedDB para el entorno de pruebas (Vitest + jsdom).
// Dexie necesita indexedDB/IDBKeyRange reales; fake-indexeddb los provee
// en memoria sin depender de un navegador.
import 'fake-indexeddb/auto';
