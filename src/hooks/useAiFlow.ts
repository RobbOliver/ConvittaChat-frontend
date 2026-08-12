import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import type { AiFlow } from '../types';

export const AI_FLOW_KEY = ['ai-flow'];

/** Read-only for Fase 2 — the account's flow graph, auto-created server-side if it doesn't exist
 * yet. Editing (PUT /ai-flow) lands in Fase 3. */
export function useAiFlow() {
  return useQuery({
    queryKey: AI_FLOW_KEY,
    queryFn: async () => (await api.get<AiFlow>('/ai-flow')).data,
    enabled: !!getToken(),
  });
}
