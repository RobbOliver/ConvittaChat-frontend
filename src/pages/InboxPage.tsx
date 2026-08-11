import { useEffect, useMemo, useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { ContactDetailsPanel } from '../components/inbox/ContactDetailsPanel';
import { MessageThread } from '../components/inbox/MessageThread';
import { useConversation } from '../hooks/useConversation';
import { useConversations } from '../hooks/useConversations';
import { useContactTabs, useCreateContactTab, useDeleteContactTab } from '../hooks/useContactTabs';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMoveConversation } from '../hooks/useMoveConversation';
import { useSearchConversations } from '../hooks/useSearchConversations';
import { useSyncingSessions } from '../hooks/useWhatsappSessions';

export function InboxPage() {
  const { data: conversations, isLoading } = useConversations();
  const { data: currentUser } = useCurrentUser();
  const inboxType = currentUser?.inboxType ?? 'SECTOR';
  const { data: tabs } = useContactTabs();
  const createTab = useCreateContactTab();
  const deleteTab = useDeleteContactTab();
  const moveConversation = useMoveConversation();
  const syncingSessions = useSyncingSessions();
  const syncingMessageCount = useMemo(
    () => Array.from(syncingSessions.values()).reduce((sum, count) => sum + count, 0),
    [syncingSessions],
  );

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'thread' | 'details'>('list');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput.trim(), 300);
  const { data: searchResults, isFetching: isSearching } = useSearchConversations(searchQuery);

  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (activeTabId && tabs && !tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(null);
    }
  }, [tabs, activeTabId]);

  // Reopening a different chat should mean re-deciding whether to look at its contact info, not
  // silently keep showing the previous contact's panel.
  useEffect(() => {
    setDetailsOpen(false);
  }, [selectedId]);

  const { data: selectedConversation } = useConversation(selectedId);

  const visibleConversations = useMemo(
    () => (conversations ?? []).filter((c) => activeTabId === null || c.tabId === activeTabId),
    [conversations, activeTabId],
  );

  // Counts unread *conversations*, not total unread messages — a folder with 3 chats that each
  // have several unread messages should badge "3", the same way WhatsApp's own chat-list badges work.
  const unread = useMemo(() => {
    const byTab: Record<string, number> = {};
    let total = 0;
    for (const conversation of conversations ?? []) {
      if (conversation.unreadCount <= 0) continue;
      total += 1;
      if (conversation.tabId) {
        byTab[conversation.tabId] = (byTab[conversation.tabId] ?? 0) + 1;
      }
    }
    return { total, byTab };
  }, [conversations]);

  function openDetails() {
    setDetailsOpen(true);
    setMobileView('details');
  }

  function closeDetails() {
    setDetailsOpen(false);
    setMobileView('thread');
  }

  return (
    <div className="flex h-svh flex-col bg-paper text-ink md:flex-row">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col md:flex md:flex-none`}>
        {syncingSessions.size > 0 && (
          <div className="bg-signal/15 px-4 py-2 text-center">
            <p className="text-xs font-medium text-signal">
              Identificando contatos e grupos… {syncingMessageCount.toLocaleString('pt-BR')} mensagens processadas até agora
            </p>
            <p className="text-[11px] text-signal/70">
              O histórico de mensagens não é importado — cada conversa começa vazia a partir de agora, mensagens novas continuam chegando normalmente enquanto isso
            </p>
          </div>
        )}
        <ConversationList
          inboxType={inboxType}
          conversations={visibleConversations}
          searchResults={searchResults}
          isSearching={searchQuery.length > 0 && isSearching}
          tabs={tabs ?? []}
          activeTabId={activeTabId}
          unreadTotal={unread.total}
          unreadByTab={unread.byTab}
          selectedId={selectedId}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileView('thread');
          }}
          onSelectTab={(id) => {
            setSearchInput('');
            setActiveTabId(id);
          }}
          onCreateTab={(name) => createTab.mutate(name)}
          onDeleteTab={(id) => deleteTab.mutate(id)}
          onMoveConversation={(conversationId, tabId) => moveConversation.mutate({ conversationId, tabId })}
        />
      </div>
      <div className={`${mobileView === 'thread' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 md:flex`}>
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            inboxType={inboxType}
            onBack={() => setMobileView('list')}
            onOpenDetails={inboxType === 'SALES' ? openDetails : undefined}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-ink/40">
            {isLoading
              ? 'Carregando conversas…'
              : 'Nenhuma conversa ainda. Assim que alguém escrever pro seu WhatsApp, ela aparece aqui.'}
          </div>
        )}
      </div>
      {inboxType === 'SALES' && detailsOpen && selectedConversation && (
        <div className={`${mobileView === 'details' ? 'flex' : 'hidden'} min-h-0 md:flex`}>
          <ContactDetailsPanel conversation={selectedConversation} onClose={closeDetails} />
        </div>
      )}
    </div>
  );
}
