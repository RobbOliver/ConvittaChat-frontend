import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { WhatsappSession } from '../types';

const SESSIONS_KEY = ['whatsapp-sessions'];

export function useWhatsappSessions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async () => (await api.get<WhatsappSession[]>('/whatsapp-sessions')).data,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    socket.on('whatsapp-session:status', invalidate);
    return () => {
      socket.off('whatsapp-session:status', invalidate);
    };
  }, [queryClient]);

  return query;
}

export function useCreateWhatsappSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string) => (await api.post<WhatsappSession>('/whatsapp-sessions', { label })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useDisconnectWhatsappSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/whatsapp-sessions/${id}/disconnect`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}

export function useReconnectWhatsappSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/whatsapp-sessions/${id}/reconnect`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  });
}
