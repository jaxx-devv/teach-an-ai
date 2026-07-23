import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { updateDisplayName } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const { displayName } = await req.json();
  if (!displayName || typeof displayName !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await updateDisplayName(session.userId, displayName.trim());
  return NextResponse.json({ ok: true });
}
