import { useEffect, useMemo, useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { MessageThread } from '../components/inbox/MessageThread';
import { useConversation } from '../hooks/useConversation';
import { useConversations } from '../hooks/useConversations';
import { useContactTabs, useCreateContactTab, useDeleteContactTab } from '../hooks/useContactTabs';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useMoveConversation } from '../hooks/useMoveConversation';
import { useSearchConversations } from '../hooks/useSearchConversations';
import { useSyncingSessions } from '../hooks/useWhatsappSessions';

export function InboxPage() {
  const { data: conversations, isLoading } = useConversations();
  const { data: tabs } = useContactTabs();
  const createTab = useCreateContactTab();
  const deleteTab = useDeleteContactTab();
  const moveConversation = useMoveConversation();
  const syncingSessions = useSyncingSessions();

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
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

  const { data: selectedConversation } = useConversation(selectedId);

  const visibleConversations = useMemo(
    () => (conversations ?? []).filter((c) => activeTabId === null || c.tabId === activeTabId),
    [conversations, activeTabId],
  );

  return (
    <div className="flex h-svh flex-col bg-paper text-ink md:flex-row">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col md:flex md:flex-none`}>
        {syncingSessions.size > 0 && (
          <p className="bg-signal/15 px-4 py-2 text-center text-xs font-medium text-signal">
            Sincronizando conversas…
          </p>
        )}
        <ConversationList
          conversations={visibleConversations}
          searchResults={searchResults}
          isSearching={searchQuery.length > 0 && isSearching}
          tabs={tabs ?? []}
          activeTabId={activeTabId}
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
          <MessageThread conversation={selectedConversation} onBack={() => setMobileView('list')} />
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-ink/40">
            {isLoading
              ? 'Carregando conversas…'
              : 'Nenhuma conversa ainda. Assim que alguém escrever pro seu WhatsApp, ela aparece aqui.'}
          </div>
        )}
      </div>
    </div>
  );
}
