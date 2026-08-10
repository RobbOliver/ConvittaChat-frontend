import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { ContactWithConversation } from '../types';

export const CONTACTS_KEY = ['contacts'];

/** Every synced WhatsApp contact/group, not just the ones already chatted with — used by the
 * "new chat" picker to offer everyone, the way WhatsApp's own picker does. */
export function useContacts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CONTACTS_KEY,
    queryFn: async () => (await api.get<ContactWithConversation[]>('/contacts')).data,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    socket.on('conversations:synced', invalidate);
    return () => {
      socket.off('conversations:synced', invalidate);
    };
  }, [queryClient]);

  return query;
}
