import type { ScenarioTree, ScenarioListItem } from "./types";

// 클라이언트: 상대 경로 사용 (rewrites가 백엔드로 프록시)
// 서버(API Route): BACKEND_URL 환경변수 사용
const BACKEND_URL = typeof window === "undefined"
  ? (process.env.BACKEND_URL || "http://localhost:8080")
  : "";

// ==================== 관리자 인증 API ====================

export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface VerifyResponse {
  is_admin: boolean;
}

/** 관리자 로그인 */
export async function adminLogin(password: string): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "로그인 실패" }));
    throw new Error(error.detail || "로그인 실패");
  }

  return res.json();
}

/** 관리자 로그아웃 */
export async function adminLogout(): Promise<LoginResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("로그아웃 실패");
  }

  return res.json();
}

/** 관리자 세션 검증 */
export async function verifyAdmin(): Promise<VerifyResponse> {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/verify`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    return { is_admin: false };
  }

  return res.json();
}

/** 시나리오 목록 조회 */
export async function fetchScenarios(): Promise<ScenarioListItem[]> {
  const res = await fetch(`${BACKEND_URL}/api/v1/scenarios`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch scenarios: ${res.status}`);
  }
  return res.json();
}

/** 시나리오 상세 조회 */
export async function fetchScenario(id: string): Promise<ScenarioTree> {
  const res = await fetch(`${BACKEND_URL}/api/v1/scenarios/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch scenario: ${res.status}`);
  }
  return res.json();
}

// ==================== 크롤러 API ====================

export interface PhishingArticle {
  id: string;
  url: string;
  title: string;
  source: string;
  phishing_type: string;
  victim_profile: string | null;
  scammer_persona: string | null;
  initial_contact: string | null;
  persuasion_tactics: string[];
  requested_actions: string[];
  red_flags: string[];
  damage_amount: string | null;
  scenario_seed: string | null;
}

export interface CrawlerTaskStatus {
  status: "pending" | "crawling" | "completed" | "failed" | "generating";
  articles_count?: number;
  phishing_types?: Record<string, number>;
  scenario_id?: string;
  error?: string;
}

/** 뉴스 크롤링 시작 */
export async function startCrawling(keywords?: string[]): Promise<{ task_id: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/crawler/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords }),
  });
  if (!res.ok) {
    throw new Error(`Failed to start crawling: ${res.status}`);
  }
  return res.json();
}

/** 크롤링 작업 상태 조회 */
export async function getCrawlerStatus(taskId: string): Promise<CrawlerTaskStatus> {
  const res = await fetch(`${BACKEND_URL}/api/v1/crawler/status/${taskId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get crawler status: ${res.status}`);
  }
  return res.json();
}

/** 분석된 기사 목록 조회 */
export async function getArticles(): Promise<{ articles: PhishingArticle[]; total: number }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/crawler/articles`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to get articles: ${res.status}`);
  }
  return res.json();
}

/** 선택한 기사로 시나리오 생성 */
export async function generateFromArticle(
  articleId: string,
  difficulty: string = "medium"
): Promise<{ task_id: string }> {
  const res = await fetch(`${BACKEND_URL}/api/v1/crawler/generate-from-article`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ article_id: articleId, difficulty }),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate scenario: ${res.status}`);
  }
  return res.json();
}
