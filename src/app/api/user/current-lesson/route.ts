import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { setCurrentLesson } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { lessonId } = await req.json();
  await setCurrentLesson(session.userId, lessonId ?? null);
  return NextResponse.json({ ok: true });
}
