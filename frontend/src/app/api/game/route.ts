import { NextRequest, NextResponse } from "next/server";
import { fetchScenario } from "@/lib/api";
import { createSession } from "@/lib/game-engine";
import { sessions } from "@/lib/session-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId } = body;

    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId is required" },
        { status: 400 }
      );
    }

    // 시나리오 로드
    const scenario = await fetchScenario(scenarioId);

    // 세션 생성
    const session = createSession(scenario);
    sessions.set(session.id, session);

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to create game session:", error);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }
}
