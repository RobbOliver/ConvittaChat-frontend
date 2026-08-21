import { useState, type DragEvent, type FormEvent } from 'react';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import { formatBadgeCount } from '../../lib/format';
import { PRESS, PRESS_SM } from '../../lib/interactions';
import type { ContactTab } from '../../types';

interface Props {
  tabs: ContactTab[];
  activeTabId: string | null;
  unreadTotal: number;
  unreadByTab: Record<string, number>;
  onSelect: (tabId: string | null) => void;
  onCreateTab: (name: string) => void;
  onDeleteTab: (id: string) => void;
  onDropConversation: (conversationId: string, tabId: string | null) => void;
}

function chipClasses(isActive: boolean, isDragOver: boolean) {
  if (isActive) return 'bg-signal text-ink';
  if (isDragOver) return 'bg-signal-soft text-signal ring-2 ring-signal dark:bg-[#3a2f1f]';
  return 'bg-mist text-ink/55 hover:bg-line hover:text-ink dark:bg-[#24252e] dark:text-[#ececed]/55 dark:hover:bg-[#2f3039] dark:hover:text-[#ececed]';
}

/** Small discreet unread-count pill — legible on both the plain grey chip and the amber "active"
 * chip without competing with either for attention. */
function UnreadBadge({ count, isActive }: { count: number; isActive: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${
        isActive ? 'bg-white text-signal' : 'bg-signal text-ink'
      }`}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

export function TabBar({
  tabs,
  activeTabId,
  unreadTotal,
  unreadByTab,
  onSelect,
  onCreateTab,
  onDeleteTab,
  onDropConversation,
}: Props) {
  const [dragOverTabId, setDragOverTabId] = useState<string | null | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');

  function handleDragOver(event: DragEvent, tabId: string | null) {
    if (!event.dataTransfer.types.includes(CONVERSATION_DRAG_MIME)) return;
    event.preventDefault();
    setDragOverTabId(tabId);
  }

  function handleDrop(event: DragEvent, tabId: string | null) {
    event.preventDefault();
    setDragOverTabId(undefined);
    const conversationId = event.dataTransfer.getData(CONVERSATION_DRAG_MIME);
    if (conversationId) onDropConversation(conversationId, tabId);
  }

  function handleCreateSubmit(event: FormEvent) {
    event.preventDefault();
    const name = draftName.trim();
    if (name) onCreateTab(name);
    setDraftName('');
    setCreating(false);
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 pb-3">
      <button
        type="button"
        onClick={() => onSelect(null)}
        onDragOver={(event) => handleDragOver(event, null)}
        onDragLeave={() => setDragOverTabId(undefined)}
        onDrop={(event) => handleDrop(event, null)}
        className={`flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ${PRESS} ${chipClasses(activeTabId === null, dragOverTabId === null)}`}
      >
        All
        <UnreadBadge count={unreadTotal} isActive={activeTabId === null} />
      </button>

      {tabs.map((tab) => (
        <div key={tab.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => onSelect(tab.id)}
            onDragOver={(event) => handleDragOver(event, tab.id)}
            onDragLeave={() => setDragOverTabId(undefined)}
            onDrop={(event) => handleDrop(event, tab.id)}
            className={`flex items-center rounded-full py-1.5 pl-3 pr-6 text-xs font-semibold ${PRESS} ${chipClasses(activeTabId === tab.id, dragOverTabId === tab.id)}`}
          >
            {tab.name}
            <UnreadBadge count={unreadByTab[tab.id] ?? 0} isActive={activeTabId === tab.id} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteTab(tab.id)}
            aria-label={`Excluir aba ${tab.name}`}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-0 group-hover:opacity-100 ${PRESS_SM} ${
              activeTabId === tab.id
                ? 'text-ink/50 hover:text-ink'
                : 'text-ink/35 hover:text-ink dark:text-[#ececed]/35 dark:hover:text-[#ececed]'
            }`}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}

      {creating ? (
        <form onSubmit={handleCreateSubmit} className="shrink-0">
          <input
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={() => {
              if (!draftName.trim()) setCreating(false);
            }}
            placeholder="Nome da aba"
            className="w-28 rounded-full bg-mist px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink/35 focus:bg-line/60 dark:bg-[#24252e] dark:text-[#ececed] dark:placeholder:text-[#ececed]/35 dark:focus:bg-[#2f3039]"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="Criar aba"
          className={`shrink-0 rounded-full bg-mist px-2.5 py-1.5 text-xs font-semibold text-ink/50 hover:bg-line hover:text-ink dark:bg-[#24252e] dark:text-[#ececed]/50 dark:hover:bg-[#2f3039] dark:hover:text-[#ececed] ${PRESS}`}
        >
          +
        </button>
      )}
    </div>
  );
}
