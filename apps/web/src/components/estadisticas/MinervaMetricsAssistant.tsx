import { useState, type FormEvent } from 'react';
import {
  askMetricsAssistant,
  type MetricsAssistantMessage,
  type MetricsAssistantScope,
} from '../../services/metricsAssistantService';
import '../../styles/MinervaMetricsAssistant.css';

interface MinervaMetricsAssistantProps {
  scope: MetricsAssistantScope;
  entityId?: string;
}

const suggestedPrompts: Record<MetricsAssistantScope, string[]> = {
  QUIZ: [
    'Resume los principales hallazgos de este quiz.',
    '¿Qué preguntas muestran mayor dificultad o pérdida de foco?',
    'Propón ajustes didácticos para reforzar los conceptos con menor acierto.',
  ],
  GRUPO: [
    'Interpreta el desempeño actual del grupo.',
    '¿Qué patrones aparecen entre aciertos, aprobación y foco?',
    'Diseña una planeación de reforzamiento basada en estas métricas.',
  ],
  PLANTEL: [
    'Resume los indicadores más relevantes de este plantel.',
    '¿Qué riesgos o prioridades sugieren los datos disponibles?',
    'Propón tres acciones académicas con base en estas métricas.',
  ],
  INSTITUCION: [
    'Resume los hallazgos institucionales y sus prioridades.',
    '¿Qué planteles, materias o grupos requieren atención?',
    'Propón un plan de mejora pedagógica con base en los datos.',
  ],
};

function OwlLogo() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Minerva">
      <path d="M12 18 24 8l8 6 8-6 12 10v23c0 12-9 20-20 20S12 53 12 41V18Z"
        fill="currentColor" />
      <circle cx="24" cy="29" r="9" fill="#fff" />
      <circle cx="40" cy="29" r="9" fill="#fff" />
      <circle cx="25" cy="29" r="3.2" fill="#17324d" />
      <circle cx="39" cy="29" r="3.2" fill="#17324d" />
      <path d="m27 39 5-5 5 5-5 5-5-5Z" fill="#f0b44d" />
    </svg>
  );
}

export default function MinervaMetricsAssistant({
  scope,
  entityId,
}: MinervaMetricsAssistantProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<MetricsAssistantMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function send(value: string) {
    const content = value.trim();
    if (!content || sending) return;

    setPrompt('');
    setError('');
    setSending(true);
    const previousMessages = messages.slice(-10);
    setMessages((current) => [
      ...current,
      { role: 'user', content },
    ]);

    try {
      const response = await askMetricsAssistant(
        scope,
        entityId,
        content,
        previousMessages,
      );
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.answer },
      ]);
    } catch {
      setError('Minerva no pudo responder. Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(prompt);
  }

  return (
    <>
      <button
        type="button"
        className="minerva-assistant-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Cerrar asistente Minerva' : 'Consultar a Minerva'}
        aria-expanded={open}
      >
        <OwlLogo />
      </button>

      {open && (
        <section
          className="minerva-assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Minerva, asistente de métricas"
        >
          <header className="minerva-assistant-header">
            <article className="d-flex align-items-center gap-2">
              <span className="minerva-assistant-logo"><OwlLogo /></span>
              <article>
                <strong>Minerva</strong>
                <small>Consulta estadística y didáctica</small>
              </article>
            </article>
            <button
              type="button"
              className="minerva-assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar Minerva"
            >
              <i className="bi bi-x-lg" />
            </button>
          </header>

          <section className="minerva-assistant-body">
            {messages.length === 0 ? (
              <article className="minerva-assistant-empty">
                <p className="mb-2 fw-semibold">¿Qué deseas analizar?</p>
                <p className="small text-secondary mb-3">
                  Solo usaré los datos de esta pantalla y este nivel.
                </p>
                <article className="d-flex flex-column gap-2">
                  {suggestedPrompts[scope].map((suggestion) => (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm text-start"
                      key={suggestion}
                      onClick={() => void send(suggestion)}
                      disabled={sending}
                    >
                      {suggestion}
                    </button>
                  ))}
                </article>
              </article>
            ) : (
              <article className="minerva-assistant-messages">
                {messages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={`minerva-message minerva-message-${message.role}`}
                  >
                    {message.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex}>{line || '\u00a0'}</p>
                    ))}
                  </article>
                ))}
              </article>
            )}

            {sending && (
              <p className="minerva-assistant-thinking" role="status">
                <span className="spinner-border spinner-border-sm me-2" />
                Analizando las métricas...
              </p>
            )}
            {error && <p className="alert alert-danger small mb-0">{error}</p>}
          </section>

          <form className="minerva-assistant-form" onSubmit={submit}>
            <textarea
              rows={2}
              maxLength={4000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Pregunta sobre estas métricas..."
              aria-label="Mensaje para Minerva"
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !prompt.trim()}
              aria-label="Enviar pregunta"
            >
              <i className="bi bi-send" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
