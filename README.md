# Sabores que Conectan con Amor — Miniapp

PWA local-first (offline-first) construida con React 18 + Vite + Dexie (IndexedDB).
Fase actual: **F0 — Fundaciones** (ver `../Plan-de-Implementacion-Miniapp-Sabores.md`).

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — typecheck (`tsc -b`) + build de producción con Service Worker (Workbox).
- `npm run preview` — sirve el build de `dist/` (usar para probar el modo offline).
- `npm test` — suite de pruebas (Vitest + fake-indexeddb).
- `npm run typecheck` — solo verificación de tipos.

## Estructura

Ver `TRD-Miniapp-Sabores-que-Conectan-con-Amor.md` §13 para la estructura de carpetas objetivo.
Regla de arquitectura no negociable: ningún componente de UI accede a Dexie o al JSON de
contenido directamente — todo pasa por `src/repositories/`.

## Valores provisorios (TODO, confirmar con el cliente)

Marcados en el código con `// TODO: valor provisorio, confirmar con el cliente`:

- Nombre corto: "Sabores" (Plan de Implementación §1, decisión #1).
- Ícono/splash placeholder (tazón + corazón) en `public/icons/` (decisión #2).
- Sin lógica de licencia/acceso al Recetario — catálogo abierto en esta fase (decisión #4).
