"use client";

import { useEffect } from "react";
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
    setTypingComplete,
    dismissPopup,
    reset,
    getResult,
  } = useGameStore();

  // 게임 시작
  useEffect(() => {
    startGame(scenarioId);
    return () => reset();
  }, [scenarioId, startGame, reset]);

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

  // 게임 종료
  if (session.isFinished) {
    const result = getResult();
    if (result) {
      return (
        <EndingScreen
          result={result}
          onReplay={() => startGame(scenarioId)}
          onSelectOther={() => router.push("/game")}
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
