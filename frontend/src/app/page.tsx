import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative crt-scanlines">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* 로고/타이틀 */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold text-glow text-cyan-400">
            PhishGuard
          </h1>
          <p className="text-xl text-gray-300">
            피싱 예방 체험 게임
          </p>
        </div>

        {/* 태그라인 */}
        <p className="text-lg text-gray-400 max-w-md mx-auto">
          실제 피싱 수법을 직접 체험하며 배우세요.
          <br />
          <span className="text-orange-400">아는 것이 곧 예방입니다.</span>
        </p>

        {/* 기능 하이라이트 */}
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-surface-secondary/60 rounded-lg border border-gray-700">
            <div className="text-2xl mb-2">📰</div>
            <div className="font-semibold text-gray-200">실제 사례 기반</div>
            <p className="text-gray-400 text-xs mt-1">
              최신 뉴스에서 수집한 실제 피싱 수법
            </p>
          </div>
          <div className="p-4 bg-surface-secondary/60 rounded-lg border border-gray-700">
            <div className="text-2xl mb-2">🎮</div>
            <div className="font-semibold text-gray-200">체험형 학습</div>
            <p className="text-gray-400 text-xs mt-1">
              텍스트 어드벤처로 직접 상황을 경험
            </p>
          </div>
          <div className="p-4 bg-surface-secondary/60 rounded-lg border border-gray-700">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-semibold text-gray-200">즉각적 피드백</div>
            <p className="text-gray-400 text-xs mt-1">
              위험한 선택마다 교육 콘텐츠 제공
            </p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <Link
          href="/game"
          className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-lg font-semibold rounded-lg transition-all hover:scale-105 shadow-lg shadow-cyan-600/30"
        >
          게임 시작하기
        </Link>

        {/* 경고 문구 */}
        <p className="text-xs text-gray-500">
          이 게임은 교육 목적으로 제작되었습니다.
          <br />
          실제 피싱 피해 발생 시 112 또는 금융감독원 1332로 신고하세요.
        </p>
      </div>
    </main>
  );
}
