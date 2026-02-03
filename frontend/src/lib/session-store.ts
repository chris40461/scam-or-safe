import type { GameSession } from "./types";

/** 인메모리 세션 저장소 (서버리스 배포 시 Zustand 전환 필요) */
class SessionStore {
  private sessions = new Map<string, GameSession>();

  set(id: string, session: GameSession) {
    console.log(`[SessionStore] Setting session: ${id}`);
    this.sessions.set(id, session);
    console.log(`[SessionStore] Total sessions: ${this.sessions.size}`);
  }

  get(id: string): GameSession | undefined {
    const session = this.sessions.get(id);
    console.log(`[SessionStore] Getting session: ${id}, found: ${!!session}`);
    if (!session) {
      console.log(`[SessionStore] Available sessions: ${Array.from(this.sessions.keys()).join(", ")}`);
    }
    return session;
  }

  has(id: string): boolean {
    return this.sessions.has(id);
  }

  delete(id: string): boolean {
    console.log(`[SessionStore] Deleting session: ${id}`);
    return this.sessions.delete(id);
  }

  clear() {
    console.log(`[SessionStore] Clearing all sessions`);
    this.sessions.clear();
  }

  get size(): number {
    return this.sessions.size;
  }
}

// Next.js 개발 모드에서 HMR로 인한 재초기화 방지
declare global {
  var __gameSessionStore: SessionStore | undefined;
}

if (!global.__gameSessionStore) {
  global.__gameSessionStore = new SessionStore();
  console.log("[SessionStore] Created new session store");
}

export const sessions = global.__gameSessionStore;
