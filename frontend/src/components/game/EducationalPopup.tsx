"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { EducationalContent } from "@/lib/types";

interface EducationalPopupProps {
  content: EducationalContent;
  isOpen: boolean;
  onDismiss: () => void;
}

export function EducationalPopup({
  content,
  isOpen,
  onDismiss,
}: EducationalPopupProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 포커스 트랩
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    },
    [onDismiss]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40"
            onClick={onDismiss}
          />

          {/* 모달 */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-surface-secondary border-2 border-orange-500/50 rounded-xl shadow-2xl overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="popup-title"
          >
            {/* 헤더 */}
            <div className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-4">
              <h2
                id="popup-title"
                className="text-xl font-bold text-orange-400 flex items-center gap-2"
              >
                <span>⚠️</span>
                {content.title}
              </h2>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-200">{content.explanation}</p>

              {/* 경고 신호 */}
              {content.warning_signs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-2">
                    🚨 놓친 경고 신호
                  </h3>
                  <ul className="space-y-1">
                    {content.warning_signs.map((sign, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-red-400">•</span>
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 예방 팁 */}
              {content.prevention_tips.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-emerald-400 mb-2">
                    ✅ 예방 방법
                  </h3>
                  <ul className="space-y-1">
                    {content.prevention_tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-emerald-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 bg-surface-primary/50 border-t border-gray-700">
              <button
                ref={closeButtonRef}
                onClick={onDismiss}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                확인하고 계속하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
