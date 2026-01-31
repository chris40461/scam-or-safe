import Link from "next/link";
import { GameContainer } from "@/components/game";

interface GamePlayPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GamePlayPage({ params }: GamePlayPageProps) {
  const { sessionId } = await params;

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/game"
            className="text-sm text-gray-400 hover:text-gray-200 inline-block"
          >
            ← 시나리오 선택
          </Link>
        </div>

        {/* 게임 컨테이너 */}
        <GameContainer scenarioId={sessionId} />
      </div>
    </main>
  );
}
