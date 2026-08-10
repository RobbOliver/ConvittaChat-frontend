import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ConversationSummary } from '../types';
import { CONVERSATIONS_KEY } from './useConversations';

interface StartVariables {
  sessionId: string;
  phoneNumber: string;
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: StartVariables) =>
      (await api.post<ConversationSummary>('/conversations/start', variables)).data,
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationSummary[]>(CONVERSATIONS_KEY, (previous) => {
        if (!previous) return previous;
        const exists = previous.some((item) => item.id === conversation.id);
        return exists
          ? previous.map((item) => (item.id === conversation.id ? conversation : item))
          : [conversation, ...previous];
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
