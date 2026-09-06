import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiChatScreen } from './AiChatScreen';
import * as aiClient from '../../ai/aiClient';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AiChatScreen (Flujo de App §9 — chat simple)', () => {
  it('envía una pregunta y muestra la respuesta en el chat', async () => {
    vi.spyOn(aiClient, 'getLocalRemainingCalls').mockResolvedValue(9);
    vi.spyOn(aiClient, 'askAi').mockResolvedValue({ text: 'Encontré 2 recetas con plátano.', blocked: false });

    const user = userEvent.setup();
    render(<AiChatScreen />);

    await user.type(screen.getByLabelText('Escribí tu pregunta'), '¿Qué recetas tengo con plátano?');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('¿Qué recetas tengo con plátano?')).toBeInTheDocument();
    expect(await screen.findByText('Encontré 2 recetas con plátano.')).toBeInTheDocument();
    expect(await screen.findByText('Te quedan 9 preguntas hoy.')).toBeInTheDocument();
  });

  it('"Resumir esta semana" dispara el acceso rápido correspondiente', async () => {
    vi.spyOn(aiClient, 'getLocalRemainingCalls').mockResolvedValue(8);
    const summarizeSpy = vi
      .spyOn(aiClient, 'summarizeThisWeek')
      .mockResolvedValue({ text: 'Esta semana comió bien 4 de 7 días.', blocked: false });

    const user = userEvent.setup();
    render(<AiChatScreen />);

    await user.click(screen.getByRole('button', { name: 'Resumir esta semana' }));

    expect(summarizeSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Esta semana comió bien 4 de 7 días.')).toBeInTheDocument();
  });

  it('muestra el aviso correspondiente cuando la IA está bloqueada por límite diario', async () => {
    vi.spyOn(aiClient, 'getLocalRemainingCalls').mockResolvedValue(0);
    vi.spyOn(aiClient, 'askAi').mockResolvedValue({ text: '', blocked: true, blockedReason: 'local_limit' });

    const user = userEvent.setup();
    render(<AiChatScreen />);

    await user.type(screen.getByLabelText('Escribí tu pregunta'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/Ya usaste tus 10 preguntas de hoy/)).toBeInTheDocument();
  });

  it('muestra el aviso de conexión cuando la IA está bloqueada por estar offline', async () => {
    vi.spyOn(aiClient, 'getLocalRemainingCalls').mockResolvedValue(5);
    vi.spyOn(aiClient, 'askAi').mockResolvedValue({ text: '', blocked: true, blockedReason: 'offline' });

    const user = userEvent.setup();
    render(<AiChatScreen />);

    await user.type(screen.getByLabelText('Escribí tu pregunta'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/Necesitás conexión a internet/)).toBeInTheDocument();
  });
});
