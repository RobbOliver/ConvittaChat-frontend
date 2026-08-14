import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { playNotificationSound } from '../lib/notificationSound';
import { socket } from '../lib/socket';
import type { ConversationSummary, NotifySignal } from '../types';

export const CONVERSATIONS_KEY = ['conversations'];

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => (await api.get<ConversationSummary[]>('/conversations')).data,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    // A flow step's `notify` signal (see AiMessageNodeConfig) — plays a sound the moment it fires.
    // 'HUMAN_NEEDED' also persists to `needsHuman` server-side, surfaced via the ordinary
    // `conversation:updated` -> invalidate -> refetch path above, not here; this listener only
    // ever plays the sound, never touches the query cache itself.
    const onNotify = (payload: { conversationId: string; signal: NotifySignal }) => {
      playNotificationSound(payload.signal);
    };
    socket.on('conversation:new-message', invalidate);
    socket.on('conversation:updated', invalidate);
    socket.on('conversations:synced', invalidate);
    socket.on('conversation:notify', onNotify);
    return () => {
      socket.off('conversation:new-message', invalidate);
      socket.off('conversation:updated', invalidate);
      socket.off('conversations:synced', invalidate);
      socket.off('conversation:notify', onNotify);
    };
  }, [queryClient]);

  return query;
}
