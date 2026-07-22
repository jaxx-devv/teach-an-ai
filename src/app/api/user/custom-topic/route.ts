import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { saveCustomTopicTitle } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { lessonId, title } = await req.json();
  if (!lessonId || !title) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await saveCustomTopicTitle(session.userId, lessonId, title);
  return NextResponse.json({ ok: true });
}
