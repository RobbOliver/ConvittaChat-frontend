import { useState, type DragEvent, type FormEvent } from 'react';
import { CONVERSATION_DRAG_MIME } from '../../lib/dnd';
import type { ContactTab } from '../../types';

interface Props {
  tabs: ContactTab[];
  activeTabId: string | null;
  onSelect: (tabId: string | null) => void;
  onCreateTab: (name: string) => void;
  onDeleteTab: (id: string) => void;
  onDropConversation: (conversationId: string, tabId: string | null) => void;
}

function chipClasses(isActive: boolean, isDragOver: boolean) {
  if (isActive) return 'bg-signal text-ink';
  if (isDragOver) return 'bg-white/25 text-white ring-2 ring-signal';
  return 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white';
}

export function TabBar({ tabs, activeTabId, onSelect, onCreateTab, onDeleteTab, onDropConversation }: Props) {
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
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${chipClasses(activeTabId === null, dragOverTabId === null)}`}
      >
        All
      </button>

      {tabs.map((tab) => (
        <div key={tab.id} className="group relative shrink-0">
          <button
            type="button"
            onClick={() => onSelect(tab.id)}
            onDragOver={(event) => handleDragOver(event, tab.id)}
            onDragLeave={() => setDragOverTabId(undefined)}
            onDrop={(event) => handleDrop(event, tab.id)}
            className={`rounded-full py-1.5 pl-3 pr-6 text-xs font-semibold transition-colors ${chipClasses(activeTabId === tab.id, dragOverTabId === tab.id)}`}
          >
            {tab.name}
          </button>
          <button
            type="button"
            onClick={() => onDeleteTab(tab.id)}
            aria-label={`Excluir aba ${tab.name}`}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/40 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
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
            className="w-28 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/40 focus:bg-white/15"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="Criar aba"
          className="shrink-0 rounded-full bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          +
        </button>
      )}
    </div>
  );
}
