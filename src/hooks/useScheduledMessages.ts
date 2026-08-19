import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import { socket } from '../lib/socket';
import type { ScheduledMessage, ScheduledMessageMode } from '../types';

export const SCHEDULED_MESSAGES_KEY = ['scheduled-messages'];

/** Every scheduled message for the account (pending + history) — the panel splits by `status`
 * itself rather than this hook exposing two separate queries. Live-updated over the socket, same
 * pattern as useConversations: a sweep tick sending an occurrence emits `scheduled-message:updated`
 * server-side, which just invalidates here rather than trying to patch the cache in place. */
export function useScheduledMessages() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SCHEDULED_MESSAGES_KEY,
    queryFn: async () => (await api.get<ScheduledMessage[]>('/scheduled-messages')).data,
    enabled: !!getToken(),
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: SCHEDULED_MESSAGES_KEY });
    socket.on('scheduled-message:updated', invalidate);
    return () => {
      socket.off('scheduled-message:updated', invalidate);
    };
  }, [queryClient]);

  return query;
}

export interface CreateScheduledMessageInput {
  contactId: string;
  text?: string;
  file?: File;
  mode: ScheduledMessageMode;
  loopCount?: number;
  loopIntervalMinutes?: number;
  occurrences?: string[];
}

export function useCreateScheduledMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateScheduledMessageInput) => {
      const formData = new FormData();
      formData.append('contactId', input.contactId);
      formData.append('mode', input.mode);
      if (input.text) formData.append('text', input.text);
      if (input.file) formData.append('file', input.file);
      if (input.loopCount) formData.append('loopCount', String(input.loopCount));
      if (input.loopIntervalMinutes) formData.append('loopIntervalMinutes', String(input.loopIntervalMinutes));
      if (input.occurrences) formData.append('occurrences', JSON.stringify(input.occurrences));
      return (
        await api.post<ScheduledMessage>('/scheduled-messages', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_MESSAGES_KEY });
    },
  });
}

export function useCancelScheduledMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => (await api.delete<ScheduledMessage>(`/scheduled-messages/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_MESSAGES_KEY });
    },
  });
}
