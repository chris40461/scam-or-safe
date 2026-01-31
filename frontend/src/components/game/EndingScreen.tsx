"use client";

import { motion } from "motion/react";
import type { GameResult, ChoiceHistoryItem } from "@/lib/types";

interface EndingScreenProps {
  result: GameResult;
  onReplay: () => void;
  onSelectOther: () => void;
}

export function EndingScreen({
  result,
  onReplay,
  onSelectOther,
}: EndingScreenProps) {
  const isGood = result.ending === "good";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 p-6"
    >
      {/* 엔딩 타이틀 */}
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className={`text-6xl ${isGood ? "text-glow" : ""}`}
        style={{ color: isGood ? "#10b981" : "#ef4444" }}
      >
        {isGood ? "🎉" : "💔"}
      </motion.div>

      <h1
        className={`text-3xl font-bold ${isGood ? "text-emerald-400" : "text-red-400"}`}
      >
        {isGood ? "피해를 예방했습니다!" : "피싱에 당했습니다"}
      </h1>

      {/* 최종 자원 상태 */}
      <div className="w-full max-w-md bg-surface-secondary/60 rounded-lg p-4 border border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          최종 상태
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🎭</div>
            <div className="text-xs text-gray-400">신뢰도</div>
            <div className="text-lg font-bold">
              {result.finalResources.trust}
            </div>
          </div>
          <div>
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs text-gray-400">자산</div>
            <div className="text-lg font-bold">
              {result.finalResources.money}
            </div>
          </div>
          <div>
            <div className="text-2xl mb-1">👁️</div>
            <div className="text-xs text-gray-400">경각심</div>
            <div className="text-lg font-bold">
              {result.finalResources.awareness}
            </div>
          </div>
        </div>
      </div>

      {/* 선택 이력 타임라인 */}
      <div className="w-full max-w-md bg-surface-secondary/60 rounded-lg p-4 border border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          선택 이력
        </h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {result.choiceHistory.map((item: ChoiceHistoryItem, index: number) => (
            <div
              key={`${item.nodeId}-${item.choiceId}`}
              className={`
                flex items-center gap-2 text-sm p-2 rounded
                ${item.isDangerous ? "bg-red-500/10 border-l-2 border-red-500" : "bg-gray-700/30"}
              `}
            >
              <span className="text-gray-500 w-6">{index + 1}.</span>
              <span className={item.isDangerous ? "text-red-300" : ""}>
                {item.choiceText}
              </span>
              {item.isDangerous && (
                <span className="ml-auto text-xs text-red-400">⚠️ 위험</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 교육 요약 (있는 경우) */}
      {result.educationalSummary.length > 0 && (
        <div className="w-full max-w-md bg-surface-secondary/60 rounded-lg p-4 border border-gray-700">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">
            핵심 교훈
          </h2>
          <div className="space-y-3">
            {result.educationalSummary.slice(0, 3).map((edu, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium text-orange-400">{edu.title}</div>
                <p className="text-gray-300 text-xs mt-1">{edu.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={onReplay}
          className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
        >
          다시 플레이
        </button>
        <button
          onClick={onSelectOther}
          className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          다른 시나리오
        </button>
      </div>
    </motion.div>
  );
}
