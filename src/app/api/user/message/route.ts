import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { logMessage } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { lessonId, role, content } = await req.json();
  if (!lessonId || !role || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const entry = await logMessage({
    userId: session.userId,
    lessonId,
    role,
    content,
    createdAt: Date.now(),
  });
  return NextResponse.json({ entry });
}
