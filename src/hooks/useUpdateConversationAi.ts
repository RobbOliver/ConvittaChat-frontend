import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ConversationDetail } from '../types';
import { conversationKey } from './useConversation';
import { CONVERSATIONS_KEY } from './useConversations';

interface UpdateVariables {
  conversationId: string;
  aiEnabled?: boolean;
  aiObjective?: string | null;
}

/** Per-conversation AI toggle + the "Objetivo" note — same PATCH /conversations/:id endpoint
 * useMoveConversation uses, just a different body shape. */
export function useUpdateConversationAi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, ...input }: UpdateVariables) =>
      (await api.patch<ConversationDetail>(`/conversations/${conversationId}`, input)).data,
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
