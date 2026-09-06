/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: false, // usamos public/manifest.webmanifest tal cual (TRD §6)
      workbox: {
        // Cache-first para el app shell completo (TRD §6): HTML/JS/CSS/imágenes/fuentes.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'],
        // F1 agrega rutas de cliente (React Router) — cualquier navegación
        // profunda (ej. /comunicar/necesidades) debe resolver al app shell
        // también sin red, no solo "/".
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Nunca cachear respuestas de la API de IA como contenido offline (TRD §6).
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // El default (5s) a veces no alcanza para pruebas que renderizan las
    // 48 recetas reales bajo carga paralela de muchos archivos de test.
    testTimeout: 10000,
  },
})
