import { Link } from 'react-router-dom';
import type { ConversationSummary } from '../../types';
import { contactDisplayName, formatTime, getInitials } from '../../lib/format';
import { StageBadge } from './StageBadge';
import { STAGE_DOT } from './stageTheme';

interface Props {
  conversations: ConversationSummary[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-ink md:w-80">
      <Link
        to="/"
        className="group flex items-center gap-2 px-5 pb-5 pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-white"
          aria-hidden
        >
          <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <p className="font-display text-xl font-semibold tracking-tight text-white">Convitta</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Inbox</p>
        </span>
      </Link>
      <ul className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.map((conversation) => {
          const { lastMessage } = conversation;
          const isSelected = conversation.id === selectedId;
          const name = contactDisplayName(conversation.contact);
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`group relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 ${
                  isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute bottom-3 left-0 top-3 w-0.5 rounded-full transition-opacity ${STAGE_DOT[conversation.stage]} ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                  }`}
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-semibold text-white">
                  {getInitials(name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{name}</span>
                    {lastMessage && (
                      <span className="shrink-0 font-mono text-[10px] text-white/35">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  {lastMessage && (
                    <span className="mt-0.5 block truncate text-xs text-white/50">{lastMessage.content}</span>
                  )}
                  <span className="mt-1.5 inline-flex">
                    <StageBadge stage={conversation.stage} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
