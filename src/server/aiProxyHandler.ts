import Anthropic from '@anthropic-ai/sdk';
import { AI_SYSTEM_PROMPT, containsRiskyContent, STANDARD_PROFESSIONAL_REFERRAL_MESSAGE } from '../domain/aiSafety.js';
import { checkAndConsume } from './rateLimiter.js';

// F7 — el único lugar donde vive la clave real de la API de Anthropic (vía
// variable de entorno del hosting, ver .env.example). El cliente (src/ai/
// aiClient.ts) SIEMPRE le pega a este endpoint, nunca a api.anthropic.com
// directamente.
const MODEL = 'claude-haiku-4-5'; // decisión de negocio #5 ya resuelta
const MAX_TOKENS = 1024;

interface AiChatRequestBody {
  deviceId?: string;
  messages?: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  // Nunca "*" — el endpoint solo responde con el header de CORS habilitado
  // cuando el origen coincide EXACTAMENTE con el configurado (TRD §9/F7,
  // requisito explícito de restringir CORS al origen propio de la PWA).
  if (allowedOrigin && origin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }
  return headers;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? 'unknown';
}

/** Filtro server-side (capa b, PRD secc. 38 / TRD §9.3): si CUALQUIER
 * bloque de texto de la respuesta contiene un patrón de riesgo, se
 * reemplaza la respuesta COMPLETA por el mensaje estándar — nunca una
 * respuesta "editada a medias", tal como pide el criterio de F7. No
 * depende de que el system prompt haya funcionado. */
function applySafetyFilter(content: Anthropic.ContentBlock[]): Anthropic.ContentBlock[] {
  const hasRiskyText = content.some((block) => block.type === 'text' && containsRiskyContent(block.text));
  if (!hasRiskyText) return content;

  return [
    {
      type: 'text',
      text: STANDARD_PROFESSIONAL_REFERRAL_MESSAGE,
      citations: [],
    } as Anthropic.TextBlock,
  ];
}

export interface AiProxyDependencies {
  /** Inyectable en pruebas para no llamar a la API real de Anthropic. */
  client?: Anthropic;
}

export async function handleAiChatRequest(request: Request, deps: AiProxyDependencies = {}): Promise<Response> {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, headers);
  }

  let body: AiChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, headers);
  }

  if (!body.deviceId || typeof body.deviceId !== 'string') {
    return jsonResponse({ error: 'missing_device_id' }, 400, headers);
  }
  if (!Array.isArray(body.messages)) {
    return jsonResponse({ error: 'missing_messages' }, 400, headers);
  }

  const ip = extractIp(request);
  const rateLimit = checkAndConsume(body.deviceId, ip);
  if (!rateLimit.allowed) {
    return jsonResponse({ error: 'rate_limit_exceeded', reason: rateLimit.reason }, 429, headers);
  }

  const client = deps.client ?? new Anthropic();

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // El system prompt lo fuerza SIEMPRE el servidor — se ignora
      // cualquier `system` que mandara el cliente. Es la capa (a) de la
      // defensa en profundidad, pero vive acá (no solo en aiClient.ts)
      // porque un llamador que le pegue directo a este endpoint (sin pasar
      // por la app real) podría mandar cualquier cosa como `system` si el
      // servidor confiara en ese valor.
      system: AI_SYSTEM_PROMPT,
      messages: body.messages,
      tools: body.tools ?? [],
    });
  } catch (error) {
    // Verificado en producción real: sin este try/catch, cualquier error
    // de la API de Anthropic (saldo insuficiente, rate limit propio de
    // Anthropic, caída transitoria) hacía que la función entera crasheara
    // sin headers de CORS ni cuerpo JSON — a diferencia de TODOS los demás
    // caminos de error de este archivo, que sí devuelven jsonResponse().
    // No se filtra el mensaje interno del proveedor al cliente.
    console.error('Fallo al llamar a la API de Anthropic:', error);
    return jsonResponse({ error: 'ai_unavailable' }, 502, headers);
  }

  const filteredContent = applySafetyFilter(response.content);
  const wasFiltered = filteredContent !== response.content;

  return jsonResponse(
    {
      id: response.id,
      role: response.role,
      // Si el filtro actuó, el stop_reason pasa a end_turn: la respuesta
      // ya es la definitiva, no hay que seguir el loop de tool use.
      stop_reason: wasFiltered ? 'end_turn' : response.stop_reason,
      content: filteredContent,
      usage: response.usage,
      rateLimitRemaining: rateLimit.deviceRemaining,
    },
    200,
    headers,
  );
}
