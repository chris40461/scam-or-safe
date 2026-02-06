"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { DangerFeedback } from "@/lib/types";

interface DangerFeedbackModalProps {
  choiceText: string;
  feedback: DangerFeedback;
  isOpen: boolean;
  onClose: () => void;
}

export function DangerFeedbackModal({
  choiceText,
  feedback,
  isOpen,
  onClose,
}: DangerFeedbackModalProps) {
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
        onClose();
      }
    },
    [onClose]
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
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-surface-secondary border-2 border-red-500/50 rounded-xl shadow-2xl overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="danger-feedback-title"
          >
            {/* 헤더 */}
            <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-4">
              <h2
                id="danger-feedback-title"
                className="text-xl font-bold text-red-400 flex items-center gap-2"
              >
                <span>⚠️</span>
                위험한 선택
              </h2>
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 선택 텍스트 */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-gray-400 mb-1">선택한 행동</p>
                <p className="text-gray-200 font-medium">{choiceText}</p>
              </div>

              {/* 왜 위험한지 */}
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  왜 위험했나요?
                </h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {feedback.why_dangerous}
                </p>
              </div>

              {/* 경고 신호 */}
              {feedback.warning_signs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-orange-400 mb-2">
                    놓친 경고 신호
                  </h3>
                  <ul className="space-y-1">
                    {feedback.warning_signs.map((sign, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-300 flex items-start gap-2"
                      >
                        <span className="text-orange-400">•</span>
                        {sign}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 더 안전한 대안 */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 mb-2">
                  더 안전한 대안
                </h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {feedback.safe_alternative}
                </p>
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 bg-surface-primary/50 border-t border-gray-700">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                확인
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
