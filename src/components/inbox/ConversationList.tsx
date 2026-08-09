import type { Conversation } from '../../types';
import { StageBadge } from './StageBadge';

interface Props {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: Props) {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Conversas</h1>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const lastMessage = conversation.messages.at(-1);
          const isSelected = conversation.id === selectedId;
          return (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`flex w-full flex-col gap-1 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-900 ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {conversation.contact.name}
                  </span>
                  <StageBadge stage={conversation.stage} />
                </div>
                {lastMessage && (
                  <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {lastMessage.content}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
