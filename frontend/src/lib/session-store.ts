import type { GameSession } from "./types";

/** 인메모리 세션 저장소 (서버리스 배포 시 Zustand 전환 필요) */
export const sessions = new Map<string, GameSession>();
