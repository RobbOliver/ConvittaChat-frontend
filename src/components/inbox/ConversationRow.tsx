import type { DragEvent } from 'react';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import { contactDisplayName, formatTime } from '../../lib/format';
import type { ContactTab, ConversationSummary } from '../../types';
import { Avatar } from './Avatar';
import { MoveToTabMenu } from './MoveToTabMenu';

interface Props {
  conversation: ConversationSummary;
  tabs: ContactTab[];
  isSelected: boolean;
  draggable?: boolean;
  onSelect: (id: string) => void;
  onMoveConversation: (conversationId: string, tabId: string | null) => void;
}

export function ConversationRow({
  conversation,
  tabs,
  isSelected,
  draggable = true,
  onSelect,
  onMoveConversation,
}: Props) {
  const { lastMessage } = conversation;
  const name = contactDisplayName(conversation.contact);

  function handleDragStart(event: DragEvent) {
    event.dataTransfer.setData(CONVERSATION_DRAG_MIME, conversation.id);
    event.dataTransfer.effectAllowed = 'move';
  }

  return (
    <li className="group relative">
      <button
        type="button"
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
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
}
