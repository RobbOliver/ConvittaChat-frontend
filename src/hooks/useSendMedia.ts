import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Message } from '../types';
import { conversationKey } from './useConversation';
import { CONVERSATIONS_KEY } from './useConversations';

export function useSendMedia(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (
        await api.post<Message>(`/conversations/${conversationId}/messages/media`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
