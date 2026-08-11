import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { conversationKey } from './useConversation';

export type AiContextResetScope = 'day' | 'general' | 'all';

/** Resets what the AI knows about this contact — never touches the actual chat history, which
 * stays exactly as-is. See ResetAiContextDto on the backend for what each scope clears. */
export function useResetAiContext(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scope: AiContextResetScope) =>
      (await api.post(`/conversations/${conversationId}/ai-reset`, { scope })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: ['contact-fields'] });
    },
  });
}
