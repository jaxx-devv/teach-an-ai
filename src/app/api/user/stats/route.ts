import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getAllConfidences, getTeachingStreak, getTotalUserMessages } from "@/lib/db";

export async function GET() {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const [confidences, streak, totalUserMessages] = await Promise.all([
    getAllConfidences(session.userId),
    getTeachingStreak(session.userId),
    getTotalUserMessages(session.userId),
  ]);

  return NextResponse.json({ confidences, streak, totalUserMessages });
}
