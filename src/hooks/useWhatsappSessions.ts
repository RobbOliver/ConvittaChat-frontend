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

/** Permanently deletes the number and everything tied to it (contacts, conversations, messages)
 * — distinct from disconnect, which only frees the slot and keeps the number reconnectable with
 * its history intact. Reconnecting after a remove starts from a clean slate. */
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

/**
 * Session ids currently streaming in their WhatsApp history after a fresh pairing, mapped to how
 * many messages have been processed so far. WhatsApp never tells Baileys the total upfront, so
 * this is an honest running count, not a percentage — a session present in the map is syncing,
 * one absent from it isn't (or finished).
 */
export function useSyncingSessions(): Map<string, number> {
  const [syncing, setSyncing] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const onSync = (payload: { sessionId: string; syncing: boolean; messagesSynced?: number }) => {
      setSyncing((prev) => {
        const next = new Map(prev);
        if (payload.syncing) next.set(payload.sessionId, payload.messagesSynced ?? next.get(payload.sessionId) ?? 0);
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
