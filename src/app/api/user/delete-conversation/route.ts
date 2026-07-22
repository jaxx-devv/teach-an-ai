import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { deleteConversation } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { lessonId } = await req.json();
  if (!lessonId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await deleteConversation(session.userId, lessonId);
  return NextResponse.json({ ok: true });
}
