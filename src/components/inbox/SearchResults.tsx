import type { ReactNode } from 'react';
import { contactDisplayName, formatSearchDate } from '../../lib/format';
import type { ContactTab, InboxSearchResults } from '../../types';
import { Avatar } from './Avatar';
import { ConversationRow } from './ConversationRow';

interface Props {
  results: InboxSearchResults;
  isLoading: boolean;
  query: string;
  tabs: ContactTab[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onMoveConversation: (conversationId: string, tabId: string | null) => void;
}

function highlightMatch(text: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded-sm bg-signal/40 text-white">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function SearchResults({ results, isLoading, query, tabs, selectedId, onSelect, onMoveConversation }: Props) {
  const { chats, messages } = results;

  if (isLoading && chats.length === 0 && messages.length === 0) {
    return <p className="px-5 py-4 text-center text-sm text-white/40">Buscando…</p>;
  }

  if (chats.length === 0 && messages.length === 0) {
    return <p className="px-5 py-4 text-center text-sm text-white/40">Nenhum resultado encontrado.</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4">
      {chats.length > 0 && (
        <div className="mb-2">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">Conversas</p>
          <ul>
            {chats.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                tabs={tabs}
                isSelected={conversation.id === selectedId}
                draggable={false}
                onSelect={onSelect}
                onMoveConversation={onMoveConversation}
              />
            ))}
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <div>
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/35">Mensagens</p>
          <ul>
            {messages.map((message) => {
              const name = contactDisplayName(message.contact);
              return (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(message.conversationId)}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    <Avatar name={name} avatarUrl={message.contact.avatarUrl} tone="dark" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">{name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-white/35">
                          {formatSearchDate(message.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/50">
                        {message.direction === 'OUTBOUND' && <span className="text-white/35">Você: </span>}
                        {message.content ? highlightMatch(message.content, query) : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
