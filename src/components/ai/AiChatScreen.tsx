import { useEffect, useState } from 'react';
import { askAi, getLocalRemainingCalls, summarizeThisWeek, type AskAiBlockedReason } from '../../ai/aiClient';
import './aiChat.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

function messageForBlock(reason: AskAiBlockedReason | undefined): string {
  switch (reason) {
    case 'offline':
      return 'Necesitás conexión a internet para usar la IA — el resto de la app sigue funcionando igual.';
    case 'local_limit':
    case 'server_limit':
      return 'Ya usaste tus 10 preguntas de hoy. Probá de nuevo mañana.';
    default:
      return 'Hubo un problema al responder. Probá de nuevo en un momento.';
  }
}

// Flujo de App §9: chat simple (input de texto + accesos rápidos como
// "Resumir esta semana"). Cada pregunta pasa por /api/ai-chat, nunca por
// conocimiento propio del modelo sobre el catálogo/diario.
export function AiChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getLocalRemainingCalls().then(setRemaining);
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setNotice(null);
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');

    const result = await askAi(text);

    if (result.blocked) {
      setNotice(messageForBlock(result.blockedReason));
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', text: result.text }]);
    }
    setRemaining(await getLocalRemainingCalls());
    setSending(false);
  };

  const handleSummarizeWeek = async () => {
    if (sending) return;
    setSending(true);
    setNotice(null);
    setMessages((prev) => [...prev, { role: 'user', text: 'Resumir esta semana' }]);

    const result = await summarizeThisWeek();
    if (result.blocked) {
      setNotice(messageForBlock(result.blockedReason));
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', text: result.text }]);
    }
    setRemaining(await getLocalRemainingCalls());
    setSending(false);
  };

  return (
    <main className="ai-chat-screen">
      <h1 className="ai-chat-screen__title">Preguntarle a la IA</h1>
      {remaining !== null && (
        <p className="ai-chat-screen__quota">
          Te quedan {remaining} {remaining === 1 ? 'pregunta' : 'preguntas'} hoy.
        </p>
      )}

      <button
        type="button"
        className="recipe-detail__action-button"
        onClick={handleSummarizeWeek}
        disabled={sending}
      >
        Resumir esta semana
      </button>

      <div className="ai-chat-screen__messages" role="log" aria-live="polite">
        {messages.map((message, i) => (
          <p key={i} className={`ai-chat-message ai-chat-message--${message.role}`}>
            {message.text}
          </p>
        ))}
      </div>

      {notice && <p className="ai-chat-screen__notice">{notice}</p>}

      <form
        className="ai-chat-screen__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="ai-chat-input" className="sr-only">
          Escribí tu pregunta
        </label>
        <input
          id="ai-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej. ¿Qué recetas tengo con plátano?"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Enviar
        </button>
      </form>
    </main>
  );
}
