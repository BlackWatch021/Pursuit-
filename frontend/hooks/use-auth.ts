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

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; image?: string }) =>
      api.patch<{ user: User }>("/api/auth/me", input),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}

export function useUpdateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; currentPassword: string }) =>
      api.patch<{ user: User }>("/api/auth/email", input),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.patch<{ ok: true }>("/api/auth/password", input),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      api.post<{ ok: true }>("/api/auth/forgot-password", input),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; otp: string; newPassword: string }) =>
      api.post<{ user: User }>("/api/auth/reset-password", input),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}
