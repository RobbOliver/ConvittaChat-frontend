import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { InboxSearchResults } from '../types';

export function useSearchConversations(query: string) {
  return useQuery({
    queryKey: ['conversations-search', query],
    queryFn: async () =>
      (await api.get<InboxSearchResults>('/conversations/search', { params: { q: query } })).data,
    enabled: query.length > 0,
  });
}
