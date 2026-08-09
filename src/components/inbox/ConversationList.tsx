import type { DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import { contactDisplayName, formatTime } from '../../lib/format';
import type { ContactTab, ConversationSummary } from '../../types';
import { Avatar } from './Avatar';
import { MoveToTabMenu } from './MoveToTabMenu';
import { TabBar } from './TabBar';

interface Props {
  conversations: ConversationSummary[];
  tabs: ContactTab[];
  activeTabId: string | null;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onSelectTab: (tabId: string | null) => void;
  onCreateTab: (name: string) => void;
  onDeleteTab: (id: string) => void;
  onMoveConversation: (conversationId: string, tabId: string | null) => void;
}

export function ConversationList({
  conversations,
  tabs,
  activeTabId,
  selectedId,
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
    <aside className="flex h-full w-full shrink-0 flex-col bg-ink md:w-80">
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

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelect={onSelectTab}
        onCreateTab={onCreateTab}
        onDeleteTab={onDeleteTab}
        onDropConversation={onMoveConversation}
      />

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
    </aside>
  );
}
