import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { FlowTrace } from '../types';

export function flowTraceKey(conversationId: string | undefined) {
  return ['flow-trace', conversationId];
}

/** Debug view of where the AI flow currently sits for a conversation — refetches on the same
 * socket events useConversation already listens to, since any new message (customer or AI reply)
 * is exactly when the flow's current step could have changed. */
export function useFlowTrace(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: flowTraceKey(conversationId),
    queryFn: async () =>
      (await api.get<FlowTrace>(`/conversations/${conversationId}/flow-trace`)).data,
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const invalidate = (payload: { conversationId: string }) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: flowTraceKey(conversationId) });
      }
    };
    socket.on('conversation:new-message', invalidate);
    socket.on('conversation:ai-memory-updated', invalidate);
    return () => {
      socket.off('conversation:new-message', invalidate);
      socket.off('conversation:ai-memory-updated', invalidate);
    };
  }, [conversationId, queryClient]);

  return query;
}
