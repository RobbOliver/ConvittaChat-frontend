import axios from 'axios';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useContacts } from '../../hooks/useContacts';
import { useStartConversation } from '../../hooks/useStartConversation';
import { useStartConversationWithContact } from '../../hooks/useStartConversationWithContact';
import { useWhatsappSessions } from '../../hooks/useWhatsappSessions';
import { contactDisplayName } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ContactWithConversation } from '../../types';
import { Avatar } from './Avatar';

type PickerTab = 'chats' | 'groups';

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
        className={`absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink shadow-lg shadow-ink/30 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${PRESS}`}
      >
        <PencilIcon />
      </button>
      {open && <NewChatModal onClose={() => setOpen(false)} onStarted={onStarted} />}
    </>
  );
}

function NewChatModal({ onClose, onStarted }: { onClose: () => void; onStarted: (id: string) => void }) {
  const { data: contacts, isLoading } = useContacts();
  const { data: sessions } = useWhatsappSessions();
  const connectedSessions = (sessions ?? []).filter((session) => session.status === 'CONNECTED');
  const startConversation = useStartConversation();
  const startWithContact = useStartConversationWithContact();

  const [tab, setTab] = useState<PickerTab>('chats');
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
    const all = contacts ?? [];
    const q = query.trim().toLowerCase();
    const matches = q
      ? all.filter((contact) => {
          const name = contactDisplayName(contact).toLowerCase();
          return name.includes(q) || contact.phoneNumber.includes(q);
        })
      : all;
    return {
      chats: matches.filter((contact) => !contact.isGroup),
      groups: matches.filter((contact) => contact.isGroup),
    };
  }, [contacts, query]);

  const digits = query.replace(/\D/g, '');
  const hasExactNumberMatch = (contacts ?? []).some((c) => c.phoneNumber === digits);
  const canStartNew = tab === 'chats' && digits.length >= 8 && !hasExactNumberMatch;

  async function selectContact(contact: ContactWithConversation) {
    if (contact.conversationId) {
      onStarted(contact.conversationId);
      onClose();
      return;
    }
    setError(null);
    try {
      const conversation = await startWithContact.mutateAsync(contact.id);
      onStarted(conversation.id);
      onClose();
    } catch {
      setError('Não foi possível abrir essa conversa.');
    }
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

  const activeList = tab === 'chats' ? chats : groups;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4" onClick={onClose}>
      <div
        className="flex max-h-[34rem] w-full max-w-sm flex-col rounded-2xl bg-paper p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Nova conversa</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className={`rounded-full p-1 text-ink/40 hover:bg-mist hover:text-ink ${PRESS_SM}`}
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

        <div className="mt-3 flex rounded-full bg-mist p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setTab('chats')}
            className={`flex-1 rounded-full py-1.5 ${PRESS} ${
              tab === 'chats' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
            }`}
          >
            Conversas{chats.length > 0 ? ` (${chats.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('groups')}
            className={`flex-1 rounded-full py-1.5 ${PRESS} ${
              tab === 'groups' ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
            }`}
          >
            Grupos{groups.length > 0 ? ` (${groups.length})` : ''}
          </button>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto">
          {isLoading && <p className="py-6 text-center text-sm text-ink/40">Carregando…</p>}
          {!isLoading && activeList.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/40">
              {tab === 'chats' ? 'Nenhum contato encontrado.' : 'Nenhum grupo encontrado.'}
            </p>
          )}
          {!isLoading && activeList.length > 0 && (
            <ul>
              {activeList.map((contact) => {
                const name = contactDisplayName(contact);
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => selectContact(contact)}
                      disabled={startWithContact.isPending}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-mist disabled:opacity-60 ${PRESS}`}
                    >
                      <Avatar name={name} avatarUrl={contact.avatarUrl} tone="light" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{name}</span>
                        <span className="block truncate font-mono text-xs text-ink/40">
                          {!contact.isGroup ? contact.phoneNumber : contact.conversationId ? 'Conversa iniciada' : 'Ainda sem conversa'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
                className={`w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink hover:bg-signal/90 disabled:opacity-60 ${PRESS}`}
              >
                {startConversation.isPending ? 'Verificando…' : `Iniciar conversa com ${digits}`}
              </button>
            </form>
          ))}
        {!canStartNew && error && <p className="mt-3 border-t border-line pt-3 text-sm text-stage-lost">{error}</p>}
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
