import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import type { AiFlow, AiFlowEdge, AiFlowNode, AiFlowVersionSummary } from '../types';

export const AI_FLOW_KEY = ['ai-flow'];
export const AI_FLOW_VERSIONS_KEY = ['ai-flow', 'versions'];

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
  edges: Pick<
    AiFlowEdge,
    'id' | 'sourceId' | 'targetId' | 'routeLabel' | 'isFallback' | 'sourceHandle' | 'targetHandle'
  >[];
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

/** Saved backups of the flow graph, newest first — see FlowVersionsPanel. */
export function useAiFlowVersions() {
  return useQuery({
    queryKey: AI_FLOW_VERSIONS_KEY,
    queryFn: async () => (await api.get<AiFlowVersionSummary[]>('/ai-flow/versions')).data,
    enabled: !!getToken(),
  });
}

/** Snapshots the CURRENT live graph as a new version — `label` is optional, admin-typed. */
export function useSaveAiFlowVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label?: string) =>
      (await api.post<AiFlowVersionSummary>('/ai-flow/versions', { label })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_FLOW_VERSIONS_KEY });
    },
  });
}

/** Replaces the live graph with a saved version's snapshot — the backend auto-backs up the
 * current graph first, so this is itself always undoable via the versions list. */
export function useRestoreAiFlowVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) =>
      (await api.post<AiFlow>(`/ai-flow/versions/${versionId}/restore`)).data,
    onSuccess: (flow) => {
      queryClient.setQueryData<AiFlow>(AI_FLOW_KEY, flow);
      queryClient.invalidateQueries({ queryKey: AI_FLOW_VERSIONS_KEY });
    },
  });
}
