import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ConversationSummary } from '../types';

export function useSearchConversations(query: string) {
  return useQuery({
    queryKey: ['conversations-search', query],
    queryFn: async () =>
      (await api.get<ConversationSummary[]>('/conversations', { params: { q: query } })).data,
    enabled: query.length > 0,
  });
}
