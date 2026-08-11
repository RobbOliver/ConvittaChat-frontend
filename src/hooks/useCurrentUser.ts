import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getToken } from '../lib/authToken';
import type { AiBusinessHoursRange, AiBusinessInfo, CurrentUser, InboxType, PixKeyType } from '../types';

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

export interface AiConfigInput {
  aiEnabled?: boolean;
  aiBusinessName?: string;
  aiPersona?: string;
  aiBusinessInfo?: AiBusinessInfo;
  aiBusinessHours?: AiBusinessHoursRange[];
  aiExtraRules?: string;
  aiDefaultObjective?: string;
  aiFallbackMessage?: string;
  aiMaxRepliesPerDay?: number;
}

export function useUpdateAiConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AiConfigInput) => (await api.patch<CurrentUser>('/auth/ai', input)).data,
    onSuccess: (user) => {
      queryClient.setQueryData<CurrentUser>(CURRENT_USER_KEY, user);
    },
  });
}
