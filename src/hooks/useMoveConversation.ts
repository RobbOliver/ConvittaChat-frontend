import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ConversationSummary } from '../types';
import { CONVERSATIONS_KEY } from './useConversations';

interface MoveVariables {
  conversationId: string;
  tabId: string | null;
}

export function useMoveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, tabId }: MoveVariables) =>
      (await api.patch(`/conversations/${conversationId}`, { tabId })).data,
    onMutate: async ({ conversationId, tabId }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      const previous = queryClient.getQueryData<ConversationSummary[]>(CONVERSATIONS_KEY);
      if (previous) {
        queryClient.setQueryData<ConversationSummary[]>(
          CONVERSATIONS_KEY,
          previous.map((conversation) => (conversation.id === conversationId ? { ...conversation, tabId } : conversation)),
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(CONVERSATIONS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}
