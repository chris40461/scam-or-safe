"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  startCrawling,
  getCrawlerStatus,
  getArticles,
  generateFromArticle,
  type PhishingArticle,
} from "@/lib/api";

type Step = "idle" | "crawling" | "selecting" | "generating" | "complete";

export default function GeneratePage() {
  const [step, setStep] = useState<Step>("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [articles, setArticles] = useState<PhishingArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [error, setError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 크롤링 시작
  const handleStartCrawling = async () => {
    try {
      setError(null);
      setStep("crawling");
      setStatusMessage("뉴스 크롤링 시작...");

      const { task_id } = await startCrawling();
      setTaskId(task_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "크롤링 시작 실패");
      setStep("idle");
    }
  };

  // 크롤링 상태 폴링
  useEffect(() => {
    if (step !== "crawling" || !taskId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getCrawlerStatus(taskId);

        if (status.status === "crawling") {
          setStatusMessage("AI가 최신 피싱 뉴스를 분석 중...");
        } else if (status.status === "completed") {
          clearInterval(pollInterval);
          setStatusMessage(`${status.articles_count}개의 피싱 사례를 찾았습니다!`);

          // 기사 목록 가져오기
          const { articles } = await getArticles();
          setArticles(articles);
          setStep("selecting");
        } else if (status.status === "failed") {
          clearInterval(pollInterval);
          setError(status.error || "크롤링 실패");
          setStep("idle");
        }
      } catch (e) {
        clearInterval(pollInterval);
        setError(e instanceof Error ? e.message : "상태 조회 실패");
        setStep("idle");
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [step, taskId]);

  // 시나리오 생성
  const handleGenerate = async () => {
    if (!selectedArticle) return;

    try {
      setError(null);
      setStep("generating");
      setStatusMessage("시나리오 생성 중...");

      const { task_id } = await generateFromArticle(selectedArticle, difficulty);
      setTaskId(task_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "시나리오 생성 실패");
      setStep("selecting");
    }
  };

  // 시나리오 생성 상태 폴링
  useEffect(() => {
    if (step !== "generating" || !taskId) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await getCrawlerStatus(taskId);

        if (status.status === "generating") {
          setStatusMessage("AI가 시나리오를 만들고 있어요...");
        } else if (status.status === "completed" && status.scenario_id) {
          clearInterval(pollInterval);
          setScenarioId(status.scenario_id);
          setStep("complete");
        } else if (status.status === "failed") {
          clearInterval(pollInterval);
          setError(status.error || "시나리오 생성 실패");
          setStep("selecting");
        }
      } catch (e) {
        clearInterval(pollInterval);
        setError(e instanceof Error ? e.message : "상태 조회 실패");
        setStep("selecting");
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [step, taskId]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/game"
            className="text-sm text-gray-400 hover:text-gray-200 mb-4 inline-block"
          >
            ← 시나리오 목록
          </Link>
          <h1 className="text-3xl font-bold text-cyan-400">새 시나리오 만들기(관리자용)</h1>
          <p className="text-gray-400 mt-2">
            최신 피싱 뉴스를 기반으로 시나리오를 생성합니다
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: 시작 버튼 */}
        {step === "idle" && (
          <div className="p-12 bg-surface-secondary/40 border border-gray-700 rounded-lg text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              최신 피싱 뉴스 탐색
            </h2>
            <p className="text-gray-400 mb-8">
              AI가 최신 피싱/사기 뉴스를 분석하여 교육용 시나리오를 만들어드립니다.
            </p>
            <button
              onClick={handleStartCrawling}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
            >
              뉴스 탐색 시작
            </button>
          </div>
        )}

        {/* Step 2: 크롤링 중 */}
        {step === "crawling" && (
          <div className="p-12 bg-surface-secondary/40 border border-gray-700 rounded-lg text-center">
            <div className="text-6xl mb-6">📡</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              {statusMessage}
            </h2>
            <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full animate-[loading_2s_ease-in-out_infinite]"
                   style={{
                     width: "30%",
                     animation: "loading 2s ease-in-out infinite"
                   }} />
            </div>
            <style jsx>{`
              @keyframes loading {
                0% { transform: translateX(-100%); width: 30%; }
                50% { transform: translateX(150%); width: 50%; }
                100% { transform: translateX(-100%); width: 30%; }
              }
            `}</style>
          </div>
        )}

        {/* Step 3: 기사 선택 */}
        {step === "selecting" && (
          <div>
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-cyan-400">{statusMessage}</p>
            </div>

            {/* 난이도 선택 */}
            <div className="mb-6 p-4 bg-surface-secondary/40 border border-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                난이도 선택
              </label>
              <div className="flex gap-4">
                {[
                  { value: "easy", label: "쉬움", color: "green" },
                  { value: "medium", label: "보통", color: "yellow" },
                  { value: "hard", label: "어려움", color: "red" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer border transition-colors ${
                      difficulty === opt.value
                        ? `bg-${opt.color}-500/20 border-${opt.color}-500/50 text-${opt.color}-400`
                        : "bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={opt.value}
                      checked={difficulty === opt.value}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* 기사 목록 */}
            <div className="space-y-3 mb-6">
              {articles.map((article) => (
                <label
                  key={article.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedArticle === article.id
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-surface-secondary/40 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="article"
                      value={article.id}
                      checked={selectedArticle === article.id}
                      onChange={() => setSelectedArticle(article.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                          {article.phishing_type}
                        </span>
                        <span className="text-xs text-gray-500">{article.source}</span>
                      </div>
                      <h3 className="font-medium text-gray-200 mb-2">{article.title}</h3>
                      {article.scenario_seed && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {article.scenario_seed}
                        </p>
                      )}
                      {article.persuasion_tactics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {article.persuasion_tactics.slice(0, 3).map((tactic, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs bg-gray-700/50 text-gray-400 rounded"
                            >
                              {tactic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={!selectedArticle}
              className={`w-full py-3 font-semibold rounded-lg transition-colors ${
                selectedArticle
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              선택한 사례로 시나리오 만들기
            </button>
          </div>
        )}

        {/* Step 4: 시나리오 생성 중 */}
        {step === "generating" && (
          <div className="p-12 bg-surface-secondary/40 border border-gray-700 rounded-lg text-center">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              {statusMessage}
            </h2>
            <p className="text-gray-400">
              선택한 피싱 사례를 바탕으로 교육용 시나리오를 생성하고 있습니다...
            </p>
          </div>
        )}

        {/* Step 5: 완료 */}
        {step === "complete" && scenarioId && (
          <div className="p-12 bg-surface-secondary/40 border border-gray-700 rounded-lg text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              시나리오가 생성되었습니다!
            </h2>
            <p className="text-gray-400 mb-8">
              이제 새로운 피싱 시나리오를 체험해보세요.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/game/${scenarioId}`}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
              >
                바로 플레이하기
              </Link>
              <Link
                href="/game"
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-colors"
              >
                시나리오 목록
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
