"use client";

import { api } from "@/lib/api";
import type { CalendarData, DashboardData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function useDashboard(boardId?: string) {
  return useQuery({
    queryKey: ["dashboard", boardId ?? "default"],
    queryFn: () => api.get<DashboardData>(`/api/dashboard${boardId ? `?boardId=${boardId}` : ""}`),
  });
}

export function useCalendar(year: number, boardId?: string) {
  return useQuery({
    queryKey: ["calendar", year, boardId ?? "default"],
    queryFn: () => {
      const qs = new URLSearchParams({ year: String(year) });
      if (boardId) qs.set("boardId", boardId);
      return api.get<CalendarData>(`/api/dashboard/calendar?${qs.toString()}`);
    },
  });
}
