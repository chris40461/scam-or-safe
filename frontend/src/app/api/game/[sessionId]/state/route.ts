import { NextRequest, NextResponse } from "next/server";
import { sessions } from "@/lib/session-store";

export async function GET(
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

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to get session state:", error);
    return NextResponse.json(
      { error: "Failed to get session state" },
      { status: 500 }
    );
  }
}
