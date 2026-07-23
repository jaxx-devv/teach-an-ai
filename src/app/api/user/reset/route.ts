import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { resetUserMemory } from "@/lib/db";

export async function POST() {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  await resetUserMemory(session.userId);
  return NextResponse.json({ ok: true });
}
