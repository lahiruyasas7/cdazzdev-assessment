// src/hooks/use-login.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api/axios-client";
import type { LoginFormValues } from "@/lib/validation/auth.validation";
import type { AuthSessionResponse } from "@/lib/types/auth.type";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<
    AuthSessionResponse,
    AxiosError<{ message: string }>,
    LoginFormValues
  >({
    mutationFn: async (values) => {
      const { data } = await apiClient.post<AuthSessionResponse>(
        "/auth/login",
        values,
      );
      return data;
    },
    onSuccess: (data) => {
      // Seeds the session Context reads from (see auth-context.tsx) —
      // this is the one place that cache gets populated, since there's
      // no GET /auth/me to refetch it from independently yet.
      queryClient.setQueryData(["auth", "session"], data);
    },
  });
}
