import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AppTheme } from '../../contexts/ThemeContext';
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
  theme: AppTheme;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
    <aside className="relative flex h-full w-full shrink-0 flex-col border-r border-line bg-paper md:w-[380px] dark:border-[#34353f] dark:bg-[#1a1b21]">
      <div className="flex items-center gap-1 px-5 pb-3 pt-5">
        <Link
          to="/"
          className="group flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-ink dark:text-[#ececed]/30 dark:group-hover:text-[#ececed]"
            aria-hidden
          >
            <path d="M12.5 15 7.5 10l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-semibold tracking-tight text-ink dark:text-[#ececed]">
              Convitta
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-ink/35 dark:text-[#ececed]/35">
              {INBOX_TYPE_LABEL[inboxType]}
            </p>
          </span>
        </Link>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-mist hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 dark:text-[#ececed]/40 dark:hover:bg-[#24252e] dark:hover:text-[#ececed] ${PRESS_SM}`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-[#ececed]/35">
            <SearchIcon />
          </span>
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar conversas, contatos ou mensagens"
            className="w-full rounded-full border border-line bg-mist/60 py-2 pl-9 pr-9 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-signal focus:bg-paper focus:ring-2 focus:ring-signal/20 dark:border-[#34353f] dark:bg-[#24252e]/60 dark:text-[#ececed] dark:placeholder:text-[#ececed]/35 dark:focus:bg-[#1a1b21]"
          />
          {isSearchActive && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className={`absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-ink/35 hover:text-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 dark:text-[#ececed]/35 dark:hover:text-[#ececed]/70 ${PRESS_SM}`}
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
        <div className="flex-1 overflow-y-auto px-2 pb-4">
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
    <li className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wide text-ink/35 dark:text-[#ececed]/35">
      {label}
    </li>
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

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a6.8 6.8 0 1 0 8.8 8.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.7v1.8M10 15.5v1.8M17.3 10h-1.8M4.5 10H2.7M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1 4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
