"use client";

import { api } from "@/lib/api";
import type { Board } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: () => api.get<{ boards: Board[] }>("/api/boards"),
  });
}

export function useUpdateBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<Board, "name" | "color" | "stages" | "customFields">>) =>
      api.patch<{ board: Board }>(`/api/boards/${boardId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
