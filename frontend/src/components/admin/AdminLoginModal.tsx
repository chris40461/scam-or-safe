"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setIsAdmin = useAdminStore((state) => state.setIsAdmin);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await adminLogin(password);
      setIsAdmin(true);
      setPassword("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-secondary border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          관리자 로그인
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500"
              placeholder="관리자 비밀번호 입력"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
                isLoading || !password
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white"
              }`}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
