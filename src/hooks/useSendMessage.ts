import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Message } from '../types';
import { conversationKey } from './useConversation';
import { CONVERSATIONS_KEY } from './useConversations';

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<Message>(`/conversations/${conversationId}/messages`, { content })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
