import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { askAi, getLocalRemainingCalls, isAiOnline } from './aiClient';
import { db } from '../db/schema';
import { clearAllUserData, SettingsRepo } from '../repositories';

const TODAY = new Date().toISOString().slice(0, 10);

afterEach(async () => {
  await clearAllUserData(db);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.stubGlobal('navigator', { onLine: true });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe('askAi (F7 — orquestador cliente, siempre vía /api/ai-chat)', () => {
  it('offline: no llama a la red y devuelve blockedReason "offline"', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await askAi('¿Qué recetas tengo con plátano?');

    expect(result.blocked).toBe(true);
    expect(result.blockedReason).toBe('offline');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('con el cupo local ya en 10 hoy, bloquea sin llamar a la red', async () => {
    await SettingsRepo.set('aiCallsResetDate', TODAY);
    await SettingsRepo.set('aiCallsToday', 10);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await askAi('hola');

    expect(result.blocked).toBe(true);
    expect(result.blockedReason).toBe('local_limit');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it(
    'resuelve un tool_use (search_recipes) ejecutándolo localmente y sigue el ' +
      'loop hasta la respuesta final, incrementando el contador local UNA sola vez',
    async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({
            stop_reason: 'tool_use',
            content: [{ type: 'tool_use', id: 'tu_1', name: 'search_recipes', input: { ingredient: 'plátano' } }],
          }),
        )
        .mockResolvedValueOnce(
          jsonResponse({
            stop_reason: 'end_turn',
            content: [{ type: 'text', text: 'Encontré recetas con plátano.' }],
          }),
        );
      vi.stubGlobal('fetch', fetchMock);

      const result = await askAi('¿Qué recetas tengo con plátano?');

      expect(result.blocked).toBe(false);
      expect(result.text).toBe('Encontré recetas con plátano.');
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // El segundo request al proxy debe llevar el tool_result ya resuelto
      // localmente (no un DiaryEntry crudo, no una llamada directa al modelo).
      const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
      const toolResultMessage = secondCallBody.messages.at(-1);
      expect(toolResultMessage.content[0].type).toBe('tool_result');
      expect(toolResultMessage.content[0].tool_use_id).toBe('tu_1');

      expect(await getLocalRemainingCalls(TODAY)).toBe(9); // 10 - 1, no 10 - 2
    },
  );

  it(
    'si el servidor devuelve 429, bloquea con "server_limit" y sincroniza el ' +
      'contador local para que la UI refleje el bloqueo real de inmediato',
    async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429 })));

      const result = await askAi('hola');

      expect(result.blocked).toBe(true);
      expect(result.blockedReason).toBe('server_limit');
      expect(await getLocalRemainingCalls(TODAY)).toBe(0);
    },
  );

  it('un error de red (fetch rechaza) bloquea con "error" en vez de lanzar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await askAi('hola');

    expect(result.blocked).toBe(true);
    expect(result.blockedReason).toBe('error');
  });

  it('isAiOnline refleja navigator.onLine', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(isAiOnline()).toBe(true);
    vi.stubGlobal('navigator', { onLine: false });
    expect(isAiOnline()).toBe(false);
  });
});
