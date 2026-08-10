import type { DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import { contactDisplayName, formatTime } from '../../lib/format';
import type { ContactTab, ConversationSummary } from '../../types';
import { Avatar } from './Avatar';
import { MoveToTabMenu } from './MoveToTabMenu';
import { NewChatButton } from './NewChatButton';
import { TabBar } from './TabBar';

interface Props {
  conversations: ConversationSummary[];
  isSearching: boolean;
  tabs: ContactTab[];
  activeTabId: string | null;
  selectedId: string | undefined;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onSelectTab: (tabId: string | null) => void;
  onCreateTab: (name: string) => void;
  onDeleteTab: (id: string) => void;
  onMoveConversation: (conversationId: string, tabId: string | null) => void;
}

export function ConversationList({
  conversations,
  isSearching,
  tabs,
  activeTabId,
  selectedId,
  searchValue,
  onSearchChange,
  onSelect,
  onSelectTab,
  onCreateTab,
  onDeleteTab,
  onMoveConversation,
}: Props) {
  function handleDragStart(event: DragEvent, conversationId: string) {
    event.dataTransfer.setData(CONVERSATION_DRAG_MIME, conversationId);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <aside className="relative flex h-full w-full shrink-0 flex-col bg-ink md:w-80">
      <Link
        to="/"
        className="group flex items-center gap-2 px-5 pb-4 pt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
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

      <div className="px-3 pb-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
            <SearchIcon />
          </span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar conversas, contatos ou mensagens"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-signal/60 focus:ring-2 focus:ring-signal/20"
          />
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={onSelectTab}
        onCreateTab={onCreateTab}
        onDeleteTab={onDeleteTab}
        onDropConversation={onMoveConversation}
      />

      {searchValue && conversations.length === 0 && (
        <p className="px-5 py-4 text-center text-sm text-white/40">
          {isSearching ? 'Buscando…' : 'Nenhum resultado encontrado.'}
        </p>
      )}

      <ul className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.map((conversation) => {
          const { lastMessage } = conversation;
          const isSelected = conversation.id === selectedId;
          const name = contactDisplayName(conversation.contact);
          return (
            <li key={conversation.id} className="group relative">
              <button
                type="button"
                draggable
                onDragStart={(event) => handleDragStart(event, conversation.id)}
                onClick={() => onSelect(conversation.id)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 ${
                  isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} tone="dark" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 pr-6">
                    <span className="truncate text-sm font-medium text-white">{name}</span>
                    {lastMessage && (
                      <span className="shrink-0 font-mono text-[10px] text-white/35">
                        {formatTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  {lastMessage && (
                    <span className="mt-0.5 block truncate pr-6 text-xs text-white/50">{lastMessage.content}</span>
                  )}
                </span>
              </button>
              <div className="absolute right-2 top-3">
                <MoveToTabMenu
                  tabs={tabs}
                  currentTabId={conversation.tabId}
                  onMove={(tabId) => onMoveConversation(conversation.id, tabId)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <NewChatButton onStarted={onSelect} />
    </aside>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m16 16-3.2-3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
