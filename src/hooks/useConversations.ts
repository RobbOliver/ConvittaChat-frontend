import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { ConversationSummary } from '../types';

export const CONVERSATIONS_KEY = ['conversations'];

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => (await api.get<ConversationSummary[]>('/conversations')).data,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    socket.on('conversation:new-message', invalidate);
    return () => {
      socket.off('conversation:new-message', invalidate);
    };
  }, [queryClient]);

  return query;
}
