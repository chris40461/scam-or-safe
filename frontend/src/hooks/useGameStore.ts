"use client";

import { create } from "zustand";
import type {
  GameSession,
  ScenarioNode,
  EducationalContent,
  Resources,
} from "@/lib/types";
import { getCurrentNode, getResult } from "@/lib/game-engine";
import type { GameResult } from "@/lib/types";

interface GameStore {
  // 상태
  session: GameSession | null;
  currentNode: ScenarioNode | null;
  previousResources: Resources | null;
  isLoading: boolean;
  isTypingComplete: boolean;
  error: string | null;
  showEducationalPopup: boolean;
  educationalContent: EducationalContent | null;

  // 액션
  startGame: (scenarioId: string) => Promise<void>;
  makeChoice: (choiceId: string) => Promise<void>;
  setTypingComplete: (complete: boolean) => void;
  dismissPopup: () => void;
  clearError: () => void;
  reset: () => void;
  getResult: () => GameResult | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  currentNode: null,
  previousResources: null,
  isLoading: false,
  isTypingComplete: false,
  error: null,
  showEducationalPopup: false,
  educationalContent: null,

  startGame: async (scenarioId: string) => {
    set({ isLoading: true, error: null, isTypingComplete: false });
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      if (!res.ok) {
        throw new Error("Failed to start game");
      }

      const session: GameSession = await res.json();
      const currentNode = getCurrentNode(session);

      set({
        session,
        currentNode,
        previousResources: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  makeChoice: async (choiceId: string) => {
    const { session } = get();
    if (!session) return;

    set({ isLoading: true, error: null, isTypingComplete: false });
    try {
      const res = await fetch(`/api/game/${session.id}/choose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceId }),
      });

      if (!res.ok) {
        throw new Error("Failed to process choice");
      }

      const { session: newSession, educationalContent } = await res.json();
      const currentNode = getCurrentNode(newSession);

      set({
        previousResources: session.resources,
        session: newSession,
        currentNode,
        isLoading: false,
      });

      // 위험 선택 시 교육 팝업 표시
      if (educationalContent) {
        set({
          showEducationalPopup: true,
          educationalContent,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  setTypingComplete: (complete: boolean) => {
    set({ isTypingComplete: complete });
  },

  dismissPopup: () => {
    set({ showEducationalPopup: false, educationalContent: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      session: null,
      currentNode: null,
      previousResources: null,
      isLoading: false,
      isTypingComplete: false,
      error: null,
      showEducationalPopup: false,
      educationalContent: null,
    });
  },

  getResult: () => {
    const { session } = get();
    if (!session || !session.isFinished) return null;
    return getResult(session);
  },
}));
