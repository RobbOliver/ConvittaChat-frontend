import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ContactFieldDefinition } from '../types';

export const CONTACT_FIELD_DEFINITIONS_KEY = ['contact-field-definitions'];

/** The Sales Inbox's custom-field keys (e.g. "endereço"), managed once in Settings and shared
 * across every contact — see ContactDetailsPanel for where the per-contact values live. */
export function useContactFieldDefinitions() {
  return useQuery({
    queryKey: CONTACT_FIELD_DEFINITIONS_KEY,
    queryFn: async () => (await api.get<ContactFieldDefinition[]>('/contact-field-definitions')).data,
  });
}

export function useCreateContactFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) =>
      (await api.post<ContactFieldDefinition>('/contact-field-definitions', { key })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACT_FIELD_DEFINITIONS_KEY }),
  });
}

export function useRenameContactFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; key: string }) =>
      (await api.patch<ContactFieldDefinition>(`/contact-field-definitions/${input.id}`, { key: input.key })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACT_FIELD_DEFINITIONS_KEY }),
  });
}

export function useDeleteContactFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/contact-field-definitions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACT_FIELD_DEFINITIONS_KEY }),
  });
}
