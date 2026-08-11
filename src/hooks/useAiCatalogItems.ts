import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AiCatalogItem } from '../types';

export const AI_CATALOG_ITEMS_KEY = ['ai-catalog-items'];

/** The admin's AI catalog (products/services/menu items) — generic on purpose, see AiCatalogEditor. */
export function useAiCatalogItems() {
  return useQuery({
    queryKey: AI_CATALOG_ITEMS_KEY,
    queryFn: async () => (await api.get<AiCatalogItem[]>('/ai-catalog-items')).data,
  });
}

export interface CreateAiCatalogItemInput {
  name: string;
  description?: string;
  priceCents: number;
  available?: boolean;
}

export function useCreateAiCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAiCatalogItemInput) =>
      (await api.post<AiCatalogItem>('/ai-catalog-items', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_CATALOG_ITEMS_KEY }),
  });
}

export interface UpdateAiCatalogItemInput {
  id: string;
  name?: string;
  description?: string;
  priceCents?: number;
  available?: boolean;
}

export function useUpdateAiCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAiCatalogItemInput) =>
      (await api.patch<AiCatalogItem>(`/ai-catalog-items/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_CATALOG_ITEMS_KEY }),
  });
}

export function useDeleteAiCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/ai-catalog-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AI_CATALOG_ITEMS_KEY }),
  });
}
