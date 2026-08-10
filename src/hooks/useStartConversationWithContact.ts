import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ConversationSummary } from '../types';
import { CONTACTS_KEY } from './useContacts';
import { CONVERSATIONS_KEY } from './useConversations';

export function useStartConversationWithContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) =>
      (await api.post<ConversationSummary>('/conversations/start-with-contact', { contactId })).data,
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationSummary[]>(CONVERSATIONS_KEY, (previous) => {
        if (!previous) return previous;
        const exists = previous.some((item) => item.id === conversation.id);
        return exists
          ? previous.map((item) => (item.id === conversation.id ? conversation : item))
          : [conversation, ...previous];
      });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
