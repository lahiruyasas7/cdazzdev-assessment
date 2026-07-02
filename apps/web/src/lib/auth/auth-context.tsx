// src/lib/auth/auth-context.tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios-client";
import type { AuthSessionResponse, AuthUser } from "@/lib/types/auth.type";

interface AuthContextValue {
  user: AuthUser | undefined;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Backed by GET /api/auth/me (our own Route Handler, which calls the
 * API's GET /auth/me). This now properly survives a hard page refresh:
 * middleware lets the request through based on the httpOnly cookies
 * alone, and this query then fetches the real user the moment the page
 * mounts, using the same cookies (sent automatically, same-origin).
 *
 * Login/register still eagerly seed this same query key on success
 * (see use-login.ts / use-register.ts) purely as a perceived-speed
 * optimization — it means the UI shows the right user immediately after
 * login without waiting on a second round trip, rather than because
 * this query couldn't otherwise get the data itself.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuthSessionResponse>({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const { data } = await apiClient.get<AuthSessionResponse>("/auth/me");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false, // a 401 here means "not logged in", not "transient failure" — don't retry
  });

  async function logout() {
    await apiClient.post("/auth/logout");
    queryClient.setQueryData(["auth", "session"], undefined);
    queryClient.clear();
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user: data?.user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
