import type { ScenarioTree, ScenarioListItem } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
