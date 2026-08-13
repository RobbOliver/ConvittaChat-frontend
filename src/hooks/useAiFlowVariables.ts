import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AiFlowVariable } from '../types';

export const AI_FLOW_VARIABLES_KEY = ['ai-flow-variables'];

/** Flow-internal working variable names (e.g. "tentativas"), managed once in the flow canvas's
 * "Variáveis" panel — see WaitReplyNodeConfig for where a value gets assigned into one. */
export function useAiFlowVariables() {
  return useQuery({
    queryKey: AI_FLOW_VARIABLES_KEY,
    queryFn: async () => (await api.get<AiFlowVariable[]>('/ai-flow-variables')).data,
  });
}

export function useCreateAiFlowVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => (await api.post<AiFlowVariable>('/ai-flow-variables', { key })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_FLOW_VARIABLES_KEY }),
  });
}

export function useRenameAiFlowVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; key: string }) =>
      (await api.patch<AiFlowVariable>(`/ai-flow-variables/${input.id}`, { key: input.key })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_FLOW_VARIABLES_KEY }),
  });
}

export function useDeleteAiFlowVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/ai-flow-variables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_FLOW_VARIABLES_KEY }),
  });
}
