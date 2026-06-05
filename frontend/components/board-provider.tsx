"use client";

import { useBoards } from "@/hooks/use-boards";
import type { Board } from "@/lib/types";
import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "pursuit:activeBoardId";

interface BoardContextValue {
  boards: Board[];
  activeBoard: Board | null;
  activeBoardId: string | null;
  setActiveBoardId: (id: string) => void;
  isLoading: boolean;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useBoards();
  const boards = data?.boards ?? [];

  // Explicit selection this session; falls back to localStorage, then the
  // first (default) board. Resolved at render time so a deleted board can't
  // leave a dangling selection.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  let activeBoard: Board | null = null;
  if (boards.length > 0) {
    const stored =
      selectedId ?? (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
    activeBoard = boards.find((b) => b._id === stored) ?? boards[0];
  }

  function setActiveBoardId(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }

  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoard,
        activeBoardId: activeBoard?._id ?? null,
        setActiveBoardId,
        isLoading,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useActiveBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useActiveBoard must be used within a BoardProvider");
  return ctx;
}
