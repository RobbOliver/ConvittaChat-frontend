import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ContactField } from '../types';

export function contactFieldsKey(contactId: string | undefined) {
  return ['contact-fields', contactId];
}

export const CONTACT_FIELD_KEYS_KEY = ['contact-field-keys'];

export function useContactFields(contactId: string | undefined) {
  return useQuery({
    queryKey: contactFieldsKey(contactId),
    queryFn: async () => (await api.get<ContactField[]>(`/contacts/${contactId}/fields`)).data,
    enabled: !!contactId,
  });
}

/** Known field keys across every contact (e.g. "endereço"), suggested when adding a new field so
 * naming stays consistent for the future quick-message template lookup. */
export function useContactFieldKeys() {
  return useQuery({
    queryKey: CONTACT_FIELD_KEYS_KEY,
    queryFn: async () => (await api.get<string[]>('/contacts/fields/keys')).data,
  });
}

export function useCreateContactField(contactId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { key: string; value: string }) =>
      (await api.post<ContactField>(`/contacts/${contactId}/fields`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactFieldsKey(contactId) });
      queryClient.invalidateQueries({ queryKey: CONTACT_FIELD_KEYS_KEY });
    },
  });
}

export function useUpdateContactField(contactId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { fieldId: string; value: string }) =>
      (await api.patch<ContactField>(`/contacts/${contactId}/fields/${input.fieldId}`, { value: input.value })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactFieldsKey(contactId) }),
  });
}

export function useDeleteContactField(contactId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fieldId: string) => api.delete(`/contacts/${contactId}/fields/${fieldId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactFieldsKey(contactId) }),
  });
}
