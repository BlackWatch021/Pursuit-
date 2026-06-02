"use client";

import { api } from "@/lib/api";
import type { Item, Priority } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ItemFilters {
  search?: string;
  tag?: string;
}

export function useItems(boardId: string | undefined, filters: ItemFilters = {}) {
  return useQuery({
    queryKey: ["items", boardId, filters.search ?? "", filters.tag ?? ""],
    enabled: !!boardId,
    queryFn: () => {
      const qs = new URLSearchParams();
      if (boardId) qs.set("boardId", boardId);
      if (filters.search) qs.set("search", filters.search);
      if (filters.tag) qs.set("tag", filters.tag);
      return api.get<{ items: Item[] }>(`/api/items?${qs.toString()}`);
    },
  });
}

export function useItem(id: string | null) {
  return useQuery({
    queryKey: ["item", id],
    enabled: !!id,
    queryFn: () => api.get<{ item: Item }>(`/api/items/${id}`),
  });
}

export interface CreateItemInput {
  boardId: string;
  title: string;
  stageId?: string;
  primaryDate?: string;
  fields?: Record<string, unknown>;
  tags?: string[];
  priority?: Priority;
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => api.post<{ item: Item }>("/api/items", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export type UpdateItemData = Partial<
  Pick<Item, "title" | "primaryDate" | "fields" | "tags" | "priority" | "archived">
>;

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemData }) =>
      api.patch<{ item: Item }>(`/api/items/${id}`, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useMoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId, order }: { id: string; stageId: string; order?: number }) =>
      api.patch<{ item: Item }>(`/api/items/${id}/stage`, { stageId, order }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useReorderItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: string; stageId: string; order: number }[]) =>
      api.patch<{ ok: true }>("/api/items/reorder", { updates }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}
