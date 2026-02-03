import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/session-store";
import { undoLastChoice } from "@/lib/game-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const newSession = undoLastChoice(session);
    if (!newSession) {
      return NextResponse.json(
        { error: "No choices to undo" },
        { status: 400 }
      );
    }

    sessions.set(sessionId, newSession);

    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error("Failed to undo choice:", error);
    return NextResponse.json(
      { error: "Failed to undo choice" },
      { status: 500 }
    );
  }
}
