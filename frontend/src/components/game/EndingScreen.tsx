"use client";

import { motion } from "motion/react";
import type { GameResult, ChoiceHistoryItem } from "@/lib/types";

interface EndingScreenProps {
  result: GameResult;
  onReplay: () => void;
  onSelectOther: () => void;
  onGoBack?: () => void;
}

export function EndingScreen({
  result,
  onReplay,
  onSelectOther,
  onGoBack,
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

      {/* 엔딩 서사 */}
      <div className="w-full max-w-md bg-surface-secondary/60 rounded-lg p-5 border border-gray-700">
        {result.endingImageUrl && result.endingImageUrl.trim() !== "" && (
          <img
            src={result.endingImageUrl}
            alt="엔딩 장면"
            className="w-full rounded-lg mb-4 object-cover max-h-48"
            onError={(e) => {
              // 이미지 로드 실패 시 이미지 요소 숨기기
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <p className="text-gray-200 leading-relaxed whitespace-pre-line">
          {result.endingText}
        </p>
      </div>

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
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="group flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-slate-500/50"
          >
            <span className="text-xl mb-1 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span className="text-xs sm:text-sm">이전 선택</span>
          </button>
        )}
        <button
          onClick={onReplay}
          className="group flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
        >
          <span className="text-xl mb-1 transition-transform duration-300 group-hover:rotate-180">↻</span>
          <span className="text-xs sm:text-sm">다시 플레이</span>
        </button>
        <button
          onClick={onSelectOther}
          className="group flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-teal-500/50"
        >
          <span className="text-xl mb-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
          <span className="text-xs sm:text-sm">다른 시나리오</span>
        </button>
      </div>
    </motion.div>
  );
}
