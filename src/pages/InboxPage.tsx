import { useEffect, useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { MessageThread } from '../components/inbox/MessageThread';
import { PipelinePanel } from '../components/inbox/PipelinePanel';
import { useConversation } from '../hooks/useConversation';
import { useConversations } from '../hooks/useConversations';

export function InboxPage() {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const { data: selectedConversation } = useConversation(selectedId);

  return (
    <div className="flex h-svh flex-col bg-paper text-ink md:flex-row">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 flex-1 md:flex md:flex-none`}>
        <ConversationList
          conversations={conversations ?? []}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileView('thread');
          }}
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
      <div className="hidden min-h-0 lg:flex">
        {selectedConversation && <PipelinePanel conversation={selectedConversation} />}
      </div>
    </div>
  );
}
