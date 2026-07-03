import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api/axios-client';
import type { AuthSessionResponse } from '@/lib/types/auth.type';
import { RegisterFormValues } from '@/lib/validation/auth.validation';

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<AuthSessionResponse, AxiosError<{ message: string }>, RegisterFormValues>({
    mutationFn: async (values) => {
      const { data } = await apiClient.post<AuthSessionResponse>('/auth/register', values);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'session'], data);
    },
  });
}
