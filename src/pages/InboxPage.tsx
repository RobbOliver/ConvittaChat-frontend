import { useState } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { MessageThread } from '../components/inbox/MessageThread';
import { PipelinePanel } from '../components/inbox/PipelinePanel';
import { mockConversations } from '../mocks/conversations';

export function InboxPage() {
  const [selectedId, setSelectedId] = useState(mockConversations[0].id);
  const selectedConversation = mockConversations.find((c) => c.id === selectedId) ?? mockConversations[0];

  return (
    <div className="flex h-svh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <ConversationList
        conversations={mockConversations}
        selectedId={selectedConversation.id}
        onSelect={setSelectedId}
      />
      <MessageThread conversation={selectedConversation} />
      <PipelinePanel conversation={selectedConversation} />
    </div>
  );
}
