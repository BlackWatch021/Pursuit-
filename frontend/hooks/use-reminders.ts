"use client";

import { api } from "@/lib/api";
import type { Reminder } from "@/lib/types";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function invalidateAll(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["reminders"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["calendar"] });
}

export function useReminders(scope?: "open") {
  return useQuery({
    queryKey: ["reminders", scope ?? "all"],
    queryFn: () => api.get<{ reminders: Reminder[] }>(`/api/reminders${scope ? `?scope=${scope}` : ""}`),
  });
}

export function useItemReminders(itemId: string | null) {
  return useQuery({
    queryKey: ["reminders", "item", itemId],
    enabled: !!itemId,
    queryFn: () => api.get<{ reminders: Reminder[] }>(`/api/items/${itemId}/reminders`),
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; dueDate: string; note?: string }) =>
      api.post<{ reminder: Reminder }>("/api/reminders", input),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { done?: boolean; note?: string; dueDate?: string } }) =>
      api.patch<{ reminder: Reminder }>(`/api/reminders/${id}`, data),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reminders/${id}`),
    onSuccess: () => invalidateAll(qc),
  });
}
