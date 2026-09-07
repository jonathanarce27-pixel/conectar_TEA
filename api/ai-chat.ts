import { handleAiChatRequest } from '../src/server/aiProxyHandler.js';

// Vercel Function (Node.js runtime, firma Fetch API estándar) — F7. Toda la
// lógica real vive en src/server/aiProxyHandler.ts para poder probarla con
// Vitest sin desplegar; este archivo es solo el punto de entrada que
// Vercel detecta por convención de carpeta (api/*.ts).
export default async function handler(request: Request): Promise<Response> {
  return handleAiChatRequest(request);
}
