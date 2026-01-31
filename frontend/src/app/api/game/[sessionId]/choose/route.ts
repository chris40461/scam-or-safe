import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/session-store";
import { processChoice, getCurrentNode } from "@/lib/game-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { choiceId } = body;

    if (!choiceId) {
      return NextResponse.json(
        { error: "choiceId is required" },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 위험 선택 시 교육 콘텐츠 확인
    const currentNode = getCurrentNode(session);
    const choice = currentNode.choices.find((c) => c.id === choiceId);
    const educationalContent =
      choice?.is_dangerous && currentNode.educational_content
        ? currentNode.educational_content
        : null;

    // 선택 처리
    const newSession = processChoice(session, choiceId);
    sessions.set(sessionId, newSession);

    return NextResponse.json({
      session: newSession,
      educationalContent,
    });
  } catch (error) {
    console.error("Failed to process choice:", error);
    return NextResponse.json(
      { error: "Failed to process choice" },
      { status: 500 }
    );
  }
}
