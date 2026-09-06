import type Anthropic from '@anthropic-ai/sdk';
import { SettingsRepo } from '../repositories';
import { AI_TOOLS, executeAiTool } from './aiTools';

// F7 — orquestador del lado del cliente (TRD §9.1): arma el loop de tool
// use, pero SIEMPRE le pega a /api/ai-chat (el proxy), nunca a
// api.anthropic.com directamente — ese endpoint es el único lugar donde
// vive la clave real.

const DAILY_LOCAL_LIMIT = 10;
const DEVICE_ID_SETTINGS_KEY = 'aiDeviceId' as const;
const MAX_TOOL_TURNS = 5; // tope defensivo: nunca un loop infinito de tool use

export function isAiOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/** Id estable por dispositivo — se genera una sola vez (la primera vez que
 * se usa la IA) y se persiste en `settings` (Esquema de Backend §5.7). No
 * es un mecanismo de autenticación (ver nota en rateLimiter.ts). */
async function getDeviceId(): Promise<string> {
  const existing = await SettingsRepo.get(DEVICE_ID_SETTINGS_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await SettingsRepo.set(DEVICE_ID_SETTINGS_KEY, id);
  return id;
}

/** Contador LOCAL — Esquema de Backend §5.7, ya existente desde F0. Sirve
 * SOLO para que la UI muestre "te quedan N" sin esperar a la red; el
 * límite real e inescapable vive en el servidor (src/server/rateLimiter.ts). */
export async function getLocalRemainingCalls(today: string = new Date().toISOString().slice(0, 10)): Promise<number> {
  const resetDate = await SettingsRepo.get('aiCallsResetDate');
  const callsToday = resetDate === today ? ((await SettingsRepo.get('aiCallsToday')) ?? 0) : 0;
  return Math.max(0, DAILY_LOCAL_LIMIT - callsToday);
}

async function incrementLocalCallCount(today: string = new Date().toISOString().slice(0, 10)): Promise<void> {
  const resetDate = await SettingsRepo.get('aiCallsResetDate');
  const current = resetDate === today ? ((await SettingsRepo.get('aiCallsToday')) ?? 0) : 0;
  await SettingsRepo.set('aiCallsResetDate', today);
  await SettingsRepo.set('aiCallsToday', current + 1);
}

/** Se llama cuando el servidor rechaza por límite (fuente de verdad) aunque
 * el contador local todavía dijera que había cupo — sincroniza la UI. */
async function syncLocalCountToBlocked(today: string = new Date().toISOString().slice(0, 10)): Promise<void> {
  await SettingsRepo.set('aiCallsResetDate', today);
  await SettingsRepo.set('aiCallsToday', DAILY_LOCAL_LIMIT);
}

export type AskAiBlockedReason = 'offline' | 'local_limit' | 'server_limit' | 'error';

export interface AskAiResult {
  text: string;
  blocked: boolean;
  blockedReason?: AskAiBlockedReason;
}

interface AiChatResponse {
  stop_reason: string;
  content: Anthropic.ContentBlock[];
}

async function callProxy(deviceId: string, messages: Anthropic.MessageParam[]): Promise<Response> {
  return fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, messages, tools: AI_TOOLS }),
  });
}

/** Flujo de App §9: chat simple con tool use — nunca responde con
 * conocimiento propio sobre el catálogo/diario, siempre a través de las
 * herramientas. "1 llamada de IA" (del límite de 10/día) = 1 pregunta del
 * usuario, sin importar cuántos turnos internos de tool use haga falta
 * para responderla — el límite real del servidor, en cambio, cuenta cada
 * request al proxy (ver rateLimiter.ts), así que una pregunta que
 * requiera varios tool calls consume más de 1 del cupo del lado servidor. */
export async function askAi(userMessage: string): Promise<AskAiResult> {
  if (!isAiOnline()) {
    return { text: '', blocked: true, blockedReason: 'offline' };
  }

  const remaining = await getLocalRemainingCalls();
  if (remaining <= 0) {
    return { text: '', blocked: true, blockedReason: 'local_limit' };
  }

  const deviceId = await getDeviceId();
  // No hace falta mandar el system prompt desde acá: el proxy lo fuerza
  // siempre del lado servidor e ignora cualquier `system` del llamador
  // (ver src/server/aiProxyHandler.ts) — esa es la capa que de verdad
  // protege, justamente porque no depende de que este cliente lo incluya.
  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    let response: Response;
    try {
      response = await callProxy(deviceId, messages);
    } catch {
      return { text: '', blocked: true, blockedReason: 'error' };
    }

    if (response.status === 429) {
      await syncLocalCountToBlocked();
      return { text: '', blocked: true, blockedReason: 'server_limit' };
    }
    if (!response.ok) {
      return { text: '', blocked: true, blockedReason: 'error' };
    }

    const message: AiChatResponse = await response.json();

    if (message.stop_reason === 'tool_use') {
      const toolUseBlocks = message.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );
      messages = [...messages, { role: 'assistant', content: message.content }];

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await executeAiTool(block.name, block.input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }
      messages = [...messages, { role: 'user', content: toolResults }];
      continue;
    }

    await incrementLocalCallCount();
    const textBlock = message.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
    return { text: textBlock?.text ?? '', blocked: false };
  }

  return { text: '', blocked: true, blockedReason: 'error' };
}

/** Acceso rápido "Resumir esta semana" (Flujo de App §9). */
export async function summarizeThisWeek(): Promise<AskAiResult> {
  return askAi('Resumime cómo estuvo esta semana en el diario.');
}
