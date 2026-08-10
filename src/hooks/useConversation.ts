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
    socket.on('conversation:new-message', onMessage);
    socket.on('message:reaction', onReaction);
    return () => {
      socket.off('conversation:new-message', onMessage);
      socket.off('message:reaction', onReaction);
    };
  }, [id, queryClient]);

  return query;
}
