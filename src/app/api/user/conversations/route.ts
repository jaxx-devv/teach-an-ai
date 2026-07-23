import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { getRecentConversations } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 5);
  const conversations = await getRecentConversations(session.userId, limit);
  return NextResponse.json({ conversations });
}
