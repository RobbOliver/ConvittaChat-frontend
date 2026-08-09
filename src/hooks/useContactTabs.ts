import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import { CONVERSATIONS_KEY } from './useConversations';
import type { ContactTab } from '../types';

export const CONTACT_TABS_KEY = ['contact-tabs'];

export function useContactTabs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CONTACT_TABS_KEY,
    queryFn: async () => (await api.get<ContactTab[]>('/contact-tabs')).data,
  });

  useEffect(() => {
    const onDeleted = () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TABS_KEY });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    };
    socket.on('contact-tab:deleted', onDeleted);
    return () => {
      socket.off('contact-tab:deleted', onDeleted);
    };
  }, [queryClient]);

  return query;
}

export function useCreateContactTab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => (await api.post<ContactTab>('/contact-tabs', { name })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACT_TABS_KEY }),
  });
}

export function useDeleteContactTab() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/contact-tabs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_TABS_KEY });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
