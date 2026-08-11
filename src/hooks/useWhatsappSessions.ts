import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

/** Hides the card from Home for good — distinct from disconnect, which keeps it reconnectable.
 * Conversation history for that number is untouched, only the connection-list card disappears. */
export function useRemoveWhatsappSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/whatsapp-sessions/${id}/remove`)).data,
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

/** Session ids currently streaming in their WhatsApp history after a fresh pairing. */
export function useSyncingSessions(): Set<string> {
  const [syncing, setSyncing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onSync = (payload: { sessionId: string; syncing: boolean }) => {
      setSyncing((prev) => {
        const next = new Set(prev);
        if (payload.syncing) next.add(payload.sessionId);
        else next.delete(payload.sessionId);
        return next;
      });
    };
    socket.on('whatsapp-session:sync', onSync);
    return () => {
      socket.off('whatsapp-session:sync', onSync);
    };
  }, []);

  return syncing;
}
