import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useStartConversation } from '../../hooks/useStartConversation';
import { useWhatsappSessions } from '../../hooks/useWhatsappSessions';

interface Props {
  onStarted: (conversationId: string) => void;
}

export function NewChatButton({ onStarted }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nova conversa"
        title="Nova conversa"
        className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink shadow-lg shadow-ink/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <PencilIcon />
      </button>
      {open && <NewChatModal onClose={() => setOpen(false)} onStarted={onStarted} />}
    </>
  );
}

function NewChatModal({ onClose, onStarted }: { onClose: () => void; onStarted: (id: string) => void }) {
  const { data: sessions } = useWhatsappSessions();
  const connectedSessions = (sessions ?? []).filter((session) => session.status === 'CONNECTED');
  const startConversation = useStartConversation();

  const [sessionId, setSessionId] = useState(connectedSessions[0]?.id ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  // The sessions list loads asynchronously, so the initial useState above can miss it — pick a
  // default once it arrives if the user hasn't already chosen one.
  useEffect(() => {
    if (!sessionId && connectedSessions[0]) setSessionId(connectedSessions[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedSessions[0]?.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const conversation = await startConversation.mutateAsync({ sessionId, phoneNumber });
      onStarted(conversation.id);
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      setError(message ?? 'Não foi possível iniciar a conversa.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-ink">Nova conversa</h2>

        {connectedSessions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">
            Conecte um número do WhatsApp na Home antes de iniciar uma conversa nova.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {connectedSessions.length > 1 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/50">Enviar de</label>
                <select
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
                >
                  {connectedSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/50">Número do WhatsApp</label>
              <input
                autoFocus
                type="tel"
                inputMode="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Ex.: 5511999999999"
                required
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
              />
              <p className="mt-1 text-xs text-ink/35">Com código do país e DDD, só números.</p>
            </div>
            {error && <p className="text-sm text-stage-lost">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm text-ink/60 hover:bg-mist"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={startConversation.isPending || !sessionId}
                className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal/90 disabled:opacity-60"
              >
                {startConversation.isPending ? 'Verificando…' : 'Iniciar conversa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M13.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7 15.4l-3.2.8.8-3.2 8.9-9.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
