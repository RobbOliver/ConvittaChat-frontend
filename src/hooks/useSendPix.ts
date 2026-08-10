import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { conversationKey } from './useConversation';
import { CONVERSATIONS_KEY } from './useConversations';

export function useSendPix(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { amount: number; description?: string }) =>
      (await api.post<{ ok: true }>(`/conversations/${conversationId}/messages/pix`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
