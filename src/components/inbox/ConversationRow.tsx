import type { DragEvent } from 'react';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import { contactDisplayName, formatBadgeCount, formatTime } from '../../lib/format';
import { PRESS } from '../../lib/interactions';
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
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 ${PRESS} ${
          isSelected ? 'bg-signal-soft dark:bg-[#3a2f1f]' : 'hover:bg-mist dark:hover:bg-[#24252e]'
        }`}
      >
        <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} tone="light" />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-2 pr-6">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-ink dark:text-[#ececed]">{name}</span>
              {conversation.needsHuman && (
                <span
                  title="Um passo do fluxo pediu atendimento humano aqui"
                  className="shrink-0 rounded-full bg-stage-lost px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                >
                  Atendente
                </span>
              )}
            </span>
            {lastMessage && (
              <span className="mt-0.5 block truncate text-xs text-ink/45 dark:text-[#ececed]/45">
                {lastMessage.content}
              </span>
            )}
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {lastMessage && (
              <span
                className={`font-mono text-[10px] ${
                  conversation.unreadCount > 0 ? 'font-semibold text-signal' : 'text-ink/35 dark:text-[#ececed]/35'
                }`}
              >
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
            {conversation.unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold leading-none text-ink">
                {formatBadgeCount(conversation.unreadCount)}
              </span>
            )}
          </span>
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
