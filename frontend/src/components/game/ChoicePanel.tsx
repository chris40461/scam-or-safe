"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Choice } from "@/lib/types";

interface ChoicePanelProps {
  choices: Choice[];
  onChoose: (choiceId: string) => void;
  disabled: boolean;
  isVisible: boolean;
}

export function ChoicePanel({
  choices,
  onChoose,
  disabled,
  isVisible,
}: ChoicePanelProps) {
  // 숫자키 단축키
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled || !isVisible) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= choices.length) {
        onChoose(choices[num - 1].id);
      }
    },
    [choices, disabled, isVisible, onChoose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-3"
        >
          {choices.map((choice, index) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChoose(choice.id)}
              disabled={disabled}
              className={`
                relative w-full p-4 text-left rounded-lg border transition-all flex items-center gap-3
                ${
                  disabled
                    ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-surface-secondary border-gray-600 hover:border-cyan-500 hover:bg-surface-secondary/80 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                }
              `}
            >
              <span className="flex items-center justify-center w-6 h-6 flex-shrink-0 text-sm rounded bg-gray-700 text-gray-300">
                {index + 1}
              </span>
              <span className="flex-1">{choice.text}</span>

              {disabled && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
