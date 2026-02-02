import type { ScenarioTree, ScenarioListItem } from "./types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

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
