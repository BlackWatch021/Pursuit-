"use client";

import { api } from "@/lib/api";
import type { Activity } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useActivities(itemId: string | null) {
  return useQuery({
    queryKey: ["activities", itemId],
    enabled: !!itemId,
    queryFn: () => api.get<{ activities: Activity[] }>(`/api/items/${itemId}/activities`),
  });
}

export function useAddNote(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<{ activity: Activity }>(`/api/items/${itemId}/activities`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities", itemId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
