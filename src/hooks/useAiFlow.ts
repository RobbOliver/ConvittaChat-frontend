import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import type { AiFlow, AiFlowEdge, AiFlowNode } from '../types';

export const AI_FLOW_KEY = ['ai-flow'];

/** The account's flow graph, auto-created server-side if it doesn't exist yet. */
export function useAiFlow() {
  return useQuery({
    queryKey: AI_FLOW_KEY,
    queryFn: async () => (await api.get<AiFlow>('/ai-flow')).data,
    enabled: !!getToken(),
  });
}

export interface UpdateAiFlowInput {
  nodes: Pick<AiFlowNode, 'id' | 'type' | 'label' | 'positionX' | 'positionY' | 'config'>[];
  edges: Pick<AiFlowEdge, 'id' | 'sourceId' | 'targetId' | 'routeLabel' | 'isFallback'>[];
}

export function useUpdateAiFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAiFlowInput) => (await api.put<AiFlow>('/ai-flow', input)).data,
    onSuccess: (flow) => {
      queryClient.setQueryData<AiFlow>(AI_FLOW_KEY, flow);
    },
  });
}
