"use client";

import { useEffect, useCallback } from "react";
import { useTypingEffect } from "@/hooks/useTypingEffect";

interface NarrativePanelProps {
  text: string;
  imageUrl?: string | null;
  onComplete: () => void;
  speed?: number;
}

export function NarrativePanel({
  text,
  imageUrl,
  onComplete,
  speed = 30,
}: NarrativePanelProps) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const { displayedText, isComplete, skip } = useTypingEffect(text, {
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
            src={`${backendUrl}${imageUrl}`}
            alt="장면 이미지"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-secondary/90" />
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className="p-6">
        <p className="text-lg leading-relaxed whitespace-pre-wrap font-light">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-2 h-5 bg-cyan-400 ml-1 animate-pulse" />
          )}
        </p>

        {/* 스크린 리더용 전체 텍스트 */}
        <span className="sr-only">{text}</span>
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
