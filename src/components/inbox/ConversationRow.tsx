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
    <li className="group relative border-b border-[#f0f2f5]">
      <button
        type="button"
        draggable={draggable}
        onDragStart={draggable ? handleDragStart : undefined}
        onClick={() => onSelect(conversation.id)}
        className={`flex w-full items-start gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00a884]/60 ${PRESS} ${
          isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
        }`}
      >
        <Avatar name={name} avatarUrl={conversation.contact.avatarUrl} tone="light" />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-2 border-t border-transparent pr-6">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[15px] text-[#111b21]">{name}</span>
              {conversation.needsHuman && (
                <span
                  title="Um passo do fluxo pediu atendimento humano aqui"
                  className="shrink-0 rounded-full bg-[#ea4335] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                >
                  Atendente
                </span>
              )}
            </span>
            {lastMessage && (
              <span className="mt-0.5 block truncate text-[13px] text-[#667781]">{lastMessage.content}</span>
            )}
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1.5">
            {lastMessage && (
              <span
                className={`text-[11px] ${
                  conversation.unreadCount > 0 ? 'font-semibold text-[#00a884]' : 'text-[#667781]'
                }`}
              >
                {formatTime(lastMessage.createdAt)}
              </span>
            )}
            {conversation.unreadCount > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#00a884] px-1 text-[11px] font-semibold leading-none text-white">
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
