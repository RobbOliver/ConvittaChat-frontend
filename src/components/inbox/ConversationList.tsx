import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PRESS_SM } from '../../lib/interactions';
import type { ContactTab, ConversationSummary, InboxSearchResults, InboxType } from '../../types';
import { ConversationRow } from './ConversationRow';
import { NewChatButton } from './NewChatButton';
import { SearchResults } from './SearchResults';
import { TabBar } from './TabBar';

/** Splits an already-sorted (most-recent-first) conversation list into "today" and "the rest",
 * without re-sorting either group — order within each group stays whatever the caller passed in. */
function splitByToday(conversations: ConversationSummary[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today: ConversationSummary[] = [];
  const others: ConversationSummary[] = [];
  for (const conversation of conversations) {
    const at = new Date(conversation.lastMessage?.createdAt ?? conversation.updatedAt);
    (at >= startOfToday ? today : others).push(conversation);
  }
  return { today, others };
}

/** Milliseconds until the next local midnight — used to re-run the today/others split without a
 * page refresh, since the boundary is purely a function of wall-clock time, not of any data
 * change the socket/query layer would otherwise invalidate on. */
function msUntilNextMidnight(): number {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime() - Date.now();
}

const INBOX_TYPE_LABEL: Record<InboxType, string> = {
  SECTOR: 'Inbox por Setor',
  SALES: 'Inbox para Vendas',
};

interface Props {
  inboxType: InboxType;
  conversations: ConversationSummary[];
  searchResults: InboxSearchResults | undefined;
  isSearching: boolean;
  tabs: ContactTab[];
  activeTabId: string | null;
  unreadTotal: number;
  unreadByTab: Record<string, number>;
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
  inboxType,
  conversations,
  searchResults,
  isSearching,
  tabs,
  activeTabId,
  unreadTotal,
  unreadByTab,
  selectedId,
  searchValue,
  onSearchChange,
  onSelect,
  onSelectTab,
  onCreateTab,
  onDeleteTab,
  onMoveConversation,
}: Props) {
  const isSearchActive = searchValue.length > 0;
  // Bumped once at each local midnight to force the split below to recompute — nothing else about
  // this value matters, it's never read.
  const [, setDayTick] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timer = setTimeout(() => {
        setDayTick((t) => t + 1);
        scheduleNext();
      }, msUntilNextMidnight());
    };
    scheduleNext();
    return () => clearTimeout(timer);
  }, []);
  const { today, others } = splitByToday(conversations);

  return (
    <aside className="relative flex h-full w-full shrink-0 flex-col border-r border-[#e9edef] bg-white md:w-[380px]">
      <Link
        to="/"
        className="group flex items-center gap-2.5 bg-[#f0f2f5] px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]/60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] font-sans text-sm font-bold text-white">
          C
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#111b21]">Convitta</p>
          <p className="truncate text-[11px] font-medium text-[#667781]">{INBOX_TYPE_LABEL[inboxType]}</p>
        </span>
      </Link>

      <div className="bg-white px-3 py-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#667781]">
            <SearchIcon />
          </span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Pesquisar ou começar uma nova conversa"
            className="w-full rounded-lg bg-[#f0f2f5] py-[7px] pl-9 pr-9 text-sm text-[#111b21] outline-none placeholder:text-[#667781] focus:ring-1 focus:ring-[#00a884]/50"
          />
          {isSearchActive && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className={`absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-[#667781] hover:text-[#111b21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]/60 ${PRESS_SM}`}
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        unreadTotal={unreadTotal}
        unreadByTab={unreadByTab}
        onSelect={onSelectTab}
        onCreateTab={onCreateTab}
        onDeleteTab={onDeleteTab}
        onDropConversation={onMoveConversation}
      />

      {isSearchActive ? (
        <SearchResults
          results={searchResults ?? { chats: [], messages: [] }}
          isLoading={isSearching}
          query={searchValue}
          tabs={tabs}
          selectedId={selectedId}
          onSelect={onSelect}
          onMoveConversation={onMoveConversation}
        />
      ) : (
        <div className="flex-1 overflow-y-auto bg-white pb-4">
          {today.length > 0 && (
            <ul>
              <ConversationGroupHeader label="Hoje" />
              {today.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  tabs={tabs}
                  isSelected={conversation.id === selectedId}
                  onSelect={onSelect}
                  onMoveConversation={onMoveConversation}
                />
              ))}
            </ul>
          )}
          {others.length > 0 && (
            <ul>
              <ConversationGroupHeader label="Outros" />
              {others.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  tabs={tabs}
                  isSelected={conversation.id === selectedId}
                  onSelect={onSelect}
                  onMoveConversation={onMoveConversation}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <NewChatButton onStarted={onSelect} />
    </aside>
  );
}

function ConversationGroupHeader({ label }: { label: string }) {
  return (
    <li className="bg-[#f7f8f9] px-4 pb-1.5 pt-2 text-[12px] font-medium text-[#667781]">{label}</li>
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

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" aria-hidden>
      <path d="M4 4l12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
