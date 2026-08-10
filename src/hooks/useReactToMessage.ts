import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { conversationKey } from './useConversation';

export function useReactToMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { messageId: string; emoji: string }) =>
      (
        await api.post(`/conversations/${conversationId}/messages/${input.messageId}/react`, {
          emoji: input.emoji,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
    },
  });
}
