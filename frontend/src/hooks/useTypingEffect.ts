"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypingEffectOptions {
  speed?: number; // ms per character
  onComplete?: () => void;
}

export function useTypingEffect(
  text: string,
  options: UseTypingEffectOptions = {}
) {
  const { speed = 30, onComplete } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const lastTimeRef = useRef(0);

  // 텍스트 변경 시 리셋
  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;
    lastTimeRef.current = 0;
  }, [text]);

  // 타이핑 애니메이션
  useEffect(() => {
    if (isComplete || !text) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= speed) {
        const charsToAdd = Math.floor(elapsed / speed);
        const newIndex = Math.min(indexRef.current + charsToAdd, text.length);

        if (newIndex > indexRef.current) {
          indexRef.current = newIndex;
          setDisplayedText(text.slice(0, newIndex));
          lastTimeRef.current = timestamp;
        }

        if (newIndex >= text.length) {
          setIsComplete(true);
          onComplete?.();
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, speed, isComplete, onComplete]);

  // 스킵 기능
  const skip = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setDisplayedText(text);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  return { displayedText, isComplete, skip };
}
