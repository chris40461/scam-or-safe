import Link from "next/link";
import { fetchScenarios } from "@/lib/api";
import type { ScenarioListItem } from "@/lib/types";

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "hard":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "쉬움";
    case "medium":
      return "보통";
    case "hard":
      return "어려움";
    default:
      return difficulty;
  }
}

interface ScenarioCardProps {
  scenario: ScenarioListItem;
}

function ScenarioCard({ scenario }: ScenarioCardProps) {
  return (
    <Link
      href={`/game/${scenario.id}`}
      className="block p-5 bg-surface-secondary/60 hover:bg-surface-secondary/80 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-lg font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors">
          {scenario.title}
        </h2>
        <span
          className={`px-2 py-0.5 text-xs rounded border ${getDifficultyColor(scenario.difficulty)}`}
        >
          {getDifficultyLabel(scenario.difficulty)}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
        {scenario.description}
      </p>

      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-xs bg-gray-700/50 text-gray-300 rounded">
          {scenario.phishing_type}
        </span>
      </div>
    </Link>
  );
}

export default async function ScenarioSelectPage() {
  let scenarios: ScenarioListItem[] = [];
  let error: string | null = null;

  try {
    scenarios = await fetchScenarios();
  } catch (e) {
    error = e instanceof Error ? e.message : "시나리오를 불러올 수 없습니다";
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-200 mb-4 inline-block"
          >
            ← 홈으로
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">시나리오 선택</h1>
              <p className="text-gray-400 mt-2">
                체험할 피싱 시나리오를 선택하세요
              </p>
            </div>
            <Link
              href="/generate"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <span>✨</span>
              새 시나리오 만들기
            </Link>
          </div>
        </div>

        {/* 에러 상태 */}
        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link
              href="/game"
              className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              다시 시도
            </Link>
          </div>
        )}

        {/* 빈 상태 */}
        {!error && scenarios.length === 0 && (
          <div className="p-12 bg-surface-secondary/40 border border-gray-700 rounded-lg text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              시나리오 준비 중
            </h2>
            <p className="text-gray-400">
              곧 새로운 피싱 시나리오가 추가될 예정입니다.
            </p>
          </div>
        )}

        {/* 시나리오 목록 */}
        {!error && scenarios.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
