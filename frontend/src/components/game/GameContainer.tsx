"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/hooks/useGameStore";
import { StatusBar } from "./StatusBar";
import { NarrativePanel } from "./NarrativePanel";
import { ChoicePanel } from "./ChoicePanel";
import { EducationalPopup } from "./EducationalPopup";
import { EndingScreen } from "./EndingScreen";

interface GameContainerProps {
  scenarioId: string;
}

export function GameContainer({ scenarioId }: GameContainerProps) {
  const router = useRouter();
  const [showPrologue, setShowPrologue] = useState(true);
  const {
    session,
    currentNode,
    previousResources,
    isLoading,
    isTypingComplete,
    error,
    showEducationalPopup,
    educationalContent,
    startGame,
    makeChoice,
    undoChoice,
    setTypingComplete,
    dismissPopup,
    reset,
    getResult,
  } = useGameStore();

  // 게임 시작
  useEffect(() => {
    startGame(scenarioId);
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // 로딩 상태
  if (isLoading && !session) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-12 bg-surface-secondary rounded-lg" />
        <div className="h-48 bg-surface-secondary rounded-lg" />
        <div className="space-y-3">
          <div className="h-14 bg-surface-secondary rounded-lg" />
          <div className="h-14 bg-surface-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400">오류가 발생했습니다: {error}</p>
        <button
          onClick={() => startGame(scenarioId)}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 세션 없음
  if (!session || !currentNode) {
    return null;
  }

  // 프롤로그 화면 (이전 상황 설명)
  const prologue = session.scenarioTree?.prologue;
  if (prologue && showPrologue) {
    return (
      <div className="flex flex-col gap-6">
        <div className="p-6 bg-surface-secondary/60 border border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📜</span>
            <h2 className="text-lg font-semibold text-gray-200">지금까지의 상황</h2>
          </div>
          <p className="text-gray-300 leading-relaxed italic">
            {prologue}
          </p>
        </div>
        <button
          onClick={() => setShowPrologue(false)}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
        >
          시작하기
        </button>
      </div>
    );
  }

  // 게임 종료
  if (session.isFinished) {
    const result = getResult();
    if (result) {
      // 선택 이력이 있는 경우에만 이전 선택지 버튼 표시
      const hasHistory = session.choiceHistory.length > 0;

      return (
        <EndingScreen
          result={result}
          onReplay={() => startGame(scenarioId)}
          onSelectOther={() => router.push("/game")}
          onGoBack={hasHistory ? undoChoice : undefined}
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 자원 바 */}
      <StatusBar
        resources={session.resources}
        previousResources={previousResources}
      />

      {/* 나레이션 */}
      <NarrativePanel
        text={currentNode.text}
        imageUrl={currentNode.image_url}
        onComplete={() => setTypingComplete(true)}
      />

      {/* 선택지 */}
      <ChoicePanel
        choices={currentNode.choices}
        onChoose={makeChoice}
        disabled={isLoading}
        isVisible={isTypingComplete && currentNode.choices.length > 0}
      />

      {/* 교육 팝업 */}
      {educationalContent && (
        <EducationalPopup
          content={educationalContent}
          isOpen={showEducationalPopup}
          onDismiss={dismissPopup}
        />
      )}
    </div>
  );
}
