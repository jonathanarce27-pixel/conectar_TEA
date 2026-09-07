import { handleAiChatRequest } from '../src/server/aiProxyHandler.js';

// Vercel Function (Node.js runtime, firma Fetch API estándar) — F7. Toda la
// lógica real vive en src/server/aiProxyHandler.ts para poder probarla con
// Vitest sin desplegar; este archivo es solo el punto de entrada que
// Vercel detecta por convención de carpeta (api/*.ts).
//
// Verificado en producción real (conectar-tea.vercel.app): un
// `export default function handler(request)` hace que Vercel invoque la
// función con la firma LEGACY de Node (req, res) — de ahí
// "request.headers.get is not a function" en runtime, porque `headers` era
// un objeto plano, no un Headers de Fetch. La firma Web Handler
// documentada por Vercel exige exportar el método HTTP por nombre.
export async function POST(request: Request): Promise<Response> {
  return handleAiChatRequest(request);
}

// handleAiChatRequest ya resuelve el preflight de CORS internamente
// (status 204 si request.method === 'OPTIONS') — se expone también acá
// porque la firma Web Handler de Vercel enruta por método exportado.
export async function OPTIONS(request: Request): Promise<Response> {
  return handleAiChatRequest(request);
}
