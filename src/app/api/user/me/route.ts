import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserById } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  try {
    const user = await getUserById(session.userId);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
