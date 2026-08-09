import { useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { MessageThread } from '../components/inbox/MessageThread';
import { PipelinePanel } from '../components/inbox/PipelinePanel';
import { mockConversations } from '../mocks/conversations';

export function InboxPage() {
  const [selectedId, setSelectedId] = useState(mockConversations[0].id);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const selectedConversation = mockConversations.find((c) => c.id === selectedId) ?? mockConversations[0];

  return (
    <div className="flex h-svh flex-col bg-paper text-ink md:flex-row">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} min-h-0 flex-1 md:flex md:flex-none`}>
        <ConversationList
          conversations={mockConversations}
          selectedId={selectedConversation.id}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileView('thread');
          }}
        />
      </div>
      <div className={`${mobileView === 'thread' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 md:flex`}>
        <MessageThread conversation={selectedConversation} onBack={() => setMobileView('list')} />
      </div>
      <div className="hidden min-h-0 lg:flex">
        <PipelinePanel conversation={selectedConversation} />
      </div>
    </div>
  );
}
