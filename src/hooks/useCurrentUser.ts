import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import type { CurrentUser, InboxType, PixKeyType } from '../types';

export const CURRENT_USER_KEY = ['auth', 'me'];

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => (await api.get<CurrentUser>('/auth/me')).data,
    enabled: !!getToken(),
  });
}

export function useUpdateInboxType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inboxType: InboxType) => (await api.patch<CurrentUser>('/auth/me', { inboxType })).data,
    onSuccess: (user) => {
      queryClient.setQueryData<CurrentUser>(CURRENT_USER_KEY, user);
    },
  });
}

export interface PixConfigInput {
  pixKey: string;
  pixKeyType: PixKeyType;
  pixMerchantName: string;
  pixMerchantCity?: string;
}

export function useUpdatePixConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PixConfigInput) => (await api.patch<CurrentUser>('/auth/pix', input)).data,
    onSuccess: (user) => {
      queryClient.setQueryData<CurrentUser>(CURRENT_USER_KEY, user);
    },
  });
}
