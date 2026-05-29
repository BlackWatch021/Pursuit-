"use client";

import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ user: User }>("/api/auth/me"),
    retry: false,
  });
  return { user: data?.user ?? null, isLoading, isError };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ user: User }>("/api/auth/login", input),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      api.post<{ user: User }>("/api/auth/register", input),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
    },
  });
}
