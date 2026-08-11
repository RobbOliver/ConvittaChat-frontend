import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { ConversationDetail } from '../types';

export function conversationKey(id: string | undefined) {
  return ['conversation', id];
}

export function useConversation(id: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationKey(id),
    queryFn: async () => (await api.get<ConversationDetail>(`/conversations/${id}`)).data,
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const onMessage = (payload: { conversationId: string }) => {
      if (payload.conversationId === id) {
        queryClient.invalidateQueries({ queryKey: conversationKey(id) });
      }
    };
    const onReaction = (payload: { conversationId: string }) => {
      if (payload.conversationId === id) {
        queryClient.invalidateQueries({ queryKey: conversationKey(id) });
      }
    };
    // Fired after the AI auto-reply extracts new fields/objective/long-term facts — refreshes the
    // contact panel's AI blocks live if it's open on this conversation.
    const onAiMemoryUpdated = (payload: { conversationId: string }) => {
      if (payload.conversationId === id) {
        queryClient.invalidateQueries({ queryKey: conversationKey(id) });
        // Extracted fields land in ContactField values, keyed by contactId, not conversationId —
        // broad-invalidate every contact-fields query rather than resolving which contact this is.
        queryClient.invalidateQueries({ queryKey: ['contact-fields'] });
      }
    };
    socket.on('conversation:new-message', onMessage);
    socket.on('message:reaction', onReaction);
    socket.on('conversation:ai-memory-updated', onAiMemoryUpdated);
    return () => {
      socket.off('conversation:new-message', onMessage);
      socket.off('message:reaction', onReaction);
      socket.off('conversation:ai-memory-updated', onAiMemoryUpdated);
    };
  }, [id, queryClient]);

  return query;
}
