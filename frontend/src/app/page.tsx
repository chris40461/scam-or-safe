"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLoginModal from "@/components/admin/AdminLoginModal";
import { useAdminStore } from "@/lib/admin-store";
import { adminLogout } from "@/lib/api";

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAdmin, logout } = useAdminStore();

  const handleLogout = async () => {
    try {
      await adminLogout();
      logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative crt-scanlines">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* 로고/타이틀 */}
        <div className="space-y-1
        ">
          <h1 className="text-6xl sm:text-7xl font-bold text-glow text-cyan-400">
            SOS
          </h1>
          <p className="text-2xl sm:text-2xl tracking-widest text-cyan-100/80 font-light">
            Scam Or Safe
          </p>
        </div>

        {/* 태그라인 */}
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-lg text-gray-300">
            실제 피싱 수법을 직접 체험하며 배우세요.
          </p>
          <p className="text-xl font-medium text-orange-400">
            아는 것이 곧 예방입니다.
          </p>
        </div>

        {/* 기능 하이라이트 */}
        <div className="grid sm:grid-cols-3 gap-6 text-sm pt-4">
          <div className="group p-6 bg-surface-secondary/40 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1">
            <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">📰</div>
            <div className="font-semibold text-gray-100 mb-2 text-lg">실제 사례 기반</div>
            <p className="text-gray-400 text-xs leading-relaxed">
              최신 뉴스에서 수집한 실제 피싱 수법
            </p>
          </div>
          <div className="group p-6 bg-surface-secondary/40 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1">
            <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">🎮</div>
            <div className="font-semibold text-gray-100 mb-2 text-lg">체험형 학습</div>
            <p className="text-gray-400 text-xs leading-relaxed">
              텍스트 어드벤처로 직접 상황을 경험
            </p>
          </div>
          <div className="group p-6 bg-surface-secondary/40 rounded-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1">
            <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110">📚</div>
            <div className="font-semibold text-gray-100 mb-2 text-lg">종합 피드백</div>
            <p className="text-gray-400 text-xs leading-relaxed">
              게임 종료 시 제공되는 상세한 평가
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="pt-4">
          <Link
            href="/game"
            className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-xl shadow-cyan-600/40 hover:shadow-2xl hover:shadow-cyan-500/50"
          >
            게임 시작하기
          </Link>

          {/* 관리자 로그인/로그아웃 링크 */}
          <div className="mt-4">
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
              >
                관리자 로그아웃
              </button>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
              >
                관리자로 로그인
              </button>
            )}
          </div>
        </div>

        {/* 경고 문구 */}
        <p className="text-xs text-gray-500 leading-relaxed pt-4">
          이 게임은 교육 목적으로 제작되었습니다.
          <br />
          실제 피싱 피해 발생 시 112 또는 금융감독원 1332로 신고하세요.
        </p>
      </div>

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </main>
  );
}
