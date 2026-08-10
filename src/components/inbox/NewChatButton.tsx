import axios from 'axios';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useConversations } from '../../hooks/useConversations';
import { useStartConversation } from '../../hooks/useStartConversation';
import { useWhatsappSessions } from '../../hooks/useWhatsappSessions';
import { contactDisplayName } from '../../lib/format';
import type { ConversationSummary } from '../../types';
import { Avatar } from './Avatar';

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
  const { data: conversations } = useConversations();
  const { data: sessions } = useWhatsappSessions();
  const connectedSessions = (sessions ?? []).filter((session) => session.status === 'CONNECTED');
  const startConversation = useStartConversation();

  const [query, setQuery] = useState('');
  const [sessionId, setSessionId] = useState(connectedSessions[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  // The sessions list loads asynchronously, so the initial useState above can miss it — pick a
  // default once it arrives if the user hasn't already chosen one.
  useEffect(() => {
    if (!sessionId && connectedSessions[0]) setSessionId(connectedSessions[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedSessions[0]?.id]);

  const { chats, groups } = useMemo(() => {
    const all = conversations ?? [];
    const q = query.trim().toLowerCase();
    const matches = q
      ? all.filter((conversation) => {
          const name = contactDisplayName(conversation.contact).toLowerCase();
          return name.includes(q) || conversation.contact.phoneNumber.includes(q);
        })
      : all;
    return {
      chats: matches.filter((conversation) => !conversation.contact.isGroup),
      groups: matches.filter((conversation) => conversation.contact.isGroup),
    };
  }, [conversations, query]);

  const digits = query.replace(/\D/g, '');
  const hasExactNumberMatch = (conversations ?? []).some((c) => c.contact.phoneNumber === digits);
  const canStartNew = digits.length >= 8 && !hasExactNumberMatch;

  function selectConversation(id: string) {
    onStarted(id);
    onClose();
  }

  async function handleStartNew(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const conversation = await startConversation.mutateAsync({ sessionId, phoneNumber: digits });
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
        className="flex max-h-[32rem] w-full max-w-sm flex-col rounded-2xl bg-paper p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Nova conversa</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou número"
          className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/20"
        />

        <div className="mt-2 flex-1 overflow-y-auto">
          {chats.length > 0 && <ConversationSection title="Conversas" items={chats} onSelect={selectConversation} />}
          {groups.length > 0 && <ConversationSection title="Grupos" items={groups} onSelect={selectConversation} />}
          {chats.length === 0 && groups.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/40">Nenhuma conversa encontrada.</p>
          )}
        </div>

        {canStartNew &&
          (connectedSessions.length === 0 ? (
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink/40">
              Conecte um número do WhatsApp na Home para falar com um número novo.
            </p>
          ) : (
            <form onSubmit={handleStartNew} className="mt-3 space-y-2 border-t border-line pt-3">
              {connectedSessions.length > 1 && (
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
              )}
              {error && <p className="text-sm text-stage-lost">{error}</p>}
              <button
                type="submit"
                disabled={startConversation.isPending}
                className="w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-signal/90 disabled:opacity-60"
              >
                {startConversation.isPending ? 'Verificando…' : `Iniciar conversa com ${digits}`}
              </button>
            </form>
          ))}
      </div>
    </div>
  );
}

function ConversationSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: ConversationSummary[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-1">
      <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35">{title}</p>
      <ul>
        {items.map((conversation) => {
          const name = contactDisplayName(conversation.contact);
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-mist"
              >
                <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} tone="light" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{name}</span>
                  <span className="block truncate font-mono text-xs text-ink/40">
                    {conversation.contact.phoneNumber}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
