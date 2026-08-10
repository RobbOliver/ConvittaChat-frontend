import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ContactField } from '../types';

export function contactFieldsKey(contactId: string | undefined) {
  return ['contact-fields', contactId];
}

export function useContactFields(contactId: string | undefined) {
  return useQuery({
    queryKey: contactFieldsKey(contactId),
    queryFn: async () => (await api.get<ContactField[]>(`/contacts/${contactId}/fields`)).data,
    enabled: !!contactId,
  });
}

export function useSetContactFieldValue(contactId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { definitionId: string; value: string }) =>
      (await api.put<ContactField>(`/contacts/${contactId}/fields/${input.definitionId}`, { value: input.value })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactFieldsKey(contactId) }),
  });
}

export function useClearContactFieldValue(contactId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (definitionId: string) => api.delete(`/contacts/${contactId}/fields/${definitionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactFieldsKey(contactId) }),
  });
}
