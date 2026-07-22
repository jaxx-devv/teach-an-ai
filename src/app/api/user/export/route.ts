import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { exportUserData } from "@/lib/db";

export async function GET() {
  const { session, unauthorized } = await requireSession();
  if (!session) return unauthorized;

  const json = await exportUserData(session.userId);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=teach-an-ai-export.json",
    },
  });
}
