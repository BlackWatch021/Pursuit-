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

export interface CreateBoardInput {
  name: string;
  color?: string;
  stages?: { id?: string; name: string; order: number; color: string }[];
  customFields?: { id?: string; name: string; type: string; options?: string[] }[];
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBoardInput) => api.post<{ board: Board }>("/api/boards", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boards"] }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => api.delete<{ ok: true }>(`/api/boards/${boardId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useUpdateBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<
          Board,
          | "name"
          | "color"
          | "stages"
          | "customFields"
          | "titleLabel"
          | "dateLabel"
          | "showTags"
          | "showPriority"
        >
      >,
    ) => api.patch<{ board: Board }>(`/api/boards/${boardId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteStage(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { stageId: string; strategy: "move" | "delete"; targetStageId?: string }) =>
      api.delete<{ board: Board }>(`/api/boards/${boardId}/stages/${vars.stageId}`, {
        strategy: vars.strategy,
        targetStageId: vars.targetStageId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}
