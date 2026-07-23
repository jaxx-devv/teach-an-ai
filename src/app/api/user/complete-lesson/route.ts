import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { completeLesson } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { lessonId, xpAward } = await req.json();
  if (!lessonId || typeof xpAward !== "number") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await completeLesson(session.userId, lessonId, xpAward);
  return NextResponse.json({ user });
}
