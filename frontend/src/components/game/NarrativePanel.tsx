"use client";

import { useEffect, useCallback } from "react";
import { useTypingEffect } from "@/hooks/useTypingEffect";

interface NarrativePanelProps {
  text: string;
  imageUrl?: string | null;
  onComplete: () => void;
  speed?: number;
}

// 텍스트 가독성을 위한 전처리 함수
function formatNarrativeText(text: string): string {
  // 1. 마침표, 느낌표, 물음표 뒤에 줄바꿈 추가 (먼저 처리)
  let formatted = text.replace(/([.!?])\s+/g, "$1\n");

  // 2. 큰따옴표와 작은따옴표로 감싼 대사를 별도 줄로 분리 (나중에 처리)
  formatted = formatted.replace(/("[^"]+"|'[^']+')/g, "\n\n$1\n\n");

  // 3. 연속된 줄바꿈을 2개로 제한
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  // 4. 시작과 끝의 불필요한 공백 제거
  formatted = formatted.trim();

  return formatted;
}

export function NarrativePanel({
  text,
  imageUrl,
  onComplete,
  speed = 30,
}: NarrativePanelProps) {
  // 이미지 URL은 /api/v1/images/... 형태로, rewrites가 백엔드로 프록시
  const formattedText = formatNarrativeText(text);
  const { displayedText, isComplete, skip } = useTypingEffect(formattedText, {
    speed,
    onComplete,
  });

  // 클릭/키보드로 스킵
  const handleSkip = useCallback(() => {
    if (!isComplete) {
      skip();
    }
  }, [isComplete, skip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  return (
    <div
      className="relative bg-surface-secondary/60 backdrop-blur rounded-lg border border-gray-700 cursor-pointer min-h-[200px] overflow-hidden"
      onClick={handleSkip}
      role="article"
      aria-live="polite"
    >
      {/* 이미지 표시 */}
      {imageUrl && (
        <div className="relative w-full h-48 sm:h-64">
          <img
            src={imageUrl}
            alt="장면 이미지"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-secondary/90" />
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className="p-6 sm:p-8">
        <p className="text-base sm:text-lg leading-loose whitespace-pre-wrap font-light text-gray-200">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse" />
          )}
        </p>

        {/* 스크린 리더용 전체 텍스트 */}
        <span className="sr-only">{formattedText}</span>
      </div>

      {/* 스킵 힌트 */}
      {!isComplete && (
        <p className="absolute bottom-2 right-4 text-xs text-gray-500">
          클릭하거나 스페이스바를 눌러 스킵
        </p>
      )}
    </div>
  );
}
